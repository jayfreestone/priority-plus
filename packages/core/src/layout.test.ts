import { describe, expect, it } from "vitest";

import type { PriorityPlusCachedMeasurements } from "./calculate";
import { PriorityPlusLayoutController } from "./layout";

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
      measurementsChanged: false,
      visibleCountChanged: true,
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
