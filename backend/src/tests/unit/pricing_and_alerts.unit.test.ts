import assert from "node:assert/strict";
import {
  parseCurrency,
  formatCurrency,
  computePriceComparison,
  evaluateAlertCondition,
  generateAlertIdempotencyKey,
} from "../../utils/pricing";
import { StoreOffer } from "../../types";

console.log("\n==================================================");
console.log(" Running Unit Tests: Pricing & Alert Logic");
console.log("==================================================\n");

// 1. Currency Parsing Tests
console.log("1. Testing Currency Parsing...");
assert.equal(parseCurrency("₹70,000"), 70000);
assert.equal(parseCurrency("Rs. 1,29,900"), 129900);
assert.equal(parseCurrency("49999"), 49999);
assert.equal(parseCurrency(84999), 84999);
assert.equal(parseCurrency(""), 0);
assert.equal(parseCurrency(undefined), 0);
assert.equal(parseCurrency(null as any), 0);
assert.equal(parseCurrency("invalid"), 0);
console.log("✓ Currency parsing behaves correctly with various formats.");

// 2. Currency Formatting Tests
console.log("2. Testing Currency Formatting...");
assert.equal(formatCurrency(70000), "₹70,000");
assert.equal(formatCurrency(129900), "₹1,29,900");
assert.equal(formatCurrency(0), "₹0");
assert.equal(formatCurrency(-500), "₹0");
assert.equal(formatCurrency(NaN), "₹0");
console.log("✓ Currency formatting renders proper Indian Rupee locale strings.");

// 3. Price Comparison Logic Tests
console.log("3. Testing Store Price Comparison...");
const mockOffers: StoreOffer[] = [
  { name: "Amazon", price: "₹74,999", numericPrice: 74999, link: "https://amazon.in", inStock: true },
  { name: "Flipkart", price: "₹68,999", numericPrice: 68999, link: "https://flipkart.com", inStock: true },
  { name: "Croma", price: "₹76,500", numericPrice: 76500, link: "https://croma.com", inStock: true },
  { name: "Reliance Digital", price: "₹72,000", numericPrice: 72000, link: "https://reliancedigital.in", inStock: true },
];

const comparison = computePriceComparison(mockOffers);
assert.ok(comparison.cheapest);
assert.equal(comparison.cheapest?.name, "Flipkart");
assert.equal(comparison.cheapest?.numericPrice, 68999);

assert.ok(comparison.highest);
assert.equal(comparison.highest?.name, "Croma");
assert.equal(comparison.highest?.numericPrice, 76500);

assert.equal(comparison.maxSavings, 76500 - 68999); // ₹7,501
assert.equal(comparison.savingsPercentage, Math.round(((76500 - 68999) / 76500) * 100)); // 10%
assert.equal(comparison.sortedStores.length, 4);
assert.equal(comparison.sortedStores[0].name, "Flipkart");
assert.equal(comparison.sortedStores[3].name, "Croma");
console.log("✓ Price comparison correctly identified cheapest store, highest store, and calculated savings.");

// 3b. Edge case: empty offers
const emptyComparison = computePriceComparison([]);
assert.equal(emptyComparison.cheapest, null);
assert.equal(emptyComparison.highest, null);
assert.equal(emptyComparison.maxSavings, 0);
assert.equal(emptyComparison.savingsPercentage, 0);
assert.deepEqual(emptyComparison.sortedStores, []);

// 3c. Edge case: single store offer
const singleOfferComparison = computePriceComparison([mockOffers[0]]);
assert.equal(singleOfferComparison.cheapest?.name, "Amazon");
assert.equal(singleOfferComparison.highest?.name, "Amazon");
assert.equal(singleOfferComparison.maxSavings, 0);
assert.equal(singleOfferComparison.savingsPercentage, 0);
console.log("✓ Handled empty and single-offer boundary conditions gracefully.");

// 4. Alert Trigger Logic Tests
console.log("4. Testing Price Alert Trigger & Idempotency Key Evaluation...");
const alertMock = { id: "alert-uuid-12345", targetPrice: 70000 };

// Case A: Price is lower than target (Trigger condition met)
const triggeredDecision = evaluateAlertCondition(alertMock, 1, 68999);
assert.equal(triggeredDecision.shouldTrigger, true);
assert.equal(triggeredDecision.savings, 1001);
assert.equal(triggeredDecision.savingsPercentage, 1);
assert.equal(
  triggeredDecision.idempotencyKey,
  "alert_alert-uuid-12345_p1_price68999"
);

// Case B: Price exactly matches target
const exactDecision = evaluateAlertCondition(alertMock, 1, 70000);
assert.equal(exactDecision.shouldTrigger, true);
assert.equal(exactDecision.savings, 0);
assert.equal(exactDecision.savingsPercentage, 0);

// Case C: Price is above target (No trigger)
const aboveDecision = evaluateAlertCondition(alertMock, 1, 74999);
assert.equal(aboveDecision.shouldTrigger, false);
assert.equal(aboveDecision.savings, 0);

// Case D: Zero / invalid current price
const zeroDecision = evaluateAlertCondition(alertMock, 1, 0);
assert.equal(zeroDecision.shouldTrigger, false);

// 5. Idempotency Key Determinism
const key1 = generateAlertIdempotencyKey("alt-01", 10, 64500.8);
const key2 = generateAlertIdempotencyKey("alt-01", 10, 64500.2);
assert.equal(key1, "alert_alt-01_p10_price64500");
assert.equal(key1, key2, "Idempotency key must floor fractional prices to prevent false duplicate keys");
console.log("✓ Alert conditions and deterministic idempotency generation verified.");

console.log("\n==================================================");
console.log(" ALL PRICING & ALERT UNIT TESTS PASSED! ");
console.log("==================================================\n");
