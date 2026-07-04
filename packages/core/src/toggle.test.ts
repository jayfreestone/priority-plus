import { describe, expect, it } from "vitest";

import { createPriorityPlusState } from "./state";
import {
  defaultToggleLabel,
  presentToggle,
  widestToggleState,
} from "./toggle";

const overflowing = {
  itemCount: 4,
  visibleCount: 1,
  overflowCount: 3,
  allVisible: false,
};

describe("presentToggle", () => {
  it("expands the overflow when open and items overflow", () => {
    expect(presentToggle(true, overflowing)).toEqual({
      expanded: true,
      toggleHidden: false,
      overflowHidden: false,
    });
  });

  it("collapses the overflow when closed", () => {
    expect(presentToggle(false, overflowing)).toEqual({
      expanded: false,
      toggleHidden: false,
      overflowHidden: true,
    });
  });

  it("never expands when every item is visible, whatever the intent", () => {
    expect(presentToggle(true, createPriorityPlusState(4))).toEqual({
      expanded: false,
      toggleHidden: true,
      overflowHidden: true,
    });
  });
});

describe("defaultToggleLabel", () => {
  it("renders the overflow count", () => {
    expect(defaultToggleLabel(overflowing)).toBe("More (3)");
  });

  it("clamps to one so a measurer never renders More (0)", () => {
    expect(defaultToggleLabel(createPriorityPlusState(4))).toBe("More (1)");
  });
});

describe("widestToggleState", () => {
  it("pretends every item overflowed", () => {
    expect(widestToggleState(4)).toEqual({
      itemCount: 4,
      visibleCount: 0,
      overflowCount: 4,
      allVisible: false,
    });
  });

  it("clamps the overflow count for empty item lists", () => {
    expect(widestToggleState(0).overflowCount).toBe(1);
  });
});
