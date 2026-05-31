import {
  useEffect,
  useState,
  type HTMLAttributes,
  type Key,
  type ReactNode,
} from "react";
import type { PriorityPlusState } from "@priority-plus/core";

import {
  usePriorityPlus,
  type UsePriorityPlusOptions,
} from "./usePriorityPlus";

const measurerStyle: HTMLAttributes<HTMLDivElement>["style"] = {
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
    Omit<HTMLAttributes<HTMLElement>, "children"> {
  items: readonly T[];
  children: (item: T, state: PriorityPlusItemState) => ReactNode;
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
  `More (${Math.max(1, state.overflowCount)})`;

const defaultItemKey = (_item: unknown, index: number): Key => index;

export function PriorityPlus<T>({
  items,
  children,
  collapseAtCount,
  "aria-label": ariaLabel = "Priority navigation",
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
  const [open, setOpen] = useState(false);
  const overflowOpen = open && !priority.allVisible;

  useEffect(() => {
    if (priority.allVisible) setOpen(false);
  }, [priority.allVisible]);

  const toggleState: PriorityPlusToggleState = {
    allVisible: priority.allVisible,
    itemCount: priority.itemCount,
    overflowCount: priority.overflowCount,
    visibleCount: priority.visibleCount,
    open,
  };

  // The hidden measurer renders the toggle as if every item overflowed, so the
  // fit calculation always reserves room for the toggle at its widest.
  const measureToggleState: PriorityPlusToggleState = {
    allVisible: false,
    itemCount: priority.itemCount,
    overflowCount: Math.max(1, priority.itemCount),
    visibleCount: 0,
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
      ref={priority.containerRef}
    >
      <ul className={primaryClassName} ref={priority.primaryRef}>
        {priority.visibleItems.map((item, index) =>
          renderItem(item, index, false),
        )}
      </ul>

      <button
        type="button"
        className={toggleClassName}
        aria-expanded={overflowOpen}
        hidden={priority.allVisible}
        onClick={() => setOpen((value) => !value)}
      >
        {renderToggle(toggleState)}
      </button>

      {overflowOpen && (
        <ul className={overflowClassName}>
          {priority.overflowItems.map((item, index) =>
            renderItem(item, priority.visibleCount + index, true),
          )}
        </ul>
      )}

      <div aria-hidden="true" className={measurerClassName} style={measurerStyle}>
        <ul className={primaryClassName} ref={priority.measureListRef}>
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
          ref={priority.measureToggleRef}
        >
          {renderToggle(measureToggleState)}
        </button>
      </div>
    </nav>
  );
}
