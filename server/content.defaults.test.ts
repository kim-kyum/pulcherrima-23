import { describe, expect, it } from "vitest";
import { getDefaultSiteContent } from "./db";

describe("site content defaults", () => {
  it("provides a defined recruiting document when no row exists", () => {
    const content = getDefaultSiteContent("recruiting");
    const parsed = JSON.parse(content.contentValue) as Record<string, string>;

    expect(content).toBeDefined();
    expect(content.contentKey).toBe("recruiting");
    expect(parsed.generation).toBe("23기");
    expect(parsed.contactEmail).toBe("recruit@pulcherrima.site");
  });
});
