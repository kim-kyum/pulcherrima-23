import { describe, expect, it } from "vitest";
import { getDefaultSiteContent } from "./db";

describe("expanded promotional content defaults", () => {
  it("provides editable home sections and calls to action", () => {
    const parsed = JSON.parse(getDefaultSiteContent("home").contentValue) as { screens?: unknown[]; ctas?: unknown[] };
    expect(parsed.screens?.length).toBeGreaterThanOrEqual(3);
    expect(parsed.ctas?.length).toBeGreaterThanOrEqual(3);
  });

  it("provides editable video items and recruiting sections", () => {
    const videos = JSON.parse(getDefaultSiteContent("videos").contentValue) as { items?: unknown[]; channelUrl?: string };
    const recruiting = JSON.parse(getDefaultSiteContent("recruiting").contentValue) as { fitItems?: unknown[]; steps?: unknown[]; noticeTitle?: string };
    expect(videos.items?.length).toBeGreaterThanOrEqual(5);
    expect(videos.channelUrl).toContain("youtube.com");
    expect(recruiting.fitItems?.length).toBe(3);
    expect(recruiting.steps?.length).toBe(3);
    expect(recruiting.noticeTitle).toBeTruthy();
  });
});
