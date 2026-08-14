import { Router } from "express";
import { z } from "zod";
import { courtService } from "../../application/services/courtService";
import { bookingService } from "../../application/services/bookingService";
import { subscriptionService } from "../../application/services/subscriptionService";
import { asyncHandler } from "../middlewares/errorHandler";
import { authMiddleware, ownerMiddleware } from "../middlewares/auth";

const router = Router();

router.use(authMiddleware);
router.use(ownerMiddleware);

const createSchema = z.object({
  name: z.string().min(1),
  hourlyRate: z.coerce.number().positive(),
  slotMinutes: z.coerce.number().int().min(5).max(480).optional(),
  extraBlockMinutes: z.coerce.number().int().min(0).optional(),
  extraBlockPrice: z.coerce.number().min(0).optional(),
  mensalistaHourlyRate: z.coerce.number().positive().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  hourlyRate: z.coerce.number().positive().optional(),
  slotMinutes: z.coerce.number().int().min(5).max(480).optional(),
  extraBlockMinutes: z.coerce.number().int().min(0).optional(),
  extraBlockPrice: z.coerce.number().min(0).optional(),
  mensalistaHourlyRate: z.coerce.number().positive().nullable().optional(),
  active: z.boolean().optional(),
});

const hoursSchema = z.array(
  z.object({
    weekday: z.number().int().min(0).max(6),
    openTime: z.string(),
    closeTime: z.string(),
    closed: z.boolean(),
  }),
);

const blockSchema = z.object({
  date: z.string().min(1),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  reason: z.string().optional(),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const courts = await courtService.list(req.auth!.quadraId!);
    res.json(courts);
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const court = await courtService.create({ quadraId: req.auth!.quadraId!, ...data });
    res.status(201).json(court);
  }),
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = updateSchema.parse(req.body);
    const court = await courtService.update(req.params.id, req.auth!.quadraId!, data);
    res.json(court);
  }),
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await courtService.remove(req.params.id, req.auth!.quadraId!);
    res.status(204).send();
  }),
);

router.put(
  "/:id/hours",
  asyncHandler(async (req, res) => {
    const hours = hoursSchema.parse(req.body);
    const result = await courtService.setHours(req.params.id, req.auth!.quadraId!, hours);
    res.json(result);
  }),
);

router.post(
  "/:id/blocks",
  asyncHandler(async (req, res) => {
    const data = blockSchema.parse(req.body);
    const block = await courtService.addBlock(req.params.id, req.auth!.quadraId!, data);
    res.status(201).json(block);
  }),
);

router.delete(
  "/:id/blocks/:blockId",
  asyncHandler(async (req, res) => {
    await courtService.removeBlock(req.params.id, req.auth!.quadraId!, req.params.blockId);
    res.status(204).send();
  }),
);

router.get(
  "/:id/bookings",
  asyncHandler(async (req, res) => {
    const bookings = await bookingService.listForCourt(req.auth!.quadraId!, req.params.id);
    res.json(bookings);
  }),
);

router.put(
  "/:id/bookings/:bookingId/cancel",
  asyncHandler(async (req, res) => {
    const booking = await bookingService.adminCancel(req.auth!.quadraId!, req.params.id, req.params.bookingId);
    res.json(booking);
  }),
);

router.get(
  "/:id/subscriptions",
  asyncHandler(async (req, res) => {
    const subscriptions = await subscriptionService.adminList(req.auth!.quadraId!, req.params.id);
    res.json(subscriptions);
  }),
);

router.put(
  "/:id/subscriptions/:subscriptionId/cancel",
  asyncHandler(async (req, res) => {
    const subscription = await subscriptionService.adminCancel(
      req.auth!.quadraId!,
      req.params.id,
      req.params.subscriptionId,
    );
    res.json(subscription);
  }),
);

export default router;
