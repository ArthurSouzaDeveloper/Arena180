import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { UnauthorizedError } from "../../domain/errors";

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
    throw new UnauthorizedError("Acesso restrito ao dono da arena");
  }
  next();
}

export function superadminMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (req.auth?.role !== "SUPERADMIN") {
    throw new UnauthorizedError("Acesso restrito ao superadmin");
  }
  next();
}
