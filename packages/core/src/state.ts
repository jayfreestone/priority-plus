import {
  type PriorityPlusMeasurements,
  type PriorityPlusOptions,
  resolveVisibleCount,
} from "./calculate";

export interface PriorityPlusState {
  itemCount: number;
  visibleCount: number;
  overflowCount: number;
  allVisible: boolean;
}

export function createPriorityPlusState(itemCount = 0): PriorityPlusState {
  return {
    itemCount,
    visibleCount: itemCount,
    overflowCount: 0,
    allVisible: true,
  };
}

export function getPriorityPlusState(
  measurements: PriorityPlusMeasurements,
  options: PriorityPlusOptions = {},
): PriorityPlusState {
  const itemCount = measurements.itemWidths.length;
  const visibleCount = resolveVisibleCount(measurements, options);
  const overflowCount = itemCount - visibleCount;

  return {
    itemCount,
    visibleCount,
    overflowCount,
    allVisible: overflowCount === 0,
  };
}

export function partitionItems<T>(
  items: readonly T[],
  visibleCount: number,
): { visibleItems: T[]; overflowItems: T[] } {
  return {
    visibleItems: items.slice(0, visibleCount),
    overflowItems: items.slice(visibleCount),
  };
}
