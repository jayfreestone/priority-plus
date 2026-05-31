import type {
  PriorityPlusCachedMeasurements,
  PriorityPlusLayoutController,
  PriorityPlusLayoutResult,
} from "./layout";
import {
  createPriorityPlusFrameScheduler,
  type PriorityPlusScheduleOptions,
} from "./scheduler";

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
  /** Optional wrapper around each synchronous layout pass (e.g. profiling). */
  instrument?: (run: () => void) => void;
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
 * Owns the "re-measure vs. reuse cached measurements" decision and the frame
 * scheduler that every adapter would otherwise reimplement. Adapters supply the
 * DOM-facing hooks (`readMeasurements`, `getContainerInlineSize`, `onResult`)
 * and decide whether to apply results imperatively or through their renderer.
 */
export function createPriorityPlusEngine({
  controller,
  readMeasurements,
  getContainerInlineSize,
  onResult,
  instrument,
  requestFrame,
  cancelFrame,
}: PriorityPlusEngineOptions): PriorityPlusEngine {
  const run = (refreshMeasurements: boolean): void => {
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
    const pass = () => run(options.refreshMeasurements === true);
    if (instrument === undefined) {
      pass();
    } else {
      instrument(pass);
    }
  };

  const scheduler = createPriorityPlusFrameScheduler(
    ({ refreshMeasurements }) => layout({ refreshMeasurements }),
    { requestFrame, cancelFrame },
  );

  return {
    layout,
    schedule: scheduler.schedule,
    cancel: scheduler.cancel,
  };
}
