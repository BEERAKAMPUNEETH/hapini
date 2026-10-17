import { Request, Response, NextFunction } from "express";
import { productService } from "../services/product.service";
import { cacheService } from "../services/cache.service";

export const productController = {
  /**
   * List products with filters, sorting, and pagination.
   * Sets cache-aside headers (X-Cache: HIT | MISS).
   */
  async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category, search, sortBy, inStockOnly, minPrice, maxPrice, limit, offset } = req.query;

      const { products, cacheStatus } = await productService.getAllProducts({
        category: category as string,
        search: search as string,
        sortBy: sortBy as any,
        inStockOnly: inStockOnly === "true",
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });

      res.setHeader("X-Cache", cacheStatus);
      res.setHeader("X-Cache-Lookup", cacheService.isAvailable() ? "REDIS" : "MEMORY_FALLBACK");

      res.status(200).json({
        success: true,
        count: products.length,
        _cached: cacheStatus === "HIT",
        data: products,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Retrieve product detail by UUID, legacy ID, or slug
   */
  async getProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawId = req.params.id;
      const idOrSlug = Array.isArray(rawId) ? rawId[0] : rawId;

      if (!idOrSlug) {
        res.status(400).json({ success: false, message: "Invalid product identifier" });
        return;
      }

      const { product, cacheStatus } = await productService.getProductByIdWithMeta(idOrSlug);
      if (!product) {
        res.status(404).json({ success: false, message: "Product not found" });
        return;
      }

      res.setHeader("X-Cache", cacheStatus);
      res.setHeader("X-Cache-Lookup", cacheService.isAvailable() ? "REDIS" : "MEMORY_FALLBACK");

      res.status(200).json({
        success: true,
        _cached: cacheStatus === "HIT",
        data: product,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Search products autocomplete
   */
  async searchProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = (req.query.q as string) || "";
      const limit = req.query.limit ? Number(req.query.limit) : 10;

      const { products, cacheStatus } = await productService.searchProducts(query, limit);

      res.setHeader("X-Cache", cacheStatus);
      res.setHeader("X-Cache-Lookup", cacheService.isAvailable() ? "REDIS" : "MEMORY_FALLBACK");

      res.status(200).json({
        success: true,
        count: products.length,
        _cached: cacheStatus === "HIT",
        data: products,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Invalidate product caches upon updates
   */
  async invalidateCache(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId } = req.body || {};
      const { deletedKeys } = await productService.invalidateProductCache(productId);

      res.status(200).json({
        success: true,
        message: productId
          ? `Cache invalidated for product ${productId} and associated listings`
          : "All product caches successfully invalidated",
        deletedKeys,
      });
    } catch (error) {
      next(error);
    }
  },
};
