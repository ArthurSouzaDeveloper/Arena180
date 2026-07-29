import { Router } from 'express';
import { asyncHandler } from '../../utils/http';
import { authenticate, requireArena } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { createCourtSchema, updateCourtSchema } from '../validators/schemas';
import { courtService } from '../../application/services/court.service';

const router = Router();
router.use(authenticate, requireArena);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const includeInactive = req.query.includeInactive === 'true';
    res.json(await courtService.list(req.user!.arenaId!, includeInactive));
  }),
);

router.post(
  '/',
  validateBody(createCourtSchema),
  asyncHandler(async (req, res) => {
    const court = await courtService.create(req.user!.arenaId!, req.body);
    res.status(201).json(court);
  }),
);

router.put(
  '/:id',
  validateBody(updateCourtSchema),
  asyncHandler(async (req, res) => {
    res.json(await courtService.update(req.user!.arenaId!, req.params.id, req.body));
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await courtService.remove(req.user!.arenaId!, req.params.id);
    res.status(204).end();
  }),
);

export default router;
