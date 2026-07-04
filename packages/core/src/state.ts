import {
  calculateVisibleCount,
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
  const itemCount = measurements.itemWidths.length;
  const fittedCount = calculateVisibleCount(measurements);
  const visibleCount = resolveFittedVisibleCount(
    fittedCount,
    itemCount,
    options.collapseAtCount,
  );
  const overflowCount = itemCount - visibleCount;

  return {
    itemCount,
    visibleCount,
    overflowCount,
    allVisible: overflowCount === 0,
  };
}
