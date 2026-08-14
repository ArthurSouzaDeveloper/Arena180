import { Router } from "express";
import { z } from "zod";
import { superadminService } from "../../application/services/superadminService";
import { asyncHandler } from "../middlewares/errorHandler";
import { authMiddleware, superadminMiddleware } from "../middlewares/auth";

const router = Router();

router.use(authMiddleware);
router.use(superadminMiddleware);

const createArenaSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen"),
  adminName: z.string().min(1),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(10, "A senha deve ter pelo menos 10 caracteres"),
});

const activeSchema = z.object({
  active: z.boolean(),
});

router.get(
  "/arenas",
  asyncHandler(async (_req, res) => {
    const arenas = await superadminService.listArenas();
    res.json(arenas);
  }),
);

router.post(
  "/arenas",
  asyncHandler(async (req, res) => {
    const data = createArenaSchema.parse(req.body);
    const arena = await superadminService.createArena(data);
    res.status(201).json(arena);
  }),
);

router.put(
  "/arenas/:id/active",
  asyncHandler(async (req, res) => {
    const { active } = activeSchema.parse(req.body);
    const arena = await superadminService.setActive(req.params.id, active);
    res.json(arena);
  }),
);

export default router;
