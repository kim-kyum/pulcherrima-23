const imageFormats = {
  "image/jpeg": { extension: "jpg", matches: (data: Buffer) => data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff },
  "image/png": { extension: "png", matches: (data: Buffer) => data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  "image/gif": { extension: "gif", matches: (data: Buffer) => data.length >= 6 && ["GIF87a", "GIF89a"].includes(data.subarray(0, 6).toString("ascii")) },
  "image/webp": { extension: "webp", matches: (data: Buffer) => data.length >= 12 && data.subarray(0, 4).toString("ascii") === "RIFF" && data.subarray(8, 12).toString("ascii") === "WEBP" },
} as const;

export const MAX_ARCHIVE_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_ARCHIVE_IMAGE_BASE64_CHARS = Math.ceil(MAX_ARCHIVE_IMAGE_BYTES / 3) * 4 + 4;

export type ArchiveImageContentType = keyof typeof imageFormats;

export function decodeArchiveImageUpload(contentType: string, base64: string) {
  if (!(contentType in imageFormats)) {
    throw new Error("JPG, PNG, GIF 또는 WebP 파일만 업로드할 수 있습니다.");
  }
  if (!base64 || base64.length > MAX_ARCHIVE_IMAGE_BASE64_CHARS || base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) {
    throw new Error("이미지 데이터 형식을 확인하세요.");
  }

  const data = Buffer.from(base64, "base64");
  if (data.length === 0 || data.length > MAX_ARCHIVE_IMAGE_BYTES) {
    throw new Error("이미지 파일은 8MB 이하만 업로드할 수 있습니다.");
  }

  const format = imageFormats[contentType as ArchiveImageContentType];
  if (!format.matches(data)) {
    throw new Error("파일 확장자와 실제 이미지 형식이 일치하지 않습니다.");
  }
  return { data, contentType: contentType as ArchiveImageContentType, extension: format.extension };
}
