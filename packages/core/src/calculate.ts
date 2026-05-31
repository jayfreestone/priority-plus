export interface PriorityPlusMeasurements {
  /** Width of each item in source order. */
  itemWidths: number[];
  /** Gap between adjacent primary items. */
  itemGap: number;
  /** Gap between the primary list and the overflow toggle. */
  containerGap: number;
  /** Width of the overflow toggle when visible. */
  toggleWidth: number;
  /** Inline space available to fit primary list + toggle. */
  available: number;
}

export interface PriorityPlusOptions {
  /**
   * Collapse every item into overflow when the fitted primary count is less
   * than or equal to this value. Useful for avoiding orphaned primary items.
   */
  collapseAtCount?: number;
}

export function calculateVisibleCount({
  itemWidths,
  itemGap,
  containerGap,
  toggleWidth,
  available,
}: PriorityPlusMeasurements): number {
  const itemCount = itemWidths.length;
  if (itemCount === 0) return 0;

  const prefix: number[] = [0];

  for (let index = 0; index < itemCount; index += 1) {
    const previous = prefix[index] ?? 0;
    const width = itemWidths[index] ?? 0;
    const gap = index === 0 ? 0 : itemGap;
    prefix.push(previous + gap + width);
  }

  const total = prefix[itemCount] ?? 0;
  if (total <= available) return itemCount;

  let low = 0;
  let high = itemCount;
  let visibleCount = 0;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const itemsWidth = prefix[mid] ?? 0;
    const required = itemsWidth + (mid > 0 ? containerGap : 0) + toggleWidth;

    if (required <= available) {
      visibleCount = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return visibleCount;
}

export function resolveVisibleCount(
  measurements: PriorityPlusMeasurements,
  options: PriorityPlusOptions = {},
): number {
  const visibleCount = calculateVisibleCount(measurements);
  const itemCount = measurements.itemWidths.length;

  if (
    options.collapseAtCount !== undefined &&
    visibleCount <= options.collapseAtCount &&
    visibleCount < itemCount
  ) {
    return 0;
  }

  return visibleCount;
}
