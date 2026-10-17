import { query, isDbActive } from "../config/db";
import { Product, StoreOffer, PriceHistoryPoint } from "../types";

export interface ProductQueryOptions {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sortBy?: "featured" | "price-asc" | "price-desc" | "rating-desc";
  limit?: number;
  offset?: number;
}

export const productRepository = {
  /**
   * Retrieves products using parameterized SQL query
   */
  async findProducts(options: ProductQueryOptions = {}): Promise<Product[]> {
    if (!isDbActive()) {
      return [];
    }

    try {
      const params: any[] = [];
      let whereClauses: string[] = [];

    if (options.category && options.category !== "All") {
      params.push(options.category);
      whereClauses.push(`p.category = $${params.length}`);
    }

    if (options.search && options.search.trim()) {
      params.push(`%${options.search.trim().toLowerCase()}%`);
      whereClauses.push(`(LOWER(p.name) LIKE $${params.length} OR LOWER(p.category) LIKE $${params.length} OR LOWER(COALESCE(p.brand, '')) LIKE $${params.length})`);
    }

    if (options.inStockOnly) {
      whereClauses.push(`p.in_stock = TRUE`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    let orderSql = "ORDER BY p.rating DESC, p.created_at DESC";
    if (options.sortBy === "price-asc") {
      orderSql = "ORDER BY \"numericPrice\" ASC";
    } else if (options.sortBy === "price-desc") {
      orderSql = "ORDER BY \"numericPrice\" DESC";
    } else if (options.sortBy === "rating-desc") {
      orderSql = "ORDER BY p.rating DESC";
    }

    const safeLimit = Math.max(1, Math.min(100, Number(options.limit) || 50));
    const safeOffset = Math.max(0, Number(options.offset) || 0);
    params.push(safeLimit);
    const limitPlaceholder = `$${params.length}`;
    params.push(safeOffset);
    const offsetPlaceholder = `$${params.length}`;

    const sql = `
      SELECT 
        p.id,
        p.legacy_id as "legacyId",
        p.name,
        p.slug,
        p.category,
        p.brand,
        p.image_url as image,
        p.rating::text as rating,
        p.reviews_count as "reviewsCount",
        p.delivery_time as delivery,
        p.in_stock as "inStock",
        p.review_summary as "reviewSummary",
        p.specs,
        p.pros,
        p.cons,
        COALESCE(MIN(o.price), 0) as "numericPrice",
        COALESCE(MIN(o.price_formatted), '₹0') as "lowestPrice",
        COALESCE(
          (
            SELECT r2.name 
            FROM offers o2 
            JOIN retailers r2 ON o2.retailer_id = r2.id 
            WHERE o2.product_id = p.id 
            ORDER BY o2.price ASC 
            LIMIT 1
          ), 
          'Best Deal'
        ) as "bestDeal",
        MAX(CASE WHEN r.slug = 'amazon' THEN o.price_formatted END) as amazon,
        MAX(CASE WHEN r.slug = 'flipkart' THEN o.price_formatted END) as flipkart,
        MAX(CASE WHEN r.slug = 'croma' THEN o.price_formatted END) as croma,
        MAX(CASE WHEN r.slug = 'amazon' THEN o.affiliate_url END) as "amazonLink",
        MAX(CASE WHEN r.slug = 'flipkart' THEN o.affiliate_url END) as "flipkartLink",
        MAX(CASE WHEN r.slug = 'croma' THEN o.affiliate_url END) as "cromaLink"
      FROM products p
      LEFT JOIN offers o ON p.id = o.product_id
      LEFT JOIN retailers r ON o.retailer_id = r.id
      ${whereSql}
      GROUP BY p.id
      ${orderSql}
      LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder};
    `;

    const res = await query(sql, params);

    return res.rows.map((row: any) => ({
      ...row,
      id: row.legacyId || row.id, // preserve compatibility with numeric frontend id
      uuid: row.id,
      numericPrice: Number(row.numericPrice),
      priceHistory: [],
    }));
    } catch (err: any) {
      console.warn("findProducts DB query failed:", err.message);
      return [];
    }
  },

  /**
   * Retrieves single product by UUID, integer legacy_id, or slug
   */
  async findProductById(idOrSlug: string | number): Promise<Product | null> {
    if (!isDbActive()) {
      return null;
    }

    try {
      const isUuid =
      typeof idOrSlug === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    const isNumber = !isNaN(Number(idOrSlug)) && !isUuid;

    let whereClause = "p.slug = $1";
    if (isUuid) {
      whereClause = "p.id = $1";
    } else if (isNumber) {
      whereClause = "p.legacy_id = $1";
    }

    const sql = `
      SELECT 
        p.id,
        p.legacy_id as "legacyId",
        p.name,
        p.slug,
        p.category,
        p.brand,
        p.image_url as image,
        p.rating::text as rating,
        p.reviews_count as "reviewsCount",
        p.delivery_time as delivery,
        p.in_stock as "inStock",
        p.review_summary as "reviewSummary",
        p.specs,
        p.pros,
        p.cons,
        COALESCE(MIN(o.price), 0) as "numericPrice",
        COALESCE(MIN(o.price_formatted), '₹0') as "lowestPrice",
        COALESCE(
          (
            SELECT r2.name 
            FROM offers o2 
            JOIN retailers r2 ON o2.retailer_id = r2.id 
            WHERE o2.product_id = p.id 
            ORDER BY o2.price ASC 
            LIMIT 1
          ), 
          'Best Deal'
        ) as "bestDeal",
        MAX(CASE WHEN r.slug = 'amazon' THEN o.price_formatted END) as amazon,
        MAX(CASE WHEN r.slug = 'flipkart' THEN o.price_formatted END) as flipkart,
        MAX(CASE WHEN r.slug = 'croma' THEN o.price_formatted END) as croma,
        MAX(CASE WHEN r.slug = 'amazon' THEN o.affiliate_url END) as "amazonLink",
        MAX(CASE WHEN r.slug = 'flipkart' THEN o.affiliate_url END) as "flipkartLink",
        MAX(CASE WHEN r.slug = 'croma' THEN o.affiliate_url END) as "cromaLink"
      FROM products p
      LEFT JOIN offers o ON p.id = o.product_id
      LEFT JOIN retailers r ON o.retailer_id = r.id
      WHERE ${whereClause}
      GROUP BY p.id
      LIMIT 1;
    `;

    const res = await query(sql, [idOrSlug]);
    if (res.rows.length === 0) return null;

    const row = res.rows[0];

    // Fetch related offers from retailers
    const offersRes = await query(
      `
      SELECT 
        r.name,
        o.price_formatted as price,
        o.affiliate_url as link,
        o.price as "numericPrice",
        o.in_stock as "inStock"
      FROM offers o
      JOIN retailers r ON o.retailer_id = r.id
      WHERE o.product_id = $1
      ORDER BY o.price ASC;
    `,
      [row.id]
    );

    // Fetch price history points
    const historyRes = await query(
      `
      SELECT month, price::numeric as price
      FROM price_history
      WHERE product_id = $1
      ORDER BY recorded_at ASC;
    `,
      [row.id]
    );

    const product: Product = {
      ...row,
      id: row.legacyId || row.id,
      uuid: row.id,
      numericPrice: Number(row.numericPrice),
      stores: offersRes.rows.map((o: any) => ({
        ...o,
        numericPrice: Number(o.numericPrice),
      })),
      priceHistory: historyRes.rows.map((h: any) => ({
        month: h.month,
        price: Number(h.price),
      })),
    };

    return product;
    } catch (err: any) {
      console.warn(`findProductById DB query for ${idOrSlug} failed:`, err.message);
      return null;
    }
  },

  /**
   * Fast autocomplete search query using parameterized ILIKE
   */
  async searchProducts(searchTerm: string, limit: number = 10): Promise<Product[]> {
    const trimmed = searchTerm.trim().toLowerCase();
    if (!trimmed) return [];

    const sql = `
      SELECT 
        p.id,
        p.legacy_id as "legacyId",
        p.name,
        p.slug,
        p.category,
        p.brand,
        p.image_url as image,
        p.rating::text as rating,
        COALESCE(MIN(o.price_formatted), '₹0') as "lowestPrice",
        COALESCE(
          (
            SELECT r2.name 
            FROM offers o2 
            JOIN retailers r2 ON o2.retailer_id = r2.id 
            WHERE o2.product_id = p.id 
            ORDER BY o2.price ASC 
            LIMIT 1
          ), 
          'Best Deal'
        ) as "bestDeal"
      FROM products p
      LEFT JOIN offers o ON p.id = o.product_id
      WHERE LOWER(p.name) LIKE $1 OR LOWER(p.category) LIKE $1 OR LOWER(COALESCE(p.brand, '')) LIKE $1
      GROUP BY p.id
      ORDER BY p.rating DESC
      LIMIT $2;
    `;

    const res = await query(sql, [`%${trimmed}%`, limit]);

    return res.rows.map((row: any) => ({
      ...row,
      id: row.legacyId || row.id,
      uuid: row.id,
      numericPrice: 0,
      delivery: "Tomorrow",
      reviewSummary: "",
      priceHistory: [],
      amazon: "",
      flipkart: "",
      croma: "",
      amazonLink: "",
      flipkartLink: "",
      cromaLink: "",
    }));
  },
};
