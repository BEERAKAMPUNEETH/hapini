import { Client } from "pg";
import { env } from "../config/env";

export async function ensureDatabasesExist(): Promise<void> {
  const devDb = env.DB_NAME || "hapini_dev";
  const testDb = env.TEST_DB_NAME || "hapini_test";

  // Connect to default maintenance database 'postgres'
  const client = new Client({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: "postgres",
  });

  try {
    await client.connect();
    console.log(" Connected to PostgreSQL maintenance database.");

    for (const dbName of [devDb, testDb]) {
      const checkRes = await client.query(
        "SELECT 1 FROM pg_database WHERE datname = $1",
        [dbName]
      );

      if (checkRes.rowCount === 0) {
        console.log(` Creating database "${dbName}"...`);
        // Database names cannot be parameterized in CREATE DATABASE statement
        const safeName = dbName.replace(/[^a-zA-Z0-9_]/g, "");
        await client.query(`CREATE DATABASE ${safeName};`);
        console.log(` Database "${dbName}" created successfully.`);
      } else {
        console.log(` Database "${dbName}" already exists. (Never dropping existing data).`);
      }
    }
  } catch (error: any) {
    console.warn("⚠️ Could not ensure databases exist:", error.message);
    throw error;
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  ensureDatabasesExist()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
