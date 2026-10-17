import { Router } from "express";
import { productController } from "../controllers/product.controller";
import { cacheLimiter, searchLimiter } from "../middleware/rateLimiter";

const router = Router();

// Invalidation & search endpoints
router.post("/cache/invalidate", cacheLimiter, productController.invalidateCache);
router.get("/search", searchLimiter, productController.searchProducts);

// Catalog endpoints
router.get("/", productController.getProducts);
router.get("/:id", productController.getProductById);

export default router;
