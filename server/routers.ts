import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { validateAdminCredentials, createAdminSessionToken, ADMIN_COOKIE_NAME, ADMIN_SESSION_MAX_AGE } from "./adminAuth";
import { z } from "zod";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, galleryProcedure, ownerProcedure, publicProcedure, router } from "./_core/trpc";
import { getSiteContent, listSiteContents, upsertSiteContent } from "./db";
import { createAdminAccount, listAdminAccounts, updateAdminAccount } from "./adminAccounts";
import { decodeArchiveImageUpload } from "./adminMedia";
import { storagePut } from "./storage";
import { validateEditableContent } from "../shared/contentValidation";
import { TRPCError } from "@trpc/server";
import { createMember, createMemberSessionToken, listMembers, MEMBER_COOKIE_NAME, MEMBER_SESSION_MAX_AGE, updateMember, validateMemberCredentials } from "./memberAuth";
import { abortUpload, completeUpload, createThumbUpload, deletePhoto, getUsage, listPhotos, resolveUploader, signParts, startUpload, updatePhoto } from "./photos";
import { isObjectStorageConfigured, presignPutObject } from "./objectStorage";

/** Turns plain Errors from helpers into readable tRPC errors without leaking stack traces. */
async function friendly<T>(work: () => Promise<T>, fallback: string): Promise<T> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    console.error("[API]", error);
    throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : fallback });
  }
}

const ARCHIVE_IMAGE_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "image/webp": "webp" } as const;
const ARCHIVE_DIRECT_MAX_BYTES = 20 * 1024 * 1024;
const username = z.string().trim().min(3).max(64).regex(/^[A-Za-z0-9._-]+$/, "아이디는 영문·숫자·.-_만 쓸 수 있습니다.");

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
      /** Signs a direct browser → bucket upload; `legacy` means fall back to uploadArchiveImage. */
      createArchiveUpload: adminProcedure.input(z.object({ contentType: z.string().max(64), sizeBytes: z.number().int().positive() })).mutation(({ input }) => friendly(async () => {
        if (!isObjectStorageConfigured()) return { mode: "legacy" as const };
        const extension = ARCHIVE_IMAGE_TYPES[input.contentType as keyof typeof ARCHIVE_IMAGE_TYPES];
        if (!extension) throw new Error("JPG, PNG, GIF 또는 WebP 파일만 업로드할 수 있습니다.");
        if (input.sizeBytes > ARCHIVE_DIRECT_MAX_BYTES) throw new Error("이미지 파일은 20MB 이하만 업로드할 수 있습니다.");
        const name = `${new Date().toISOString().slice(0, 10)}-${crypto.randomUUID()}.${extension}`;
        const uploadUrl = await presignPutObject(`archive/${name}`, input.contentType, input.sizeBytes);
        return { mode: "direct" as const, uploadUrl, publicUrl: `/api/media/archive/${name}` };
      }, "사진 업로드를 준비하지 못했습니다.")),
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
    members: router({
      list: adminProcedure.query(() => friendly(() => listMembers(), "회원 목록을 불러오지 못했습니다.")),
      create: adminProcedure.input(z.object({ username, displayName: z.string().trim().min(1).max(64), password: z.string().min(8).max(128) })).mutation(({ input }) => friendly(async () => {
        await createMember(input);
        return { success: true } as const;
      }, "회원 계정을 만들지 못했습니다.")),
      update: adminProcedure.input(z.object({ id: z.number().int().positive(), displayName: z.string().trim().min(1).max(64).optional(), password: z.string().min(8).max(128).optional(), active: z.boolean().optional() })).mutation(({ input }) => friendly(() => updateMember(input), "회원 계정을 저장하지 못했습니다.")),
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
  member: router({
    me: publicProcedure.query(async ({ ctx }) => {
      const uploader = await resolveUploader(ctx.req).catch(() => null);
      return uploader ? { authenticated: true as const, name: uploader.name, kind: uploader.kind, isAdmin: uploader.isAdmin, storageReady: isObjectStorageConfigured() } : { authenticated: false as const, storageReady: isObjectStorageConfigured() };
    }),
    login: publicProcedure.input(z.object({ username: z.string().min(1).max(64), password: z.string().min(1).max(128) })).mutation(({ input, ctx }) => friendly(async () => {
      const member = await validateMemberCredentials(input.username, input.password);
      if (!member) throw new TRPCError({ code: "UNAUTHORIZED", message: "회원 아이디 또는 비밀번호가 올바르지 않습니다." });
      ctx.res.cookie(MEMBER_COOKIE_NAME, createMemberSessionToken(member), { ...getSessionCookieOptions(ctx.req), maxAge: MEMBER_SESSION_MAX_AGE });
      return { success: true, displayName: member.displayName } as const;
    }, "로그인하지 못했습니다.")),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(MEMBER_COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  photos: router({
    usage: galleryProcedure.query(({ ctx }) => friendly(() => getUsage(ctx.uploader), "사용량을 불러오지 못했습니다.")),
    list: galleryProcedure.input(z.object({ cursor: z.number().int().positive().optional(), limit: z.number().int().min(1).max(60).default(30), mine: z.boolean().optional() })).query(({ ctx, input }) => friendly(() => listPhotos(ctx.uploader, input), "사진 목록을 불러오지 못했습니다.")),
    startUpload: galleryProcedure.input(z.object({ fileName: z.string().trim().min(1).max(255), sizeBytes: z.number().int().positive(), contentType: z.string().max(128), title: z.string().max(200).optional(), description: z.string().max(2000).optional() })).mutation(({ ctx, input }) => friendly(() => startUpload(ctx.uploader, input), "업로드를 시작하지 못했습니다.")),
    signParts: galleryProcedure.input(z.object({ photoId: z.number().int().positive(), partNumbers: z.array(z.number().int().min(1).max(10000)).min(1).max(50) })).mutation(({ ctx, input }) => friendly(() => signParts(ctx.uploader, input.photoId, input.partNumbers), "업로드 주소를 만들지 못했습니다.")),
    complete: galleryProcedure.input(z.object({ photoId: z.number().int().positive(), parts: z.array(z.object({ partNumber: z.number().int().min(1).max(10000), etag: z.string().min(1).max(200) })).max(10000).optional() })).mutation(({ ctx, input }) => friendly(() => completeUpload(ctx.uploader, input.photoId, input.parts), "업로드를 마무리하지 못했습니다.")),
    abort: galleryProcedure.input(z.object({ photoId: z.number().int().positive() })).mutation(({ ctx, input }) => friendly(() => abortUpload(ctx.uploader, input.photoId), "업로드를 취소하지 못했습니다.")),
    thumbUpload: galleryProcedure.input(z.object({ photoId: z.number().int().positive(), sizeBytes: z.number().int().positive() })).mutation(({ ctx, input }) => friendly(() => createThumbUpload(ctx.uploader, input.photoId, input.sizeBytes), "미리보기를 올리지 못했습니다.")),
    update: galleryProcedure.input(z.object({ photoId: z.number().int().positive(), title: z.string().max(200).optional(), description: z.string().max(2000).optional() })).mutation(({ ctx, input }) => friendly(() => updatePhoto(ctx.uploader, input), "사진 정보를 저장하지 못했습니다.")),
    delete: galleryProcedure.input(z.object({ photoId: z.number().int().positive() })).mutation(({ ctx, input }) => friendly(() => deletePhoto(ctx.uploader, input.photoId), "사진을 지우지 못했습니다.")),
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
