import { Router } from "express";
import { z } from "zod";
import { rachaService } from "../../application/services/rachaService";
import { asyncHandler } from "../middlewares/errorHandler";
import { authMiddleware, ownerMiddleware } from "../middlewares/auth";

const router = Router();

router.use(authMiddleware);
router.use(ownerMiddleware);

const itemSchema = z.object({
  productId: z.string().uuid().optional(),
  name: z.string().min(1),
  unitPrice: z.coerce.number().nonnegative(),
  quantity: z.coerce.number().int().positive(),
});

const createSchema = z.object({
  courtValue: z.coerce.number().nonnegative(),
  playersCount: z.coerce.number().int().positive(),
  playedAt: z.string().optional(),
  items: z.array(itemSchema).default([]),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const rachas = await rachaService.list(req.auth!.quadraId!);
    res.json(rachas);
  }),
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const racha = await rachaService.getById(req.params.id, req.auth!.quadraId!);
    res.json(racha);
  }),
);

router.post(
  "/calculate",
  asyncHandler(async (req, res) => {
    const { courtValue, playersCount, items } = createSchema.parse(req.body);
    const result = rachaService.calculate(courtValue, playersCount, items);
    res.json(result);
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { courtValue, playersCount, playedAt, items } = createSchema.parse(req.body);
    const racha = await rachaService.create({
      quadraId: req.auth!.quadraId!,
      courtValue,
      playersCount,
      playedAt,
      items,
    });
    res.status(201).json(racha);
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await rachaService.remove(req.params.id, req.auth!.quadraId!);
    res.status(204).send();
  }),
);

export default router;
