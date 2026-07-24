import { Router } from 'express';
import { asyncHandler } from '../../utils/http';
import { authenticate, requireQuadra } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createProductSchema, updateProductSchema } from '../validators/schemas';
import { productService } from '../../application/services/product.service';
import { uploadProductPhoto, verifyUploadedImage } from '../middlewares/upload.middleware';
import { env } from '../../config/env';

const router = Router();
router.use(authenticate, requireQuadra);

function photoUrlFor(filename?: string): string | undefined {
  if (!filename) return undefined;
  return `/${env.uploadDir}/products/${filename}`;
}

const handlePhotoUpload = asyncHandler(
  (req, res, next) =>
    new Promise<void>((resolve, reject) => {
      uploadProductPhoto(req, res, (err) => (err ? reject(err) : resolve()));
    }).then(() => next()),
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const includeInactive = req.query.includeInactive === 'true';
    res.json(await productService.list(req.user!.quadraId!, includeInactive));
  }),
);

router.post(
  '/',
  handlePhotoUpload,
  verifyUploadedImage,
  validateBody(createProductSchema),
  asyncHandler(async (req, res) => {
    const photoUrl = photoUrlFor(req.file?.filename);
    const product = await productService.create(req.user!.quadraId!, { ...req.body, photoUrl });
    res.status(201).json(product);
  }),
);

router.put(
  '/:id',
  handlePhotoUpload,
  verifyUploadedImage,
  validateBody(updateProductSchema),
  asyncHandler(async (req, res) => {
    const photoUrl = photoUrlFor(req.file?.filename);
    const product = await productService.update(req.user!.quadraId!, req.params.id, {
      ...req.body,
      ...(photoUrl ? { photoUrl } : {}),
    });
    res.json(product);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await productService.remove(req.user!.quadraId!, req.params.id);
    res.status(204).end();
  }),
);

export default router;
