import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "path";
import { env } from "./config/env";
import { errorHandler } from "./presentation/middlewares/errorHandler";
import { apiRateLimit, loginRateLimit } from "./presentation/middlewares/rateLimit";
import { requestLogger } from "./presentation/middlewares/requestLogger";
import authRoutes from "./presentation/routes/authRoutes";
import productRoutes from "./presentation/routes/productRoutes";
import rachaRoutes from "./presentation/routes/rachaRoutes";
import dashboardRoutes from "./presentation/routes/dashboardRoutes";
import courtRoutes from "./presentation/routes/courtRoutes";
import bookingRoutes from "./presentation/routes/bookingRoutes";
import superadminRoutes from "./presentation/routes/superadminRoutes";
import quadraSettingsRoutes from "./presentation/routes/quadraSettingsRoutes";
import bookingsAdminRoutes from "./presentation/routes/bookingsAdminRoutes";

export function createApp() {
  const app = express();

  // Required so express-rate-limit and audit logs see the real client IP
  // (X-Forwarded-For) instead of the nginx reverse-proxy's own address.
  app.set("trust proxy", 1);

  app.use(requestLogger);
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());
  app.use("/uploads", express.static(path.resolve(process.cwd(), env.uploadsDir)));

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  app.use(apiRateLimit);
  app.use("/api/auth/login", loginRateLimit);

  app.use("/api/auth", authRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/rachas", rachaRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/courts", courtRoutes);
  app.use("/api/booking", bookingRoutes);
  app.use("/api/superadmin", superadminRoutes);
  app.use("/api/quadra", quadraSettingsRoutes);
  app.use("/api/reservas", bookingsAdminRoutes);

  app.use(errorHandler);

  return app;
}
