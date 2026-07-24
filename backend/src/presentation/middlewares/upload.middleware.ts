import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { env } from '../../config/env';
import { AppError } from '../../utils/errors';

const productsDir = path.resolve(process.cwd(), env.uploadDir, 'products');
fs.mkdirSync(productsDir, { recursive: true });

// Extensão sempre derivada do MIME validado — nunca do nome de arquivo enviado
// pelo cliente, que é livremente forjável (evita upload de .html/.svg/.php
// disfarçado de imagem e servido depois por express.static).
const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const ALLOWED_MIME = new Set(Object.keys(EXTENSION_BY_MIME));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, productsDir),
  filename: (_req, file, cb) => {
    cb(null, `${randomUUID()}${EXTENSION_BY_MIME[file.mimetype] ?? ''}`);
  },
});

export const uploadProductPhoto = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new AppError('Formato de imagem inválido. Use JPG, PNG ou WEBP.', 400, 'INVALID_FILE_TYPE'));
      return;
    }
    cb(null, true);
  },
}).single('photo');

// Assinaturas binárias (magic numbers) dos formatos aceitos — o header
// Content-Type do multipart é fornecido pelo cliente e pode ser forjado, então
// confirmamos o conteúdo real do arquivo depois que ele já foi salvo em disco.
const SIGNATURES: { mime: string; bytes: number[] }[] = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
];

function isValidWebp(buffer: Buffer): boolean {
  return (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  );
}

/** Confirma que o arquivo salvo é de fato uma imagem do tipo declarado; apaga e rejeita caso contrário. */
export function verifyUploadedImage(req: { file?: Express.Multer.File }, _res: unknown, next: (err?: unknown) => void): void {
  const file = req.file;
  if (!file) {
    next();
    return;
  }

  const head = Buffer.alloc(12);
  const fd = fs.openSync(file.path, 'r');
  fs.readSync(fd, head, 0, 12, 0);
  fs.closeSync(fd);

  const matchesKnownSignature = SIGNATURES.some(
    ({ bytes }) => head.subarray(0, bytes.length).equals(Buffer.from(bytes)),
  );
  const isImage = matchesKnownSignature || isValidWebp(head);

  if (!isImage) {
    fs.unlinkSync(file.path);
    next(new AppError('O arquivo enviado não é uma imagem válida.', 400, 'INVALID_FILE_CONTENT'));
    return;
  }

  next();
}
