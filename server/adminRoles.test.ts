import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const makeContext = (role: "owner" | "admin"): TrpcContext => ({
  user: { id: 1, openId: "test-admin", name: "test", email: null, loginMethod: "password", role: "admin", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  adminSession: { sub: "pulcherrima-admin", accountId: 1, username: "test", role, iat: 1, exp: 2_000_000_000 },
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {} as TrpcContext["res"],
});

describe("admin role boundaries", () => {
  it("blocks a regular administrator from account management", async () => {
    const caller = appRouter.createCaller(makeContext("admin"));
    await expect(caller.admin.accounts.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows an owner to access the administrator account list", async () => {
    const caller = appRouter.createCaller(makeContext("owner"));
    await expect(caller.admin.accounts.list()).resolves.toBeInstanceOf(Array);
  });
});
