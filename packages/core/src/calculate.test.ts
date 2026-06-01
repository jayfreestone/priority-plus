import { describe, expect, it } from "vitest";

import {
  calculateVisibleCount,
  createPriorityPlusState,
  getPriorityPlusState,
  partitionItems,
  planPartition,
  type PriorityPlusMeasurements,
} from ".";

describe("calculateVisibleCount", () => {
  const visibleCountCases: Array<{
    expected: number;
    measurements: PriorityPlusMeasurements;
    name: string;
  }> = [
    {
      name: "returns zero when there are no items",
      measurements: {
        itemWidths: [],
        itemGap: 10,
        containerGap: 8,
        toggleWidth: 72,
        available: 260,
      },
      expected: 0,
    },
    {
      name: "keeps every item visible when all items fit without the toggle",
      measurements: {
        itemWidths: [80, 90, 100],
        itemGap: 10,
        containerGap: 8,
        toggleWidth: 72,
        available: 290,
      },
      expected: 3,
    },
    {
      name: "returns zero when only the overflow toggle can fit",
      measurements: {
        itemWidths: [96, 96],
        itemGap: 8,
        containerGap: 8,
        toggleWidth: 72,
        available: 72,
      },
      expected: 0,
    },
    {
      name: "reserves room for the toggle when items overflow",
      measurements: {
        itemWidths: [96, 96, 96, 96],
        itemGap: 8,
        containerGap: 8,
        toggleWidth: 72,
        available: 260,
      },
      expected: 1,
    },
    {
      name: "includes another item when the required width exactly matches the available width",
      measurements: {
        itemWidths: [96, 96, 96, 96],
        itemGap: 8,
        containerGap: 8,
        toggleWidth: 72,
        available: 280,
      },
      expected: 2,
    },
  ];

  it.for(visibleCountCases)("$name", ({ measurements, expected }) => {
    expect(calculateVisibleCount(measurements)).toBe(expected);
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

describe("planPartition", () => {
  it("promotes the newly fitting indices into primary", () => {
    expect(planPartition(1, 3, 4)).toEqual({
      kind: "promote",
      indices: [1, 2],
    });
  });

  it("demotes the now-overflowing indices into overflow", () => {
    expect(planPartition(3, 1, 4)).toEqual({
      kind: "demote",
      indices: [1, 2],
    });
  });

  it("does nothing when the visible count is unchanged", () => {
    expect(planPartition(2, 2, 4)).toEqual({ kind: "none" });
  });

  it("rebuilds both lists when forced", () => {
    expect(planPartition(3, 2, 4, { force: true })).toEqual({
      kind: "rebuild",
      primary: [0, 1],
      overflow: [2, 3],
    });
  });
});
