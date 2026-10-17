import fs from "fs";
import path from "path";
import { Pool } from "pg";
import { pool } from "../config/db";

export async function runMigrations(customPool?: Pool): Promise<void> {
  const activePool = customPool || pool;
  const client = await activePool.connect();

  try {
    console.log(" Checking migration status...");

    // 1. Ensure schema_migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // 2. Fetch already executed migrations
    const appliedRes = await client.query("SELECT name FROM schema_migrations;");
    const applied = new Set(appliedRes.rows.map((r: any) => r.name));

    // 3. Find migration files in database/migrations
    const migrationsDir = path.resolve(process.cwd(), "../database/migrations");
    const altDir = path.resolve(process.cwd(), "database/migrations");
    const activeDir = fs.existsSync(migrationsDir) ? migrationsDir : altDir;

    if (!fs.existsSync(activeDir)) {
      console.warn(`⚠️ Migrations directory not found at ${activeDir}`);
      return;
    }

    const files = fs
      .readdirSync(activeDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    let executedCount = 0;

    for (const file of files) {
      if (applied.has(file)) {
        console.log(` Migration [ALREADY APPLIED]: ${file}`);
        continue;
      }

      console.log(` Running migration [PENDING]: ${file}...`);
      const filePath = path.join(activeDir, file);
      const sql = fs.readFileSync(filePath, "utf-8");

      const start = Date.now();
      await client.query("BEGIN;");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (name) VALUES ($1);",
          [file]
        );
        await client.query("COMMIT;");
        const elapsed = Date.now() - start;
        console.log(` Migration [SUCCESS]: ${file} (${elapsed}ms)`);
        executedCount++;
      } catch (err: any) {
        await client.query("ROLLBACK;");
        console.error(`❌ Migration failed in ${file}:`, err.message);
        throw err;
      }
    }

    if (executedCount === 0) {
      console.log(" All migrations are already up to date.");
    } else {
      console.log(` Successfully applied ${executedCount} new migration(s).`);
    }
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Migration runner exited with error:", err);
      process.exit(1);
    });
}
