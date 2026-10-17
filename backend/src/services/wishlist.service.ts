import { wishlistRepository } from "../repositories/wishlist.repository";
import { Product } from "../types";

export const wishlistService = {
  /**
   * Get full product objects for the authenticated user's wishlist
   */
  async getWishlist(userId: string): Promise<Product[]> {
    if (!userId) {
      throw new Error("Unauthorized: User ID required");
    }
    return wishlistRepository.getUserWishlist(userId);
  },

  /**
   * Get product IDs wishlisted by the authenticated user
   */
  async getWishlistIds(userId: string): Promise<(string | number)[]> {
    if (!userId) {
      throw new Error("Unauthorized: User ID required");
    }
    return wishlistRepository.getWishlistProductIds(userId);
  },

  /**
   * Add a product to the user's wishlist
   */
  async addToWishlist(userId: string, productId: string | number): Promise<void> {
    if (!userId) {
      throw new Error("Unauthorized: User ID required");
    }
    if (!productId) {
      throw new Error("Product ID is required");
    }
    await wishlistRepository.addToWishlist(userId, productId);
  },

  /**
   * Remove a product from the user's wishlist
   */
  async removeFromWishlist(userId: string, productId: string | number): Promise<void> {
    if (!userId) {
      throw new Error("Unauthorized: User ID required");
    }
    if (!productId) {
      throw new Error("Product ID is required");
    }
    await wishlistRepository.removeFromWishlist(userId, productId);
  },

  /**
   * Toggle a product in the user's wishlist
   */
  async toggleWishlist(
    userId: string,
    productId: string | number
  ): Promise<{ inWishlist: boolean }> {
    if (!userId) {
      throw new Error("Unauthorized: User ID required");
    }
    const isPresent = await wishlistRepository.isInWishlist(userId, productId);
    if (isPresent) {
      await wishlistRepository.removeFromWishlist(userId, productId);
      return { inWishlist: false };
    } else {
      await wishlistRepository.addToWishlist(userId, productId);
      return { inWishlist: true };
    }
  },
};
