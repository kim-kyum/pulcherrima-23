import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { resolveUploader } from "../photos";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

export const ownerProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin" || ctx.adminSession?.role !== "owner") {
      throw new TRPCError({ code: "FORBIDDEN", message: "총괄관리자 권한이 필요합니다." });
    }
    return next({ ctx: { ...ctx, user: ctx.user, adminSession: ctx.adminSession } });
  }),
);

/**
 * Club members (and administrators) using the /gallery photo library.
 * Uses its own message instead of UNAUTHED_ERR_MSG so the client does not
 * redirect to the Manus OAuth login page.
 */
export const galleryProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    const uploader = await resolveUploader(ctx.req);
    if (!uploader) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "회원 로그인이 필요합니다." });
    }
    return next({ ctx: { ...ctx, uploader } });
  }),
);
