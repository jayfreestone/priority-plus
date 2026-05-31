import { describe, expect, it, vi } from "vitest";

import {
  calculateVisibleCount,
  createPriorityPlusState,
  getPriorityPlusState,
  partitionItems,
  PriorityPlusController,
} from ".";

describe("calculateVisibleCount", () => {
  it("returns zero when there are no items", () => {
    expect(
      calculateVisibleCount({
        itemWidths: [],
        itemGap: 10,
        containerGap: 8,
        toggleWidth: 72,
        available: 260,
      }),
    ).toBe(0);
  });

  it("keeps every item visible when all items fit without the toggle", () => {
    expect(
      calculateVisibleCount({
        itemWidths: [80, 90, 100],
        itemGap: 10,
        containerGap: 8,
        toggleWidth: 72,
        available: 290,
      }),
    ).toBe(3);
  });

  it("returns zero when only the overflow toggle can fit", () => {
    expect(
      calculateVisibleCount({
        itemWidths: [96, 96],
        itemGap: 8,
        containerGap: 8,
        toggleWidth: 72,
        available: 72,
      }),
    ).toBe(0);
  });

  it("reserves room for the toggle when items overflow", () => {
    expect(
      calculateVisibleCount({
        itemWidths: [96, 96, 96, 96],
        itemGap: 8,
        containerGap: 8,
        toggleWidth: 72,
        available: 260,
      }),
    ).toBe(1);
  });

  it("includes another item when the required width exactly matches the available width", () => {
    expect(
      calculateVisibleCount({
        itemWidths: [96, 96, 96, 96],
        itemGap: 8,
        containerGap: 8,
        toggleWidth: 72,
        available: 280,
      }),
    ).toBe(2);
  });

  it("can collapse orphaned primary items into the overflow", () => {
    expect(
      getPriorityPlusState(
        {
          itemWidths: [96, 96, 96],
          itemGap: 8,
          containerGap: 8,
          toggleWidth: 72,
          available: 260,
        },
        { collapseAtCount: 1 },
      ),
    ).toMatchObject({
      visibleCount: 0,
      overflowCount: 3,
      allVisible: false,
    });
  });

  it("does not collapse items when every item already fits", () => {
    expect(
      getPriorityPlusState(
        {
          itemWidths: [80, 90, 100],
          itemGap: 10,
          containerGap: 8,
          toggleWidth: 72,
          available: 290,
        },
        { collapseAtCount: 3 },
      ),
    ).toMatchObject({
      visibleCount: 3,
      overflowCount: 0,
      allVisible: true,
    });
  });
});

describe("createPriorityPlusState", () => {
  it("starts with every item visible", () => {
    expect(createPriorityPlusState(4)).toEqual({
      itemCount: 4,
      visibleCount: 4,
      overflowCount: 0,
      allVisible: true,
    });
  });
});

describe("partitionItems", () => {
  it("returns stable visible and overflow slices", () => {
    expect(partitionItems(["a", "b", "c"], 2)).toEqual({
      visibleItems: ["a", "b"],
      overflowItems: ["c"],
    });
  });

  it("keeps every item in overflow when the visible count is zero", () => {
    expect(partitionItems(["a", "b", "c"], 0)).toEqual({
      visibleItems: [],
      overflowItems: ["a", "b", "c"],
    });
  });
});

describe("PriorityPlusController", () => {
  it("notifies subscribers only when calculated state changes", () => {
    const controller = new PriorityPlusController({}, 3);
    const listener = vi.fn();

    const unsubscribe = controller.subscribe(listener);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenLastCalledWith({
      itemCount: 3,
      visibleCount: 3,
      overflowCount: 0,
      allVisible: true,
    });

    const measurements = {
      itemWidths: [96, 96, 96],
      itemGap: 8,
      containerGap: 8,
      toggleWidth: 72,
      available: 260,
    };

    controller.setMeasurements(measurements);
    controller.setMeasurements(measurements);

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith({
      itemCount: 3,
      visibleCount: 1,
      overflowCount: 2,
      allVisible: false,
    });

    controller.setOptions({ collapseAtCount: 1 });

    expect(listener).toHaveBeenCalledTimes(3);
    expect(listener).toHaveBeenLastCalledWith({
      itemCount: 3,
      visibleCount: 0,
      overflowCount: 3,
      allVisible: false,
    });

    unsubscribe();
    controller.setOptions({});

    expect(listener).toHaveBeenCalledTimes(3);
  });
});
