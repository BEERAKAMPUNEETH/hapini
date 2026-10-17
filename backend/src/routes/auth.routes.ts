import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticateToken } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimiter";

const router = Router();

// Public authentication routes (rate-limited)
router.post("/register", authLimiter, authController.register);
router.post("/login", authLimiter, authController.login);
router.post("/logout", authController.logout);

// Protected session route
router.get("/me", authenticateToken, authController.me);

export default router;
