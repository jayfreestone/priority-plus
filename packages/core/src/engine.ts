import type {
  PriorityPlusCachedMeasurements,
  PriorityPlusLayoutController,
  PriorityPlusLayoutResult,
} from "./layout";

export interface PriorityPlusScheduleOptions {
  refreshMeasurements?: boolean;
}

export interface PriorityPlusEngineOptions {
  /** The layout controller to drive. Must outlive the engine. */
  controller: PriorityPlusLayoutController;
  /**
   * Read fresh measurements from the DOM. Return `null`/`undefined` to abort
   * the layout (e.g. when required elements are not mounted yet).
   */
  readMeasurements: () => PriorityPlusCachedMeasurements | null | undefined;
  /**
   * The current inline size available to the primary list, or `null`/
   * `undefined` to abort the layout. Read after `readMeasurements` so adapters
   * may update it as a side effect of measuring.
   */
  getContainerInlineSize: () => number | null | undefined;
  /** Apply a freshly computed layout result. */
  onResult: (result: PriorityPlusLayoutResult) => void;
  /** Override the frame primitives (mainly for tests). */
  requestFrame?: (callback: (time: number) => void) => number;
  cancelFrame?: (handle: number) => void;
}

export interface PriorityPlusEngine {
  /** Run a layout synchronously. */
  layout: (options?: PriorityPlusScheduleOptions) => void;
  /** Coalesce a layout into the next animation frame. */
  schedule: (options?: PriorityPlusScheduleOptions) => void;
  /** Cancel any pending scheduled layout. */
  cancel: () => void;
}

/**
 * Owns the "re-measure vs. reuse cached measurements" decision and frame
 * coalescing that every adapter would otherwise reimplement. Adapters supply
 * the DOM-facing hooks (`readMeasurements`, `getContainerInlineSize`,
 * `onResult`) and decide whether to apply results imperatively or through their
 * renderer.
 */
export function createPriorityPlusEngine({
  controller,
  readMeasurements,
  getContainerInlineSize,
  onResult,
  requestFrame = defaultRequestFrame,
  cancelFrame = defaultCancelFrame,
}: PriorityPlusEngineOptions): PriorityPlusEngine {
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

  const layout = (options: PriorityPlusScheduleOptions = {}): void => {
    run(options.refreshMeasurements);
  };

  // Coalesce bursts of schedule() calls (e.g. ResizeObserver firing for several
  // observed elements) into one layout per frame, remembering whether any
  // caller asked to re-measure.
  let frame: number | undefined;
  let refreshPending: boolean | undefined = false;

  const schedule = (options: PriorityPlusScheduleOptions = {}): void => {
    refreshPending ||= options.refreshMeasurements;
    if (frame !== undefined) return;

    frame = requestFrame(() => {
      frame = undefined;
      const refresh = refreshPending;
      refreshPending = false;
      run(refresh);
    });
  };

  const cancel = (): void => {
    if (frame !== undefined) cancelFrame(frame);
    frame = undefined;
    refreshPending = false;
  };

  return { layout, schedule, cancel };
}

const defaultRequestFrame = (callback: (time: number) => void): number =>
  typeof requestAnimationFrame === "function"
    ? requestAnimationFrame(callback)
    : setTimeout(() => callback(Date.now()), 0);

const defaultCancelFrame = (handle: number): void => {
  if (typeof cancelAnimationFrame === "function") {
    cancelAnimationFrame(handle);
  } else {
    clearTimeout(handle);
  }
};
