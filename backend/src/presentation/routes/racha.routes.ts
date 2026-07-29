import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/http';
import { authenticate, requireArena } from '../middlewares/auth.middleware';
import { validateBody, validateQuery } from '../middlewares/validate.middleware';
import {
  createRachaSchema,
  closeRachaSchema,
  createComandaSchema,
  updateComandaSchema,
  listRachasQuerySchema,
} from '../validators/schemas';
import { rachaService } from '../../application/services/racha.service';

const router = Router();
router.use(authenticate, requireArena);

router.get(
  '/',
  validateQuery(listRachasQuerySchema),
  asyncHandler(async (req, res) => {
    const { from, to, status } = res.locals.query as z.infer<typeof listRachasQuerySchema>;
    res.json(await rachaService.list(req.user!.arenaId!, from, to, status));
  }),
);

router.post(
  '/',
  validateBody(createRachaSchema),
  asyncHandler(async (req, res) => {
    const racha = await rachaService.create(req.user!.arenaId!, req.body);
    res.status(201).json(racha);
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await rachaService.get(req.user!.arenaId!, req.params.id));
  }),
);

router.patch(
  '/:id/status',
  validateBody(closeRachaSchema),
  asyncHandler(async (req, res) => {
    res.json(await rachaService.setStatus(req.user!.arenaId!, req.params.id, req.body.status));
  }),
);

router.post(
  '/:id/comandas',
  validateBody(createComandaSchema),
  asyncHandler(async (req, res) => {
    const racha = await rachaService.addComanda(req.user!.arenaId!, req.params.id, req.body);
    res.status(201).json(racha);
  }),
);

router.put(
  '/:id/comandas/:comandaId',
  validateBody(updateComandaSchema),
  asyncHandler(async (req, res) => {
    const racha = await rachaService.updateComanda(req.user!.arenaId!, req.params.id, req.params.comandaId, req.body);
    res.json(racha);
  }),
);

router.delete(
  '/:id/comandas/:comandaId',
  asyncHandler(async (req, res) => {
    const racha = await rachaService.removeComanda(req.user!.arenaId!, req.params.id, req.params.comandaId);
    res.json(racha);
  }),
);

export default router;
