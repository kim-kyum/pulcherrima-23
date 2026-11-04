/*
 * Member photo library: quota checks, upload bookkeeping and access control.
 * Bytes go browser → bucket directly (see objectStorage.ts); this module only
 * records metadata and signs URLs.
 */
import { and, desc, eq, lt, sql } from "drizzle-orm";
import type { Request } from "express";
import { photos, type Photo } from "../drizzle/schema";
import { getDb } from "./db";
import { ensureMemberTables } from "./memberSchema";
import { getActiveMemberSession } from "./memberAuth";
import { getAdminSession } from "./adminAuth";
import { getAdminAccountById } from "./adminAccounts";
import {
  abortMultipartUpload,
  choosePartSize,
  completeMultipartUpload,
  createMultipartUpload,
  deleteObject,
  headObjectSize,
  presignPutObject,
  presignUploadParts,
  SINGLE_PUT_MAX_BYTES,
  storageLimits,
} from "./objectStorage";

export type Uploader = { kind: "member" | "admin"; id: number; name: string; isAdmin: boolean };

/** Extensions astronomy photo work actually produces. */
export const ALLOWED_PHOTO_EXTENSIONS = [
  "jpg", "jpeg", "png", "webp", "gif", "heic", "heif", "avif", "tif", "tiff", "bmp",
  "fits", "fit", "fts", "fz", "xisf",
  "cr2", "cr3", "nef", "arw", "raf", "orf", "rw2", "dng", "pef", "srw",
  "ser", "avi", "mov", "mp4",
  "zip",
] as const;

export const THUMB_MAX_BYTES = 2 * 1024 * 1024;

export function fileExtension(fileName: string) {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot + 1).toLowerCase();
}

export function isAllowedPhotoFile(fileName: string) {
  return (ALLOWED_PHOTO_EXTENSIONS as readonly string[]).includes(fileExtension(fileName));
}

/** Keeps Latin letters, Hangul, digits, dot, dash and underscore for the object key. */
export function safeObjectFileName(fileName: string) {
  const cleaned = fileName.normalize("NFC").replace(/[^A-Za-z0-9\uAC00-\uD7A3._-]+/g, "_").replace(/_+/g, "_").replace(/^[._]+/, "");
  return (cleaned || "file").slice(-120);
}

function safeContentType(contentType: string) {
  return /^[\w.+-]+\/[\w.+-]+$/.test(contentType) && contentType.length <= 128 ? contentType : "application/octet-stream";
}

async function photoDb() {
  await ensureMemberTables();
  const db = await getDb();
  if (!db) throw new Error("데이터베이스에 연결할 수 없습니다.");
  return db;
}

export async function getUsage(uploader?: Uploader) {
  const db = await photoDb();
  const total = await db.select({ bytes: sql<string>`coalesce(sum(${photos.sizeBytes}), 0)`, count: sql<string>`count(*)` }).from(photos);
  let mine = 0;
  if (uploader) {
    const own = await db
      .select({ bytes: sql<string>`coalesce(sum(${photos.sizeBytes}), 0)` })
      .from(photos)
      .where(and(eq(photos.uploaderKind, uploader.kind), eq(photos.uploaderId, uploader.id)));
    mine = Number(own[0]?.bytes ?? 0);
  }
  const limits = storageLimits();
  return { usedBytes: Number(total[0]?.bytes ?? 0), fileCount: Number(total[0]?.count ?? 0), myUsedBytes: mine, ...limits };
}

/** Abandoned uploads (closed tab, lost network) still reserve quota; release them after a day. */
async function cleanupStaleUploads() {
  const db = await photoDb();
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const stale = await db.select().from(photos).where(and(eq(photos.status, "uploading"), lt(photos.createdAt, cutoff))).limit(20);
  for (const photo of stale) await removePhotoObjects(photo).catch(() => undefined);
}

export async function startUpload(uploader: Uploader, input: { fileName: string; sizeBytes: number; contentType: string; title?: string; description?: string }) {
  if (!isAllowedPhotoFile(input.fileName)) {
    throw new Error("지원하지 않는 파일 형식입니다. 사진(JPG·PNG·TIFF·HEIC), RAW, FITS·XISF, SER·AVI 영상, ZIP을 올릴 수 있습니다.");
  }
  await cleanupStaleUploads().catch(() => undefined);
  const usage = await getUsage(uploader);
  if (input.sizeBytes > usage.maxFileBytes) throw new Error(`한 파일은 ${formatBytes(usage.maxFileBytes)}까지 올릴 수 있습니다.`);
  if (usage.usedBytes + input.sizeBytes > usage.totalQuotaBytes) {
    throw new Error(`동아리 저장 공간이 부족합니다. (남은 공간 ${formatBytes(Math.max(0, usage.totalQuotaBytes - usage.usedBytes))})`);
  }
  if (usage.memberQuotaBytes > 0 && !uploader.isAdmin && usage.myUsedBytes + input.sizeBytes > usage.memberQuotaBytes) {
    throw new Error(`개인 저장 한도(${formatBytes(usage.memberQuotaBytes)})를 넘습니다.`);
  }

  const now = new Date();
  const folder = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const objectKey = `photos/${folder}/${crypto.randomUUID()}/${safeObjectFileName(input.fileName)}`;
  const contentType = safeContentType(input.contentType);
  const multipart = input.sizeBytes > SINGLE_PUT_MAX_BYTES;
  const uploadId = multipart ? await createMultipartUpload(objectKey, contentType) : null;

  const db = await photoDb();
  const inserted = await db.insert(photos).values({
    uploaderKind: uploader.kind,
    uploaderId: uploader.id,
    uploaderName: uploader.name.slice(0, 64),
    objectKey,
    uploadId,
    fileName: input.fileName.slice(0, 255),
    contentType,
    sizeBytes: input.sizeBytes,
    title: input.title?.trim() || null,
    description: input.description?.trim() || null,
    status: "uploading",
  }).$returningId();
  const photoId = inserted[0]?.id;
  if (!photoId) throw new Error("업로드 기록을 만들지 못했습니다.");

  if (!multipart) {
    return { photoId, mode: "single" as const, contentType, url: await presignPutObject(objectKey, contentType, input.sizeBytes) };
  }
  const { partSize, partCount } = choosePartSize(input.sizeBytes);
  return { photoId, mode: "multipart" as const, partSize, partCount };
}

async function getPhoto(photoId: number) {
  const db = await photoDb();
  const rows = await db.select().from(photos).where(eq(photos.id, photoId)).limit(1);
  return rows[0];
}

function ownsPhoto(uploader: Uploader, photo: Photo) {
  return photo.uploaderKind === uploader.kind && photo.uploaderId === uploader.id;
}

async function getOwnUploadingPhoto(uploader: Uploader, photoId: number) {
  const photo = await getPhoto(photoId);
  if (!photo || !ownsPhoto(uploader, photo)) throw new Error("업로드를 찾을 수 없습니다.");
  if (photo.status !== "uploading") throw new Error("이미 끝난 업로드입니다.");
  return photo;
}

export async function signParts(uploader: Uploader, photoId: number, partNumbers: number[]) {
  const photo = await getOwnUploadingPhoto(uploader, photoId);
  if (!photo.uploadId) throw new Error("분할 업로드가 아닙니다.");
  return presignUploadParts(photo.objectKey, photo.uploadId, partNumbers);
}

export async function completeUpload(uploader: Uploader, photoId: number, parts?: Array<{ partNumber: number; etag: string }>) {
  const photo = await getOwnUploadingPhoto(uploader, photoId);
  if (photo.uploadId) {
    if (!parts?.length) throw new Error("업로드한 조각 정보가 없습니다.");
    await completeMultipartUpload(photo.objectKey, photo.uploadId, parts);
  }
  const storedSize = await headObjectSize(photo.objectKey);
  if (storedSize === null) throw new Error("저장소에서 파일을 찾지 못했습니다. 다시 올려 주세요.");
  if (storedSize !== photo.sizeBytes) {
    await removePhotoObjects({ ...photo, uploadId: null });
    throw new Error("올라간 파일 크기가 신고한 크기와 달라 업로드를 취소했습니다.");
  }
  const db = await photoDb();
  await db.update(photos).set({ status: "ready", uploadId: null, completedAt: new Date() }).where(eq(photos.id, photoId));
  return { success: true } as const;
}

export async function abortUpload(uploader: Uploader, photoId: number) {
  const photo = await getOwnUploadingPhoto(uploader, photoId);
  await removePhotoObjects(photo);
  return { success: true } as const;
}

export async function createThumbUpload(uploader: Uploader, photoId: number, sizeBytes: number) {
  const photo = await getPhoto(photoId);
  if (!photo || !ownsPhoto(uploader, photo)) throw new Error("사진을 찾을 수 없습니다.");
  if (sizeBytes > THUMB_MAX_BYTES) throw new Error("미리보기 이미지가 너무 큽니다.");
  const thumbKey = `photos/thumbs/${photo.id}-${crypto.randomUUID().slice(0, 8)}.jpg`;
  const url = await presignPutObject(thumbKey, "image/jpeg", sizeBytes);
  if (photo.thumbKey) await deleteObject(photo.thumbKey).catch(() => undefined);
  const db = await photoDb();
  await db.update(photos).set({ thumbKey }).where(eq(photos.id, photo.id));
  return { url };
}

async function removePhotoObjects(photo: Photo) {
  if (photo.uploadId) await abortMultipartUpload(photo.objectKey, photo.uploadId).catch(() => undefined);
  await deleteObject(photo.objectKey).catch(() => undefined);
  if (photo.thumbKey) await deleteObject(photo.thumbKey).catch(() => undefined);
  const db = await photoDb();
  await db.delete(photos).where(eq(photos.id, photo.id));
}

export async function deletePhoto(uploader: Uploader, photoId: number) {
  const photo = await getPhoto(photoId);
  if (!photo) throw new Error("사진을 찾을 수 없습니다.");
  if (!uploader.isAdmin && !ownsPhoto(uploader, photo)) throw new Error("직접 올린 사진만 지울 수 있습니다.");
  await removePhotoObjects(photo);
  return { success: true } as const;
}

export async function updatePhoto(uploader: Uploader, input: { photoId: number; title?: string; description?: string }) {
  const photo = await getPhoto(input.photoId);
  if (!photo) throw new Error("사진을 찾을 수 없습니다.");
  if (!uploader.isAdmin && !ownsPhoto(uploader, photo)) throw new Error("직접 올린 사진만 고칠 수 있습니다.");
  const db = await photoDb();
  await db.update(photos).set({ title: input.title?.trim() || null, description: input.description?.trim() || null }).where(eq(photos.id, photo.id));
  return { success: true } as const;
}

export async function listPhotos(uploader: Uploader, input: { cursor?: number; limit: number; mine?: boolean }) {
  const db = await photoDb();
  const conditions = [eq(photos.status, "ready")];
  if (input.cursor) conditions.push(lt(photos.id, input.cursor));
  if (input.mine) conditions.push(eq(photos.uploaderKind, uploader.kind), eq(photos.uploaderId, uploader.id));
  const rows = await db.select().from(photos).where(and(...conditions)).orderBy(desc(photos.id)).limit(input.limit + 1);
  const page = rows.slice(0, input.limit);
  return {
    items: page.map((photo) => ({
      id: photo.id,
      title: photo.title,
      description: photo.description,
      fileName: photo.fileName,
      contentType: photo.contentType,
      extension: fileExtension(photo.fileName),
      sizeBytes: photo.sizeBytes,
      uploaderName: photo.uploaderName,
      hasThumb: Boolean(photo.thumbKey),
      createdAt: photo.completedAt ?? photo.createdAt,
      canEdit: uploader.isAdmin || ownsPhoto(uploader, photo),
    })),
    nextCursor: rows.length > input.limit ? page[page.length - 1]?.id : undefined,
  };
}

export async function getReadyPhoto(photoId: number) {
  const photo = await getPhoto(photoId);
  return photo?.status === "ready" ? photo : undefined;
}

/** Resolves who is looking at the gallery from cookies (member first, then admin). */
export async function resolveUploader(request: Request): Promise<Uploader | null> {
  const admin = getAdminSession(request);
  if (admin) {
    if (admin.accountId > 0) {
      const account = await getAdminAccountById(admin.accountId);
      if (account && account.active && account.role === admin.role && account.username === admin.username) {
        return { kind: "admin", id: admin.accountId, name: admin.username, isAdmin: true };
      }
    } else {
      return { kind: "admin", id: 0, name: admin.username, isAdmin: true };
    }
  }
  const member = await getActiveMemberSession(request).catch(() => null);
  if (member) return { kind: "member", id: member.memberId, name: member.displayName, isAdmin: false };
  return null;
}

export function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value >= 100 || unit === 0 ? Math.round(value) : value.toFixed(1)}${units[unit]}`;
}
