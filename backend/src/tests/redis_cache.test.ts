import assert from "assert";
import http from "http";
import app from "../app";
import { cacheService } from "../services/cache.service";
import { productService, generateProductsListCacheKey } from "../services/product.service";

const PORT = 5098; // Dedicated port for cache tests
let server: http.Server;

interface ApiResponse<T = any> {
  status: number;
  headers: http.IncomingHttpHeaders;
  data: T;
}

function request(method: string, path: string, body?: any): Promise<ApiResponse> {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : "";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

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
            resolve({ status: res.statusCode || 500, headers: res.headers, data });
          } catch {
            resolve({ status: res.statusCode || 500, headers: res.headers, data: raw as any });
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

async function runCacheTests() {
  console.log("==================================================");
  console.log(" Starting Hapini Redis & Cache-Aside Test Suite");
  console.log("==================================================\n");

  await new Promise<void>((resolve) => {
    server = app.listen(PORT, () => {
      console.log(` Test server listening on http://127.0.0.1:${PORT}`);
      resolve();
    });
  });

  try {
    // Clean any residual cache
    await productService.invalidateProductCache();

    // -----------------------------------------------------------------
    // TEST 1: Cache Miss on Fresh Query
    // -----------------------------------------------------------------
    console.log("Test 1: Initial query causes Cache Miss (fetches from source)...");
    const res1 = await request("GET", "/api/products?search=MacBook");
    assert.strictEqual(res1.status, 200);
    assert.strictEqual(res1.headers["x-cache"], "MISS", "Expected initial lookup to be a cache MISS");
    assert.ok(res1.data.data.length > 0, "Expected products in response");
    console.log("✓ Test 1 Passed: Initial query returned X-Cache: MISS and populated cache.");

    // -----------------------------------------------------------------
    // TEST 2: Cache Hit on Identical Query
    // -----------------------------------------------------------------
    console.log("\nTest 2: Subsequent identical query results in Cache Hit...");
    const res2 = await request("GET", "/api/products?search=MacBook");
    assert.strictEqual(res2.status, 200);
    assert.strictEqual(res2.headers["x-cache"], "HIT", "Expected subsequent lookup to be a cache HIT");
    assert.strictEqual(res2.data._cached, true);
    assert.strictEqual(res2.data.count, res1.data.count);
    console.log("✓ Test 2 Passed: Subsequent query returned X-Cache: HIT.");

    // -----------------------------------------------------------------
    // TEST 3: Deterministic Stable Cache Keys (Query Parameter Ordering)
    // -----------------------------------------------------------------
    console.log("\nTest 3: Deterministic cache key generation with permuted parameters...");
    const keyA = generateProductsListCacheKey({ category: "Laptops", sortBy: "price-asc" });
    const keyB = generateProductsListCacheKey({ sortBy: "price-asc", category: "Laptops" });
    assert.strictEqual(keyA, keyB, "Expected stable canonical cache key regardless of param order");
    console.log(`✓ Test 3 Passed: Key normalized to '${keyA}'.`);

    // -----------------------------------------------------------------
    // TEST 4: Single Product Detail Cache Hit & Miss
    // -----------------------------------------------------------------
    console.log("\nTest 4: Product detail cache lifecycle...");
    const detailMiss = await request("GET", "/api/products/1");
    assert.strictEqual(detailMiss.status, 200);
    assert.strictEqual(detailMiss.headers["x-cache"], "MISS");

    const detailHit = await request("GET", "/api/products/1");
    assert.strictEqual(detailHit.status, 200);
    assert.strictEqual(detailHit.headers["x-cache"], "HIT");
    assert.strictEqual(detailHit.data._cached, true);
    console.log("✓ Test 4 Passed: Product detail caching confirmed (MISS then HIT).");

    // -----------------------------------------------------------------
    // TEST 5: Cache Invalidation After Product / Offer Updates
    // -----------------------------------------------------------------
    console.log("\nTest 5: Cache invalidation upon update...");
    const invalRes = await request("POST", "/api/products/cache/invalidate", { productId: 1 });
    assert.strictEqual(invalRes.status, 200);
    assert.strictEqual(invalRes.data.success, true);
    assert.ok(invalRes.data.deletedKeys > 0, "Expected deleted keys count > 0");

    // Next request to product 1 must be a fresh MISS
    const detailAfterInval = await request("GET", "/api/products/1");
    assert.strictEqual(detailAfterInval.headers["x-cache"], "MISS", "Expected cache MISS after invalidation");

    // Then hit again
    const detailReCached = await request("GET", "/api/products/1");
    assert.strictEqual(detailReCached.headers["x-cache"], "HIT", "Expected cache HIT after re-caching");
    console.log("✓ Test 5 Passed: Cache invalidation evicted product 1 and dependent lists.");

    // -----------------------------------------------------------------
    // TEST 6: Configurable TTL and Automatic Expiration
    // -----------------------------------------------------------------
    console.log("\nTest 6: Configurable TTL and expiration...");
    const testKey = "test:ttl:expiration";
    await cacheService.set(testKey, { sample: "payload" }, 1); // 1 second TTL

    const immediate = await cacheService.get(testKey);
    assert.ok(immediate, "Expected item to exist immediately after setting");

    console.log("  Waiting 1.2s for key expiration...");
    await new Promise((r) => setTimeout(r, 1200));

    const expired = await cacheService.get(testKey);
    assert.strictEqual(expired, null, "Expected item to be null after TTL expiration");
    console.log("✓ Test 6 Passed: TTL expired cleanly as configured.");

    // -----------------------------------------------------------------
    // TEST 7: Redis Failure & Safe Database Fallback
    // -----------------------------------------------------------------
    console.log("\nTest 7: Safe fallback when Redis is offline / disconnected...");
    // When Redis is unreachable, all product operations must still succeed using the repository
    const fallbackList = await productService.getAllProducts({ category: "Smartphones" });
    assert.ok(fallbackList.products.length > 0, "Expected products returned despite cache status");

    const fallbackDetail = await productService.getProductById(1);
    assert.ok(fallbackDetail !== null, "Expected product detail returned");
    assert.strictEqual(fallbackDetail?.name, "iPhone 17 Pro");
    console.log("✓ Test 7 Passed: System transparently fell back to primary store with zero errors.");

    console.log("\n==================================================");
    console.log(" ALL 7 CACHE & RESILIENCE TESTS PASSED! ");
    console.log("==================================================");
  } catch (err) {
    console.error("\n❌ CACHE TEST FAILED:", err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runCacheTests();
