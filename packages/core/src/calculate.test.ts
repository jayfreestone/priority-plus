import { describe, expect, it } from "vitest";

import {
  calculateVisibleCount,
  inflateMeasurements,
  type PriorityPlusMeasurements,
} from "./calculate";

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
});

describe("inflateMeasurements", () => {
  it("re-derives available from the live container width", () => {
    expect(
      inflateMeasurements(
        {
          itemWidths: [96, 96],
          itemGap: 8,
          containerGap: 8,
          toggleWidth: 72,
          primaryNonContentInlineSize: 20,
        },
        320,
      ),
    ).toEqual({
      itemWidths: [96, 96],
      itemGap: 8,
      containerGap: 8,
      toggleWidth: 72,
      available: 300,
    });
  });
});
