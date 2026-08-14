import { randomUUID } from "crypto";
import pinoHttp from "pino-http";
import { Request } from "express";
import { logger } from "../../infrastructure/logging/logger";

// One line per request, correlated by requestId (echoed back via the
// X-Request-Id response header so it can be handed to support/a bug report
// and grepped straight out of the logs). Includes userId/quadraId/role once
// authMiddleware has populated req.auth, method, path, status, duration and
// the real client IP (trusts X-Forwarded-For — app.set("trust proxy", 1) in
// app.ts scopes that trust to the nginx reverse proxy in front of it).
export const requestLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const existing = req.headers["x-request-id"];
    const id = typeof existing === "string" && existing.length > 0 ? existing : randomUUID();
    res.setHeader("X-Request-Id", id);
    return id;
  },
  customProps: (req) => {
    const auth = (req as Request).auth;
    return {
      userId: auth?.userId,
      quadraId: auth?.quadraId,
      role: auth?.role,
    };
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  autoLogging: {
    ignore: (req) => req.url === "/api/health",
  },
});
