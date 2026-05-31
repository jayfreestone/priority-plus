import {
  createPriorityPlusState,
  getPriorityPlusState,
  partitionItems,
  throttle,
  type ThrottledCallback,
  type PriorityPlusOptions,
  type PriorityPlusState,
} from "@priority-plus/core";
import {
  contentInlineSize,
  inlineGap,
  nonContentInlineSize,
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

export interface UsePriorityPlusOptions extends PriorityPlusOptions {
  throttleMs?: number;
}

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
  const { collapseAtCount, throttleMs = 50 } = options;
  const coreOptions = useMemo(
    () => ({ collapseAtCount }),
    [collapseAtCount],
  );
  const containerElementRef = useRef<HTMLElement>(null);
  const primaryElementRef = useRef<HTMLUListElement>(null);
  const measureListElementRef = useRef<HTMLUListElement>(null);
  const measureToggleElementRef = useRef<HTMLButtonElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const onResizeRef = useRef<ThrottledCallback<[]> | null>(null);
  const [state, setState] = useState(() => createPriorityPlusState(items.length));

  const update = useCallback(() => {
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
      return;
    }

    const itemWidths = Array.from(measureList.children)
      .filter((child): child is HTMLElement => child instanceof HTMLElement)
      .map((item) => item.getBoundingClientRect().width);

    const nextState = getPriorityPlusState(
      {
        itemWidths,
        itemGap: inlineGap(measureList),
        containerGap: inlineGap(container),
        toggleWidth: measureToggle.getBoundingClientRect().width,
        available: contentInlineSize(container) - nonContentInlineSize(primary),
      },
      coreOptions,
    );

    setState((currentState) =>
      priorityPlusStatesEqual(currentState, nextState)
        ? currentState
        : nextState,
    );
  }, [coreOptions]);

  const getResizeObserver = useCallback(() => {
    if (typeof ResizeObserver === "undefined") return null;

    resizeObserverRef.current ??= new ResizeObserver(() => {
      onResizeRef.current?.();
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
      const resizeObserver = getResizeObserver();
      resizeObserver?.observe(element);

      return () => {
        resizeObserver?.unobserve(element);
        if (primaryElementRef.current === element) {
          primaryElementRef.current = null;
        }
      };
    },
    [getResizeObserver],
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
    const nextState = createPriorityPlusState(items.length);
    setState((currentState) =>
      priorityPlusStatesEqual(currentState, nextState)
        ? currentState
        : nextState,
    );
  }, [items.length]);

  useLayoutEffect(() => {
    update();
  }, [items, update]);

  useEffect(() => {
    const onResize = throttle(update, throttleMs);
    onResizeRef.current = onResize;

    return () => {
      onResize.cancel();
      if (onResizeRef.current === onResize) {
        onResizeRef.current = null;
      }
    };
  }, [throttleMs, update]);

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
