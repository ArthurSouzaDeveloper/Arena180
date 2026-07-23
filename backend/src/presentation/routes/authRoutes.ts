import { Router } from "express";
import { z } from "zod";
import { authService } from "../../application/services/authService";
import { asyncHandler } from "../middlewares/errorHandler";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const result = await authService.login({ email, password });
    res.json(result);
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

export default router;
