import { Router } from 'express';
import { asyncHandler } from '../../utils/http';
import { authenticate, requireQuadra } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createRachaSchema, closeRachaSchema } from '../validators/schemas';
import { rachaService } from '../../application/services/racha.service';

const router = Router();
router.use(authenticate, requireQuadra);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;
    res.json(await rachaService.list(req.user!.quadraId!, from, to));
  }),
);

router.post(
  '/',
  validateBody(createRachaSchema),
  asyncHandler(async (req, res) => {
    const racha = await rachaService.create(req.user!.quadraId!, req.body);
    res.status(201).json(racha);
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await rachaService.get(req.user!.quadraId!, req.params.id));
  }),
);

router.patch(
  '/:id/status',
  validateBody(closeRachaSchema),
  asyncHandler(async (req, res) => {
    res.json(await rachaService.setStatus(req.user!.quadraId!, req.params.id, req.body.status));
  }),
);

export default router;
