import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer from "multer";
import { env } from "./env";
import { AppError } from "../domain/errors";

const uploadsPath = path.resolve(process.cwd(), env.uploadsDir);

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}

// Client-supplied mimetype/originalname are trivially spoofable and must never be
// trusted for storage decisions. We only use them as a cheap early rejection, then
// re-derive the real type from the file's magic bytes before writing anything to
// disk. The saved extension always comes from that detected type, never from the
// attacker-controlled originalname — this is what prevents someone from uploading
// e.g. "photo.html" with a spoofed `Content-Type: image/png` and having it served
// back as text/html (stored XSS) from the same origin the admin JWT lives in.
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

type DetectedImage = { ext: string; mime: string };

function detectImageType(buffer: Buffer): DetectedImage | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: "jpg", mime: "image/jpeg" };
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { ext: "png", mime: "image/png" };
  }
  if (buffer.length >= 6) {
    const header = buffer.subarray(0, 6).toString("ascii");
    if (header === "GIF87a" || header === "GIF89a") {
      return { ext: "gif", mime: "image/gif" };
    }
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { ext: "webp", mime: "image/webp" };
  }
  return null;
}

function fileFilter(_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (ALLOWED_MIME.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError("Apenas arquivos de imagem (JPEG, PNG, GIF ou WEBP) são permitidos"));
  }
}

// Buffered in memory, never written to disk until content is verified against
// its real magic bytes — see saveValidatedImage below.
export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

export function saveValidatedImage(file: Express.Multer.File): string {
  const detected = detectImageType(file.buffer);
  if (!detected) {
    throw new AppError("O arquivo enviado não é uma imagem válida");
  }

  const filename = `${Date.now()}-${crypto.randomBytes(16).toString("hex")}.${detected.ext}`;
  fs.writeFileSync(path.join(uploadsPath, filename), file.buffer, { mode: 0o644 });
  return `/uploads/${filename}`;
}

export const uploadsAbsolutePath = uploadsPath;
