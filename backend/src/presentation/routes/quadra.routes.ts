import { Router } from 'express';
import { asyncHandler } from '../../utils/http';
import { authenticate, requireQuadra } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { updateQuadraSettingsSchema } from '../validators/schemas';
import { quadraService } from '../../application/services/quadra.service';

const router = Router();
router.use(authenticate, requireQuadra);

router.get(
  '/settings',
  asyncHandler(async (req, res) => {
    res.json(await quadraService.getSettings(req.user!.quadraId!));
  }),
);

router.put(
  '/settings',
  validateBody(updateQuadraSettingsSchema),
  asyncHandler(async (req, res) => {
    res.json(await quadraService.updateSettings(req.user!.quadraId!, req.body));
  }),
);

export default router;
