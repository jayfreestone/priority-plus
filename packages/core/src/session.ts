import {
  createPriorityPlusState,
  getPriorityPlusState,
  inflateMeasurements,
  type PriorityPlusCachedMeasurements,
  type PriorityPlusOptions,
  type PriorityPlusState,
} from "./calculate";

export interface PriorityPlusLayoutResult {
  previousState: PriorityPlusState;
  state: PriorityPlusState;
  visibleCountChanged: boolean;
  overflowCountChanged: boolean;
  itemCountChanged: boolean;
  measurementsChanged: boolean;
}

export interface PriorityPlusScheduleOptions {
  refreshMeasurements?: boolean;
}

export interface PriorityPlusObserveOptions {
  /**
   * Whether a resize of this element should re-measure the DOM. Use `true` for
   * elements whose intrinsic size feeds the fit calculation (the hidden
   * measurer), `false` for the container, whose resize only changes the space
   * available to a layout that can reuse cached measurements.
   *
   * Note web fonts need no dedicated handling when the measurer is observed
   * this way: new font metrics resize the measurer, which triggers the
   * re-measure.
   */
  refreshOnResize?: boolean;
}

export interface PriorityPlusSessionOptions {
  /** Initial layout options. */
  options?: PriorityPlusOptions;
  /** Initial item count, used to seed the optimistic all-visible state. */
  itemCount?: number;
  /**
   * Read fresh measurements from the DOM. Return `null`/`undefined` to abort
   * the layout (e.g. when required elements are not mounted yet).
   */
  readMeasurements: () => PriorityPlusCachedMeasurements | null | undefined;
  /** The current inline size available to the primary list. */
  getContainerInlineSize: () => number | null | undefined;
  /** Apply a freshly computed layout result. */
  onResult: (result: PriorityPlusLayoutResult) => void;
  /** Override the frame primitives (mainly for tests). */
  requestFrame?: (callback: (time: number) => void) => number;
  cancelFrame?: (handle: number) => void;
}

/**
 * The whole adapter lifecycle behind one interface: the measurement cache, the
 * "re-measure vs. reuse" decision, frame coalescing, and the `ResizeObserver`.
 * Each adapter supplies the DOM-facing hooks and decides which elements to
 * `observe` and when to `reset` or `setOptions`; everything an adapter would
 * otherwise re-wire by hand — and get subtly wrong — lives here, tested once.
 * Every recalculation is delivered through `onResult` — the single
 * notification path; `getState` reads the same snapshot on demand.
 */
export interface PriorityPlusSession {
  /** The current state snapshot (the same one `onResult` last delivered). */
  getState: () => PriorityPlusState;
  /** Run a layout synchronously. */
  layout: (options?: PriorityPlusScheduleOptions) => void;
  /** Coalesce a layout into the next animation frame. */
  schedule: (options?: PriorityPlusScheduleOptions) => void;
  /** Observe an element's size; resizes schedule a (optionally refreshing) layout. */
  observe: (target: Element, options?: PriorityPlusObserveOptions) => void;
  /** Stop observing an element. */
  unobserve: (target: Element) => void;
  /** Drop cached measurements and commit an optimistic all-visible state. */
  reset: (itemCount?: number) => void;
  /** Apply new layout options against cached measurements and commit. */
  setOptions: (options: PriorityPlusOptions) => void;
  /**
   * Cancel pending work and disconnect the observer. Reversible: a later
   * `observe` re-creates the observer, so the session survives a
   * mount/unmount/remount cycle (e.g. React StrictMode).
   */
  destroy: () => void;
}

/**
 * The layout controller: cached measurements, layout options, and change
 * detection. Every mutation recomputes the state and reports which fields
 * changed, so adapters can do the minimum DOM work.
 */
class LayoutController {
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
      getPriorityPlusState(
        inflateMeasurements(this.#measurements, this.#containerInlineSize),
        this.#options,
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

export function createPriorityPlusSession({
  options = {},
  itemCount = 0,
  readMeasurements,
  getContainerInlineSize,
  onResult,
  requestFrame = (callback) => requestAnimationFrame(callback),
  cancelFrame = (handle) => cancelAnimationFrame(handle),
}: PriorityPlusSessionOptions): PriorityPlusSession {
  const controller = new LayoutController(options, itemCount);

  // The "re-measure vs. reuse cached measurements" decision. The container
  // size is read after the measurements so adapters may update it as a side
  // effect of measuring.
  const run = (refreshMeasurements?: boolean): void => {
    if (refreshMeasurements || !controller.hasMeasurements) {
      const measurements = readMeasurements();
      if (measurements == null) return;

      const containerInlineSize = getContainerInlineSize();
      if (containerInlineSize == null) return;

      onResult(controller.setMeasurements(measurements, containerInlineSize));
      return;
    }

    const containerInlineSize = getContainerInlineSize();
    if (containerInlineSize == null) return;

    onResult(controller.setContainerInlineSize(containerInlineSize));
  };

  const layout = (layoutOptions: PriorityPlusScheduleOptions = {}): void => {
    run(layoutOptions.refreshMeasurements);
  };

  // Coalesce bursts of schedule() calls (e.g. ResizeObserver firing for several
  // observed elements) into one layout per frame, remembering whether any
  // caller asked to re-measure.
  let frame: number | undefined;
  let refreshPending: boolean | undefined = false;

  const schedule = (scheduleOptions: PriorityPlusScheduleOptions = {}): void => {
    refreshPending ||= scheduleOptions.refreshMeasurements;
    if (frame !== undefined) return;

    frame = requestFrame(() => {
      frame = undefined;
      const refresh = refreshPending;
      refreshPending = false;
      run(refresh);
    });
  };

  let observer: ResizeObserver | undefined;
  const refreshTargets = new Set<Element>();

  const observe = (
    target: Element,
    { refreshOnResize = false }: PriorityPlusObserveOptions = {},
  ): void => {
    observer ??= new ResizeObserver((entries) => {
      schedule({
        refreshMeasurements: entries.some((entry) =>
          refreshTargets.has(entry.target),
        ),
      });
    });

    if (refreshOnResize) refreshTargets.add(target);
    observer.observe(target);
  };

  const unobserve = (target: Element): void => {
    refreshTargets.delete(target);
    observer?.unobserve(target);
  };

  const destroy = (): void => {
    if (frame !== undefined) cancelFrame(frame);
    frame = undefined;
    refreshPending = false;
    observer?.disconnect();
    observer = undefined;
    refreshTargets.clear();
  };

  return {
    getState: () => controller.getState(),
    layout,
    schedule,
    observe,
    unobserve,
    reset: (nextItemCount) => onResult(controller.reset(nextItemCount)),
    setOptions: (nextOptions) => onResult(controller.setOptions(nextOptions)),
    destroy,
  };
}
