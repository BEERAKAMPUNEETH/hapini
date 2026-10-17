import { Request, Response, NextFunction } from "express";
import { alertRepository } from "../repositories/alert.repository";
import { alertJobService } from "../services/alertJob.service";

export const alertController = {
  /**
   * Create a new price drop alert for the authenticated user
   */
  async createAlert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const email = req.user?.email;

      if (!userId || !email) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }

      const { productId, targetPrice, retailerName } = req.body;

      if (!productId) {
        res.status(400).json({ success: false, message: "productId is required" });
        return;
      }

      const numTarget = Number(targetPrice);
      if (isNaN(numTarget) || numTarget <= 0) {
        res.status(400).json({ success: false, message: "targetPrice must be a valid positive number" });
        return;
      }

      const alert = await alertRepository.createAlert({
        userId,
        productId,
        targetPrice: numTarget,
        email,
        retailerName: retailerName || undefined,
      });

      res.status(201).json({
        success: true,
        message: "Price drop alert created successfully",
        data: alert,
      });
    } catch (err: any) {
      next(err);
    }
  },

  /**
   * Retrieve all alerts owned by the authenticated user
   */
  async getUserAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }

      const alerts = await alertRepository.getAlertsByUserId(userId);

      res.status(200).json({
        success: true,
        count: alerts.length,
        data: alerts,
      });
    } catch (err: any) {
      next(err);
    }
  },

  /**
   * Retrieve a single alert (strictly verifying ownership)
   */
  async getAlertById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }

      const rawId = req.params.id;
      const alertId = Array.isArray(rawId) ? rawId[0] : rawId;

      const alert = await alertRepository.getAlertById(alertId, userId);
      if (!alert) {
        res.status(404).json({ success: false, message: "Alert not found or unauthorized" });
        return;
      }

      res.status(200).json({
        success: true,
        data: alert,
      });
    } catch (err: any) {
      next(err);
    }
  },

  /**
   * Update an alert (strictly verifying ownership)
   */
  async updateAlert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }

      const rawId = req.params.id;
      const alertId = Array.isArray(rawId) ? rawId[0] : rawId;
      const { targetPrice, isActive, retailerName } = req.body;

      const updated = await alertRepository.updateAlert(alertId, userId, {
        targetPrice: targetPrice !== undefined ? Number(targetPrice) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        retailerName: retailerName !== undefined ? retailerName : undefined,
      });

      if (!updated) {
        res.status(404).json({ success: false, message: "Alert not found or unauthorized" });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Price alert updated successfully",
        data: updated,
      });
    } catch (err: any) {
      next(err);
    }
  },

  /**
   * Delete an alert (strictly verifying ownership)
   */
  async deleteAlert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
      }

      const rawId = req.params.id;
      const alertId = Array.isArray(rawId) ? rawId[0] : rawId;

      const deleted = await alertRepository.deleteAlert(alertId, userId);
      if (!deleted) {
        res.status(404).json({ success: false, message: "Alert not found or unauthorized" });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Price alert deleted successfully",
      });
    } catch (err: any) {
      next(err);
    }
  },

  /**
   * Trigger an on-demand price check pass across all active alerts
   */
  async runCheckJob(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await alertJobService.evaluatePriceAlerts();
      res.status(200).json({
        success: true,
        message: "Price evaluation job completed",
        data: result,
      });
    } catch (err: any) {
      next(err);
    }
  },

  /**
   * Simulate a price update on a product and immediately evaluate alerts
   */
  async simulatePriceChange(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId, newPrice, retailerName } = req.body;

      if (!productId || newPrice === undefined) {
        res.status(400).json({
          success: false,
          message: "productId and newPrice are required in request body",
        });
        return;
      }

      alertJobService.simulatePriceUpdate(productId, Number(newPrice), retailerName);
      const evalResult = await alertJobService.evaluatePriceAlerts();

      res.status(200).json({
        success: true,
        message: `Simulated price for product ${productId} set to ₹${newPrice}`,
        data: {
          simulatedProduct: productId,
          simulatedPrice: Number(newPrice),
          retailerName: retailerName || "Lowest Market",
          evaluation: evalResult,
        },
      });
    } catch (err: any) {
      next(err);
    }
  },

  /**
   * Get recent audit logs of price checking runs
   */
  async getJobLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = Number(req.query.limit) || 10;
      const logs = await alertRepository.getJobLogs(limit);
      res.status(200).json({
        success: true,
        count: logs.length,
        data: logs,
      });
    } catch (err: any) {
      next(err);
    }
  },
};
