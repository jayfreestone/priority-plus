import { describe, expect, it } from "vitest";

import { createPriorityPlusState, getPriorityPlusState } from "./state";

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

describe("getPriorityPlusState", () => {
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
