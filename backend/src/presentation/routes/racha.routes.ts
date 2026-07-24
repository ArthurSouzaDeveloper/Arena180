import { Router } from 'express';
import { RachaStatus } from '@prisma/client';
import { asyncHandler } from '../../utils/http';
import { authenticate, requireQuadra } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import {
  createRachaSchema,
  closeRachaSchema,
  createComandaSchema,
  updateComandaSchema,
} from '../validators/schemas';
import { rachaService } from '../../application/services/racha.service';

const router = Router();
router.use(authenticate, requireQuadra);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;
    const status = req.query.status ? (String(req.query.status) as RachaStatus) : undefined;
    res.json(await rachaService.list(req.user!.quadraId!, from, to, status));
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

router.post(
  '/:id/comandas',
  validateBody(createComandaSchema),
  asyncHandler(async (req, res) => {
    const racha = await rachaService.addComanda(req.user!.quadraId!, req.params.id, req.body);
    res.status(201).json(racha);
  }),
);

router.put(
  '/:id/comandas/:comandaId',
  validateBody(updateComandaSchema),
  asyncHandler(async (req, res) => {
    const racha = await rachaService.updateComanda(req.user!.quadraId!, req.params.id, req.params.comandaId, req.body);
    res.json(racha);
  }),
);

router.delete(
  '/:id/comandas/:comandaId',
  asyncHandler(async (req, res) => {
    const racha = await rachaService.removeComanda(req.user!.quadraId!, req.params.id, req.params.comandaId);
    res.json(racha);
  }),
);

export default router;
