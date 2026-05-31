import { describe, expect, it } from "vitest";

import {
  calculateVisibleCount,
  getPriorityPlusState,
  partitionItems,
} from ".";

describe("calculateVisibleCount", () => {
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
});

describe("partitionItems", () => {
  it("returns stable visible and overflow slices", () => {
    expect(partitionItems(["a", "b", "c"], 2)).toEqual({
      visibleItems: ["a", "b"],
      overflowItems: ["c"],
    });
  });
});
