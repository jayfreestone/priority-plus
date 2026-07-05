import { afterEach, describe, expect, it, vi } from "vitest";

import type { PriorityPlusCachedMeasurements } from "./calculate";
import { createPriorityPlusSession } from "./session";

// Three 96px items with 8px gaps: 304px total, 384px with the 72px toggle +
// 8px container gap. All visible at 320px; one visible at 260px.
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
  it("recalculates from cached measurements when only the container resizes", () => {
    installFakeResizeObserver();
    let containerInlineSize = 320;
    const readMeasurements = vi.fn(() => measurements);
    const onResult = vi.fn();

    const session = createPriorityPlusSession({
      itemCount: 3,
      readMeasurements,
      getContainerInlineSize: () => containerInlineSize,
      onResult,
      requestFrame: () => 1,
      cancelFrame: vi.fn(),
    });

    session.layout({ refreshMeasurements: true });
    expect(session.getState()).toMatchObject({
      visibleCount: 3,
      allVisible: true,
    });

    containerInlineSize = 260;
    session.layout();

    expect(readMeasurements).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenLastCalledWith(
      expect.objectContaining({
        measurementsChanged: false,
        visibleCountChanged: true,
        state: expect.objectContaining({ visibleCount: 1, overflowCount: 2 }),
      }),
    );
  });

  it("coalesces schedule bursts into one frame, keeping the strongest refresh", () => {
    installFakeResizeObserver();
    let frameCallback: ((time: number) => void) | undefined;
    const requestFrame = vi.fn((callback: (time: number) => void) => {
      frameCallback = callback;
      return 1;
    });
    const readMeasurements = vi.fn(() => measurements);
    const onResult = vi.fn();

    const session = createPriorityPlusSession({
      itemCount: 3,
      readMeasurements,
      getContainerInlineSize: () => 260,
      onResult,
      requestFrame,
      cancelFrame: vi.fn(),
    });

    session.schedule();
    session.schedule({ refreshMeasurements: true });
    session.schedule();

    expect(requestFrame).toHaveBeenCalledTimes(1);
    expect(readMeasurements).not.toHaveBeenCalled();

    frameCallback?.(0);

    // One layout, and because a refresh was requested in the batch the
    // measurements are read exactly once.
    expect(readMeasurements).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult.mock.calls[0]?.[0].state).toMatchObject({
      visibleCount: 1,
      overflowCount: 2,
    });
  });

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

    session.reset(4);

    expect(onResult).toHaveBeenLastCalledWith(
      expect.objectContaining({
        state: expect.objectContaining({
          itemCount: 4,
          visibleCount: 4,
          allVisible: true,
        }),
      }),
    );
    expect(session.getState().itemCount).toBe(4);
  });

  it("drops cached measurements on reset so the next layout re-measures", () => {
    installFakeResizeObserver();
    const readMeasurements = vi.fn(() => measurements);
    const session = createPriorityPlusSession({
      itemCount: 3,
      readMeasurements,
      getContainerInlineSize: () => 260,
      onResult: vi.fn(),
      requestFrame: () => 1,
      cancelFrame: vi.fn(),
    });

    session.layout({ refreshMeasurements: true });
    expect(readMeasurements).toHaveBeenCalledTimes(1);

    session.reset(3);
    session.layout();

    expect(readMeasurements).toHaveBeenCalledTimes(2);
  });

  it("applies option changes against cached measurements", () => {
    installFakeResizeObserver();
    const onResult = vi.fn();
    const session = createPriorityPlusSession({
      itemCount: 3,
      readMeasurements: () => measurements,
      getContainerInlineSize: () => 260,
      onResult,
      requestFrame: () => 1,
      cancelFrame: vi.fn(),
    });

    session.layout({ refreshMeasurements: true });
    session.setOptions({ collapseAtCount: 1 });

    expect(onResult).toHaveBeenLastCalledWith(
      expect.objectContaining({
        visibleCountChanged: true,
        state: expect.objectContaining({
          visibleCount: 0,
          overflowCount: 3,
          allVisible: false,
        }),
      }),
    );
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
});
