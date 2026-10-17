import { Request, Response } from "express";
import { isDbActive } from "../config/db";
import { isRedisActive } from "../config/redis";
import { HealthStatus } from "../types";

export const healthController = {
  check(_req: Request, res: Response): void {
    const dbConnected = isDbActive();
    const redisConnected = isRedisActive();

    const status: HealthStatus = {
      status: dbConnected && redisConnected ? "ok" : "degraded",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      services: {
        server: "up",
        database: dbConnected ? "connected" : "fallback_memory",
        redis: redisConnected ? "connected" : "fallback_memory",
      },
    };

    res.status(200).json(status);
  },
};
