import { Router } from "express";
import { wishlistController } from "../controllers/wishlist.controller";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Enforce authentication for all wishlist endpoints
router.use(authenticateToken);

// User-scoped wishlist operations
router.get("/", wishlistController.getWishlist);
router.get("/ids", wishlistController.getWishlistIds);
router.post("/", wishlistController.addToWishlist);
router.post("/toggle", wishlistController.toggleWishlist);
router.delete("/:productId", wishlistController.removeFromWishlist);

export default router;
