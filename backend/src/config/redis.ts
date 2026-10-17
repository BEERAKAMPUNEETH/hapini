import Redis from "ioredis";
import { env } from "./env";

let redisClient: Redis | null = null;
let isRedisConnected = false;

try {
  redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    connectTimeout: 3000,
    retryStrategy(times) {
      if (times > 3) {
        return null; // Stop retrying after 3 failed attempts
      }
      return Math.min(times * 500, 2000);
    },
    lazyConnect: true,
  });

  redisClient.on("connect", () => {
    isRedisConnected = true;
    console.log(" Redis client connected successfully.");
  });

  redisClient.on("error", (err) => {
    isRedisConnected = false;
    // Suppress noisy reconnection logs in dev
    if (env.NODE_ENV === "development") {
      console.warn("⚠️ Redis not connected (fallback in-memory cache active):", err.message);
    }
  });

  // Attempt initial connection asynchronously
  redisClient.connect().catch(() => {
    isRedisConnected = false;
  });
} catch (err: any) {
  console.warn("⚠️ Failed to initialize Redis client:", err.message);
}

export function isRedisActive(): boolean {
  return isRedisConnected;
}

export function getRedisClient(): Redis | null {
  return redisClient;
}
