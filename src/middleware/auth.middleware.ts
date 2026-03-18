import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { envConfig } from "../config/envConfig.js";
import { Unauthorized } from "../lib/AppError.js";
import * as STATUS_CODES from "../lib/HttpStatusCodes.js";

interface JwtPayload {
  sub: string;
  roleId: string;
}

// Extend Express Request to carry the decoded user
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; roleId: string };
    }
  }
}

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(Unauthorized("No token provided"));
  }

  const token = authHeader.slice(7); // Remove 'Bearer ' prefix

  try {
    const decoded = jwt.verify(token, envConfig.JWT_SECRET) as JwtPayload;
    req.user = { id: decoded.sub, roleId: decoded.roleId };
    next();
  } catch {
    next(Unauthorized("Token is invalid or expired"));
  }
};
