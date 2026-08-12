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

export default router;
