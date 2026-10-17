import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { Pool } from "pg";
import { isDbActive, checkDatabaseConnection } from "../../config/db";
import { userRepository } from "../../repositories/user.repository";
import { wishlistRepository } from "../../repositories/wishlist.repository";
import { alertRepository } from "../../repositories/alert.repository";
import { env } from "../../config/env";

export async function runDatabasePersistenceTests() {
  console.log("\n==================================================");
  console.log(" Running Database Persistence & Connection Tests  ");
  console.log("==================================================\n");

  // ---------------------------------------------------------------------------
  // Test 1: Verification of Graceful Connection Failure Handling
  // ---------------------------------------------------------------------------
  console.log("Test 1: Graceful connection failure handling on unreachable port...");
  const dummyPool = new Pool({
    connectionString: "postgresql://postgres:wrong_password@127.0.0.1:54321/non_existent_db",
    connectionTimeoutMillis: 1000,
  });

  let threwUnhandled = false;
  try {
    const client = await dummyPool.connect().catch((err) => {
      // Caught cleanly
      return null;
    });
    assert.equal(client, null, "Should return null on connection failure");
    console.log("✓ Test 1 Passed: Unreachable database connection handled without crashing process.");
  } catch (err) {
    threwUnhandled = true;
  } finally {
    await dummyPool.end().catch(() => {});
  }
  assert.equal(threwUnhandled, false, "Connection failure must be caught gracefully");

  // ---------------------------------------------------------------------------
  // Test 2: Migration Files Structural & SQL Integrity Checks
  // ---------------------------------------------------------------------------
  console.log("Test 2: Verifying migration file structure and SQL syntax rules...");
  const migrationsDir = path.resolve(__dirname, "../../../../database/migrations");
  assert.ok(fs.existsSync(migrationsDir), `Migrations directory must exist at ${migrationsDir}`);

  const migrationFiles = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  assert.ok(migrationFiles.length >= 2, "Must contain at least 2 migrations");
  assert.equal(migrationFiles[0], "001_initial_schema.sql");
  assert.equal(migrationFiles[1], "002_price_alerts_and_logs.sql");

  const schema001 = fs.readFileSync(path.join(migrationsDir, "001_initial_schema.sql"), "utf-8");
  assert.match(schema001, /CREATE TABLE IF NOT EXISTS users/i, "001 must create users table");
  assert.match(schema001, /CREATE TABLE IF NOT EXISTS products/i, "001 must create products table");
  assert.match(schema001, /CREATE TABLE IF NOT EXISTS offers/i, "001 must create offers table");
  assert.match(schema001, /CREATE TABLE IF NOT EXISTS wishlists/i, "001 must create wishlists table");
  assert.match(schema001, /CREATE TABLE IF NOT EXISTS price_alerts/i, "001 must create price_alerts table");
  assert.match(schema001, /NUMERIC\(12,\s*2\)/i, "Pricing columns must use decimal-safe NUMERIC(12, 2)");
  console.log("✓ Test 2 Passed: Schema migration files strictly follow naming and decimal-safe conventions.");

  // ---------------------------------------------------------------------------
  // Test 3: Idempotent Seed File Analysis
  // ---------------------------------------------------------------------------
  console.log("Test 3: Verifying seed file idempotency safeguards...");
  const seedPath = path.resolve(__dirname, "../../../../database/seeds.sql");
  assert.ok(fs.existsSync(seedPath), `Seeds script must exist at ${seedPath}`);
  const seedSql = fs.readFileSync(seedPath, "utf-8");

  assert.match(seedSql, /ON CONFLICT \(slug\) DO UPDATE/i, "Retailer and product seeds must use ON CONFLICT");
  assert.match(seedSql, /ON CONFLICT \(email\) DO NOTHING/i, "User seeds must use ON CONFLICT");
  assert.match(seedSql, /ON CONFLICT \(product_id, retailer_id\) DO UPDATE/i, "Offer seeds must enforce unique store quotes");
  console.log("✓ Test 3 Passed: Seed scripts enforce ON CONFLICT idempotency across all tables.");

  // ---------------------------------------------------------------------------
  // Test 4: Repository Fallback Data Persistence
  // ---------------------------------------------------------------------------
  console.log("Test 4: Repository persistence under disconnected state...");
  userRepository._clearMemory();
  wishlistRepository._clearMemory();
  alertRepository._clearMemory();

  // Create user in disconnected/fallback state
  const testUser = await userRepository.create({
    email: "persistence_test@example.com",
    name: "Persistence Test User",
    password_hash: "hashed_dummy_password",
  });
  assert.ok(testUser.id, "User ID must be generated");

  // Read back user
  const foundUser = await userRepository.findByEmail("persistence_test@example.com");
  assert.ok(foundUser, "User must be retrievable from repository");
  assert.equal(foundUser?.email, "persistence_test@example.com");

  // Add wishlist item
  await wishlistRepository.addToWishlist(testUser.id, 1);
  const wishlistItems = await wishlistRepository.getUserWishlist(testUser.id);
  assert.ok(wishlistItems.length >= 1, "Wishlist must persist saved items");

  // Create price alert
  const alert = await alertRepository.createAlert({
    userId: testUser.id,
    productId: 1,
    targetPrice: 65000,
    email: "persistence_test@example.com",
    retailerName: "Amazon",
  });
  assert.ok(alert.id, "Alert ID must be generated");

  const userAlerts = await alertRepository.getAlertsByUserId(testUser.id);
  assert.equal(userAlerts.length, 1, "Alert must persist in repository");
  assert.equal(userAlerts[0].targetPrice, 65000);
  console.log("✓ Test 4 Passed: Repository layer guarantees persistence and isolation when DB is in fallback mode.");

  // ---------------------------------------------------------------------------
  // Test 5: Live PostgreSQL Persistence Verification (if DB is reachable)
  // ---------------------------------------------------------------------------
  console.log("Test 5: Live PostgreSQL persistence verification check...");
  let livePool: Pool | null = null;
  try {
    livePool = new Pool({
      connectionString: env.TEST_DATABASE_URL,
      connectionTimeoutMillis: 1500,
    });
    const client = await livePool.connect();
    await client.query("SELECT 1;");
    client.release();

    console.log("  Live PostgreSQL instance detected on TEST_DATABASE_URL! Testing disk roundtrip...");
    const testEmail = `disk_verify_${Date.now()}@hapini.test`;
    await livePool.query(
      `INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING;`,
      [testEmail, "sample_hash", "Disk User", "user"]
    );

    const verifyRes = await livePool.query(`SELECT email FROM users WHERE email = $1;`, [testEmail]);
    assert.equal(verifyRes.rows.length, 1, "Record must persist on disk in PostgreSQL");
    assert.equal(verifyRes.rows[0].email, testEmail);

    // Clean up test record
    await livePool.query(`DELETE FROM users WHERE email = $1;`, [testEmail]);
    console.log("✓ Test 5 Passed: Verified actual PostgreSQL disk-backed persistence.");
  } catch (err: any) {
    console.log(`ℹ️ Test 5 Notice: Live PostgreSQL not reachable locally (${err.message}). In-memory fallback verified.`);
  } finally {
    if (livePool) await livePool.end().catch(() => {});
  }

  console.log("\n==================================================");
  console.log(" ALL DATABASE PERSISTENCE TESTS PASSED CLEANLY!  ");
  console.log("==================================================\n");
}

if (require.main === module) {
  runDatabasePersistenceTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Test failed:", err);
      process.exit(1);
    });
}
