import dotenv from "dotenv";
import path from "path";

// Load .env from root or local backend
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const dbUser = process.env.DB_USER || "postgres";
const dbPassword = process.env.DB_PASSWORD || "postgres";
const dbHost = process.env.DB_HOST || "localhost";
const dbPort = Number(process.env.DB_PORT) || 5432;
const dbName = process.env.DB_NAME || "hapini_dev";
const testDbName = process.env.TEST_DB_NAME || "hapini_test";

export const env = {
  PORT: Number(process.env.PORT) || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",

  // PostgreSQL Configuration (Dedicated Dev & Test databases)
  DB_HOST: dbHost,
  DB_PORT: dbPort,
  DB_NAME: dbName,
  TEST_DB_NAME: testDbName,
  DB_USER: dbUser,
  DB_PASSWORD: dbPassword,
  DB_SSL: process.env.DB_SSL === "true",
  DB_REQUIRED: process.env.DB_REQUIRED === "true",
  DATABASE_URL:
    process.env.DATABASE_URL ||
    `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`,
  TEST_DATABASE_URL:
    process.env.TEST_DATABASE_URL ||
    `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${testDbName}`,

  // Redis Configuration
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: Number(process.env.REDIS_PORT) || 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  CACHE_TTL_SECONDS: Number(process.env.CACHE_TTL_SECONDS) || 300,
  SEARCH_CACHE_TTL_SECONDS: Number(process.env.SEARCH_CACHE_TTL_SECONDS) || 120,
  PRODUCT_CACHE_TTL_SECONDS: Number(process.env.PRODUCT_CACHE_TTL_SECONDS) || 600,

  // Authentication & Security
  JWT_SECRET:
    process.env.JWT_SECRET ||
    (process.env.NODE_ENV === "production"
      ? (() => {
          throw new Error("JWT_SECRET must be configured in production");
        })()
      : "hapini_dev_jwt_secret_key_minimum_32_characters_random_string"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
};
