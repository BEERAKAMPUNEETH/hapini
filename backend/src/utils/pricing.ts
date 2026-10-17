import { StoreOffer, PriceAlert } from "../types";

export interface PriceComparisonSummary {
  cheapest: StoreOffer | null;
  highest: StoreOffer | null;
  maxSavings: number;
  savingsPercentage: number;
  sortedStores: StoreOffer[];
}

export interface AlertEvaluationDecision {
  shouldTrigger: boolean;
  savings: number;
  savingsPercentage: number;
  idempotencyKey: string;
}

/**
 * Parses numeric price from formatted strings (e.g., "₹70,000", "Rs 1,29,900", "84999")
 */
export function parseCurrency(priceStr?: string | number): number {
  if (typeof priceStr === "number") return isNaN(priceStr) ? 0 : priceStr;
  if (!priceStr) return 0;

  // Strip prefixes like "Rs.", "Rs", "INR", "₹", "$"
  let str = String(priceStr).trim().replace(/^(?:rs\.?|inr|₹|\$)\s*/i, "");

  // If there's a dot followed by 1 or 2 digits at the end (e.g. 1299.50), keep as decimal
  const matchDecimal = str.match(/([0-9,]+)\.([0-9]{1,2})$/);
  if (matchDecimal) {
    const whole = matchDecimal[1].replace(/[^0-9]/g, "");
    const num = parseFloat(`${whole}.${matchDecimal[2]}`);
    return isNaN(num) ? 0 : num;
  }

  const cleaned = str.replace(/[^0-9]/g, "");
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

/**
 * Formats a number to an Indian Rupee string representation (e.g., 70000 -> "₹70,000")
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount < 0) return "₹0";
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

/**
 * Computes price comparison metrics from an array of retailer offers
 */
export function computePriceComparison(stores: StoreOffer[] = []): PriceComparisonSummary {
  if (!stores || stores.length === 0) {
    return {
      cheapest: null,
      highest: null,
      maxSavings: 0,
      savingsPercentage: 0,
      sortedStores: [],
    };
  }

  // Ensure each offer has normalized numericPrice
  const normalized = stores.map((s) => ({
    ...s,
    numericPrice: s.numericPrice || parseCurrency(s.price),
  })).filter((s) => s.numericPrice > 0);

  if (normalized.length === 0) {
    return {
      cheapest: null,
      highest: null,
      maxSavings: 0,
      savingsPercentage: 0,
      sortedStores: [],
    };
  }

  const sorted = [...normalized].sort((a, b) => a.numericPrice - b.numericPrice);
  const cheapest = sorted[0];
  const highest = sorted[sorted.length - 1];
  const maxSavings = Math.max(0, highest.numericPrice - cheapest.numericPrice);
  const savingsPercentage =
    highest.numericPrice > 0 ? Math.round((maxSavings / highest.numericPrice) * 100) : 0;

  return {
    cheapest,
    highest,
    maxSavings,
    savingsPercentage,
    sortedStores: sorted,
  };
}

/**
 * Generates deterministic idempotency key for alert notification dispatch.
 * Prevents duplicate alerts for the same price drop observation.
 */
export function generateAlertIdempotencyKey(
  alertId: string,
  productId: string | number,
  currentPrice: number
): string {
  return `alert_${alertId}_p${productId}_price${Math.floor(currentPrice)}`;
}

/**
 * Evaluates whether an alert condition is met and computes metrics
 */
export function evaluateAlertCondition(
  alert: Pick<PriceAlert, "id" | "targetPrice">,
  productId: string | number,
  currentPrice: number
): AlertEvaluationDecision {
  const shouldTrigger = currentPrice > 0 && currentPrice <= alert.targetPrice;
  const savings = Math.max(0, alert.targetPrice - currentPrice);
  const savingsPercentage =
    alert.targetPrice > 0 ? Math.round((savings / alert.targetPrice) * 100) : 0;
  const idempotencyKey = generateAlertIdempotencyKey(alert.id, productId, currentPrice);

  return {
    shouldTrigger,
    savings,
    savingsPercentage,
    idempotencyKey,
  };
}
