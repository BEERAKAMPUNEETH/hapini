import { query, isDbActive } from "../config/db";
import { productService } from "../services/product.service";
import { Product } from "../types";

// In-memory fallback: Map<userId, Set<productId>>
const inMemoryWishlists: Map<string, Set<string>> = new Map();

export const wishlistRepository = {
  /**
   * Retrieve all products wishlisted by a specific user.
   * Parameterized strictly by the authenticated userId.
   */
  async getUserWishlist(userId: string): Promise<Product[]> {
    if (isDbActive()) {
      try {
        const sql = `
          SELECT 
            p.id,
            p.legacy_id AS "legacyId",
            p.name,
            p.slug,
            p.category,
            p.brand,
            p.image_url AS image,
            p.rating,
            p.reviews_count AS "reviewsCount",
            p.delivery_time AS delivery,
            p.in_stock AS "inStock",
            p.review_summary AS "reviewSummary",
            p.specs,
            p.pros,
            p.cons,
            COALESCE(
              (SELECT json_agg(json_build_object(
                'name', r.name,
                'price', o.price_formatted,
                'numericPrice', o.price,
                'link', o.affiliate_url,
                'inStock', o.in_stock
              ) ORDER BY o.price ASC)
              FROM offers o
              JOIN retailers r ON o.retailer_id = r.id
              WHERE o.product_id = p.id
              ), '[]'::json) AS stores,
            COALESCE(
              (SELECT MIN(price) FROM offers WHERE product_id = p.id),
              0
            ) AS "numericPrice"
          FROM wishlists w
          JOIN products p ON w.product_id = p.id
          WHERE w.user_id = $1
          ORDER BY w.created_at DESC;
        `;
        const result = await query(sql, [userId]);
        if (result.rows.length > 0) {
          return result.rows.map((row: any) => {
            const stores = row.stores || [];
            const lowestOffer = stores[0] || null;
            return {
              id: row.legacyId || row.id,
              uuid: row.id,
              legacyId: row.legacyId,
              name: row.name,
              slug: row.slug,
              category: row.category,
              brand: row.brand,
              image: row.image,
              rating: String(row.rating),
              reviewsCount: row.reviewsCount,
              delivery: row.delivery,
              inStock: row.inStock,
              reviewSummary: row.reviewSummary,
              specs: row.specs,
              pros: row.pros,
              cons: row.cons,
              stores: stores,
              numericPrice: Number(row.numericPrice),
              lowestPrice: lowestOffer ? lowestOffer.price : `₹${row.numericPrice.toLocaleString("en-IN")}`,
              bestDeal: lowestOffer ? lowestOffer.name : "Direct",
              amazon: stores.find((s: any) => s.name === "Amazon")?.price || "N/A",
              flipkart: stores.find((s: any) => s.name === "Flipkart")?.price || "N/A",
              croma: stores.find((s: any) => s.name === "Croma")?.price || "N/A",
              amazonLink: stores.find((s: any) => s.name === "Amazon")?.link || "https://amazon.in",
              flipkartLink: stores.find((s: any) => s.name === "Flipkart")?.link || "https://flipkart.com",
              cromaLink: stores.find((s: any) => s.name === "Croma")?.link || "https://croma.com",
              priceHistory: [],
            };
          });
        }
        return [];
      } catch (err: any) {
        console.warn("Wishlist DB lookup failed, falling back to memory:", err.message);
      }
    }

    // In-memory fallback
    const userProductIds = inMemoryWishlists.get(userId) || new Set();
    const products: Product[] = [];

    for (const prodId of userProductIds) {
      const product = await productService.getProductById(prodId);
      if (product) {
        products.push(product);
      }
    }

    return products;
  },

  /**
   * Get an array of product IDs currently in user's wishlist
   */
  async getWishlistProductIds(userId: string): Promise<(string | number)[]> {
    if (isDbActive()) {
      try {
        const sql = `
          SELECT p.legacy_id, p.id AS uuid
          FROM wishlists w
          JOIN products p ON w.product_id = p.id
          WHERE w.user_id = $1;
        `;
        const result = await query(sql, [userId]);
        return result.rows.map((r: any) => r.legacy_id || r.uuid);
      } catch (err: any) {
        console.warn("Wishlist IDs DB lookup failed, falling back to memory:", err.message);
      }
    }

    const userProductIds = inMemoryWishlists.get(userId) || new Set();
    return Array.from(userProductIds).map((id) => (isNaN(Number(id)) ? id : Number(id)));
  },

  /**
   * Add a product to the user's wishlist
   */
  async addToWishlist(userId: string, productId: string | number): Promise<boolean> {
    // 1. Resolve product UUID
    const targetProduct = await productService.getProductById(productId);
    if (!targetProduct) {
      throw new Error("Product not found");
    }

    const productUuid = targetProduct.uuid || String(targetProduct.id);

    if (isDbActive()) {
      try {
        const sql = `
          INSERT INTO wishlists (user_id, product_id, created_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (user_id, product_id) DO NOTHING;
        `;
        await query(sql, [userId, productUuid]);
      } catch (err: any) {
        console.warn("Wishlist DB insert failed, writing to memory:", err.message);
      }
    }

    // Keep in-memory cache updated
    if (!inMemoryWishlists.has(userId)) {
      inMemoryWishlists.set(userId, new Set());
    }
    inMemoryWishlists.get(userId)!.add(String(targetProduct.id));
    if (targetProduct.uuid) {
      inMemoryWishlists.get(userId)!.add(targetProduct.uuid);
    }

    return true;
  },

  /**
   * Remove a product from the user's wishlist
   */
  async removeFromWishlist(userId: string, productId: string | number): Promise<boolean> {
    const targetProduct = await productService.getProductById(productId);
    const productUuid = targetProduct?.uuid || String(productId);

    if (isDbActive()) {
      try {
        const sql = `
          DELETE FROM wishlists
          WHERE user_id = $1 AND (product_id = $2 OR product_id IN (
            SELECT id FROM products WHERE legacy_id = $3
          ));
        `;
        const numId = isNaN(Number(productId)) ? null : Number(productId);
        await query(sql, [userId, productUuid, numId]);
      } catch (err: any) {
        console.warn("Wishlist DB delete failed, updating memory:", err.message);
      }
    }

    const userSet = inMemoryWishlists.get(userId);
    if (userSet) {
      userSet.delete(String(productId));
      if (targetProduct?.id) userSet.delete(String(targetProduct.id));
      if (targetProduct?.uuid) userSet.delete(targetProduct.uuid);
    }

    return true;
  },

  /**
   * Check if a single product is in the user's wishlist
   */
  async isInWishlist(userId: string, productId: string | number): Promise<boolean> {
    const ids = await this.getWishlistProductIds(userId);
    return ids.some((id) => String(id) === String(productId));
  },

  /**
   * Reset in-memory wishlists for testing
   */
  _clearMemory(): void {
    inMemoryWishlists.clear();
  },
};
