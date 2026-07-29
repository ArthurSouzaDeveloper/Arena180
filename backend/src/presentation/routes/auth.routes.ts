import { Router } from 'express';
import { asyncHandler } from '../../utils/http';
import { authService } from '../../application/services/auth.service';
import { validateBody } from '../middlewares/validate.middleware';
import { loginSchema } from '../validators/schemas';
import { authenticate } from '../middlewares/auth.middleware';
import { authLimiter } from '../middlewares/rateLimit.middleware';

const router = Router();

router.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.login(req.body.email, req.body.password);
    res.json(result);
  }),
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    res.json(await authService.me(req.user!.sub));
  }),
);

export default router;
