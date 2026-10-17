import { alertRepository } from "../repositories/alert.repository";
import { productService } from "./product.service";
import {
  defaultNotificationProvider,
  INotificationProvider,
} from "../notifications/notification.provider";
import { PriceAlert } from "../types";
import { evaluateAlertCondition } from "../utils/pricing";

export interface EvaluationResult {
  alertsEvaluated: number;
  alertsTriggered: number;
  notificationsDispatched: number;
  durationMs: number;
  details: any[];
}

// In-memory simulation registry for deterministic testing without external network calls
const simulatedPriceRegistry: Map<string, number> = new Map();

let schedulerTimer: NodeJS.Timeout | null = null;
let isJobRunning = false;

export const alertJobService = {
  notificationProvider: defaultNotificationProvider as INotificationProvider,

  /**
   * Set custom notification provider (useful for test assertions or future transports)
   */
  setNotificationProvider(provider: INotificationProvider): void {
    this.notificationProvider = provider;
  },

  /**
   * Register a simulated price override for a product/retailer (no scraping)
   */
  simulatePriceUpdate(
    productId: string | number,
    newPrice: number,
    retailerName?: string
  ): void {
    const key = retailerName
      ? `${productId}:${retailerName.toLowerCase()}`
      : String(productId);
    simulatedPriceRegistry.set(key, Number(newPrice));
  },

  /**
   * Clear all simulated price overrides
   */
  clearSimulatedPrices(): void {
    simulatedPriceRegistry.clear();
  },

  /**
   * Execute evaluation pass over all active price alerts with idempotency guards
   */
  async evaluatePriceAlerts(): Promise<EvaluationResult> {
    if (isJobRunning) {
      console.warn("⚠️ Price alert job is already running, skipping overlapping execution.");
      return {
        alertsEvaluated: 0,
        alertsTriggered: 0,
        notificationsDispatched: 0,
        durationMs: 0,
        details: [],
      };
    }

    isJobRunning = true;
    const startTime = Date.now();
    let evaluatedCount = 0;
    let triggeredCount = 0;
    let dispatchedCount = 0;
    const details: any[] = [];

    try {
      const activeAlerts: PriceAlert[] = await alertRepository.getActiveAlerts();
      evaluatedCount = activeAlerts.length;

      for (const alert of activeAlerts) {
        const product = await productService.getProductById(alert.productId);
        if (!product) {
          details.push({ alertId: alert.id, status: "SKIPPED_PRODUCT_NOT_FOUND" });
          continue;
        }

        // Determine current evaluated price:
        // 1. Check if simulated price override exists
        // 2. Check if specific retailer offer was requested
        // 3. Fall back to lowest market price
        let currentPrice: number = product.numericPrice || 0;
        let matchedRetailer = alert.retailerName || product.bestDeal || "Direct";

        const retailerSimKey = alert.retailerName
          ? `${alert.productId}:${alert.retailerName.toLowerCase()}`
          : null;

        if (retailerSimKey && simulatedPriceRegistry.has(retailerSimKey)) {
          currentPrice = simulatedPriceRegistry.get(retailerSimKey)!;
        } else if (simulatedPriceRegistry.has(String(alert.productId))) {
          currentPrice = simulatedPriceRegistry.get(String(alert.productId))!;
        } else if (alert.retailerName && product.stores && product.stores.length > 0) {
          const storeMatch = product.stores.find(
            (s) => s.name.toLowerCase() === alert.retailerName?.toLowerCase()
          );
          if (storeMatch && storeMatch.numericPrice > 0) {
            currentPrice = storeMatch.numericPrice;
            matchedRetailer = storeMatch.name;
          }
        } else if (product.stores && product.stores.length > 0) {
          const lowestStore = [...product.stores].sort(
            (a, b) => a.numericPrice - b.numericPrice
          )[0];
          if (lowestStore && lowestStore.numericPrice > 0) {
            currentPrice = lowestStore.numericPrice;
            matchedRetailer = lowestStore.name;
          }
        }

        // Evaluate target price trigger condition and metrics
        const decision = evaluateAlertCondition(alert, product.id, currentPrice);

        if (decision.shouldTrigger) {
          triggeredCount++;

          const alreadySent = await alertRepository.hasNotificationBeenSent(decision.idempotencyKey);
          if (alreadySent) {
            details.push({
              alertId: alert.id,
              status: "IDEMPOTENT_DUPLICATE_SKIPPED",
              currentPrice,
              targetPrice: alert.targetPrice,
            });
            continue;
          }

          // Dispatch simulated notification
          const notifPayload = {
            alertId: alert.id,
            userEmail: alert.email,
            productName: product.name,
            productId: product.id,
            targetPrice: alert.targetPrice,
            currentPrice,
            retailerName: matchedRetailer,
            savings: decision.savings,
            savingsPercentage: decision.savingsPercentage,
            triggeredAt: new Date().toISOString(),
            idempotencyKey: decision.idempotencyKey,
          };

          await this.notificationProvider.sendPriceAlert(notifPayload);
          dispatchedCount++;

          // Idempotently persist notification & mark alert triggered
          await alertRepository.recordNotification(
            alert.id,
            product.id,
            currentPrice,
            alert.targetPrice,
            matchedRetailer,
            decision.idempotencyKey
          );

          await alertRepository.markAlertTriggered(alert.id, currentPrice);

          details.push({
            alertId: alert.id,
            status: "TRIGGERED_AND_NOTIFIED",
            currentPrice,
            targetPrice: alert.targetPrice,
            retailer: matchedRetailer,
          });
        } else {
          details.push({
            alertId: alert.id,
            status: "PENDING_TARGET_NOT_MET",
            currentPrice,
            targetPrice: alert.targetPrice,
          });
        }
      }

      const durationMs = Date.now() - startTime;

      // Persist job log
      await alertRepository.recordJobLog(
        "scheduled_price_check",
        "SUCCESS",
        evaluatedCount,
        triggeredCount,
        { detailsCount: details.length, dispatchedCount },
        durationMs
      );

      return {
        alertsEvaluated: evaluatedCount,
        alertsTriggered: triggeredCount,
        notificationsDispatched: dispatchedCount,
        durationMs,
        details,
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      console.error("❌ Price check job failed:", err.message);

      await alertRepository.recordJobLog(
        "scheduled_price_check",
        "FAILED",
        evaluatedCount,
        triggeredCount,
        { error: err.message },
        durationMs
      );

      throw err;
    } finally {
      isJobRunning = false;
    }
  },

  /**
   * Start recurring background evaluation interval
   */
  startScheduler(intervalMs: number = 60000): void {
    if (schedulerTimer) {
      return;
    }

    console.log(` Starting Hapini Price Alert Scheduler (Interval: ${intervalMs}ms)`);
    schedulerTimer = setInterval(() => {
      this.evaluatePriceAlerts().catch((err) => {
        console.error("Scheduled price check tick failed:", err.message);
      });
    }, intervalMs);
  },

  /**
   * Stop background scheduler
   */
  stopScheduler(): void {
    if (schedulerTimer) {
      clearInterval(schedulerTimer);
      schedulerTimer = null;
      console.log("🛑 Hapini Price Alert Scheduler stopped.");
    }
  },
};
