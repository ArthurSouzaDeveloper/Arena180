import { Router } from 'express';
import { asyncHandler } from '../../utils/http';
import { authenticate, requireArena } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { updateArenaSettingsSchema } from '../validators/schemas';
import { arenaService } from '../../application/services/arena.service';

const router = Router();
router.use(authenticate, requireArena);

router.get(
  '/settings',
  asyncHandler(async (req, res) => {
    res.json(await arenaService.getSettings(req.user!.arenaId!));
  }),
);

router.put(
  '/settings',
  validateBody(updateArenaSettingsSchema),
  asyncHandler(async (req, res) => {
    res.json(await arenaService.updateSettings(req.user!.arenaId!, req.body));
  }),
);

export default router;
