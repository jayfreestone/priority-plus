import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

import { usePriorityPlus, type UsePriorityPlusOptions } from "./usePriorityPlus";

export interface PriorityPlusClassNames {
  root?: string;
  primary?: string;
  overflow?: string;
  item?: string;
  toggle?: string;
  measurer?: string;
}

export interface PriorityPlusProps<T> extends UsePriorityPlusOptions {
  items: readonly T[];
  "aria-label"?: string;
  className?: string;
  classNames?: PriorityPlusClassNames;
  getKey?: (item: T, index: number) => string | number;
  renderItem: (item: T, index: number) => ReactNode;
  renderToggle?: (details: { overflowCount: number; open: boolean }) => ReactNode;
}

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

export function PriorityPlus<T>({
  items,
  "aria-label": ariaLabel = "Priority navigation",
  className,
  classNames,
  getKey = (_item, index) => index,
  renderItem,
  renderToggle = ({ overflowCount }) => `More (${overflowCount})`,
  ...options
}: PriorityPlusProps<T>) {
  const [open, setOpen] = useState(false);
  const priority = usePriorityPlus(items, options);
  const overflowOpen = open && !priority.allVisible;

  useEffect(() => {
    if (priority.allVisible) setOpen(false);
  }, [priority.allVisible]);

  return (
    <nav
      aria-label={ariaLabel}
      className={[classNames?.root, className].filter(Boolean).join(" ")}
      ref={priority.containerRef}
    >
      <ul className={classNames?.primary} ref={priority.primaryRef}>
        {priority.visibleItems.map((item, index) => (
          <li className={classNames?.item} key={getKey(item, index)}>
            {renderItem(item, index)}
          </li>
        ))}
      </ul>

      <button
        aria-expanded={open}
        className={classNames?.toggle}
        hidden={priority.allVisible}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {renderToggle({
          overflowCount: priority.overflowCount,
          open,
        })}
      </button>

      {overflowOpen ? (
        <ul className={classNames?.overflow}>
          {priority.overflowItems.map((item, index) => (
            <li
              className={classNames?.item}
              key={getKey(item, priority.visibleCount + index)}
            >
              {renderItem(item, priority.visibleCount + index)}
            </li>
          ))}
        </ul>
      ) : null}

      <div
        aria-hidden="true"
        className={classNames?.measurer}
        style={measurerStyle}
      >
        <ul className={classNames?.primary} ref={priority.measureListRef}>
          {items.map((item, index) => (
            <li className={classNames?.item} key={getKey(item, index)}>
              {renderItem(item, index)}
            </li>
          ))}
        </ul>
        <button className={classNames?.toggle} ref={priority.measureToggleRef}>
          {renderToggle({
            overflowCount: Math.max(1, priority.overflowCount),
            open: false,
          })}
        </button>
      </div>
    </nav>
  );
}
