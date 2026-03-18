// When to use what?
// throw AppError(...) in Services ( )
// sendSuccess(...) and sendError(...) in Controllers

import STATUS_CODES from "./HttpStatusCodes.js";

// Why?
// Services should only handle business logic, not HTTP responses
// Controllers should handle HTTP responses

// Example:
// Service: throw NotFound('User not found')
// Controller: catch error and call sendError(res, error.message, error.statusCode)

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = STATUS_CODES.INTERNAL_SERVER_ERROR,
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const NotFound = (resource: string) =>
  new AppError(`${resource} not found`, STATUS_CODES.NOT_FOUND);

export const Unauthorized = (msg = "Unauthorized") =>
  new AppError(msg, STATUS_CODES.UNAUTHORIZED);

export const Forbidden = (msg = "Forbidden") =>
  new AppError(msg, STATUS_CODES.FORBIDDEN);

export const BadRequest = (msg: string) =>
  new AppError(msg, STATUS_CODES.BAD_REQUEST);

export const Conflict = (msg: string) =>
  new AppError(msg, STATUS_CODES.CONFLICT);

export const UnprocessableEntity = (msg: string) =>
  new AppError(msg, STATUS_CODES.UNPROCESSABLE_ENTITY);
