import type {
  PriorityPlusMeasurements,
  PriorityPlusOptions,
} from "./calculate";
import {
  createPriorityPlusState,
  getPriorityPlusStateFromParts,
  type PriorityPlusState,
} from "./state";

export interface PriorityPlusCachedMeasurements
  extends Omit<PriorityPlusMeasurements, "available"> {
  primaryNonContentInlineSize: number;
}

export interface PriorityPlusLayoutResult {
  previousState: PriorityPlusState;
  state: PriorityPlusState;
  visibleCountChanged: boolean;
  overflowCountChanged: boolean;
  itemCountChanged: boolean;
  measurementsChanged: boolean;
}

export class PriorityPlusLayoutController {
  #containerInlineSize = 0;
  #measurements?: PriorityPlusCachedMeasurements;
  #options: PriorityPlusOptions;
  #state: PriorityPlusState;

  constructor(options: PriorityPlusOptions = {}, itemCount = 0) {
    this.#options = options;
    this.#state = createPriorityPlusState(itemCount);
  }

  get hasMeasurements(): boolean {
    return this.#measurements !== undefined;
  }

  getState(): PriorityPlusState {
    return this.#state;
  }

  reset(itemCount = this.#state.itemCount): PriorityPlusLayoutResult {
    this.#measurements = undefined;
    return this.#setState(createPriorityPlusState(itemCount), true);
  }

  setOptions(options: PriorityPlusOptions): PriorityPlusLayoutResult {
    this.#options = options;
    return this.#recalculate();
  }

  setMeasurements(
    measurements: PriorityPlusCachedMeasurements,
    containerInlineSize: number,
  ): PriorityPlusLayoutResult {
    this.#measurements = measurements;
    this.#containerInlineSize = containerInlineSize;
    return this.#recalculate(true);
  }

  setContainerInlineSize(
    containerInlineSize: number,
  ): PriorityPlusLayoutResult {
    this.#containerInlineSize = containerInlineSize;
    return this.#recalculate();
  }

  #recalculate(measurementsChanged = false): PriorityPlusLayoutResult {
    if (this.#measurements === undefined) {
      return this.#setState(this.#state, measurementsChanged);
    }

    return this.#setState(
      getPriorityPlusStateFromParts(
        this.#measurements.itemWidths,
        this.#measurements.itemGap,
        this.#measurements.containerGap,
        this.#measurements.toggleWidth,
        this.#containerInlineSize -
          this.#measurements.primaryNonContentInlineSize,
        this.#options.collapseAtCount,
      ),
      measurementsChanged,
    );
  }

  #setState(
    state: PriorityPlusState,
    measurementsChanged = false,
  ): PriorityPlusLayoutResult {
    const previousState = this.#state;
    this.#state = state;

    return {
      previousState,
      state,
      visibleCountChanged: previousState.visibleCount !== state.visibleCount,
      overflowCountChanged: previousState.overflowCount !== state.overflowCount,
      itemCountChanged: previousState.itemCount !== state.itemCount,
      measurementsChanged,
    };
  }
}
