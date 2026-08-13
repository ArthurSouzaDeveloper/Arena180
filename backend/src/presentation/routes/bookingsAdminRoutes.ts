import { Router } from "express";
import { z } from "zod";
import { bookingService } from "../../application/services/bookingService";
import { asyncHandler } from "../middlewares/errorHandler";
import { authMiddleware, ownerMiddleware } from "../middlewares/auth";

const router = Router();

router.use(authMiddleware);
router.use(ownerMiddleware);

const listQuerySchema = z.object({
  courtId: z.string().optional(),
  status: z.enum(["CONFIRMADA", "PENDENTE_PAGAMENTO", "CANCELADA"]).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const filters = listQuerySchema.parse(req.query);
    const bookings = await bookingService.listAllForQuadra(req.auth!.quadraId!, filters);
    res.json(bookings);
  }),
);

router.put(
  "/:courtId/:bookingId/cancel",
  asyncHandler(async (req, res) => {
    const booking = await bookingService.adminCancel(req.auth!.quadraId!, req.params.courtId, req.params.bookingId);
    res.json(booking);
  }),
);

export default router;
