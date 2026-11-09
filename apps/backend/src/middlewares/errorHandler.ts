import { Request, Response, NextFunction } from "express";

export interface CustomError extends Error {
  statusCode?: number;
  errors?: Record<string, string[]>;
}

export function errorHandler(
  err: CustomError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const statusCode = err.statusCode || 500;
  const message = err.message || "An unexpected internal server error occurred.";

  res.status(statusCode).json({
    message,
    ...(err.errors ? { errors: err.errors } : {}),
  });
}

