import { Router } from "express";
import { z } from "zod";
import { bookingService } from "../../application/services/bookingService";
import { asyncHandler } from "../middlewares/errorHandler";

const router = Router();

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida");

const createSchema = z.object({
  date: dateSchema,
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido"),
  withExtraBlock: z.boolean().optional(),
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  paymentMode: z.enum(["DEPOSITO", "INTEGRAL"]).optional(),
});

router.get(
  "/:quadraSlug/courts",
  asyncHandler(async (req, res) => {
    const courts = await bookingService.listCourts(req.params.quadraSlug);
    res.json(courts);
  }),
);

router.get(
  "/:quadraSlug/courts/:courtId/availability",
  asyncHandler(async (req, res) => {
    const date = dateSchema.parse(req.query.date);
    const availability = await bookingService.availability(req.params.quadraSlug, req.params.courtId, date);
    res.json(availability);
  }),
);

router.post(
  "/:quadraSlug/courts/:courtId",
  asyncHandler(async (req, res) => {
    const data = createSchema.parse(req.body);
    const booking = await bookingService.create(req.params.quadraSlug, req.params.courtId, data);
    res.status(201).json(booking);
  }),
);

const tokenSchema = z.object({ token: z.string().min(1) });

router.get(
  "/:quadraSlug/bookings/:bookingId",
  asyncHandler(async (req, res) => {
    const { token } = tokenSchema.parse(req.query);
    const booking = await bookingService.getByToken(req.params.quadraSlug, req.params.bookingId, token);
    res.json(booking);
  }),
);

router.post(
  "/:quadraSlug/bookings/:bookingId/cancel",
  asyncHandler(async (req, res) => {
    const { token } = tokenSchema.parse(req.body);
    const booking = await bookingService.cancelByToken(req.params.quadraSlug, req.params.bookingId, token);
    res.json(booking);
  }),
);

router.get(
  "/:quadraSlug/bookings/:bookingId/payment-status",
  asyncHandler(async (req, res) => {
    const { token } = tokenSchema.parse(req.query);
    const status = await bookingService.getPaymentStatus(req.params.quadraSlug, req.params.bookingId, token);
    res.json(status);
  }),
);

router.post(
  "/:quadraSlug/pix-webhook",
  asyncHandler(async (req, res) => {
    const paymentId = req.body?.data?.id ?? req.query["data.id"];
    if (paymentId) {
      await bookingService.handlePixWebhook(req.params.quadraSlug, String(paymentId));
    }
    res.status(200).send("ok");
  }),
);

export default router;
