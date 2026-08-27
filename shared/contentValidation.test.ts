import { describe, expect, it } from "vitest";
import { isSafeEditableUrl, validateEditableContent } from "./contentValidation";

describe("editable content validation", () => {
  it("allows storage image URLs and rejects executable URLs", () => {
    expect(isSafeEditableUrl("/manus-storage/pulcherrima/archive/image.jpg", { allowRelative: true })).toBe(true);
    expect(isSafeEditableUrl("javascript:alert(1)", { allowRelative: true })).toBe(false);
  });

  it("requires a safe image URL and alt text for archive cards", () => {
    const valid = { intro: "기록", label: "이번 학기", period: "2027 상반기", entries: [{ date: "2027. 03", type: "관측", title: "첫 기록", excerpt: "기록 설명", image: "/manus-storage/pulcherrima/archive/first.jpg", imageAlt: "망원경" }] };
    expect(validateEditableContent("archive", JSON.stringify(valid))).toMatchObject(valid);
    expect(() => validateEditableContent("archive", JSON.stringify({ ...valid, entries: [{ ...valid.entries[0], imageAlt: "" }] }))).toThrow("이미지 대체 텍스트");
  });

  it("requires an eleven-character YouTube ID", () => {
    const home = { screens: [{ line: "문구", kind: "video", videoId: "invalid" }], ctas: [{ label: "영상", href: "/videos" }] };
    expect(() => validateEditableContent("home", JSON.stringify(home))).toThrow("11자리 YouTube 영상 ID");
  });
});
