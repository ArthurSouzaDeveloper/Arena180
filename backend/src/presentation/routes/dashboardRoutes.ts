import { Router } from "express";
import { dashboardService } from "../../application/services/dashboardService";
import { asyncHandler } from "../middlewares/errorHandler";
import { authMiddleware, ownerMiddleware } from "../middlewares/auth";

const router = Router();

router.use(authMiddleware);
router.use(ownerMiddleware);

router.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const summary = await dashboardService.summary(req.auth!.quadraId!);
    res.json(summary);
  }),
);

export default router;
