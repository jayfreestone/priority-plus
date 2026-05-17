export interface OverflowInput {
  /** Width of each item in the primary list, in source order. */
  itemWidths: number[];
  /** Gap between adjacent items inside the primary list. */
  itemGap: number;
  /** Gap between the primary list and the toggle in their shared container. */
  containerGap: number;
  /** Width of the toggle button when it is visible. */
  toggleWidth: number;
  /** Inline space available to fit primary list + toggle. */
  available: number;
}

/**
 * Given a set of measurements, decide how many leading items fit in the
 * primary list while leaving room for the toggle. Items beyond the returned
 * count belong in the overflow list.
 *
 * Pure: no DOM access. Safe to share with non-DOM contexts (tests, React, ...).
 */
export function calculateVisibleCount({
  itemWidths,
  itemGap,
  containerGap,
  toggleWidth,
  available,
}: OverflowInput): number {
  const itemCount = itemWidths.length;
  if (itemCount === 0) return 0;

  // prefix[k] = total inline size of the first k items including gaps between them.
  const prefix: number[] = [0];
  for (let i = 0; i < itemCount; i += 1) {
    const previous = prefix[i] ?? 0;
    const width = itemWidths[i] ?? 0;
    const gap = i === 0 ? 0 : itemGap;
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
