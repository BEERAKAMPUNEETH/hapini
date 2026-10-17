export interface PriceAlertNotificationPayload {
  alertId: string;
  userEmail: string;
  userName?: string;
  productName: string;
  productId: string | number;
  targetPrice: number;
  currentPrice: number;
  retailerName: string;
  productUrl?: string;
  savings: number;
  savingsPercentage: number;
  triggeredAt: string;
  idempotencyKey: string;
}

export interface INotificationProvider {
  sendPriceAlert(
    payload: PriceAlertNotificationPayload
  ): Promise<{ success: boolean; notificationId: string }>;
}

/**
 * Local Development Notification Provider.
 * Safely logs simulated price drop alerts without sending actual external emails or using paid APIs.
 * Preserves a dispatched list in memory for automated test assertions.
 */
export class ConsoleNotificationProvider implements INotificationProvider {
  private dispatchedNotifications: PriceAlertNotificationPayload[] = [];

  async sendPriceAlert(
    payload: PriceAlertNotificationPayload
  ): Promise<{ success: boolean; notificationId: string }> {
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    this.dispatchedNotifications.push(payload);

    console.log("\n=======================================================");
    console.log("       HAPINI PRICE DROP ALERT NOTIFICATION           ");
    console.log("=======================================================");
    console.log(` To:        ${payload.userName ? `${payload.userName} <${payload.userEmail}>` : payload.userEmail}`);
    console.log(` Product:   ${payload.productName} (ID: ${payload.productId})`);
    console.log(` Retailer:  ${payload.retailerName}`);
    console.log(` Target:    ₹${payload.targetPrice.toLocaleString("en-IN")}`);
    console.log(` Live Now:  ₹${payload.currentPrice.toLocaleString("en-IN")} (Dropped by ₹${payload.savings.toLocaleString("en-IN")} / ${payload.savingsPercentage}%)`);
    console.log(` Triggered: ${payload.triggeredAt}`);
    console.log(` Idempotency Key: ${payload.idempotencyKey}`);
    console.log(" [Local Dev Mode: No real email was sent]");
    console.log("=======================================================\n");

    return { success: true, notificationId };
  }

  getDispatchedNotifications(): PriceAlertNotificationPayload[] {
    return [...this.dispatchedNotifications];
  }

  clearDispatchedNotifications(): void {
    this.dispatchedNotifications = [];
  }
}

// Default singleton instance
export const defaultNotificationProvider = new ConsoleNotificationProvider();
