import express, { Application, Request, Response } from "express";
import cors from "cors";
import { env } from "./config/env";
import productRoutes from "./routes/product.routes";
import healthRoutes from "./routes/health.routes";
import authRoutes from "./routes/auth.routes";
import wishlistRoutes from "./routes/wishlist.routes";
import alertRoutes from "./routes/alert.routes";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/logger";

export const app: Application = express();

// Parse comma-separated allowed origins for production + localhost for dev
const clientOrigins = env.CLIENT_URL.split(",").map((url) => url.trim());
const allowedOrigins = Array.from(
  new Set([
    ...clientOrigins,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:80",
    "http://localhost",
  ])
);

// Standard middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// API routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/products", productRoutes);

// Root informational endpoint
app.get("/", (_req: Request, res: Response) => {
  res.json({
    name: "Hapini API",
    version: "1.0.0",
    docs: "/api/health",
    status: "active",
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

// Centralized error handling
app.use(errorHandler);

export default app;
