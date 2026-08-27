import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { validateAdminCredentials, createAdminSessionToken, ADMIN_COOKIE_NAME, ADMIN_SESSION_MAX_AGE } from "./adminAuth";
import { z } from "zod";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, ownerProcedure, publicProcedure, router } from "./_core/trpc";
import { getSiteContent, listSiteContents, upsertSiteContent } from "./db";
import { createAdminAccount, listAdminAccounts, updateAdminAccount } from "./adminAccounts";
import { decodeArchiveImageUpload } from "./adminMedia";
import { storagePut } from "./storage";
import { validateEditableContent } from "../shared/contentValidation";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  admin: router({
    me: publicProcedure.query(({ ctx }) => ({ authenticated: ctx.user?.role === "admin", role: ctx.adminSession?.role ?? null, username: ctx.adminSession?.username ?? null })),
    content: router({
      list: adminProcedure.query(() => listSiteContents()),
      update: adminProcedure.input(z.object({ contentKey: z.enum(["home", "archive", "videos", "recruiting"]), contentValue: z.string().max(100000) })).mutation(({ input }) => {
        try {
          const validated = validateEditableContent(input.contentKey, input.contentValue);
          return upsertSiteContent(input.contentKey, JSON.stringify(validated, null, 2));
        } catch (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "콘텐츠 형식을 확인하세요." });
        }
      }),
    }),
    media: router({
      uploadArchiveImage: adminProcedure.input(z.object({ fileName: z.string().min(1).max(200), contentType: z.string().max(64), base64: z.string().max(12_000_000) })).mutation(async ({ input }) => {
        try {
          const image = decodeArchiveImageUpload(input.contentType, input.base64);
          const timestamp = new Date().toISOString().slice(0, 10);
          return await storagePut(`pulcherrima/archive/${timestamp}-${crypto.randomUUID()}.${image.extension}`, image.data, image.contentType);
        } catch (error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "사진을 업로드하지 못했습니다." });
        }
      }),
    }),
    accounts: router({
      list: ownerProcedure.query(() => listAdminAccounts()),
      create: ownerProcedure.input(z.object({ username: z.string().trim().min(3).max(64), password: z.string().min(10).max(128), role: z.enum(["admin", "owner"]).default("admin") })).mutation(({ input }) => createAdminAccount(input)),
      update: ownerProcedure.input(z.object({ id: z.number().int().positive(), username: z.string().trim().min(3).max(64).optional(), password: z.string().min(10).max(128).optional(), role: z.enum(["admin", "owner"]).optional(), active: z.boolean().optional() })).mutation(({ input }) => updateAdminAccount(input)),
    }),
    login: publicProcedure.input(z.object({ username: z.string().min(1), password: z.string().min(1) })).mutation(async ({ input, ctx }) => {
      const account = await validateAdminCredentials(input.username, input.password);
      if (!account) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "관리자 아이디 또는 비밀번호가 올바르지 않습니다." });
      }
      ctx.res.cookie(ADMIN_COOKIE_NAME, createAdminSessionToken(account), {
        ...getSessionCookieOptions(ctx.req),
        maxAge: ADMIN_SESSION_MAX_AGE,
      });
      return { success: true, role: account.role } as const;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(ADMIN_COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  content: router({
    get: publicProcedure.input(z.object({ contentKey: z.enum(["home", "archive", "videos", "recruiting"]) })).query(({ input }) => getSiteContent(input.contentKey)),
  }),
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
