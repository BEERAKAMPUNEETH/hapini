import crypto from "crypto";
import { query, isDbActive } from "../config/db";
import { PriceAlert, AlertJobLog } from "../types";
import { productService } from "../services/product.service";

// In-memory fallback store
const inMemoryAlerts: Map<string, PriceAlert> = new Map();
const inMemoryNotifications: Map<string, any> = new Map();
const inMemoryJobLogs: AlertJobLog[] = [];

export interface CreateAlertData {
  userId: string;
  productId: string | number;
  targetPrice: number;
  email: string;
  retailerName?: string;
}

export interface UpdateAlertData {
  targetPrice?: number;
  isActive?: boolean;
  retailerName?: string;
}

export const alertRepository = {
  /**
   * Create a new price alert
   */
  async createAlert(data: CreateAlertData): Promise<PriceAlert> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const product = await productService.getProductById(data.productId);
    const productUuid = product?.uuid || String(data.productId);
    const productId = product?.legacyId || data.productId;

    const alert: PriceAlert = {
      id,
      userId: data.userId,
      productId,
      productUuid,
      targetPrice: Number(data.targetPrice),
      email: data.email.trim().toLowerCase(),
      retailerName: data.retailerName?.trim() || undefined,
      isActive: true,
      triggeredAt: null,
      triggeredPrice: null,
      lastNotifiedAt: null,
      createdAt: now,
      updatedAt: now,
      product: product || undefined,
    };

    if (isDbActive()) {
      try {
        const sql = `
          INSERT INTO price_alerts (
            id, user_id, product_id, target_price, email, retailer_name, is_active, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW(), NOW())
          RETURNING id, user_id, product_id, target_price, email, retailer_name, is_active, triggered_at, triggered_price, last_notified_at, created_at, updated_at;
        `;
        const res = await query(sql, [
          alert.id,
          alert.userId,
          alert.productUuid,
          alert.targetPrice,
          alert.email,
          alert.retailerName || null,
        ]);
        if (res.rows.length > 0) {
          const row = res.rows[0];
          alert.id = row.id;
        }
      } catch (err: any) {
        console.warn("Alert DB insert failed, storing in memory:", err.message);
      }
    }

    inMemoryAlerts.set(alert.id, alert);
    return alert;
  },

  /**
   * Retrieve all alerts owned by a specific user (strictly user-isolated)
   */
  async getAlertsByUserId(userId: string): Promise<PriceAlert[]> {
    if (isDbActive()) {
      try {
        const sql = `
          SELECT 
            pa.id,
            pa.user_id as "userId",
            p.legacy_id as "productId",
            p.id as "productUuid",
            pa.target_price as "targetPrice",
            pa.email,
            pa.retailer_name as "retailerName",
            pa.is_active as "isActive",
            pa.triggered_at as "triggeredAt",
            pa.triggered_price as "triggeredPrice",
            pa.last_notified_at as "lastNotifiedAt",
            pa.created_at as "createdAt",
            pa.updated_at as "updatedAt"
          FROM price_alerts pa
          JOIN products p ON pa.product_id = p.id
          WHERE pa.user_id = $1
          ORDER BY pa.created_at DESC;
        `;
        const res = await query(sql, [userId]);
        const list: PriceAlert[] = [];
        for (const row of res.rows) {
          const prod = await productService.getProductById(row.productId || row.productUuid);
          list.push({
            ...row,
            targetPrice: Number(row.targetPrice),
            triggeredPrice: row.triggeredPrice ? Number(row.triggeredPrice) : null,
            product: prod || undefined,
          });
        }
        return list;
      } catch (err: any) {
        console.warn("User alerts DB lookup failed, using memory:", err.message);
      }
    }

    // In-memory fallback
    const list: PriceAlert[] = [];
    for (const alert of inMemoryAlerts.values()) {
      if (alert.userId === userId) {
        const prod = await productService.getProductById(alert.productId);
        list.push({ ...alert, product: prod || alert.product });
      }
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /**
   * Retrieve a single alert ensuring user ownership
   */
  async getAlertById(alertId: string, userId: string): Promise<PriceAlert | null> {
    if (isDbActive()) {
      try {
        const sql = `
          SELECT 
            pa.id,
            pa.user_id as "userId",
            p.legacy_id as "productId",
            p.id as "productUuid",
            pa.target_price as "targetPrice",
            pa.email,
            pa.retailer_name as "retailerName",
            pa.is_active as "isActive",
            pa.triggered_at as "triggeredAt",
            pa.triggered_price as "triggeredPrice",
            pa.last_notified_at as "lastNotifiedAt",
            pa.created_at as "createdAt",
            pa.updated_at as "updatedAt"
          FROM price_alerts pa
          JOIN products p ON pa.product_id = p.id
          WHERE pa.id = $1 AND pa.user_id = $2
          LIMIT 1;
        `;
        const res = await query(sql, [alertId, userId]);
        if (res.rows.length > 0) {
          const row = res.rows[0];
          const prod = await productService.getProductById(row.productId || row.productUuid);
          return {
            ...row,
            targetPrice: Number(row.targetPrice),
            triggeredPrice: row.triggeredPrice ? Number(row.triggeredPrice) : null,
            product: prod || undefined,
          };
        }
      } catch (err: any) {
        console.warn("Alert DB lookup by id failed, using memory:", err.message);
      }
    }

    const alert = inMemoryAlerts.get(alertId);
    if (alert && alert.userId === userId) {
      const prod = await productService.getProductById(alert.productId);
      return { ...alert, product: prod || alert.product };
    }
    return null;
  },

  /**
   * Update an alert (strictly verifying user ownership)
   */
  async updateAlert(alertId: string, userId: string, data: UpdateAlertData): Promise<PriceAlert | null> {
    const existing = await this.getAlertById(alertId, userId);
    if (!existing) {
      return null;
    }

    const now = new Date().toISOString();
    const updated: PriceAlert = {
      ...existing,
      targetPrice: data.targetPrice !== undefined ? Number(data.targetPrice) : existing.targetPrice,
      isActive: data.isActive !== undefined ? data.isActive : existing.isActive,
      retailerName: data.retailerName !== undefined ? data.retailerName : existing.retailerName,
      updatedAt: now,
    };

    if (isDbActive()) {
      try {
        const sql = `
          UPDATE price_alerts
          SET 
            target_price = $1,
            is_active = $2,
            retailer_name = $3,
            updated_at = NOW()
          WHERE id = $4 AND user_id = $5
          RETURNING *;
        `;
        await query(sql, [
          updated.targetPrice,
          updated.isActive,
          updated.retailerName || null,
          alertId,
          userId,
        ]);
      } catch (err: any) {
        console.warn("Alert DB update failed, using memory:", err.message);
      }
    }

    inMemoryAlerts.set(alertId, updated);
    return updated;
  },

  /**
   * Delete an alert (strictly verifying user ownership)
   */
  async deleteAlert(alertId: string, userId: string): Promise<boolean> {
    const existing = await this.getAlertById(alertId, userId);
    if (!existing) {
      return false;
    }

    if (isDbActive()) {
      try {
        const sql = `
          DELETE FROM price_alerts
          WHERE id = $1 AND user_id = $2;
        `;
        await query(sql, [alertId, userId]);
      } catch (err: any) {
        console.warn("Alert DB delete failed, using memory:", err.message);
      }
    }

    inMemoryAlerts.delete(alertId);
    return true;
  },

  /**
   * Fetch all active alerts across all users for background evaluation
   */
  async getActiveAlerts(): Promise<PriceAlert[]> {
    if (isDbActive()) {
      try {
        const sql = `
          SELECT 
            pa.id,
            pa.user_id as "userId",
            p.legacy_id as "productId",
            p.id as "productUuid",
            pa.target_price as "targetPrice",
            pa.email,
            pa.retailer_name as "retailerName",
            pa.is_active as "isActive",
            pa.triggered_at as "triggeredAt",
            pa.triggered_price as "triggeredPrice",
            pa.last_notified_at as "lastNotifiedAt",
            pa.created_at as "createdAt",
            pa.updated_at as "updatedAt"
          FROM price_alerts pa
          JOIN products p ON pa.product_id = p.id
          WHERE pa.is_active = TRUE;
        `;
        const res = await query(sql);
        const list: PriceAlert[] = [];
        for (const row of res.rows) {
          const prod = await productService.getProductById(row.productId || row.productUuid);
          list.push({
            ...row,
            targetPrice: Number(row.targetPrice),
            triggeredPrice: row.triggeredPrice ? Number(row.triggeredPrice) : null,
            product: prod || undefined,
          });
        }
        return list;
      } catch (err: any) {
        console.warn("Active alerts DB query failed, using memory:", err.message);
      }
    }

    const list: PriceAlert[] = [];
    for (const alert of inMemoryAlerts.values()) {
      if (alert.isActive) {
        const prod = await productService.getProductById(alert.productId);
        list.push({ ...alert, product: prod || alert.product });
      }
    }
    return list;
  },

  /**
   * Mark an alert as triggered with current observation price
   */
  async markAlertTriggered(alertId: string, triggeredPrice: number): Promise<void> {
    const now = new Date().toISOString();

    if (isDbActive()) {
      try {
        const sql = `
          UPDATE price_alerts
          SET 
            is_active = FALSE,
            triggered_at = NOW(),
            triggered_price = $1,
            last_notified_at = NOW(),
            updated_at = NOW()
          WHERE id = $2;
        `;
        await query(sql, [triggeredPrice, alertId]);
      } catch (err: any) {
        console.warn("Mark alert triggered DB update failed:", err.message);
      }
    }

    const item = inMemoryAlerts.get(alertId);
    if (item) {
      item.isActive = false;
      item.triggeredAt = now;
      item.triggeredPrice = triggeredPrice;
      item.lastNotifiedAt = now;
      item.updatedAt = now;
      inMemoryAlerts.set(alertId, item);
    }
  },

  /**
   * Check if a notification with the given idempotency key was already recorded
   */
  async hasNotificationBeenSent(idempotencyKey: string): Promise<boolean> {
    if (isDbActive()) {
      try {
        const sql = `
          SELECT 1 FROM alert_notifications WHERE idempotency_key = $1 LIMIT 1;
        `;
        const res = await query(sql, [idempotencyKey]);
        if (res.rows.length > 0) return true;
      } catch (err: any) {
        console.warn("Check idempotency DB query failed, using memory:", err.message);
      }
    }

    return inMemoryNotifications.has(idempotencyKey);
  },

  /**
   * Idempotently record a dispatched price alert notification
   */
  async recordNotification(
    alertId: string,
    productId: string | number,
    triggeredPrice: number,
    targetPrice: number,
    retailerName: string,
    idempotencyKey: string
  ): Promise<boolean> {
    if (await this.hasNotificationBeenSent(idempotencyKey)) {
      return false; // Already recorded
    }

    const now = new Date().toISOString();

    if (isDbActive()) {
      try {
        const sql = `
          INSERT INTO alert_notifications (
            id, alert_id, product_id, triggered_price, target_price, retailer_name, idempotency_key, sent_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          ON CONFLICT (idempotency_key) DO NOTHING;
        `;
        await query(sql, [
          crypto.randomUUID(),
          alertId,
          productId,
          triggeredPrice,
          targetPrice,
          retailerName,
          idempotencyKey,
        ]);
      } catch (err: any) {
        console.warn("Record notification DB insert failed, using memory:", err.message);
      }
    }

    inMemoryNotifications.set(idempotencyKey, {
      alertId,
      productId,
      triggeredPrice,
      targetPrice,
      retailerName,
      sentAt: now,
    });

    return true;
  },

  /**
   * Record background job execution audit log
   */
  async recordJobLog(
    jobName: string,
    status: "SUCCESS" | "FAILED" | "PARTIAL",
    alertsEvaluated: number,
    alertsTriggered: number,
    details: Record<string, any>,
    durationMs: number
  ): Promise<AlertJobLog> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const log: AlertJobLog = {
      id,
      jobName,
      status,
      alertsEvaluated,
      alertsTriggered,
      details,
      durationMs,
      executedAt: now,
    };

    if (isDbActive()) {
      try {
        const sql = `
          INSERT INTO alert_job_logs (
            id, job_name, status, alerts_evaluated, alerts_triggered, details, duration_ms, executed_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW());
        `;
        await query(sql, [
          log.id,
          log.jobName,
          log.status,
          log.alertsEvaluated,
          log.alertsTriggered,
          JSON.stringify(log.details),
          log.durationMs,
        ]);
      } catch (err: any) {
        console.warn("Job log DB insert failed:", err.message);
      }
    }

    inMemoryJobLogs.unshift(log);
    if (inMemoryJobLogs.length > 50) inMemoryJobLogs.pop();

    return log;
  },

  /**
   * Fetch recent audit job logs
   */
  async getJobLogs(limit: number = 20): Promise<AlertJobLog[]> {
    if (isDbActive()) {
      try {
        const sql = `
          SELECT 
            id,
            job_name as "jobName",
            status,
            alerts_evaluated as "alertsEvaluated",
            alerts_triggered as "alertsTriggered",
            details,
            duration_ms as "durationMs",
            executed_at as "executedAt"
          FROM alert_job_logs
          ORDER BY executed_at DESC
          LIMIT $1;
        `;
        const res = await query(sql, [limit]);
        if (res.rows.length > 0) {
          return res.rows;
        }
      } catch (err: any) {
        console.warn("Job logs DB lookup failed, using memory:", err.message);
      }
    }

    return inMemoryJobLogs.slice(0, limit);
  },

  /**
   * Reset in-memory alert state (for test isolation)
   */
  _clearMemory(): void {
    inMemoryAlerts.clear();
    inMemoryNotifications.clear();
    inMemoryJobLogs.length = 0;
  },
};
