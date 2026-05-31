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

  // If every item fits without the toggle, keep them all visible.
  let totalWidth = 0;
  for (let index = 0; index < itemCount; index += 1) {
    totalWidth += (index === 0 ? 0 : itemGap) + (itemWidths[index] ?? 0);
  }
  if (totalWidth <= available) return itemCount;

  // Otherwise reserve room for the toggle and keep the leading items that fit.
  // Width only grows as items are added, so the first item that overflows ends
  // the primary list.
  let usedWidth = 0;
  for (let index = 0; index < itemCount; index += 1) {
    usedWidth += (index === 0 ? 0 : itemGap) + (itemWidths[index] ?? 0);
    if (usedWidth + containerGap + toggleWidth > available) {
      return index;
    }
  }

  return itemCount;
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
