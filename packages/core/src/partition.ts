/**
 * Item placement: two answers to "which items go in primary vs. overflow", one
 * per adapter strategy. Adapters that re-render (React, Svelte) slice with
 * `partitionItems`; adapters that move live DOM nodes (the custom element)
 * execute a `planPartition` plan. The index arithmetic stays here where it can
 * be tested without a DOM.
 */

export function partitionItems<T>(
  items: readonly T[],
  visibleCount: number,
): { visibleItems: T[]; overflowItems: T[] } {
  return {
    visibleItems: items.slice(0, visibleCount),
    overflowItems: items.slice(visibleCount),
  };
}

/**
 * The change in item placement between two visible counts, expressed as item
 * indices.
 *
 * - `none` — nothing moves.
 * - `promote` — these indices move from overflow into the end of primary.
 * - `demote` — these indices move from the end of primary to the front of overflow.
 * - `rebuild` — repartition from scratch into the two index lists.
 */
export type PriorityPlusPartitionPlan =
  | { kind: "none" }
  | { kind: "promote"; indices: number[] }
  | { kind: "demote"; indices: number[] }
  | { kind: "rebuild"; primary: number[]; overflow: number[] };

export function planPartition(
  previousVisibleCount: number,
  nextVisibleCount: number,
  itemCount: number,
  { force = false }: { force?: boolean } = {},
): PriorityPlusPartitionPlan {
  if (force) {
    return {
      kind: "rebuild",
      primary: range(0, nextVisibleCount),
      overflow: range(nextVisibleCount, itemCount),
    };
  }

  if (nextVisibleCount > previousVisibleCount) {
    return { kind: "promote", indices: range(previousVisibleCount, nextVisibleCount) };
  }

  if (nextVisibleCount < previousVisibleCount) {
    return { kind: "demote", indices: range(nextVisibleCount, previousVisibleCount) };
  }

  return { kind: "none" };
}

function range(start: number, end: number): number[] {
  const indices: number[] = [];
  for (let index = start; index < end; index += 1) {
    indices.push(index);
  }
  return indices;
}
