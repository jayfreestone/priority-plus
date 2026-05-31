import { describe, expect, it, vi } from "vitest";

import {
  createPriorityPlusFrameScheduler,
  PriorityPlusLayoutController,
  type PriorityPlusCachedMeasurements,
} from ".";

const measurements: PriorityPlusCachedMeasurements = {
  itemWidths: [96, 96, 96],
  itemGap: 8,
  containerGap: 8,
  toggleWidth: 72,
  primaryNonContentInlineSize: 0,
};

describe("PriorityPlusLayoutController", () => {
  it("caches measurements and recalculates from container width changes", () => {
    const controller = new PriorityPlusLayoutController({}, 3);

    const measured = controller.setMeasurements(measurements, 320);

    expect(measured).toMatchObject({
      changed: false,
      measurementsChanged: true,
      visibleCountChanged: false,
      state: {
        itemCount: 3,
        visibleCount: 3,
        overflowCount: 0,
        allVisible: true,
      },
    });

    const resized = controller.setContainerInlineSize(260);

    expect(resized).toMatchObject({
      changed: true,
      measurementsChanged: false,
      visibleCountChanged: true,
      shouldCloseOverflow: false,
      previousState: {
        visibleCount: 3,
      },
      state: {
        itemCount: 3,
        visibleCount: 1,
        overflowCount: 2,
        allVisible: false,
      },
    });
  });

  it("applies option changes against cached measurements", () => {
    const controller = new PriorityPlusLayoutController({}, 3);

    controller.setMeasurements(measurements, 260);
    const result = controller.setOptions({ collapseAtCount: 1 });

    expect(result).toMatchObject({
      changed: true,
      visibleCountChanged: true,
      state: {
        visibleCount: 0,
        overflowCount: 3,
        allVisible: false,
      },
    });
  });

  it("resets cached measurements when the item model changes", () => {
    const controller = new PriorityPlusLayoutController({}, 3);

    controller.setMeasurements(measurements, 260);
    const result = controller.reset(4);

    expect(controller.hasMeasurements).toBe(false);
    expect(result).toMatchObject({
      changed: true,
      measurementsChanged: true,
      state: {
        itemCount: 4,
        visibleCount: 4,
        overflowCount: 0,
        allVisible: true,
      },
    });
  });
});

describe("createPriorityPlusFrameScheduler", () => {
  it("coalesces callbacks and preserves the strongest refresh request", () => {
    const requestFrame = vi.fn<(callback: FrameRequestCallback) => number>();
    const cancelFrame = vi.fn();
    const callback = vi.fn();
    let frameCallback: FrameRequestCallback | undefined;

    requestFrame.mockImplementation((nextFrame) => {
      frameCallback = nextFrame;
      return 1;
    });

    const scheduler = createPriorityPlusFrameScheduler(callback, {
      cancelFrame,
      requestFrame,
    });

    scheduler.schedule();
    scheduler.schedule({ refreshMeasurements: true });
    scheduler.schedule();

    expect(requestFrame).toHaveBeenCalledTimes(1);

    frameCallback?.(0);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith({ refreshMeasurements: true });
  });

  it("cancels pending work", () => {
    const callback = vi.fn();
    const scheduler = createPriorityPlusFrameScheduler(callback, {
      cancelFrame: vi.fn(),
      requestFrame: () => 1,
    });

    scheduler.schedule({ refreshMeasurements: true });
    scheduler.cancel();

    scheduler.schedule();

    expect(callback).not.toHaveBeenCalled();
  });
});
