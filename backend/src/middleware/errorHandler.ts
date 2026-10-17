import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("❌ Unhandled Application Error:", err.stack || err.message);

  const statusCode = (err as any).statusCode || 500;
  const message =
    env.NODE_ENV === "production" && statusCode === 500
      ? "Internal Server Error"
      : err.message || "An unexpected error occurred";

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.NODE_ENV !== "production" && { stack: err.stack }),
  });
}
