import { Router } from "express";
import { z } from "zod";
import { authService } from "../../application/services/authService";
import { passwordResetService } from "../../application/services/passwordResetService";
import { asyncHandler } from "../middlewares/errorHandler";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(8),
});

const updatePhoneSchema = z.object({
  phone: z.string().min(8),
});

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const result = await authService.login({ email, password });
    res.json(result);
  }),
);

router.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const { email } = forgotPasswordSchema.parse(req.body);
    await passwordResetService.requestReset(email);
    res.json({ message: "Se o e-mail existir e tiver WhatsApp configurado, um código foi enviado." });
  }),
);

router.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const { email, code, newPassword } = resetPasswordSchema.parse(req.body);
    await passwordResetService.resetPassword(email, code, newPassword);
    res.json({ message: "Senha redefinida com sucesso." });
  }),
);

router.get(
  "/me",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const me = await authService.me(req.auth!.userId);
    res.json(me);
  }),
);

router.patch(
  "/phone",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { phone } = updatePhoneSchema.parse(req.body);
    const result = await authService.updatePhone(req.auth!.userId, phone);
    res.json(result);
  }),
);

export default router;
