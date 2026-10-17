import rateLimit from "express-rate-limit";

/**
 * Rate limiter for sensitive authentication endpoints (login, register).
 * Prevents brute force and credential stuffing.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per IP per window
  standardHeaders: true, // Return standard RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  message: {
    success: false,
    message: "Too many authentication requests from this IP. Please try again after 15 minutes.",
  },
  skip: () => process.env.NODE_ENV === "test", // Skip rate limiting during test executions
});

/**
 * Rate limiter for sensitive cache management endpoints.
 */
export const cacheLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // 15 calls per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many cache invalidation requests. Please try again after a minute.",
  },
  skip: () => process.env.NODE_ENV === "test",
});

/**
 * Rate limiter for public search endpoints to prevent resource exhaustion.
 */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 search queries per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "High volume of search queries detected. Please slow down.",
  },
  skip: () => process.env.NODE_ENV === "test",
});
