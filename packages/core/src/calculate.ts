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

/**
 * Measurements as cached between layouts. The container's available width is
 * tracked separately (it changes on every resize), so the cache stores the
 * primary list's own padding/border/margin instead and `available` is derived
 * from the live container width at recalculation time.
 */
export interface PriorityPlusCachedMeasurements
  extends Omit<PriorityPlusMeasurements, "available"> {
  primaryNonContentInlineSize: number;
}

/**
 * The inverse of the cached split above: re-derives `available` from the live
 * container width so cached measurements can be reused across resizes without
 * re-measuring.
 */
export function inflateMeasurements(
  { primaryNonContentInlineSize, ...measurements }: PriorityPlusCachedMeasurements,
  containerInlineSize: number,
): PriorityPlusMeasurements {
  return {
    ...measurements,
    available: containerInlineSize - primaryNonContentInlineSize,
  };
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

function resolveFittedVisibleCount(
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

export interface PriorityPlusState {
  itemCount: number;
  visibleCount: number;
  overflowCount: number;
  allVisible: boolean;
  /**
   * Whether this state was computed from real measurements, as opposed to the
   * optimistic all-visible seed. Adapters reflect it as the
   * `data-priority-plus-enhanced` attribute, which neutralises any styles a
   * pre-hydration `prelayout` pass injected.
   */
  measured: boolean;
}

/** An optimistic all-visible state — the render default before measurement. */
export function createPriorityPlusState(itemCount = 0): PriorityPlusState {
  return {
    itemCount,
    visibleCount: itemCount,
    overflowCount: 0,
    allVisible: true,
    measured: false,
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
    measured: true,
  };
}
