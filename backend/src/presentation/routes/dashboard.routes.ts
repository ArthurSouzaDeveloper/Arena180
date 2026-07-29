import { Router } from 'express';
import { asyncHandler } from '../../utils/http';
import { authenticate, requireArena } from '../middlewares/auth.middleware';
import { dashboardService } from '../../application/services/dashboard.service';

const router = Router();
router.use(authenticate, requireArena);

router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    res.json(await dashboardService.summary(req.user!.arenaId!));
  }),
);

export default router;
