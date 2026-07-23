import { Router } from 'express';
import { asyncHandler } from '../../utils/http';
import { authenticate, requireQuadra } from '../middlewares/auth.middleware';
import { dashboardService } from '../../application/services/dashboard.service';

const router = Router();
router.use(authenticate, requireQuadra);

router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    res.json(await dashboardService.summary(req.user!.quadraId!));
  }),
);

export default router;
