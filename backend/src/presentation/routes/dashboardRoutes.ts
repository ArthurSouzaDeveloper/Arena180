import { Router } from "express";
import { dashboardService } from "../../application/services/dashboardService";
import { asyncHandler } from "../middlewares/errorHandler";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.use(authMiddleware);

router.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const summary = await dashboardService.summary(req.auth!.quadraId);
    res.json(summary);
  }),
);

export default router;
