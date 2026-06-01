import {
  createPriorityPlusState,
  createPriorityPlusEngine,
  partitionItems,
  PriorityPlusLayoutController,
  type PriorityPlusCachedMeasurements,
  type PriorityPlusEngine,
  type PriorityPlusLayoutResult,
  type PriorityPlusOptions,
  type PriorityPlusState,
} from "@priority-plus/core";
import {
  contentInlineSize,
  readCachedMeasurementsFromParts,
} from "@priority-plus/core/dom";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefCallback,
  type RefObject,
} from "react";

export type UsePriorityPlusOptions = PriorityPlusOptions;

export interface UsePriorityPlusResult<T> extends PriorityPlusState {
  containerRef: RefCallback<HTMLElement>;
  primaryRef: RefCallback<HTMLUListElement>;
  measureListRef: RefCallback<HTMLUListElement>;
  measureItemRef: RefCallback<HTMLLIElement>;
  measureToggleRef: RefCallback<HTMLButtonElement>;
  visibleItems: T[];
  overflowItems: T[];
  update: () => void;
}

export function usePriorityPlus<T>(
  items: readonly T[],
  options: UsePriorityPlusOptions = {},
): UsePriorityPlusResult<T> {
  const { collapseAtCount } = options;
  const coreOptions = useMemo(
    () => ({ collapseAtCount }),
    [collapseAtCount],
  );
  const controllerRef = useRef(
    new PriorityPlusLayoutController(coreOptions, items.length),
  );
  const containerElementRef = useRef<HTMLElement>(null);
  const primaryElementRef = useRef<HTMLUListElement>(null);
  const measureListElementRef = useRef<HTMLUListElement>(null);
  const measureToggleElementRef = useRef<HTMLButtonElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [state, setState] = useState(() => createPriorityPlusState(items.length));

  const commitLayoutResult = useCallback((result: PriorityPlusLayoutResult) => {
    setState((currentState) =>
      priorityPlusStatesEqual(currentState, result.state)
        ? currentState
        : result.state,
    );
  }, []);

  const readMeasurements = useCallback((): PriorityPlusCachedMeasurements | null => {
    const container = containerElementRef.current;
    const primary = primaryElementRef.current;
    const measureList = measureListElementRef.current;
    const measureToggle = measureToggleElementRef.current;

    if (
      container === null ||
      primary === null ||
      measureList === null ||
      measureToggle === null
    ) {
      return null;
    }

    return readCachedMeasurementsFromParts(
      measureList.children,
      measureList,
      container,
      measureToggle,
      primary,
    );
  }, []);

  const engineRef = useRef<PriorityPlusEngine | null>(null);
  if (engineRef.current === null) {
    engineRef.current = createPriorityPlusEngine({
      controller: controllerRef.current,
      readMeasurements,
      getContainerInlineSize: () => {
        const container = containerElementRef.current;
        return container === null ? null : contentInlineSize(container);
      },
      onResult: commitLayoutResult,
    });
  }

  const update = useCallback(() => {
    engineRef.current?.layout({
      refreshMeasurements: true,
    });
  }, []);

  const getResizeObserver = useCallback(() => {
    if (typeof ResizeObserver === "undefined") return null;

    resizeObserverRef.current ??= new ResizeObserver((entries) => {
      const container = containerElementRef.current;

      engineRef.current?.schedule({
        refreshMeasurements: entries.some((entry) => entry.target !== container),
      });
    });

    return resizeObserverRef.current;
  }, []);

  const containerRef = useElementRef(getResizeObserver, {
    store: containerElementRef,
    observe: true,
  });
  const primaryRef = useElementRef(getResizeObserver, {
    store: primaryElementRef,
  });
  const measureListRef = useElementRef(getResizeObserver, {
    store: measureListElementRef,
    observe: true,
  });
  const measureItemRef = useElementRef<HTMLLIElement>(getResizeObserver, {
    observe: true,
  });
  const measureToggleRef = useElementRef(getResizeObserver, {
    store: measureToggleElementRef,
    observe: true,
  });

  useLayoutEffect(() => {
    commitLayoutResult(controllerRef.current.reset(items.length));
  }, [items.length]);

  useLayoutEffect(() => {
    commitLayoutResult(controllerRef.current.setOptions(coreOptions));
  }, [commitLayoutResult, coreOptions]);

  useLayoutEffect(() => {
    update();
  }, [items, update]);

  useEffect(() => {
    return () => {
      engineRef.current?.cancel();
    };
  }, []);

  useEffect(() => {
    let disposed = false;
    document.fonts?.ready.then(() => {
      if (!disposed) update();
    });

    return () => {
      disposed = true;
    };
  }, [update]);

  useEffect(
    () => () => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
    },
    [],
  );

  const { visibleItems, overflowItems } = useMemo(
    () => partitionItems(items, state.visibleCount),
    [items, state.visibleCount],
  );

  return {
    ...state,
    containerRef,
    primaryRef,
    measureListRef,
    measureItemRef,
    measureToggleRef,
    visibleItems,
    overflowItems,
    update,
  };
}

function priorityPlusStatesEqual(
  a: PriorityPlusState,
  b: PriorityPlusState,
): boolean {
  return (
    a.allVisible === b.allVisible &&
    a.itemCount === b.itemCount &&
    a.overflowCount === b.overflowCount &&
    a.visibleCount === b.visibleCount
  );
}

/**
 * A stable ref callback that optionally stores the element in `store` and/or
 * registers it with the shared ResizeObserver, cleaning both up on detach.
 */
function useElementRef<E extends HTMLElement>(
  getObserver: () => ResizeObserver | null,
  { store, observe }: { store?: RefObject<E | null>; observe?: boolean } = {},
): RefCallback<E> {
  return useCallback<RefCallback<E>>(
    (element) => {
      if (element === null) {
        if (store) store.current = null;
        return;
      }

      if (store) store.current = element;
      const observer = observe ? getObserver() : null;
      observer?.observe(element);

      return () => {
        observer?.unobserve(element);
        if (store?.current === element) store.current = null;
      };
    },
    [getObserver, store, observe],
  );
}
