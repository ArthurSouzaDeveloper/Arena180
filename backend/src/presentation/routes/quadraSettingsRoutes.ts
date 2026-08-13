import { Router } from "express";
import { z } from "zod";
import { quadraSettingsService } from "../../application/services/quadraSettingsService";
import { asyncHandler } from "../middlewares/errorHandler";
import { authMiddleware, ownerMiddleware } from "../middlewares/auth";

const router = Router();

router.use(authMiddleware);
router.use(ownerMiddleware);

const saveTokenSchema = z.object({
  accessToken: z.string().min(10),
});

const paymentOptionsSchema = z.object({
  allowDepositPayment: z.boolean(),
  allowFullPayment: z.boolean(),
});

const saveWhatsappSchema = z.object({
  accessToken: z.string().min(10),
  phoneNumberId: z.string().min(3),
});

const notificationSettingsSchema = z.object({
  adminNotificationPhone: z.string().min(8).nullable(),
  notifyBookingConfirmation: z.boolean(),
  notifyBookingReminder: z.boolean(),
  notifyMensalistaRenewal: z.boolean(),
  notifyNewAvulsaBooking: z.boolean(),
});

router.get(
  "/payment-settings",
  asyncHandler(async (req, res) => {
    const settings = await quadraSettingsService.getPaymentSettings(req.auth!.quadraId!);
    res.json(settings);
  }),
);

router.put(
  "/payment-settings",
  asyncHandler(async (req, res) => {
    const { accessToken } = saveTokenSchema.parse(req.body);
    const settings = await quadraSettingsService.savePixAccessToken(req.auth!.quadraId!, accessToken);
    res.json(settings);
  }),
);

router.delete(
  "/payment-settings",
  asyncHandler(async (req, res) => {
    const settings = await quadraSettingsService.removePixAccessToken(req.auth!.quadraId!);
    res.json(settings);
  }),
);

router.put(
  "/payment-options",
  asyncHandler(async (req, res) => {
    const options = paymentOptionsSchema.parse(req.body);
    const settings = await quadraSettingsService.updatePaymentOptions(req.auth!.quadraId!, options);
    res.json(settings);
  }),
);

router.get(
  "/whatsapp-settings",
  asyncHandler(async (req, res) => {
    const settings = await quadraSettingsService.getWhatsappSettings(req.auth!.quadraId!);
    res.json(settings);
  }),
);

router.put(
  "/whatsapp-settings",
  asyncHandler(async (req, res) => {
    const { accessToken, phoneNumberId } = saveWhatsappSchema.parse(req.body);
    const settings = await quadraSettingsService.saveWhatsappCredentials(req.auth!.quadraId!, accessToken, phoneNumberId);
    res.json(settings);
  }),
);

router.delete(
  "/whatsapp-settings",
  asyncHandler(async (req, res) => {
    const settings = await quadraSettingsService.removeWhatsappCredentials(req.auth!.quadraId!);
    res.json(settings);
  }),
);

router.put(
  "/notification-settings",
  asyncHandler(async (req, res) => {
    const options = notificationSettingsSchema.parse(req.body);
    const settings = await quadraSettingsService.updateNotificationSettings(req.auth!.quadraId!, options);
    res.json(settings);
  }),
);

export default router;
