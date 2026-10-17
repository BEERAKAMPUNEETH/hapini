import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AuthTokenPayload } from "../types";

/**
 * Authentication middleware: Validates JWT Bearer token
 * Attaches decoded user payload to `req.user`.
 */
export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      success: false,
      message: "Authentication required. No authorization token was provided.",
    });
    return;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    res.status(401).json({
      success: false,
      message: "Authorization format must be: Bearer <token>",
    });
    return;
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
    req.user = decoded;
    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired session. Please sign in again.",
    });
    return;
  }
}

/**
 * Optional authentication: Extracts user if token is present,
 * but allows unauthenticated requests to proceed.
 */
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next();
  }

  const parts = authHeader.split(" ");
  if (parts.length === 2 && parts[0] === "Bearer") {
    try {
      const decoded = jwt.verify(parts[1], env.JWT_SECRET) as AuthTokenPayload;
      req.user = decoded;
    } catch {
      // Ignored for optional auth
    }
  }

  next();
}
