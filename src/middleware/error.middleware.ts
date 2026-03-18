import type { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/AppError.js";
import { sendError } from "../lib/response.js";
import { logger } from "../config/logger.js";
import z, { ZodError } from "zod";
import STATUS_CODES from "../lib/HttpStatusCodes.js";

export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  // Zod validation errors
  if (err instanceof ZodError) {
    const messages = err.issues
      .map((e: z.core.$ZodIssue) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    return sendError(res, messages, 422);
  }

  // Known operational errors (e.g., NotFound, Unauthorized)
  if (err instanceof AppError) {
    if (err.statusCode >= STATUS_CODES.INTERNAL_SERVER_ERROR) {
      logger.error({ err }, err.message);
    } else {
      logger.warn({ err }, err.message);
    }
    return sendError(res, err.message, err.statusCode);
  }

  // Unknown / programmer errors
  logger.error({ err }, "Unhandled error");
  return sendError(res, "Internal server error", 500);
};
