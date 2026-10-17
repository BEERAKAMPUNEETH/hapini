import { Pool, QueryResult, QueryResultRow } from "pg";
import { env } from "./env";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  connectionTimeoutMillis: 3000,
  idleTimeoutMillis: 10000,
  max: 10,
  ssl: env.DB_SSL ? { rejectUnauthorized: false } : undefined,
});

let isConnected = false;

pool.on("connect", () => {
  isConnected = true;
  console.log(" PostgreSQL Pool connected successfully.");
});

pool.on("error", (err) => {
  isConnected = false;
  console.warn("⚠️ PostgreSQL client error:", err.message);
});

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    isConnected = true;
    return true;
  } catch (error: any) {
    isConnected = false;
    console.warn("⚠️ PostgreSQL not reachable yet (fallback in-memory store active):", error.message);
    return false;
  }
}

export function isDbActive(): boolean {
  return isConnected;
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const res = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  if (env.NODE_ENV === "development") {
    console.log("Executed query", { text, duration, rows: res.rowCount });
  }
  return res;
}
