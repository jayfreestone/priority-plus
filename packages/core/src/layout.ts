import type {
  PriorityPlusMeasurements,
  PriorityPlusOptions,
} from "./calculate";
import {
  createPriorityPlusState,
  getPriorityPlusState,
  type PriorityPlusState,
} from "./state";

export interface PriorityPlusCachedMeasurements
  extends Omit<PriorityPlusMeasurements, "available"> {
  primaryNonContentInlineSize: number;
}

export interface PriorityPlusLayoutResult {
  previousState: PriorityPlusState;
  state: PriorityPlusState;
  changed: boolean;
  visibleCountChanged: boolean;
  overflowCountChanged: boolean;
  itemCountChanged: boolean;
  allVisibleChanged: boolean;
  measurementsChanged: boolean;
  shouldCloseOverflow: boolean;
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
    return this.#setState(createPriorityPlusState(itemCount), {
      measurementsChanged: true,
    });
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
    return this.#recalculate({ measurementsChanged: true });
  }

  setContainerInlineSize(
    containerInlineSize: number,
  ): PriorityPlusLayoutResult {
    this.#containerInlineSize = containerInlineSize;
    return this.#recalculate();
  }

  #recalculate({
    measurementsChanged = false,
  }: { measurementsChanged?: boolean } = {}): PriorityPlusLayoutResult {
    if (this.#measurements === undefined) {
      return this.#result(this.#state, this.#state, { measurementsChanged });
    }

    return this.#setState(
      getPriorityPlusState(
        {
          itemWidths: this.#measurements.itemWidths,
          itemGap: this.#measurements.itemGap,
          containerGap: this.#measurements.containerGap,
          toggleWidth: this.#measurements.toggleWidth,
          available:
            this.#containerInlineSize -
            this.#measurements.primaryNonContentInlineSize,
        },
        this.#options,
      ),
      { measurementsChanged },
    );
  }

  #setState(
    state: PriorityPlusState,
    { measurementsChanged = false }: { measurementsChanged?: boolean } = {},
  ): PriorityPlusLayoutResult {
    const previousState = this.#state;
    this.#state = state;

    return this.#result(previousState, state, { measurementsChanged });
  }

  #result(
    previousState: PriorityPlusState,
    state: PriorityPlusState,
    { measurementsChanged = false }: { measurementsChanged?: boolean } = {},
  ): PriorityPlusLayoutResult {
    const visibleCountChanged =
      previousState.visibleCount !== state.visibleCount;
    const overflowCountChanged =
      previousState.overflowCount !== state.overflowCount;
    const itemCountChanged = previousState.itemCount !== state.itemCount;
    const allVisibleChanged = previousState.allVisible !== state.allVisible;

    return {
      previousState,
      state,
      changed:
        visibleCountChanged ||
        overflowCountChanged ||
        itemCountChanged ||
        allVisibleChanged,
      visibleCountChanged,
      overflowCountChanged,
      itemCountChanged,
      allVisibleChanged,
      measurementsChanged,
      shouldCloseOverflow: state.allVisible,
    };
  }
}
