import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { env } from '../../config/env';
import { AppError } from '../../utils/errors';

const productsDir = path.resolve(process.cwd(), env.uploadDir, 'products');
fs.mkdirSync(productsDir, { recursive: true });

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, productsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

export const uploadProductPhoto = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new AppError('Formato de imagem inválido. Use JPG, PNG ou WEBP.', 400, 'INVALID_FILE_TYPE'));
      return;
    }
    cb(null, true);
  },
}).single('photo');
