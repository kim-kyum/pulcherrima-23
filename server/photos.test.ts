import { describe, expect, it } from "vitest";
import { choosePartSize } from "./objectStorage";
import { isAllowedPhotoFile, safeObjectFileName } from "./photos";
import { createMemberSessionToken, verifyMemberSessionToken } from "./memberAuth";
import { verifyAdminSessionToken } from "./adminAuth";

describe("photo upload helpers", () => {
  it("keeps multipart uploads under the 10,000-part limit with equal parts", () => {
    for (const size of [65 * 1024 ** 2, 5 * 1024 ** 3, 50 * 1024 ** 3, 1024 ** 4]) {
      const { partSize, partCount } = choosePartSize(size);
      expect(partCount).toBeLessThanOrEqual(10_000);
      expect(partSize).toBeGreaterThanOrEqual(16 * 1024 ** 2);
      expect(partSize * partCount).toBeGreaterThanOrEqual(size);
      expect(partSize * (partCount - 1)).toBeLessThan(size);
    }
  });

  it("accepts astronomy formats and rejects others", () => {
    expect(isAllowedPhotoFile("M42_stack.FITS")).toBe(true);
    expect(isAllowedPhotoFile("jupiter.ser")).toBe(true);
    expect(isAllowedPhotoFile("IMG_0001.CR3")).toBe(true);
    expect(isAllowedPhotoFile("payload.exe")).toBe(false);
    expect(isAllowedPhotoFile("noextension")).toBe(false);
  });

  it("makes object keys safe but keeps Korean names readable", () => {
    expect(safeObjectFileName("오리온 대성운 (최종).tif")).toBe("오리온_대성운_최종_.tif");
    expect(safeObjectFileName("../../etc/passwd")).toBe("etc_passwd");
  });
});

describe("member sessions", () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-for-member-sessions";

  it("round-trips a member token", () => {
    const token = createMemberSessionToken({ id: 7, username: "kyum", displayName: "23기 김겸" });
    expect(verifyMemberSessionToken(token)).toMatchObject({ memberId: 7, username: "kyum" });
  });

  it("rejects tampered and expired tokens", () => {
    const token = createMemberSessionToken({ id: 7, username: "kyum", displayName: "겸" });
    const [payload, signature] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(payload, "base64url").toString()), memberId: 1 })).toString("base64url");
    expect(verifyMemberSessionToken(`${forged}.${signature}`)).toBeNull();
    expect(verifyMemberSessionToken(token, Date.now() + 15 * 24 * 60 * 60 * 1000)).toBeNull();
  });

  it("cannot be used as an admin session", () => {
    const token = createMemberSessionToken({ id: 1, username: "kyum", displayName: "겸" });
    expect(verifyAdminSessionToken(token)).toBeNull();
  });
});
