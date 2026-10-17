import assert from "assert";
import http from "http";
import app from "../app";
import { alertJobService } from "../services/alertJob.service";
import { ConsoleNotificationProvider } from "../notifications/notification.provider";
import { alertRepository } from "../repositories/alert.repository";

const PORT = 5097; // Dedicated port for price alert tests
let server: http.Server;

interface ApiResponse<T = any> {
  status: number;
  data: T;
}

function request(
  method: string,
  path: string,
  body?: any,
  token?: string
): Promise<ApiResponse> {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : "";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    if (postData) {
      headers["Content-Length"] = String(Buffer.byteLength(postData));
    }

    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: PORT,
        path,
        method,
        headers,
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => {
          raw += chunk;
        });
        res.on("end", () => {
          try {
            const data = raw ? JSON.parse(raw) : null;
            resolve({ status: res.statusCode || 500, data });
          } catch {
            resolve({ status: res.statusCode || 500, data: raw as any });
          }
        });
      }
    );

    req.on("error", (err) => reject(err));

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runPriceAlertTests() {
  console.log("==================================================");
  console.log(" Starting Hapini Price Alert & Scheduler Tests");
  console.log("==================================================\n");

  await new Promise<void>((resolve) => {
    server = app.listen(PORT, () => {
      console.log(` Test server listening on http://127.0.0.1:${PORT}`);
      resolve();
    });
  });

  const testNotificationProvider = new ConsoleNotificationProvider();
  alertJobService.setNotificationProvider(testNotificationProvider);
  alertRepository._clearMemory();
  alertJobService.clearSimulatedPrices();

  try {
    const timestamp = Date.now();
    const user1Email = `alert_user1_${timestamp}@example.com`;
    const user2Email = `alert_user2_${timestamp}@example.com`;

    // 1. Register User 1
    const u1Reg = await request("POST", "/api/auth/register", {
      email: user1Email,
      password: "Password123!",
      name: "Alert Tester One",
    });
    const user1Token = u1Reg.data.data.token;

    // 2. Register User 2
    const u2Reg = await request("POST", "/api/auth/register", {
      email: user2Email,
      password: "Password456!",
      name: "Alert Tester Two",
    });
    const user2Token = u2Reg.data.data.token;

    // -----------------------------------------------------------------
    // TEST 1: Create Price Alert with Valid Target Price
    // -----------------------------------------------------------------
    console.log("Test 1: User 1 creates a price alert for iPhone 17 Pro at target ₹70,000...");
    const createRes = await request(
      "POST",
      "/api/alerts",
      {
        productId: 1,
        targetPrice: 70000,
        retailerName: "Flipkart",
      },
      user1Token
    );
    assert.strictEqual(createRes.status, 201, `Expected 201, got ${createRes.status}`);
    assert.strictEqual(createRes.data.success, true);
    assert.ok(createRes.data.data.id, "Expected alert ID");
    assert.strictEqual(createRes.data.data.targetPrice, 70000);
    assert.strictEqual(createRes.data.data.isActive, true);
    const alert1Id = createRes.data.data.id;
    console.log("✓ Test 1 Passed: Alert created successfully.");

    // -----------------------------------------------------------------
    // TEST 2: List User Alerts & Status Check
    // -----------------------------------------------------------------
    console.log("\nTest 2: Retrieve User 1 alerts list...");
    const listRes = await request("GET", "/api/alerts", undefined, user1Token);
    assert.strictEqual(listRes.status, 200);
    assert.strictEqual(listRes.data.count, 1);
    assert.strictEqual(listRes.data.data[0].id, alert1Id);
    assert.strictEqual(listRes.data.data[0].isActive, true);
    assert.strictEqual(listRes.data.data[0].triggeredAt, null);
    console.log("✓ Test 2 Passed: User 1 alert listed with active tracking status.");

    // -----------------------------------------------------------------
    // TEST 3: Cross-User Authorization (Strict Isolation)
    // -----------------------------------------------------------------
    console.log("\nTest 3: Cross-user authorization check (User 2 cannot tamper with User 1 alert)...");
    // User 2 lists alerts -> must be 0
    const u2List = await request("GET", "/api/alerts", undefined, user2Token);
    assert.strictEqual(u2List.data.count, 0, "User 2 must not see User 1's alerts");

    // User 2 attempts to fetch User 1's alert directly
    const u2Get = await request("GET", `/api/alerts/${alert1Id}`, undefined, user2Token);
    assert.strictEqual(u2Get.status, 404, "User 2 cannot read User 1 alert");

    // User 2 attempts to update User 1's alert
    const u2Update = await request("PATCH", `/api/alerts/${alert1Id}`, { targetPrice: 50000 }, user2Token);
    assert.strictEqual(u2Update.status, 404, "User 2 cannot update User 1 alert");

    // User 2 attempts to delete User 1's alert
    const u2Delete = await request("DELETE", `/api/alerts/${alert1Id}`, undefined, user2Token);
    assert.strictEqual(u2Delete.status, 404, "User 2 cannot delete User 1 alert");

    // Confirm User 1's alert is still untouched
    const u1Check = await request("GET", `/api/alerts/${alert1Id}`, undefined, user1Token);
    assert.strictEqual(u1Check.status, 200);
    assert.strictEqual(u1Check.data.data.targetPrice, 70000);
    console.log("✓ Test 3 Passed: Cross-user isolation verified (read, update, and delete unauthorized).");

    // -----------------------------------------------------------------
    // TEST 4: Scheduled Price Evaluation (No Trigger when price is above target)
    // -----------------------------------------------------------------
    console.log("\nTest 4: Price check pass with current price above target (no trigger)...");
    // Current price is ₹74,499 which is > target ₹70,000
    const pass1 = await request("POST", "/api/alerts/run-check");
    assert.strictEqual(pass1.status, 200);
    assert.strictEqual(pass1.data.data.alertsTriggered, 0, "Alert should NOT trigger when current > target");
    assert.strictEqual(testNotificationProvider.getDispatchedNotifications().length, 0);
    console.log("✓ Test 4 Passed: No alert triggered when price remains above target.");

    // -----------------------------------------------------------------
    // TEST 5: Simulated Price Drop & Alert Trigger
    // -----------------------------------------------------------------
    console.log("\nTest 5: Simulate price drop to ₹68,999 and evaluate...");
    const simRes = await request("POST", "/api/alerts/simulate-price", {
      productId: 1,
      newPrice: 68999,
      retailerName: "Flipkart",
    });
    assert.strictEqual(simRes.status, 200);
    assert.strictEqual(simRes.data.data.evaluation.alertsTriggered, 1, "Alert MUST trigger when price <= target");
    assert.strictEqual(simRes.data.data.evaluation.notificationsDispatched, 1, "Notification must be sent");

    const dispatched = testNotificationProvider.getDispatchedNotifications();
    assert.strictEqual(dispatched.length, 1);
    assert.strictEqual(dispatched[0].currentPrice, 68999);
    assert.strictEqual(dispatched[0].targetPrice, 70000);
    assert.strictEqual(dispatched[0].userEmail, user1Email);

    // Verify alert state is now marked triggered in database/repository
    const alertAfterDrop = await request("GET", `/api/alerts/${alert1Id}`, undefined, user1Token);
    assert.strictEqual(alertAfterDrop.data.data.isActive, false, "Alert should be deactivated after triggering");
    assert.strictEqual(alertAfterDrop.data.data.triggeredPrice, 68999);
    assert.ok(alertAfterDrop.data.data.triggeredAt !== null, "triggeredAt must be populated");
    console.log("✓ Test 5 Passed: Alert correctly triggered, simulated notification dispatched, status updated.");

    // -----------------------------------------------------------------
    // TEST 6: Idempotency & Duplicate Prevention Safeguard
    // -----------------------------------------------------------------
    console.log("\nTest 6: Idempotency check: Re-running evaluation does NOT send duplicate notifications...");
    // Manually reactivate alert at same price to test idempotency guard
    await alertRepository.updateAlert(alert1Id, u1Reg.data.data.user.id, { isActive: true });

    const pass2 = await request("POST", "/api/alerts/run-check");
    assert.strictEqual(pass2.status, 200);
    // Notification count MUST remain 1 (no duplicate sent)
    assert.strictEqual(
      testNotificationProvider.getDispatchedNotifications().length,
      1,
      "Duplicate notification must be blocked by idempotency key"
    );
    console.log("✓ Test 6 Passed: Idempotency guard strictly prevented duplicate notification.");

    // -----------------------------------------------------------------
    // TEST 7: Update and Delete Alert
    // -----------------------------------------------------------------
    console.log("\nTest 7: Update and delete alert by owner...");
    const updateRes = await request(
      "PATCH",
      `/api/alerts/${alert1Id}`,
      { targetPrice: 65000, isActive: true },
      user1Token
    );
    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateRes.data.data.targetPrice, 65000);

    const deleteRes = await request("DELETE", `/api/alerts/${alert1Id}`, undefined, user1Token);
    assert.strictEqual(deleteRes.status, 200);

    const emptyList = await request("GET", "/api/alerts", undefined, user1Token);
    assert.strictEqual(emptyList.data.count, 0, "Alerts list should now be empty");
    console.log("✓ Test 7 Passed: Alert successfully updated and deleted.");

    // -----------------------------------------------------------------
    // TEST 8: Job Audit Logs
    // -----------------------------------------------------------------
    console.log("\nTest 8: Verify job audit logs...");
    const logsRes = await request("GET", "/api/alerts/logs");
    assert.strictEqual(logsRes.status, 200);
    assert.ok(logsRes.data.count > 0, "Expected job logs to be recorded");
    assert.strictEqual(logsRes.data.data[0].jobName, "scheduled_price_check");
    console.log("✓ Test 8 Passed: Background job logs successfully audited.");

    console.log("\n==================================================");
    console.log(" ALL 8 PRICE ALERT & SCHEDULER TESTS PASSED! ");
    console.log("==================================================");
  } catch (err) {
    console.error("\n❌ PRICE ALERT TEST FAILED:", err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runPriceAlertTests();
