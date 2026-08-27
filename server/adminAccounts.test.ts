import { describe, expect, it } from "vitest";
import { hashAdminPassword, verifyAdminPassword } from "./adminAccounts";
import { createAdminSessionToken, verifyAdminSessionToken } from "./adminAuth";

describe("admin account security helpers", () => {
  it("stores passwords as one-way scrypt hashes and verifies only the matching value", () => {
    const hash = hashAdminPassword("observatory-admin-password");
    expect(hash).toMatch(/^scrypt\$/);
    expect(hash).not.toContain("observatory-admin-password");
    expect(verifyAdminPassword("observatory-admin-password", hash)).toBe(true);
    expect(verifyAdminPassword("wrong-password", hash)).toBe(false);
  });

  it("keeps the account identity and role inside a signed session", () => {
    const token = createAdminSessionToken({ accountId: 7, username: "chief", role: "owner" }, 1_000);
    const session = verifyAdminSessionToken(token, 2_000);
    expect(session).toMatchObject({ accountId: 7, username: "chief", role: "owner" });
  });
});
