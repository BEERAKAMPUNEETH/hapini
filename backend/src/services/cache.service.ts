import { getRedisClient, isRedisActive } from "../config/redis";
import { env } from "../config/env";

export interface CacheResult<T> {
  data: T | null;
  status: "HIT" | "MISS";
}

// In-memory fallback cache if Redis is down or unconfigured
const memoryCache = new Map<string, { value: string; expiresAt: number }>();

export const cacheService = {
  /**
   * Check whether Redis connection is live
   */
  isAvailable(): boolean {
    return isRedisActive();
  },

  /**
   * Retrieve cached item with status ("HIT" or "MISS")
   */
  async getWithStatus<T>(key: string): Promise<CacheResult<T>> {
    try {
      if (isRedisActive()) {
        const client = getRedisClient();
        if (client) {
          const raw = await client.get(key);
          if (raw) {
            return { data: JSON.parse(raw) as T, status: "HIT" };
          }
        }
      }
    } catch (err: any) {
      console.warn(`Redis get error on key ${key}:`, err.message);
    }

    // Memory cache fallback lookup
    const item = memoryCache.get(key);
    if (!item) {
      return { data: null, status: "MISS" };
    }

    if (Date.now() > item.expiresAt) {
      memoryCache.delete(key);
      return { data: null, status: "MISS" };
    }

    try {
      return { data: JSON.parse(item.value) as T, status: "HIT" };
    } catch {
      memoryCache.delete(key);
      return { data: null, status: "MISS" };
    }
  },

  /**
   * Retrieve item from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const result = await this.getWithStatus<T>(key);
    return result.data;
  },

  /**
   * Set item in cache with configurable TTL
   */
  async set(
    key: string,
    value: any,
    ttlSeconds: number = env.CACHE_TTL_SECONDS
  ): Promise<void> {
    const serialized = JSON.stringify(value);

    try {
      if (isRedisActive()) {
        const client = getRedisClient();
        if (client) {
          await client.set(key, serialized, "EX", ttlSeconds);
          return;
        }
      }
    } catch (err: any) {
      console.warn(`Redis set error on key ${key}:`, err.message);
    }

    // Fall back to in-memory cache
    memoryCache.set(key, {
      value: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  },

  /**
   * Remove a specific key from cache
   */
  async del(key: string): Promise<void> {
    try {
      if (isRedisActive()) {
        const client = getRedisClient();
        if (client) {
          await client.del(key);
        }
      }
    } catch (err: any) {
      console.warn(`Redis del error on key ${key}:`, err.message);
    }

    memoryCache.delete(key);
  },

  /**
   * Invalidate multiple keys matching a pattern (e.g., 'products:list:*')
   */
  async delPattern(pattern: string): Promise<number> {
    let deletedCount = 0;

    // 1. Invalidate in Redis using scanStream
    if (isRedisActive()) {
      try {
        const client = getRedisClient();
        if (client) {
          const stream = client.scanStream({ match: pattern, count: 100 });
          const keysToDelete: string[] = [];

          for await (const chunk of stream) {
            if (chunk && chunk.length > 0) {
              keysToDelete.push(...chunk);
            }
          }

          if (keysToDelete.length > 0) {
            await client.del(...keysToDelete);
            deletedCount += keysToDelete.length;
          }
        }
      } catch (err: any) {
        console.warn(`Redis delPattern error on ${pattern}:`, err.message);
      }
    }

    // 2. Invalidate in in-memory fallback
    const escapedPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, ".*");
    const regex = new RegExp(`^${escapedPattern}$`);

    for (const key of Array.from(memoryCache.keys())) {
      if (regex.test(key)) {
        memoryCache.delete(key);
        deletedCount++;
      }
    }

    return deletedCount;
  },

  /**
   * Wipe all keys from memory cache (primarily used in tests)
   */
  _clearMemory(): void {
    memoryCache.clear();
  },
};
