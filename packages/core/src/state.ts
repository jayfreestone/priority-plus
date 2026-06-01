import {
  calculateVisibleCount,
  calculateVisibleCountFromParts,
  resolveFittedVisibleCount,
  type PriorityPlusMeasurements,
  type PriorityPlusOptions,
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
  return getPriorityPlusStateFromParts(
    measurements.itemWidths,
    measurements.itemGap,
    measurements.containerGap,
    measurements.toggleWidth,
    measurements.available,
    options.collapseAtCount,
  );
}

export function getPriorityPlusStateFromParts(
  itemWidths: number[],
  itemGap: number,
  containerGap: number,
  toggleWidth: number,
  available: number,
  collapseAtCount?: number,
): PriorityPlusState {
  const itemCount = itemWidths.length;
  const fittedCount = calculateVisibleCountFromParts(
    itemWidths,
    itemGap,
    containerGap,
    toggleWidth,
    available,
  );
  const visibleCount = resolveFittedVisibleCount(
    fittedCount,
    itemCount,
    collapseAtCount,
  );
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
