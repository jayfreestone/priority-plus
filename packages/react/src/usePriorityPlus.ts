import {
  createPriorityPlusState,
  getPriorityPlusState,
  partitionItems,
  throttle,
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
  type RefObject,
} from "react";

export interface UsePriorityPlusOptions extends PriorityPlusOptions {
  throttleMs?: number;
}

export interface UsePriorityPlusResult<T> extends PriorityPlusState {
  containerRef: RefObject<HTMLElement | null>;
  primaryRef: RefObject<HTMLUListElement | null>;
  measureListRef: RefObject<HTMLUListElement | null>;
  measureToggleRef: RefObject<HTMLButtonElement | null>;
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
  const containerRef = useRef<HTMLElement>(null);
  const primaryRef = useRef<HTMLUListElement>(null);
  const measureListRef = useRef<HTMLUListElement>(null);
  const measureToggleRef = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState(() => createPriorityPlusState(items.length));

  const update = useCallback(() => {
    const container = containerRef.current;
    const primary = primaryRef.current;
    const measureList = measureListRef.current;
    const measureToggle = measureToggleRef.current;

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
    if (typeof ResizeObserver === "undefined") return;

    let disposed = false;
    const onResize = throttle(update, throttleMs);
    const resizeObserver = new ResizeObserver(() => {
      if (!disposed) onResize();
    });
    const observe = (element: Element | null): void => {
      if (element !== null) resizeObserver.observe(element);
    };
    const observeMeasuredElements = (): void => {
      resizeObserver.disconnect();
      observe(containerRef.current);
      observe(primaryRef.current);
      observe(measureListRef.current);
      observe(measureToggleRef.current);

      const measureList = measureListRef.current;
      if (measureList === null) return;

      for (const child of measureList.children) {
        observe(child);
      }
    };

    observeMeasuredElements();

    document.fonts?.ready.then(() => {
      if (!disposed) update();
    });

    return () => {
      disposed = true;
      onResize.cancel();
      resizeObserver.disconnect();
    };
  }, [items.length, throttleMs, update]);

  const { visibleItems, overflowItems } = useMemo(
    () => partitionItems(items, state.visibleCount),
    [items, state.visibleCount],
  );

  return {
    ...state,
    containerRef,
    primaryRef,
    measureListRef,
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
