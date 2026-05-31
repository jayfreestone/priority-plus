import {
  createPriorityPlusState,
  createPriorityPlusEngine,
  partitionItems,
  PriorityPlusLayoutController,
  type PriorityPlusCachedMeasurements,
  type PriorityPlusEngine,
  type PriorityPlusLayoutResult,
  type PriorityPlusOptions,
  type PriorityPlusScheduleOptions,
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

    return readCachedMeasurements({
      items: measureList.children,
      itemGapSource: measureList,
      container,
      toggle: measureToggle,
      primary,
    });
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

  const update = useCallback((options?: PriorityPlusScheduleOptions) => {
    engineRef.current?.layout({
      refreshMeasurements: options?.refreshMeasurements ?? true,
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

  const containerRef = useCallback<RefCallback<HTMLElement>>(
    (element) => {
      if (element === null) {
        containerElementRef.current = null;
        return;
      }

      containerElementRef.current = element;
      const resizeObserver = getResizeObserver();
      resizeObserver?.observe(element);

      return () => {
        resizeObserver?.unobserve(element);
        if (containerElementRef.current === element) {
          containerElementRef.current = null;
        }
      };
    },
    [getResizeObserver],
  );

  const primaryRef = useCallback<RefCallback<HTMLUListElement>>(
    (element) => {
      if (element === null) {
        primaryElementRef.current = null;
        return;
      }

      primaryElementRef.current = element;

      return () => {
        if (primaryElementRef.current === element) {
          primaryElementRef.current = null;
        }
      };
    },
    [],
  );

  const measureListRef = useCallback<RefCallback<HTMLUListElement>>(
    (element) => {
      if (element === null) {
        measureListElementRef.current = null;
        return;
      }

      measureListElementRef.current = element;
      const resizeObserver = getResizeObserver();
      resizeObserver?.observe(element);

      return () => {
        resizeObserver?.unobserve(element);
        if (measureListElementRef.current === element) {
          measureListElementRef.current = null;
        }
      };
    },
    [getResizeObserver],
  );

  const measureItemRef = useCallback<RefCallback<HTMLLIElement>>(
    (element) => {
      if (element === null) return;

      const resizeObserver = getResizeObserver();
      resizeObserver?.observe(element);

      return () => {
        resizeObserver?.unobserve(element);
      };
    },
    [getResizeObserver],
  );

  const measureToggleRef = useCallback<RefCallback<HTMLButtonElement>>(
    (element) => {
      if (element === null) {
        measureToggleElementRef.current = null;
        return;
      }

      measureToggleElementRef.current = element;
      const resizeObserver = getResizeObserver();
      resizeObserver?.observe(element);

      return () => {
        resizeObserver?.unobserve(element);
        if (measureToggleElementRef.current === element) {
          measureToggleElementRef.current = null;
        }
      };
    },
    [getResizeObserver],
  );

  useLayoutEffect(() => {
    commitLayoutResult(controllerRef.current.reset(items.length));
  }, [items.length]);

  useLayoutEffect(() => {
    commitLayoutResult(controllerRef.current.setOptions(coreOptions));
  }, [commitLayoutResult, coreOptions]);

  useLayoutEffect(() => {
    update({ refreshMeasurements: true });
  }, [items, update]);

  useEffect(() => {
    return () => {
      engineRef.current?.cancel();
    };
  }, []);

  useEffect(() => {
    let disposed = false;
    document.fonts?.ready.then(() => {
      if (!disposed) update({ refreshMeasurements: true });
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
