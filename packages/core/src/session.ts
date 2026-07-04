import type { PriorityPlusCachedMeasurements, PriorityPlusOptions } from "./calculate";
import {
  createPriorityPlusEngine,
  type PriorityPlusEngine,
  type PriorityPlusScheduleOptions,
} from "./engine";
import {
  PriorityPlusLayoutController,
  type PriorityPlusLayoutResult,
} from "./layout";
import type { PriorityPlusState } from "./state";

export type { PriorityPlusScheduleOptions } from "./engine";

export interface PriorityPlusObserveOptions {
  /**
   * Whether a resize of this element should re-measure the DOM. Use `true` for
   * elements whose intrinsic size feeds the fit calculation (the hidden
   * measurer), `false` for the container, whose resize only changes the space
   * available to a layout that can reuse cached measurements.
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
 * The whole adapter lifecycle behind one interface: the layout controller and
 * engine (both private to the session), the `ResizeObserver`, and the
 * font-load reflow. Each adapter supplies the DOM-facing hooks and decides
 * which elements to `observe` and when to `reset` or `setOptions`; everything
 * an adapter would otherwise re-wire by hand — and get subtly wrong — lives
 * here, tested once. Every state change is delivered through `onResult`;
 * `getState` reads the same snapshot on demand.
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
  /** Reset to a new item count, commit the optimistic state, and re-measure. */
  reset: (itemCount?: number) => PriorityPlusLayoutResult;
  /** Apply new layout options against cached measurements and commit. */
  setOptions: (options: PriorityPlusOptions) => PriorityPlusLayoutResult;
  /**
   * Schedule a refreshing layout once web fonts have loaded. `destroy` cancels
   * any still-pending font callback, so adapters need no disposer bookkeeping.
   */
  refreshOnFontLoad: () => void;
  /**
   * Cancel pending work (including font-load reflows) and disconnect the
   * observer. Reversible: a later `observe` re-creates the observer, so the
   * session survives a mount/unmount/remount cycle (e.g. React StrictMode).
   */
  destroy: () => void;
}

export function createPriorityPlusSession({
  options = {},
  itemCount = 0,
  readMeasurements,
  getContainerInlineSize,
  onResult,
  requestFrame,
  cancelFrame,
}: PriorityPlusSessionOptions): PriorityPlusSession {
  const controller = new PriorityPlusLayoutController(options, itemCount);

  const engine: PriorityPlusEngine = createPriorityPlusEngine({
    controller,
    readMeasurements,
    getContainerInlineSize,
    onResult,
    requestFrame,
    cancelFrame,
  });

  let observer: ResizeObserver | undefined;
  const refreshTargets = new Set<Element>();
  const fontReflowCancels = new Set<() => void>();

  const ensureObserver = (): ResizeObserver | undefined => {
    if (observer !== undefined || typeof ResizeObserver === "undefined") {
      return observer;
    }

    observer = new ResizeObserver((entries) => {
      engine.schedule({
        refreshMeasurements: entries.some((entry) =>
          refreshTargets.has(entry.target),
        ),
      });
    });
    return observer;
  };

  const observe = (
    target: Element,
    { refreshOnResize = false }: PriorityPlusObserveOptions = {},
  ): void => {
    const resizeObserver = ensureObserver();
    if (resizeObserver === undefined) return;

    if (refreshOnResize) refreshTargets.add(target);
    resizeObserver.observe(target);
  };

  const unobserve = (target: Element): void => {
    refreshTargets.delete(target);
    observer?.unobserve(target);
  };

  const reset = (
    nextItemCount?: number,
  ): PriorityPlusLayoutResult => {
    const result = controller.reset(nextItemCount);
    onResult(result);
    return result;
  };

  const setOptions = (
    nextOptions: PriorityPlusOptions,
  ): PriorityPlusLayoutResult => {
    const result = controller.setOptions(nextOptions);
    onResult(result);
    return result;
  };

  const refreshOnFontLoad = (): void => {
    let cancelled = false;
    const cancel = () => {
      cancelled = true;
    };
    fontReflowCancels.add(cancel);

    document.fonts?.ready.then(() => {
      fontReflowCancels.delete(cancel);
      if (!cancelled) engine.schedule({ refreshMeasurements: true });
    });
  };

  const destroy = (): void => {
    engine.cancel();
    observer?.disconnect();
    observer = undefined;
    refreshTargets.clear();
    for (const cancel of fontReflowCancels) cancel();
    fontReflowCancels.clear();
  };

  return {
    getState: () => controller.getState(),
    layout: engine.layout,
    schedule: engine.schedule,
    observe,
    unobserve,
    reset,
    setOptions,
    refreshOnFontLoad,
    destroy,
  };
}
