import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { envConfig } from "../config/envConfig.js";
import { Unauthorized } from "../lib/AppError.js";
import * as STATUS_CODES from "../lib/HttpStatusCodes.js";
import prisma from "../config/db.js";

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

export const requirePermission = (requiredPermission: string) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(Unauthorized("User not authenticated"));
      }

      const role = await prisma.role.findUnique({
        where: { id: req.user.roleId },
        include: { permissions: true },
      });

      if (!role) {
        return next(Unauthorized("User role not found"));
      }

      const hasPermission = role.permissions.some(
        (p) => p.action === requiredPermission || p.action === "*"
      );

      if (!hasPermission) {
        const error: any = new Error("Forbidden: Insufficient permissions");
        error.statusCode = STATUS_CODES.default.FORBIDDEN;
        error.isOperational = true;
        return next(error);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
