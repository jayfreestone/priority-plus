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
  return calculateVisibleCountFromParts(
    itemWidths,
    itemGap,
    containerGap,
    toggleWidth,
    available,
  );
}

export function calculateVisibleCountFromParts(
  itemWidths: number[],
  itemGap: number,
  containerGap: number,
  toggleWidth: number,
  available: number,
): number {
  const itemCount = itemWidths.length;
  let totalWidth = 0;
  let visibleCount = itemCount;

  for (let index = 0; index < itemCount; index += 1) {
    totalWidth += (index === 0 ? 0 : itemGap) + (itemWidths[index] ?? 0);

    if (
      visibleCount === itemCount &&
      totalWidth + containerGap + toggleWidth > available
    ) {
      visibleCount = index;
    }
  }

  // If every item fits without the toggle, keep them all visible. Otherwise use
  // the first prefix count that fits with room reserved for the toggle.
  return totalWidth <= available ? itemCount : visibleCount;
}

export function resolveVisibleCount(
  measurements: PriorityPlusMeasurements,
  options: PriorityPlusOptions = {},
): number {
  const visibleCount = calculateVisibleCount(measurements);
  const itemCount = measurements.itemWidths.length;

  return resolveFittedVisibleCount(
    visibleCount,
    itemCount,
    options.collapseAtCount,
  );
}

export function resolveFittedVisibleCount(
  visibleCount: number,
  itemCount: number,
  collapseAtCount?: number,
): number {
  return collapseAtCount !== undefined &&
    visibleCount <= collapseAtCount &&
    visibleCount < itemCount
    ? 0
    : visibleCount;
}
