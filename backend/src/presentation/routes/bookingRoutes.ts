import { Router } from "express";
import { z } from "zod";
import { bookingService } from "../../application/services/bookingService";
import { subscriptionService } from "../../application/services/subscriptionService";
import { asyncHandler } from "../middlewares/errorHandler";
import { bookingCreateRateLimit } from "../middlewares/rateLimit";

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
  bookingCreateRateLimit,
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

const phoneQuerySchema = z.object({ phone: z.string().min(1) });
const phoneBodySchema = z.object({ phone: z.string().min(1) });

router.get(
  "/:quadraSlug/my-bookings",
  asyncHandler(async (req, res) => {
    const { phone } = phoneQuerySchema.parse(req.query);
    const bookings = await bookingService.findByPhone(req.params.quadraSlug, phone);
    res.json(bookings);
  }),
);

router.post(
  "/:quadraSlug/my-bookings/:bookingId/cancel",
  asyncHandler(async (req, res) => {
    const { phone } = phoneBodySchema.parse(req.body);
    const booking = await bookingService.cancelByPhone(req.params.quadraSlug, req.params.bookingId, phone);
    res.json(booking);
  }),
);

const weekdayQuerySchema = z.object({
  weekday: z.coerce.number().int().min(0).max(6),
});

const quoteQuerySchema = weekdayQuerySchema.extend({
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido"),
});

const createSubscriptionSchema = quoteQuerySchema.extend({
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
});

router.get(
  "/:quadraSlug/courts/:courtId/mensalista/hours",
  asyncHandler(async (req, res) => {
    const { weekday } = weekdayQuerySchema.parse(req.query);
    const result = await subscriptionService.hoursForWeekday(req.params.quadraSlug, req.params.courtId, weekday);
    res.json(result);
  }),
);

router.get(
  "/:quadraSlug/courts/:courtId/mensalista/quote",
  asyncHandler(async (req, res) => {
    const { weekday, startTime } = quoteQuerySchema.parse(req.query);
    const quote = await subscriptionService.quote(req.params.quadraSlug, req.params.courtId, weekday, startTime);
    res.json(quote);
  }),
);

router.post(
  "/:quadraSlug/courts/:courtId/mensalista",
  bookingCreateRateLimit,
  asyncHandler(async (req, res) => {
    const data = createSubscriptionSchema.parse(req.body);
    const subscription = await subscriptionService.create(req.params.quadraSlug, req.params.courtId, data);
    res.status(201).json(subscription);
  }),
);

router.get(
  "/:quadraSlug/subscriptions/:subscriptionId",
  asyncHandler(async (req, res) => {
    const { token } = tokenSchema.parse(req.query);
    const subscription = await subscriptionService.getByToken(req.params.quadraSlug, req.params.subscriptionId, token);
    res.json(subscription);
  }),
);

router.get(
  "/:quadraSlug/subscriptions/:subscriptionId/payment-status",
  asyncHandler(async (req, res) => {
    const { token } = tokenSchema.parse(req.query);
    const status = await subscriptionService.getPaymentStatus(req.params.quadraSlug, req.params.subscriptionId, token);
    res.json(status);
  }),
);

router.post(
  "/:quadraSlug/subscriptions/:subscriptionId/cancel",
  asyncHandler(async (req, res) => {
    const { token } = tokenSchema.parse(req.body);
    const subscription = await subscriptionService.cancelByToken(req.params.quadraSlug, req.params.subscriptionId, token);
    res.json(subscription);
  }),
);

router.post(
  "/:quadraSlug/pix-webhook",
  asyncHandler(async (req, res) => {
    const paymentId = req.body?.data?.id ?? req.query["data.id"];
    if (paymentId) {
      const handledByBooking = await bookingService.handlePixWebhook(req.params.quadraSlug, String(paymentId));
      if (!handledByBooking) {
        await subscriptionService.handlePixWebhook(req.params.quadraSlug, String(paymentId));
      }
    }
    res.status(200).send("ok");
  }),
);

export default router;
