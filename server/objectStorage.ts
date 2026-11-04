/*
 * S3-compatible object storage (Cloudflare R2, Backblaze B2, AWS S3, Wasabi ...).
 *
 * Files never pass through the Vercel function: the server only signs short-lived
 * URLs and the browser talks to the bucket directly. This avoids Vercel's 4.5MB
 * request-body limit and lets single files reach tens of gigabytes.
 *
 * Required env: S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY
 * Optional env: S3_REGION (default "auto"), S3_FORCE_PATH_STYLE ("true"/"false")
 */
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const GB = 1024 ** 3;
const MB = 1024 ** 2;

function envNumber(key: string, fallback: number) {
  const raw = process.env[key];
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

export function storageLimits() {
  return {
    /** Total bytes all photos may occupy. Default 1TB. */
    totalQuotaBytes: Math.round(envNumber("PHOTO_STORAGE_QUOTA_GB", 1024) * GB),
    /** Per-person bytes. 0 means no per-person limit. */
    memberQuotaBytes: Math.round(envNumber("MEMBER_QUOTA_GB", 0) * GB),
    /** Largest single file. Default 50GB (multipart allows up to 5TB per object). */
    maxFileBytes: Math.round(envNumber("MAX_PHOTO_FILE_GB", 50) * GB),
  };
}

/** Files at or below this size go up in one PUT; larger files use multipart. */
export const SINGLE_PUT_MAX_BYTES = 64 * MB;
const MIN_PART_BYTES = 16 * MB;
const MAX_PARTS = 10_000;

/** Equal-sized parts (R2 requires this) that stay under the 10,000-part limit. */
export function choosePartSize(sizeBytes: number) {
  const needed = Math.ceil(sizeBytes / (MAX_PARTS - 100));
  const size = Math.max(MIN_PART_BYTES, Math.ceil(needed / MB) * MB);
  return { partSize: size, partCount: Math.max(1, Math.ceil(sizeBytes / size)) };
}

let client: S3Client | null = null;

export function isObjectStorageConfigured() {
  return Boolean(process.env.S3_ENDPOINT && process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY);
}

function bucket() {
  return process.env.S3_BUCKET ?? "";
}

function s3() {
  if (!isObjectStorageConfigured()) {
    throw new Error("사진 저장소가 아직 설정되지 않았습니다. 관리자에게 S3 저장소 환경변수 설정을 요청하세요.");
  }
  if (!client) {
    client = new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: (process.env.S3_FORCE_PATH_STYLE ?? "true") !== "false",
      credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "", secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "" },
      // Newer SDKs add CRC32 checksums to presigned URLs by default, which browsers
      // do not send and R2/B2 then reject. Only send checksums when required.
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }
  return client;
}

const UPLOAD_URL_SECONDS = 60 * 60 * 6;

/** The signed Content-Length makes the bucket reject a body of any other size. */
export async function presignPutObject(key: string, contentType: string, contentLength: number, expiresIn = 60 * 60) {
  return getSignedUrl(s3(), new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType, ContentLength: contentLength }), { expiresIn });
}

export async function createMultipartUpload(key: string, contentType: string) {
  const result = await s3().send(new CreateMultipartUploadCommand({ Bucket: bucket(), Key: key, ContentType: contentType }));
  if (!result.UploadId) throw new Error("저장소가 업로드 ID를 돌려주지 않았습니다.");
  return result.UploadId;
}

export async function presignUploadParts(key: string, uploadId: string, partNumbers: number[]) {
  const client = s3();
  return Promise.all(
    partNumbers.map(async (partNumber) => ({
      partNumber,
      url: await getSignedUrl(client, new UploadPartCommand({ Bucket: bucket(), Key: key, UploadId: uploadId, PartNumber: partNumber }), { expiresIn: UPLOAD_URL_SECONDS }),
    })),
  );
}

export async function completeMultipartUpload(key: string, uploadId: string, parts: Array<{ partNumber: number; etag: string }>) {
  const sorted = [...parts].sort((a, b) => a.partNumber - b.partNumber);
  await s3().send(
    new CompleteMultipartUploadCommand({
      Bucket: bucket(),
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: sorted.map((part) => ({ PartNumber: part.partNumber, ETag: part.etag })) },
    }),
  );
}

export async function abortMultipartUpload(key: string, uploadId: string) {
  await s3().send(new AbortMultipartUploadCommand({ Bucket: bucket(), Key: key, UploadId: uploadId }));
}

/** Returns the stored size, or null when the object does not exist. */
export async function headObjectSize(key: string) {
  try {
    const result = await s3().send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
    return Number(result.ContentLength ?? 0);
  } catch (error) {
    const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (status === 404) return null;
    throw error;
  }
}

export async function presignGetObject(key: string, options: { downloadName?: string; expiresIn?: number } = {}) {
  const disposition = options.downloadName ? `attachment; filename*=UTF-8''${encodeURIComponent(options.downloadName)}` : undefined;
  return getSignedUrl(s3(), new GetObjectCommand({ Bucket: bucket(), Key: key, ResponseContentDisposition: disposition }), { expiresIn: options.expiresIn ?? 60 * 60 });
}

export async function deleteObject(key: string) {
  await s3().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
}
