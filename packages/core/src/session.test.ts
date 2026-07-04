import { afterEach, describe, expect, it, vi } from "vitest";

import type { PriorityPlusCachedMeasurements } from "./calculate";
import { createPriorityPlusSession } from "./session";

const measurements: PriorityPlusCachedMeasurements = {
  itemWidths: [96, 96, 96],
  itemGap: 8,
  containerGap: 8,
  toggleWidth: 72,
  primaryNonContentInlineSize: 0,
};

// A minimal fake ResizeObserver that lets tests drive the callback directly.
class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];
  readonly observed: Element[] = [];
  constructor(readonly callback: ResizeObserverCallback) {
    FakeResizeObserver.instances.push(this);
  }
  observe(target: Element) {
    this.observed.push(target);
  }
  unobserve(target: Element) {
    const index = this.observed.indexOf(target);
    if (index !== -1) this.observed.splice(index, 1);
  }
  disconnect() {
    this.observed.length = 0;
  }
  emit(targets: Element[]) {
    this.callback(
      targets.map((target) => ({ target }) as ResizeObserverEntry),
      this as unknown as ResizeObserver,
    );
  }
}

const installFakeResizeObserver = () => {
  FakeResizeObserver.instances = [];
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  return () => FakeResizeObserver.instances.at(-1);
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createPriorityPlusSession", () => {
  it("refreshes measurements only when a refresh-on-resize target resizes", () => {
    const getObserver = installFakeResizeObserver();
    let frameCallback: ((time: number) => void) | undefined;
    const readMeasurements = vi.fn(() => measurements);

    const container = {} as Element;
    const measurer = {} as Element;

    const session = createPriorityPlusSession({
      itemCount: 3,
      readMeasurements,
      getContainerInlineSize: () => 260,
      onResult: vi.fn(),
      requestFrame: (callback) => {
        frameCallback = callback;
        return 1;
      },
      cancelFrame: vi.fn(),
    });

    session.observe(container, { refreshOnResize: false });
    session.observe(measurer, { refreshOnResize: true });

    const observer = getObserver();
    expect(observer?.observed).toEqual([container, measurer]);

    // Prime cached measurements so the session has something to reuse.
    session.layout({ refreshMeasurements: true });
    expect(readMeasurements).toHaveBeenCalledTimes(1);

    // Container-only resize: reuse cached measurements (no re-measure).
    observer?.emit([container]);
    frameCallback?.(0);
    expect(readMeasurements).toHaveBeenCalledTimes(1);

    // Measurer resize: re-measure.
    observer?.emit([measurer]);
    frameCallback?.(0);
    expect(readMeasurements).toHaveBeenCalledTimes(2);
  });

  it("stops refreshing on resize once a target is unobserved", () => {
    const getObserver = installFakeResizeObserver();
    let frameCallback: ((time: number) => void) | undefined;
    const readMeasurements = vi.fn(() => measurements);

    const measurer = {} as Element;
    const session = createPriorityPlusSession({
      itemCount: 3,
      readMeasurements,
      getContainerInlineSize: () => 260,
      onResult: vi.fn(),
      requestFrame: (callback) => {
        frameCallback = callback;
        return 1;
      },
      cancelFrame: vi.fn(),
    });

    session.observe(measurer, { refreshOnResize: true });
    session.unobserve(measurer);

    const observer = getObserver();
    expect(observer?.observed).toEqual([]);

    // Prime cached measurements; an unobserved target must not force a re-measure.
    session.layout({ refreshMeasurements: true });
    expect(readMeasurements).toHaveBeenCalledTimes(1);

    observer?.emit([measurer]);
    frameCallback?.(0);
    expect(readMeasurements).toHaveBeenCalledTimes(1);
  });

  it("commits an optimistic all-visible state on reset", () => {
    installFakeResizeObserver();
    const onResult = vi.fn();
    const session = createPriorityPlusSession({
      itemCount: 0,
      readMeasurements: () => measurements,
      getContainerInlineSize: () => 260,
      onResult,
      requestFrame: () => 1,
      cancelFrame: vi.fn(),
    });

    const result = session.reset(4);

    expect(result.state).toMatchObject({
      itemCount: 4,
      visibleCount: 4,
      allVisible: true,
    });
    expect(onResult).toHaveBeenCalledWith(result);
    expect(session.getState().itemCount).toBe(4);
  });

  it("disconnects the observer and stops scheduling after destroy", () => {
    const getObserver = installFakeResizeObserver();
    const cancelFrame = vi.fn();
    const session = createPriorityPlusSession({
      itemCount: 3,
      readMeasurements: () => measurements,
      getContainerInlineSize: () => 260,
      onResult: vi.fn(),
      requestFrame: () => 1,
      cancelFrame,
    });

    const container = {} as Element;
    session.observe(container);
    session.schedule();
    session.destroy();

    expect(cancelFrame).toHaveBeenCalledWith(1);
    expect(getObserver()?.observed).toEqual([]);
  });

  it("cancels a pending font-load reflow on destroy", async () => {
    installFakeResizeObserver();
    let fontsLoaded!: () => void;
    const ready = new Promise<void>((resolve) => {
      fontsLoaded = resolve;
    });
    vi.stubGlobal("document", { fonts: { ready } });

    const requestFrame = vi.fn(() => 1);
    const session = createPriorityPlusSession({
      itemCount: 3,
      readMeasurements: () => measurements,
      getContainerInlineSize: () => 260,
      onResult: vi.fn(),
      requestFrame,
      cancelFrame: vi.fn(),
    });

    session.refreshOnFontLoad();
    session.destroy();

    fontsLoaded();
    await ready;
    await Promise.resolve();

    expect(requestFrame).not.toHaveBeenCalled();
  });

  it("schedules a refreshing layout when fonts load before destroy", async () => {
    installFakeResizeObserver();
    let fontsLoaded!: () => void;
    const ready = new Promise<void>((resolve) => {
      fontsLoaded = resolve;
    });
    vi.stubGlobal("document", { fonts: { ready } });

    const requestFrame = vi.fn(() => 1);
    const session = createPriorityPlusSession({
      itemCount: 3,
      readMeasurements: () => measurements,
      getContainerInlineSize: () => 260,
      onResult: vi.fn(),
      requestFrame,
      cancelFrame: vi.fn(),
    });

    session.refreshOnFontLoad();
    fontsLoaded();
    await ready;
    await Promise.resolve();

    expect(requestFrame).toHaveBeenCalledTimes(1);
  });
});
