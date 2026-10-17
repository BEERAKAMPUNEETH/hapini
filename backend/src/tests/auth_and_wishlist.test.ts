import assert from "assert";
import http from "http";
import app from "../app";

const PORT = 5099; // Dedicated test port
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

async function runTests() {
  console.log("==================================================");
  console.log(" Starting Hapini Auth & Wishlist Integration Tests");
  console.log("==================================================\n");

  await new Promise<void>((resolve) => {
    server = app.listen(PORT, () => {
      console.log(` Test server listening on http://127.0.0.1:${PORT}`);
      resolve();
    });
  });

  try {
    const timestamp = Date.now();
    const user1Email = `alice_${timestamp}@example.com`;
    const user1Password = "SecurePass123!";
    const user1Name = "Alice Wonderland";

    const user2Email = `bob_${timestamp}@example.com`;
    const user2Password = "BobPassword987!";
    const user2Name = "Bob Builder";

    // -----------------------------------------------------------------
    // TEST 1: User 1 Registration
    // -----------------------------------------------------------------
    console.log("Test 1: User Registration with valid credentials...");
    const regRes = await request("POST", "/api/auth/register", {
      email: user1Email,
      password: user1Password,
      name: user1Name,
    });
    assert.strictEqual(regRes.status, 201, `Expected 201 Created, got ${regRes.status}`);
    assert.strictEqual(regRes.data.success, true);
    assert.ok(regRes.data.data.token, "Expected token in register response");
    assert.strictEqual(regRes.data.data.user.email, user1Email);
    const user1Token = regRes.data.data.token;
    console.log("✓ Test 1 Passed: User 1 registered and received valid JWT token.");

    // -----------------------------------------------------------------
    // TEST 2: Duplicate Registration Prevention
    // -----------------------------------------------------------------
    console.log("\nTest 2: Duplicate User Registration rejection...");
    const dupRes = await request("POST", "/api/auth/register", {
      email: user1Email,
      password: "AnotherPassword123",
      name: "Duplicate Alice",
    });
    assert.strictEqual(dupRes.status, 409, `Expected 409 Conflict, got ${dupRes.status}`);
    assert.strictEqual(dupRes.data.success, false);
    assert.ok(dupRes.data.message.includes("already exists"));
    console.log("✓ Test 2 Passed: Duplicate registration correctly rejected with 409 Conflict.");

    // -----------------------------------------------------------------
    // TEST 3: Login with Invalid Password
    // -----------------------------------------------------------------
    console.log("\nTest 3: Login with invalid password...");
    const badPassRes = await request("POST", "/api/auth/login", {
      email: user1Email,
      password: "WrongPassword999",
    });
    assert.strictEqual(badPassRes.status, 401, `Expected 401 Unauthorized, got ${badPassRes.status}`);
    assert.strictEqual(badPassRes.data.success, false);
    console.log("✓ Test 3 Passed: Invalid password rejected with 401 Unauthorized.");

    // -----------------------------------------------------------------
    // TEST 4: Login with Non-Existent Email
    // -----------------------------------------------------------------
    console.log("\nTest 4: Login with non-existent email...");
    const noUserRes = await request("POST", "/api/auth/login", {
      email: "nobody_exists@example.com",
      password: "RandomPassword123",
    });
    assert.strictEqual(noUserRes.status, 401, `Expected 401 Unauthorized, got ${noUserRes.status}`);
    assert.strictEqual(noUserRes.data.success, false);
    console.log("✓ Test 4 Passed: Non-existent email rejected with 401 Unauthorized.");

    // -----------------------------------------------------------------
    // TEST 5: Successful Login
    // -----------------------------------------------------------------
    console.log("\nTest 5: Successful user login...");
    const loginRes = await request("POST", "/api/auth/login", {
      email: user1Email,
      password: user1Password,
    });
    assert.strictEqual(loginRes.status, 200, `Expected 200 OK, got ${loginRes.status}`);
    assert.strictEqual(loginRes.data.success, true);
    assert.ok(loginRes.data.data.token, "Expected valid token upon login");
    console.log("✓ Test 5 Passed: Login successful with JWT returned.");

    // -----------------------------------------------------------------
    // TEST 6: Unauthenticated Access to Private Endpoints
    // -----------------------------------------------------------------
    console.log("\nTest 6: Unauthenticated access to /api/auth/me and /api/wishlist...");
    const unauthMe = await request("GET", "/api/auth/me");
    assert.strictEqual(unauthMe.status, 401, `Expected 401, got ${unauthMe.status}`);

    const unauthWishlist = await request("GET", "/api/wishlist");
    assert.strictEqual(unauthWishlist.status, 401, `Expected 401, got ${unauthWishlist.status}`);

    const unauthAdd = await request("POST", "/api/wishlist", { productId: 1 });
    assert.strictEqual(unauthAdd.status, 401, `Expected 401, got ${unauthAdd.status}`);
    console.log("✓ Test 6 Passed: Private endpoints safely blocked without token (401 Unauthorized).");

    // -----------------------------------------------------------------
    // TEST 7: Authenticated Profile Fetch
    // -----------------------------------------------------------------
    console.log("\nTest 7: Authenticated profile retrieval (/api/auth/me)...");
    const meRes = await request("GET", "/api/auth/me", undefined, user1Token);
    assert.strictEqual(meRes.status, 200, `Expected 200, got ${meRes.status}`);
    assert.strictEqual(meRes.data.data.user.email, user1Email);
    assert.strictEqual(meRes.data.data.user.name, user1Name);
    console.log("✓ Test 7 Passed: /api/auth/me accurately returned authenticated user profile.");

    // -----------------------------------------------------------------
    // TEST 8: User 1 Wishlist Operations
    // -----------------------------------------------------------------
    console.log("\nTest 8: User 1 adds product to wishlist and retrieves it...");
    // Add product 1
    const addRes = await request("POST", "/api/wishlist", { productId: 1 }, user1Token);
    assert.strictEqual(addRes.status, 201, `Expected 201 Created, got ${addRes.status}`);

    // Retrieve User 1 wishlist
    const u1Wishlist = await request("GET", "/api/wishlist", undefined, user1Token);
    assert.strictEqual(u1Wishlist.status, 200);
    assert.strictEqual(u1Wishlist.data.count, 1);
    assert.strictEqual(u1Wishlist.data.data[0].id, 1);
    console.log("✓ Test 8 Passed: User 1 added product 1 (iPhone 17 Pro) to their wishlist.");

    // -----------------------------------------------------------------
    // TEST 9: Cross-User Authorization & Strict Isolation
    // -----------------------------------------------------------------
    console.log("\nTest 9: Cross-user authorization and strict wishlist isolation...");
    // Register User 2
    const u2Reg = await request("POST", "/api/auth/register", {
      email: user2Email,
      password: user2Password,
      name: user2Name,
    });
    const user2Token = u2Reg.data.data.token;

    // Check User 2's wishlist: Must be empty (User 2 CANNOT see User 1's wishlist)
    const u2WishlistInitial = await request("GET", "/api/wishlist", undefined, user2Token);
    assert.strictEqual(u2WishlistInitial.status, 200);
    assert.strictEqual(u2WishlistInitial.data.count, 0, "User 2's wishlist must be isolated and empty!");

    // User 2 adds product 2
    await request("POST", "/api/wishlist", { productId: 2 }, user2Token);

    // Verify User 2 has product 2
    const u2WishlistUpdated = await request("GET", "/api/wishlist", undefined, user2Token);
    assert.strictEqual(u2WishlistUpdated.data.count, 1);
    assert.strictEqual(u2WishlistUpdated.data.data[0].id, 2);

    // Verify User 1 STILL only has product 1
    const u1WishlistCheck = await request("GET", "/api/wishlist", undefined, user1Token);
    assert.strictEqual(u1WishlistCheck.data.count, 1);
    assert.strictEqual(u1WishlistCheck.data.data[0].id, 1);

    // User 2 attempts to remove product 1 (which belongs to User 1)
    await request("DELETE", "/api/wishlist/1", undefined, user2Token);

    // User 1's wishlist must REMAIN completely untouched
    const u1AfterU2Delete = await request("GET", "/api/wishlist", undefined, user1Token);
    assert.strictEqual(u1AfterU2Delete.data.count, 1);
    assert.strictEqual(u1AfterU2Delete.data.data[0].id, 1, "User 1's wishlist was not affected by User 2!");

    // User 1 removes their own product 1
    const removeRes = await request("DELETE", "/api/wishlist/1", undefined, user1Token);
    assert.strictEqual(removeRes.status, 200);

    const u1EmptyWishlist = await request("GET", "/api/wishlist", undefined, user1Token);
    assert.strictEqual(u1EmptyWishlist.data.count, 0, "User 1 wishlist is now empty");

    // User 2 STILL has product 2
    const u2StillHasProduct2 = await request("GET", "/api/wishlist", undefined, user2Token);
    assert.strictEqual(u2StillHasProduct2.data.count, 1);
    assert.strictEqual(u2StillHasProduct2.data.data[0].id, 2);
    console.log("✓ Test 9 Passed: Cross-user isolation verified! Users cannot read or delete each other's wishlists.");

    // -----------------------------------------------------------------
    // TEST 10: Logout Confirmation
    // -----------------------------------------------------------------
    console.log("\nTest 10: Logout handling...");
    const logoutRes = await request("POST", "/api/auth/logout", undefined, user1Token);
    assert.strictEqual(logoutRes.status, 200);
    assert.strictEqual(logoutRes.data.success, true);
    console.log("✓ Test 10 Passed: Logout endpoint acknowledged.");

    console.log("\n==================================================");
    console.log(" ALL 10 TESTS COMPLETED & PASSED SUCCESSFULLY! ");
    console.log("==================================================");
  } catch (err) {
    console.error("\n❌ TEST FAILED:", err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runTests();
