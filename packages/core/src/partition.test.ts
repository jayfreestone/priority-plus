import { describe, expect, it } from "vitest";

import { partitionItems, planPartition } from "./partition";

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
