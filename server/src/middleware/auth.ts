import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/errors.js";
import { config } from "../config.js";

interface JwtPayload {
  sub: string;
  email: string;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AppError("Missing or invalid authorization header", 401, "UNAUTHORIZED");
  }

  const token = authHeader.slice("Bearer ".length).trim();
  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = {
      id: payload.sub,
      email: payload.email,
    };
    next();
  } catch {
    throw new AppError("Invalid token", 401, "UNAUTHORIZED");
  }
}
