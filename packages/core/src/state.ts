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

export type PriorityPlusListener = (state: PriorityPlusState) => void;

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

export class PriorityPlusController {
  #listeners = new Set<PriorityPlusListener>();
  #measurements?: PriorityPlusMeasurements;
  #options: PriorityPlusOptions;
  #state: PriorityPlusState;

  constructor(options: PriorityPlusOptions = {}, itemCount = 0) {
    this.#options = options;
    this.#state = createPriorityPlusState(itemCount);
  }

  getState(): PriorityPlusState {
    return this.#state;
  }

  setOptions(options: PriorityPlusOptions): void {
    this.#options = options;
    this.#recalculate();
  }

  setItemCount(itemCount: number): void {
    if (this.#measurements !== undefined) return;
    this.#setState(createPriorityPlusState(itemCount));
  }

  setMeasurements(measurements: PriorityPlusMeasurements): void {
    this.#measurements = measurements;
    this.#recalculate();
  }

  subscribe(listener: PriorityPlusListener): () => void {
    this.#listeners.add(listener);
    listener(this.#state);

    return () => {
      this.#listeners.delete(listener);
    };
  }

  #recalculate(): void {
    if (this.#measurements === undefined) return;
    this.#setState(getPriorityPlusState(this.#measurements, this.#options));
  }

  #setState(nextState: PriorityPlusState): void {
    if (statesEqual(this.#state, nextState)) return;
    this.#state = nextState;

    for (const listener of this.#listeners) {
      listener(this.#state);
    }
  }
}

function statesEqual(a: PriorityPlusState, b: PriorityPlusState): boolean {
  return (
    a.itemCount === b.itemCount &&
    a.visibleCount === b.visibleCount &&
    a.overflowCount === b.overflowCount &&
    a.allVisible === b.allVisible
  );
}
