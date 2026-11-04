/*
 * Browser → bucket uploader for the member photo library.
 * Small files go up in one signed PUT; large files are split into equal parts
 * that upload in parallel with retries, so a 30GB FITS stack survives a flaky
 * school Wi-Fi connection.
 */

type StartResult =
  | { photoId: number; mode: "single"; url: string; contentType: string }
  | { photoId: number; mode: "multipart"; partSize: number; partCount: number };

export type UploadApi = {
  start: (input: { fileName: string; sizeBytes: number; contentType: string; title?: string; description?: string }) => Promise<StartResult>;
  signParts: (input: { photoId: number; partNumbers: number[] }) => Promise<Array<{ partNumber: number; url: string }>>;
  complete: (input: { photoId: number; parts?: Array<{ partNumber: number; etag: string }> }) => Promise<unknown>;
  abort: (input: { photoId: number }) => Promise<unknown>;
  thumbUpload: (input: { photoId: number; sizeBytes: number }) => Promise<{ url: string }>;
};

export type UploadHandle = { cancel: () => void; done: Promise<void> };

const PARALLEL_PARTS = 4;
const SIGN_BATCH = 20;
const MAX_ATTEMPTS = 4;

class CancelledError extends Error {
  constructor() {
    super("업로드를 취소했습니다.");
  }
}

function putBlob(url: string, body: Blob, contentType: string | null, onProgress: (loaded: number) => void, register: (xhr: XMLHttpRequest) => void) {
  return new Promise<string | null>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    register(xhr);
    xhr.open("PUT", url);
    if (contentType) xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (event) => onProgress(event.loaded);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.getResponseHeader("ETag"));
      else reject(new Error(`저장소가 업로드를 거부했습니다 (${xhr.status}).`));
    };
    xhr.onerror = () => reject(new Error("네트워크 오류로 업로드가 끊겼습니다. 저장소 CORS 설정도 확인하세요."));
    xhr.onabort = () => reject(new CancelledError());
    xhr.send(body);
  });
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const THUMB_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/heic", "image/heif", "image/bmp"];
const THUMB_SOURCE_MAX_BYTES = 120 * 1024 * 1024;

/** A small JPEG preview made in the browser, or null for RAW/FITS/video files it cannot decode. */
export async function makeThumbnail(file: File): Promise<Blob | null> {
  if (!THUMB_TYPES.includes(file.type) || file.size > THUMB_SOURCE_MAX_BYTES || typeof createImageBitmap !== "function") return null;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 640 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return await new Promise<Blob | null>((resolve) => canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.82));
  } catch {
    return null;
  }
}

export function uploadPhoto(api: UploadApi, file: File, meta: { title?: string; description?: string }, onProgress: (fraction: number) => void): UploadHandle {
  let cancelled = false;
  const active = new Set<XMLHttpRequest>();
  const register = (xhr: XMLHttpRequest) => {
    active.add(xhr);
    xhr.addEventListener("loadend", () => active.delete(xhr));
  };
  const cancel = () => {
    cancelled = true;
    active.forEach((xhr) => xhr.abort());
  };
  const check = () => {
    if (cancelled) throw new CancelledError();
  };

  const done = (async () => {
    const contentType = file.type || "application/octet-stream";
    const started = await api.start({ fileName: file.name, sizeBytes: file.size, contentType, ...meta });
    try {
      if (started.mode === "single") {
        await putBlob(started.url, file, started.contentType, (loaded) => onProgress(loaded / file.size), register);
        check();
        await api.complete({ photoId: started.photoId });
      } else {
        const { partSize, partCount, photoId } = started;
        const loadedByPart = new Map<number, number>();
        const report = () => {
          let loaded = 0;
          loadedByPart.forEach((value) => (loaded += value));
          onProgress(Math.min(1, loaded / file.size));
        };
        const urls = new Map<number, string>();
        const etags: Array<{ partNumber: number; etag: string }> = [];
        let nextPart = 1;

        const urlFor = async (partNumber: number, forceFresh = false) => {
          if (forceFresh || !urls.has(partNumber)) {
            const batch: number[] = [];
            for (let n = partNumber; n < partNumber + SIGN_BATCH && n <= partCount; n += 1) if (forceFresh || !urls.has(n)) batch.push(n);
            (await api.signParts({ photoId, partNumbers: batch })).forEach((item) => urls.set(item.partNumber, item.url));
          }
          return urls.get(partNumber) as string;
        };

        const worker = async () => {
          while (nextPart <= partCount) {
            check();
            const partNumber = nextPart;
            nextPart += 1;
            const blob = file.slice((partNumber - 1) * partSize, Math.min(file.size, partNumber * partSize));
            for (let attempt = 1; ; attempt += 1) {
              try {
                const url = await urlFor(partNumber, attempt > 2);
                const etag = await putBlob(url, blob, null, (loaded) => { loadedByPart.set(partNumber, loaded); report(); }, register);
                if (!etag) throw new Error("저장소가 ETag를 알려주지 않았습니다. 버킷 CORS 설정에서 ETag를 노출하세요.");
                etags.push({ partNumber, etag });
                loadedByPart.set(partNumber, blob.size);
                report();
                break;
              } catch (error) {
                if (error instanceof CancelledError || attempt >= MAX_ATTEMPTS) throw error;
                loadedByPart.set(partNumber, 0);
                await sleep(1000 * 2 ** attempt);
              }
            }
          }
        };

        await Promise.all(Array.from({ length: Math.min(PARALLEL_PARTS, partCount) }, worker));
        check();
        await api.complete({ photoId, parts: etags });
      }
    } catch (error) {
      await api.abort({ photoId: started.photoId }).catch(() => undefined);
      throw error;
    }

    // The preview is a nicety; a failure here must not fail the upload itself.
    try {
      const thumb = await makeThumbnail(file);
      if (thumb) {
        const { url } = await api.thumbUpload({ photoId: started.photoId, sizeBytes: thumb.size });
        await putBlob(url, thumb, "image/jpeg", () => undefined, register);
      }
    } catch {
      /* ignore */
    }
  })();

  return { cancel, done };
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
