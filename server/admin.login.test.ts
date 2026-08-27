import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

const cookies: Array<{ name: string; options: Record<string, unknown> }> = [];
const ctx: TrpcContext = {
  user: null,
  adminSession: null,
  req: { protocol: "https", headers: {} } as TrpcContext["req"],
  res: {
    cookie: (name: string, _value: string, options: Record<string, unknown>) => cookies.push({ name, options }),
  } as TrpcContext["res"],
};

describe("admin.login", () => {
  it("validates the configured admin credentials through the API procedure", async () => {
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.login({
      username: process.env.PULCHERRIMA_ADMIN_USERNAME ?? "",
      password: process.env.PULCHERRIMA_ADMIN_PASSWORD ?? "",
    });

    expect(result).toMatchObject({ success: true, role: "owner" });
    expect(cookies[0]).toMatchObject({ name: "pulcherrima_admin_session", options: { httpOnly: true, maxAge: 8 * 60 * 60 * 1000 } });
  });

  it("rejects invalid credentials", async () => {
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.login({ username: "invalid", password: "invalid" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
