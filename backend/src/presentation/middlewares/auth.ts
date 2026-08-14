import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { UnauthorizedError } from "../../domain/errors";
import { prisma } from "../../config/database";

export interface AuthPayload {
  userId: string;
  quadraId: string | null;
  role: "OWNER" | "SUPERADMIN";
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new UnauthorizedError("Token não informado");
  }

  const token = header.replace("Bearer ", "");

  try {
    const payload = jwt.verify(token, env.jwtSecret) as AuthPayload;
    req.auth = payload;
    next();
  } catch {
    throw new UnauthorizedError("Token inválido ou expirado");
  }
}

export function ownerMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (req.auth?.role !== "OWNER" || !req.auth.quadraId) {
    next(new UnauthorizedError("Acesso restrito ao dono da arena"));
    return;
  }

  // A JWT stays valid until it expires (up to 7 days) regardless of what
  // happens to the arena afterwards. Without this check, a superadmin
  // deactivating an arena wouldn't actually revoke an owner's in-flight
  // session — they could keep managing courts/bookings for up to a week.
  // Express 4 doesn't await middleware, so this must forward rejections
  // to next() explicitly rather than relying on an async throw.
  prisma.quadra
    .findUnique({ where: { id: req.auth.quadraId }, select: { active: true } })
    .then((quadra) => {
      if (!quadra || !quadra.active) {
        next(new UnauthorizedError("Esta arena está desativada. Fale com o suporte."));
        return;
      }
      next();
    })
    .catch(next);
}

export function superadminMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (req.auth?.role !== "SUPERADMIN") {
    throw new UnauthorizedError("Acesso restrito ao superadmin");
  }
  next();
}
