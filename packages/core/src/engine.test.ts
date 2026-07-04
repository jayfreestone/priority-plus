import { describe, expect, it, vi } from "vitest";

import type { PriorityPlusCachedMeasurements } from "./calculate";
import { createPriorityPlusEngine } from "./engine";
import { PriorityPlusLayoutController } from "./layout";

const measurements: PriorityPlusCachedMeasurements = {
  itemWidths: [96, 96, 96],
  itemGap: 8,
  containerGap: 8,
  toggleWidth: 72,
  primaryNonContentInlineSize: 0,
};

describe("createPriorityPlusEngine", () => {
  it("coalesces schedule() calls into one frame and keeps the strongest refresh", () => {
    const requestFrame = vi.fn<(callback: (time: number) => void) => number>();
    let frameCallback: ((time: number) => void) | undefined;
    requestFrame.mockImplementation((callback) => {
      frameCallback = callback;
      return 1;
    });

    const readMeasurements = vi.fn(() => measurements);
    const onResult = vi.fn();

    const engine = createPriorityPlusEngine({
      controller: new PriorityPlusLayoutController({}, 3),
      readMeasurements,
      getContainerInlineSize: () => 260,
      onResult,
      requestFrame,
      cancelFrame: vi.fn(),
    });

    engine.schedule();
    engine.schedule({ refreshMeasurements: true });
    engine.schedule();

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

  it("reuses cached measurements when no refresh is requested", () => {
    let frameCallback: ((time: number) => void) | undefined;
    const readMeasurements = vi.fn(() => measurements);
    const onResult = vi.fn();
    const controller = new PriorityPlusLayoutController({}, 3);
    controller.setMeasurements(measurements, 260);

    const engine = createPriorityPlusEngine({
      controller,
      readMeasurements,
      getContainerInlineSize: () => 600,
      onResult,
      requestFrame: (callback) => {
        frameCallback = callback;
        return 1;
      },
      cancelFrame: vi.fn(),
    });

    engine.schedule();
    frameCallback?.(0);

    expect(readMeasurements).not.toHaveBeenCalled();
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult.mock.calls[0]?.[0].state.allVisible).toBe(true);
  });

  it("cancels pending work and allows rescheduling", () => {
    const cancelFrame = vi.fn();
    const requestFrame = vi.fn<(callback: (time: number) => void) => number>(
      () => 1,
    );

    const engine = createPriorityPlusEngine({
      controller: new PriorityPlusLayoutController({}, 3),
      readMeasurements: () => measurements,
      getContainerInlineSize: () => 260,
      onResult: vi.fn(),
      requestFrame,
      cancelFrame,
    });

    engine.schedule({ refreshMeasurements: true });
    expect(requestFrame).toHaveBeenCalledTimes(1);

    engine.cancel();
    expect(cancelFrame).toHaveBeenCalledWith(1);

    // Cancelling cleared the pending frame, so the next schedule requests a new
    // one rather than coalescing into the cancelled frame.
    engine.schedule();
    expect(requestFrame).toHaveBeenCalledTimes(2);
  });
});
