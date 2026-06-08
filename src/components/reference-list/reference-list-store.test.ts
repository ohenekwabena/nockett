import { describe, it, expect } from "vitest";
import { referenceReducer, titleCase, validateName } from "./reference-list-store";

describe("validateName", () => {
  it("trims and accepts a non-empty name", () => {
    expect(validateName("  Network  ")).toBe("Network");
  });

  it("rejects blank names", () => {
    expect(validateName("")).toBeNull();
    expect(validateName("   ")).toBeNull();
  });
});

describe("titleCase", () => {
  it("capitalizes each word", () => {
    expect(titleCase("demarcation")).toBe("Demarcation");
    expect(titleCase("service type")).toBe("Service Type");
    expect(titleCase("detection source")).toBe("Detection Source");
  });
});

describe("referenceReducer", () => {
  const base = [
    { id: 1, name: "A" },
    { id: 2, name: "B" },
  ];

  it("loaded replaces the whole list", () => {
    expect(referenceReducer(base, { type: "loaded", items: [{ id: 9, name: "Z" }] })).toEqual([{ id: 9, name: "Z" }]);
  });

  it("created appends the new item", () => {
    expect(referenceReducer(base, { type: "created", item: { id: 3, name: "C" } })).toEqual([
      { id: 1, name: "A" },
      { id: 2, name: "B" },
      { id: 3, name: "C" },
    ]);
  });

  it("updated renames the matching id and leaves others untouched", () => {
    expect(referenceReducer(base, { type: "updated", id: 2, name: "B2" })).toEqual([
      { id: 1, name: "A" },
      { id: 2, name: "B2" },
    ]);
  });

  it("removed drops the matching id", () => {
    expect(referenceReducer(base, { type: "removed", id: 1 })).toEqual([{ id: 2, name: "B" }]);
  });

  it("does not mutate the input array", () => {
    const input = [{ id: 1, name: "A" }];
    referenceReducer(input, { type: "created", item: { id: 2, name: "B" } });
    referenceReducer(input, { type: "removed", id: 1 });
    expect(input).toEqual([{ id: 1, name: "A" }]);
  });

  it("an optimistic remove can be reverted by re-loading the prior snapshot", () => {
    const snapshot = base;
    const afterRemove = referenceReducer(base, { type: "removed", id: 1 });
    expect(afterRemove).toEqual([{ id: 2, name: "B" }]);

    const reverted = referenceReducer(afterRemove, { type: "loaded", items: snapshot });
    expect(reverted).toEqual(base);
  });
});
