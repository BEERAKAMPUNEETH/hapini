import { Request, Response, NextFunction } from "express";
import { wishlistService } from "../services/wishlist.service";

export const wishlistController = {
  /**
   * Get the current authenticated user's wishlist
   * Secure: The userId is extracted solely from req.user (JWT payload)
   */
  async getWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized: User session required",
        });
        return;
      }

      const products = await wishlistService.getWishlist(userId);
      res.status(200).json({
        success: true,
        count: products.length,
        data: products,
      });
    } catch (err: any) {
      next(err);
    }
  },

  /**
   * Get the current authenticated user's wishlisted product IDs
   */
  async getWishlistIds(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized: User session required",
        });
        return;
      }

      const ids = await wishlistService.getWishlistIds(userId);
      res.status(200).json({
        success: true,
        data: ids,
      });
    } catch (err: any) {
      next(err);
    }
  },

  /**
   * Add a product to the user's wishlist
   */
  async addToWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized: User session required",
        });
        return;
      }

      const { productId } = req.body;
      if (!productId) {
        res.status(400).json({
          success: false,
          message: "Validation Error: 'productId' is required in request body",
        });
        return;
      }

      await wishlistService.addToWishlist(userId, productId);

      res.status(201).json({
        success: true,
        message: "Product added to wishlist",
      });
    } catch (err: any) {
      next(err);
    }
  },

  /**
   * Remove a product from the user's wishlist
   */
  async removeFromWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized: User session required",
        });
        return;
      }

      const rawId = req.params.productId;
      const productId = Array.isArray(rawId) ? rawId[0] : rawId;

      if (!productId) {
        res.status(400).json({
          success: false,
          message: "Validation Error: 'productId' is required",
        });
        return;
      }

      await wishlistService.removeFromWishlist(userId, productId);

      res.status(200).json({
        success: true,
        message: "Product removed from wishlist",
      });
    } catch (err: any) {
      next(err);
    }
  },

  /**
   * Toggle a product in the user's wishlist
   */
  async toggleWishlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Unauthorized: User session required",
        });
        return;
      }

      const { productId } = req.body;
      if (!productId) {
        res.status(400).json({
          success: false,
          message: "Validation Error: 'productId' is required in request body",
        });
        return;
      }

      const result = await wishlistService.toggleWishlist(userId, productId);

      res.status(200).json({
        success: true,
        inWishlist: result.inWishlist,
        message: result.inWishlist
          ? "Product added to wishlist"
          : "Product removed from wishlist",
      });
    } catch (err: any) {
      next(err);
    }
  },
};
