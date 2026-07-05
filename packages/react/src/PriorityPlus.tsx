import {
  useCallback,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type Key,
  type ReactNode,
  type Ref,
  type RefCallback,
} from "react";
import {
  defaultToggleLabel,
  presentToggle,
  widestToggleState,
  type PriorityPlusState,
} from "@priority-plus/core";

import {
  usePriorityPlus,
  type UsePriorityPlusOptions,
} from "./usePriorityPlus";

const measurerStyle: CSSProperties = {
  contain: "layout",
  height: 0,
  left: 0,
  overflow: "hidden",
  pointerEvents: "none",
  position: "absolute",
  top: 0,
  visibility: "hidden",
  width: "max-content",
};

export interface PriorityPlusItemState {
  /** Position of the item in the source `items` array. */
  index: number;
  /** Whether the item is currently rendered in the overflow list. */
  overflowed: boolean;
}

export interface PriorityPlusToggleState extends PriorityPlusState {
  /** Whether the overflow list is currently open. */
  open: boolean;
}

export interface PriorityPlusProps<T>
  extends UsePriorityPlusOptions,
    Omit<ComponentPropsWithoutRef<"nav">, "children"> {
  items: readonly T[];
  children: (item: T, state: PriorityPlusItemState) => ReactNode;
  /** The rendered `<nav>`; merged with the internal container ref. */
  ref?: Ref<HTMLElement>;
  /** Render the overflow toggle's contents. Defaults to `More (n)`. */
  renderToggle?: (state: PriorityPlusToggleState) => ReactNode;
  /** Derive a stable React key for an item. Defaults to its index. */
  getItemKey?: (item: T, index: number) => Key;
  className?: string;
  primaryClassName?: string;
  overflowClassName?: string;
  itemClassName?: string;
  toggleClassName?: string;
  measurerClassName?: string;
}

const defaultToggle = (state: PriorityPlusToggleState): ReactNode =>
  defaultToggleLabel(state);

const defaultItemKey = (_item: unknown, index: number): Key => index;

export function PriorityPlus<T>({
  items,
  children,
  collapseAtCount,
  "aria-label": ariaLabel = "Priority navigation",
  ref,
  renderToggle = defaultToggle,
  getItemKey = defaultItemKey,
  className,
  primaryClassName,
  overflowClassName,
  itemClassName,
  toggleClassName,
  measurerClassName,
  ...navProps
}: PriorityPlusProps<T>): ReactNode {
  const priority = usePriorityPlus(items, { collapseAtCount });
  const navRef = useMergedRef(priority.containerRef, ref);
  const [open, setOpen] = useState(false);

  // Clear stale open intent as soon as every item fits. Adjusting during
  // render re-renders before commit, so no closed-then-open frame is shown.
  if (priority.allVisible && open) setOpen(false);

  const view = presentToggle(open, priority);

  const toggleState: PriorityPlusToggleState = {
    allVisible: priority.allVisible,
    itemCount: priority.itemCount,
    measured: priority.measured,
    overflowCount: priority.overflowCount,
    visibleCount: priority.visibleCount,
    open,
  };

  // The hidden measurer renders the toggle as if every item overflowed, so the
  // fit calculation always reserves room for the toggle at its widest.
  const measureToggleState: PriorityPlusToggleState = {
    ...widestToggleState(priority.itemCount),
    open: false,
  };

  const renderItem = (item: T, index: number, overflowed: boolean) => (
    <li key={getItemKey(item, index)} className={itemClassName}>
      {children(item, { index, overflowed })}
    </li>
  );

  return (
    <nav
      {...navProps}
      aria-label={ariaLabel}
      className={className}
      // Reflected for the prelayout pass: `collapse-at` lets it read the
      // option from the DOM; `enhanced` appears with the first measured
      // layout and neutralises any styles prelayout injected.
      data-priority-plus-collapse-at={collapseAtCount}
      data-priority-plus-enhanced={priority.measured ? "" : undefined}
      ref={navRef}
    >
      <ul
        className={primaryClassName}
        data-priority-plus-primary=""
        ref={priority.primaryRef}
      >
        {priority.visibleItems.map((item, index) =>
          renderItem(item, index, false),
        )}
      </ul>

      <button
        type="button"
        className={toggleClassName}
        data-priority-plus-toggle=""
        aria-expanded={view.expanded}
        hidden={view.toggleHidden}
        onClick={() => setOpen((value) => !value)}
      >
        {renderToggle(toggleState)}
      </button>

      {!view.overflowHidden && (
        <ul className={overflowClassName}>
          {priority.overflowItems.map((item, index) =>
            renderItem(item, priority.visibleCount + index, true),
          )}
        </ul>
      )}

      <div
        aria-hidden="true"
        className={measurerClassName}
        data-priority-plus-measurer=""
        style={measurerStyle}
      >
        <ul
          className={primaryClassName}
          data-priority-plus-primary=""
          ref={priority.measureListRef}
        >
          {items.map((item, index) => (
            <li
              key={getItemKey(item, index)}
              className={itemClassName}
              ref={priority.measureItemRef}
            >
              {children(item, { index, overflowed: false })}
            </li>
          ))}
        </ul>
        <button
          type="button"
          className={toggleClassName}
          data-priority-plus-toggle=""
          ref={priority.measureToggleRef}
        >
          {renderToggle(measureToggleState)}
        </button>
      </div>
    </nav>
  );
}

/** Attach one element to both the internal container ref and the user's ref. */
function useMergedRef<T>(
  a: RefCallback<T>,
  b: Ref<T> | undefined,
): RefCallback<T> {
  return useCallback<RefCallback<T>>(
    (element) => {
      // React ≥19 calls the returned cleanup on detach instead of re-invoking
      // with null, so a null element never reaches this far.
      if (element === null) return;

      const cleanups = [a, b].map((ref) => attachRef(ref, element));
      return () => {
        for (const cleanup of cleanups) cleanup();
      };
    },
    [a, b],
  );
}

function attachRef<T>(ref: Ref<T> | undefined, element: T): () => void {
  if (ref == null) return () => {};

  if (typeof ref === "function") {
    const cleanup = ref(element);
    return typeof cleanup === "function" ? cleanup : () => ref(null);
  }

  ref.current = element;
  return () => {
    ref.current = null;
  };
}
