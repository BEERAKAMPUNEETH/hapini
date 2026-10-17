import { Router } from "express";
import { alertController } from "../controllers/alert.controller";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Job monitoring & simulation endpoints
router.post("/run-check", alertController.runCheckJob);
router.post("/simulate-price", alertController.simulatePriceChange);
router.get("/logs", alertController.getJobLogs);

// Protected user-scoped alert endpoints
router.use(authenticateToken);
router.post("/", alertController.createAlert);
router.get("/", alertController.getUserAlerts);
router.get("/:id", alertController.getAlertById);
router.patch("/:id", alertController.updateAlert);
router.delete("/:id", alertController.deleteAlert);

export default router;
