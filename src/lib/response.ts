import type { Response } from "express";
import STATUS_CODES from "./HttpStatusCodes.js";

// When to use what?
// throw AppError(...) in Services ( )
// sendSuccess(...) and sendError(...) in Controllers

// Why?
// Services should only handle business logic, not HTTP responses
// Controllers should handle HTTP responses

// Example:
// Service: throw NotFound('User not found')
// Controller: catch error and call sendError(res, error.message, error.statusCode)

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = STATUS_CODES.OK,
) => {
  res.status(statusCode).json({ success: true, data });
};

export const sendCreated = <T>(res: Response, data: T) =>
  sendSuccess(res, data, STATUS_CODES.CREATED);

export const sendError = (res: Response, message: string, statusCode = 500) => {
  res
    .status(statusCode)
    .json({ success: false, error: message, code: statusCode });
};
