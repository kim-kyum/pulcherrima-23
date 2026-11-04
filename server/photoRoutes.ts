import type { Express, Request, Response } from "express";
import { getReadyPhoto, resolveUploader } from "./photos";
import { isObjectStorageConfigured, presignGetObject } from "./objectStorage";

/*
 * Redirect endpoints so <img>/<a> tags can use stable same-origin URLs while
 * the bucket itself stays private. Each request checks the login cookie and
 * answers with a short-lived signed URL.
 */
async function sendPhoto(req: Request, res: Response, variant: "file" | "view" | "thumb") {
  try {
    const uploader = await resolveUploader(req);
    if (!uploader) {
      res.status(401).send("회원 로그인이 필요합니다.");
      return;
    }
    const photoId = Number(req.params.id);
    const photo = Number.isInteger(photoId) && photoId > 0 ? await getReadyPhoto(photoId) : undefined;
    const key = variant === "thumb" ? photo?.thumbKey : photo?.objectKey;
    if (!photo || !key) {
      res.status(404).send("사진을 찾을 수 없습니다.");
      return;
    }
    const url = await presignGetObject(key, { downloadName: variant === "file" ? photo.fileName : undefined, expiresIn: variant === "thumb" ? 60 * 60 * 2 : 60 * 60 * 6 });
    res.set("Cache-Control", variant === "thumb" ? "private, max-age=3600" : "no-store");
    res.redirect(302, url);
  } catch (error) {
    console.error("[Photos] redirect failed:", error);
    res.status(502).send("저장소에 연결하지 못했습니다.");
  }
}

export function registerPhotoRoutes(app: Express) {
  app.get("/api/photos/:id/file", (req, res) => void sendPhoto(req, res, "file"));
  app.get("/api/photos/:id/view", (req, res) => void sendPhoto(req, res, "view"));
  app.get("/api/photos/:id/thumb", (req, res) => void sendPhoto(req, res, "thumb"));

  // Public archive images uploaded from /admin live under `archive/` in the same private bucket.
  app.get("/api/media/archive/*", async (req, res) => {
    const rest = (req.params as Record<string, string>)[0];
    if (!rest || rest.includes("..") || !isObjectStorageConfigured()) {
      res.status(404).send("Not found");
      return;
    }
    try {
      const url = await presignGetObject(`archive/${rest}`, { expiresIn: 60 * 60 * 12 });
      res.set("Cache-Control", "public, max-age=3600");
      res.redirect(302, url);
    } catch (error) {
      console.error("[Media] redirect failed:", error);
      res.status(502).send("Storage error");
    }
  });
}
