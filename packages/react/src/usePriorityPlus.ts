import {
  createPriorityPlusSession,
  createPriorityPlusState,
  partitionItems,
  type PriorityPlusCachedMeasurements,
  type PriorityPlusLayoutResult,
  type PriorityPlusOptions,
  type PriorityPlusSession,
  type PriorityPlusState,
} from "@priority-plus/core";
import {
  contentInlineSize,
  readCachedMeasurements,
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
  const containerElementRef = useRef<HTMLElement>(null);
  const primaryElementRef = useRef<HTMLUListElement>(null);
  const measureListElementRef = useRef<HTMLUListElement>(null);
  const measureToggleElementRef = useRef<HTMLButtonElement>(null);
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

    return readCachedMeasurements({
      items: measureList.children,
      itemGapSource: measureList,
      container,
      toggle: measureToggle,
      primary,
    });
  }, []);

  const sessionRef = useRef<PriorityPlusSession | null>(null);
  if (sessionRef.current === null) {
    sessionRef.current = createPriorityPlusSession({
      itemCount: items.length,
      options: coreOptions,
      readMeasurements,
      getContainerInlineSize: () => {
        const container = containerElementRef.current;
        return container === null ? null : contentInlineSize(container);
      },
      onResult: commitLayoutResult,
    });
  }
  const getSession = useCallback(() => sessionRef.current, []);

  const update = useCallback(() => {
    sessionRef.current?.layout({ refreshMeasurements: true });
  }, []);

  // The container's resize only changes the available width, so a cached-
  // measurement layout suffices. The hidden measurer's elements feed the fit
  // calculation, so their resize must re-measure.
  const containerRef = useElementRef(getSession, {
    store: containerElementRef,
    observe: true,
  });
  const primaryRef = useElementRef(getSession, {
    store: primaryElementRef,
  });
  const measureListRef = useElementRef(getSession, {
    store: measureListElementRef,
    observe: true,
    refreshOnResize: true,
  });
  const measureItemRef = useElementRef<HTMLLIElement>(getSession, {
    observe: true,
    refreshOnResize: true,
  });
  const measureToggleRef = useElementRef(getSession, {
    store: measureToggleElementRef,
    observe: true,
    refreshOnResize: true,
  });

  useLayoutEffect(() => {
    sessionRef.current?.reset(items.length);
  }, [items.length]);

  useLayoutEffect(() => {
    sessionRef.current?.setOptions(coreOptions);
  }, [coreOptions]);

  useLayoutEffect(() => {
    update();
  }, [items, update]);

  useEffect(() => {
    return () => {
      sessionRef.current?.destroy();
    };
  }, []);

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
 * registers it with the session's `ResizeObserver`, cleaning both up on detach.
 */
function useElementRef<E extends HTMLElement>(
  getSession: () => PriorityPlusSession | null,
  {
    store,
    observe,
    refreshOnResize,
  }: {
    store?: RefObject<E | null>;
    observe?: boolean;
    refreshOnResize?: boolean;
  } = {},
): RefCallback<E> {
  return useCallback<RefCallback<E>>(
    (element) => {
      // React ≥19 calls the returned cleanup on detach instead of re-invoking
      // with null, so a null element never reaches this far.
      if (element === null) return;

      if (store) store.current = element;
      const session = observe ? getSession() : null;
      session?.observe(element, { refreshOnResize });

      return () => {
        session?.unobserve(element);
        if (store?.current === element) store.current = null;
      };
    },
    [getSession, store, observe, refreshOnResize],
  );
}
