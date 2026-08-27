import { describe, expect, it } from "vitest";
import { decodeArchiveImageUpload, MAX_ARCHIVE_IMAGE_BYTES } from "./adminMedia";

const onePixelPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9d9dQAAAAASUVORK5CYII=";

describe("archive image upload validation", () => {
  it("accepts a valid PNG image within the size limit", () => {
    const result = decodeArchiveImageUpload("image/png", onePixelPng);
    expect(result.extension).toBe("png");
    expect(result.data.length).toBeLessThan(MAX_ARCHIVE_IMAGE_BYTES);
  });

  it("rejects unsupported formats and mismatched image data", () => {
    expect(() => decodeArchiveImageUpload("image/svg+xml", onePixelPng)).toThrow("JPG, PNG, GIF 또는 WebP");
    expect(() => decodeArchiveImageUpload("image/jpeg", onePixelPng)).toThrow("파일 확장자와 실제 이미지 형식");
  });
});
