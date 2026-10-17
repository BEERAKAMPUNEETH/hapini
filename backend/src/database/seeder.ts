import fs from "fs";
import path from "path";
import { Pool } from "pg";
import { pool } from "../config/db";

export async function runSeeds(customPool?: Pool): Promise<void> {
  const activePool = customPool || pool;
  const client = await activePool.connect();

  try {
    console.log(" Running idempotent database seeds...");

    const seedFile = path.resolve(process.cwd(), "../database/seeds.sql");
    const altSeedFile = path.resolve(process.cwd(), "database/seeds.sql");
    const activeFile = fs.existsSync(seedFile) ? seedFile : altSeedFile;

    if (!fs.existsSync(activeFile)) {
      console.warn(`⚠️ Seed script not found at ${activeFile}`);
      return;
    }

    const sql = fs.readFileSync(activeFile, "utf-8");
    const start = Date.now();

    await client.query("BEGIN;");
    try {
      await client.query(sql);
      await client.query("COMMIT;");
      const duration = Date.now() - start;
      console.log(` Successfully seeded database from ${path.basename(activeFile)} in ${duration}ms.`);
    } catch (err: any) {
      await client.query("ROLLBACK;");
      console.error("❌ Seeding failed:", err.message);
      throw err;
    }
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runSeeds()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seeder exited with error:", err);
      process.exit(1);
    });
}
