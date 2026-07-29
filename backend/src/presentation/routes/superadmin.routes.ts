import { Router } from 'express';
import { asyncHandler } from '../../utils/http';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createArenaSchema, setArenaActiveSchema } from '../validators/schemas';
import { superadminService } from '../../application/services/superadmin.service';

const router = Router();

// Rotas exclusivas do dono da plataforma — nenhuma delas é escopada por arena.
router.use(authenticate, authorize('SUPERADMIN'));

router.get(
  '/arenas',
  asyncHandler(async (_req, res) => {
    res.json(await superadminService.listArenas());
  }),
);

router.post(
  '/arenas',
  validateBody(createArenaSchema),
  asyncHandler(async (req, res) => {
    const arena = await superadminService.createArena(req.body);
    res.status(201).json(arena);
  }),
);

router.patch(
  '/arenas/:id/active',
  validateBody(setArenaActiveSchema),
  asyncHandler(async (req, res) => {
    res.json(await superadminService.setArenaActive(req.params.id, req.body.active));
  }),
);

export default router;
