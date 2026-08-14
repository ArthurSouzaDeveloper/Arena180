import { Router } from "express";
import { z } from "zod";
import { productService } from "../../application/services/productService";
import { asyncHandler } from "../middlewares/errorHandler";
import { authMiddleware, ownerMiddleware } from "../middlewares/auth";
import { upload, saveValidatedImage } from "../../config/upload";

const router = Router();

router.use(authMiddleware);
router.use(ownerMiddleware);

const createSchema = z.object({
  name: z.string().min(1),
  price: z.coerce.number().positive(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.coerce.number().positive().optional(),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const products = await productService.list(req.auth!.quadraId!);
    res.json(products);
  }),
);

router.post(
  "/",
  upload.single("photo"),
  asyncHandler(async (req, res) => {
    const { name, price } = createSchema.parse(req.body);
    const photoUrl = req.file ? saveValidatedImage(req.file) : undefined;
    const product = await productService.create({ quadraId: req.auth!.quadraId!, name, price, photoUrl });
    res.status(201).json(product);
  }),
);

router.put(
  "/:id",
  upload.single("photo"),
  asyncHandler(async (req, res) => {
    const data = updateSchema.parse(req.body);
    const photoUrl = req.file ? saveValidatedImage(req.file) : undefined;
    const product = await productService.update(req.params.id, req.auth!.quadraId!, {
      ...data,
      ...(photoUrl ? { photoUrl } : {}),
    });
    res.json(product);
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await productService.remove(req.params.id, req.auth!.quadraId!);
    res.status(204).send();
  }),
);

export default router;
