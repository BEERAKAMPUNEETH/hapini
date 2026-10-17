import { spawn } from "child_process";
import path from "path";

async function runScript(scriptPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn("npx", ["tsx", scriptPath], {
      stdio: "inherit",
      shell: true,
      cwd: path.resolve(__dirname, "../../"),
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Test script ${scriptPath} exited with status ${code}`));
      }
    });
  });
}

async function main() {
  console.log("==================================================");
  console.log("       HAPINI MASTER TEST SUITE RUNNER           ");
  console.log("==================================================\n");

  try {
    console.log(">> SUITE 1: Pricing & Alert Logic Unit Tests\n");
    await runScript("src/tests/unit/pricing_and_alerts.unit.test.ts");

    console.log("\n>> SUITE 2: Authentication & Wishlist Isolation Tests\n");
    await runScript("src/tests/auth_and_wishlist.test.ts");

    console.log("\n>> SUITE 3: Redis Caching, Invalidation & Resilience Tests\n");
    await runScript("src/tests/redis_cache.test.ts");

    console.log("\n>> SUITE 4: Price Alerts, Scheduled Evaluation & Idempotency Tests\n");
    await runScript("src/tests/price_alerts.test.ts");

    console.log("\n>> SUITE 5: API Integration Tests with Isolated Test DB\n");
    await runScript("src/tests/integration/api_isolated_db.test.ts");

    console.log("\n>> SUITE 6: Database Persistence & Connection Tests\n");
    await runScript("src/tests/unit/database_connection_and_persistence.test.ts");

    console.log("\n==================================================");
    console.log("    ALL HAPINI TEST SUITES PASSED CLEANLY!       ");
    console.log("==================================================");
  } catch (err: any) {
    console.error("\n❌ Master test runner failed:", err.message);
    process.exit(1);
  }
}

main();
