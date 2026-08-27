import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { areAdminCredentialsValid, createAdminSessionToken, ADMIN_COOKIE_NAME, ADMIN_SESSION_MAX_AGE } from "./adminAuth";
import { z } from "zod";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { getSiteContent, listSiteContents, upsertSiteContent } from "./db";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  admin: router({
    me: publicProcedure.query(({ ctx }) => ({ authenticated: ctx.user?.role === "admin" })),
    content: router({
      list: adminProcedure.query(() => listSiteContents()),
      update: adminProcedure.input(z.object({ contentKey: z.enum(["archive", "recruiting"]), contentValue: z.string().max(100000) })).mutation(({ input }) => upsertSiteContent(input.contentKey, input.contentValue)),
    }),
    login: publicProcedure.input(z.object({ username: z.string().min(1), password: z.string().min(1) })).mutation(({ input, ctx }) => {
      if (!areAdminCredentialsValid(input.username, input.password)) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "관리자 아이디 또는 비밀번호가 올바르지 않습니다." });
      }
      ctx.res.cookie(ADMIN_COOKIE_NAME, createAdminSessionToken(), {
        ...getSessionCookieOptions(ctx.req),
        maxAge: ADMIN_SESSION_MAX_AGE,
      });
      return { success: true } as const;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(ADMIN_COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  content: router({
    get: publicProcedure.input(z.object({ contentKey: z.enum(["archive", "recruiting"]) })).query(({ input }) => getSiteContent(input.contentKey)),
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
