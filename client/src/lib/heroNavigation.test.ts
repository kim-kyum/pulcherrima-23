import { describe, expect, it } from "vitest";
import { getNextScreenIndex } from "./heroNavigation";

describe("getNextScreenIndex", () => {
  it("advances to the following hero screen", () => {
    expect(getNextScreenIndex(0, 3)).toBe(1);
    expect(getNextScreenIndex(1, 3)).toBe(2);
  });

  it("does not move beyond the final screen", () => {
    expect(getNextScreenIndex(2, 3)).toBe(2);
    expect(getNextScreenIndex(99, 3)).toBe(2);
  });

  it("returns a safe index when no screens exist", () => {
    expect(getNextScreenIndex(0, 0)).toBe(0);
  });
});
