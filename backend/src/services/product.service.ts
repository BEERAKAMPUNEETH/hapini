import { isDbActive } from "../config/db";
import { cacheService } from "./cache.service";
import { env } from "../config/env";
import { Product } from "../types";
import { initialProducts } from "../data/seedData";
import { productRepository, ProductQueryOptions } from "../repositories/product.repository";

/**
 * Deterministic cache key generator for product catalog queries.
 * Normalizes filter, search, sort, and pagination parameters to prevent duplicate cache pollution.
 */
export function generateProductsListCacheKey(options: ProductQueryOptions = {}): string {
  const parts: string[] = [];

  const category = (options.category || "all").trim().toLowerCase();
  parts.push(`cat:${category}`);

  const search = (options.search || "").trim().toLowerCase();
  if (search) {
    parts.push(`q:${search}`);
  }

  const sortBy = options.sortBy || "featured";
  parts.push(`sort:${sortBy}`);

  const inStock = options.inStockOnly ? "true" : "false";
  parts.push(`stock:${inStock}`);

  if (options.minPrice !== undefined && options.minPrice !== null) {
    parts.push(`min:${options.minPrice}`);
  }

  if (options.maxPrice !== undefined && options.maxPrice !== null) {
    parts.push(`max:${options.maxPrice}`);
  }

  const limit = options.limit || 50;
  const offset = options.offset || 0;
  parts.push(`lim:${limit}`);
  parts.push(`off:${offset}`);

  return `products:list:${parts.join(":")}`;
}

export function generateProductDetailCacheKey(idOrSlug: string | number): string {
  const normalized = String(idOrSlug).trim().toLowerCase();
  return `products:detail:${normalized}`;
}

export function generateSearchCacheKey(term: string, limit: number = 10): string {
  const normalized = term.trim().toLowerCase();
  return `products:search:q:${normalized}:lim:${limit}`;
}

export interface ProductsQueryResult {
  products: Product[];
  cacheStatus: "HIT" | "MISS";
}

export interface ProductDetailResult {
  product: Product | null;
  cacheStatus: "HIT" | "MISS";
}

export const productService = {
  /**
   * Cache-aside listing of products supporting filters, search, and sorting
   */
  async getAllProducts(options: ProductQueryOptions = {}): Promise<ProductsQueryResult> {
    const cacheKey = generateProductsListCacheKey(options);

    // 1. Attempt cache lookup (Redis / Memory fallback)
    const cached = await cacheService.getWithStatus<Product[]>(cacheKey);
    if (cached.status === "HIT" && cached.data) {
      return { products: cached.data, cacheStatus: "HIT" };
    }

    // 2. Cache Miss: Query PostgreSQL database (Source of Truth)
    let products: Product[] = [];

    if (isDbActive()) {
      try {
        products = await productRepository.findProducts(options);
      } catch (err: any) {
        console.warn("Database repository query failed, falling back to memory seed:", err.message);
      }
    }

    // 3. Fallback to seed dataset if database is not populated or offline
    if (products.length === 0) {
      let list = [...initialProducts];
      if (options.category && options.category !== "All") {
        list = list.filter((p: any) => p.category === options.category);
      }
      if (options.search && options.search.trim()) {
        const q = options.search.toLowerCase();
        list = list.filter(
          (p: any) =>
            p.name.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            (p.brand && p.brand.toLowerCase().includes(q))
        );
      }
      if (options.inStockOnly) {
        list = list.filter((p: any) => p.inStock !== false);
      }
      if (options.sortBy === "price-asc") {
        list.sort((a, b) => (a.numericPrice || 0) - (b.numericPrice || 0));
      } else if (options.sortBy === "price-desc") {
        list.sort((a, b) => (b.numericPrice || 0) - (a.numericPrice || 0));
      } else if (options.sortBy === "rating-desc") {
        list.sort((a, b) => Number(b.rating) - Number(a.rating));
      }
      products = list;
    }

    // 4. Populate cache with configurable TTL
    await cacheService.set(cacheKey, products, env.CACHE_TTL_SECONDS);

    return { products, cacheStatus: "MISS" };
  },

  /**
   * Cache-aside product details with metadata
   */
  async getProductByIdWithMeta(idOrSlug: string | number): Promise<ProductDetailResult> {
    const cacheKey = generateProductDetailCacheKey(idOrSlug);

    // 1. Cache lookup
    const cached = await cacheService.getWithStatus<Product>(cacheKey);
    if (cached.status === "HIT" && cached.data) {
      return { product: cached.data, cacheStatus: "HIT" };
    }

    // 2. Database lookup
    let product: Product | null = null;

    if (isDbActive()) {
      try {
        product = await productRepository.findProductById(idOrSlug);
      } catch (err: any) {
        console.warn(`Database query for product ${idOrSlug} failed:`, err.message);
      }
    }

    // 3. In-memory fallback
    if (!product) {
      const numericId = Number(idOrSlug);
      product =
        initialProducts.find(
          (p) => p.id === numericId || (p as any).slug === idOrSlug
        ) || null;
    }

    // 4. Cache if found
    if (product) {
      await cacheService.set(cacheKey, product, env.PRODUCT_CACHE_TTL_SECONDS);

      // Also cache under legacy id and slug if available
      if (product.slug && String(product.slug) !== String(idOrSlug)) {
        await cacheService.set(
          generateProductDetailCacheKey(product.slug),
          product,
          env.PRODUCT_CACHE_TTL_SECONDS
        );
      }
    }

    return { product, cacheStatus: "MISS" };
  },

  /**
   * Direct product detail accessor for internal services (e.g. Wishlist)
   */
  async getProductById(idOrSlug: string | number): Promise<Product | null> {
    const result = await this.getProductByIdWithMeta(idOrSlug);
    return result.product;
  },

  /**
   * Autocomplete search with dedicated search TTL
   */
  async searchProducts(searchTerm: string, limit: number = 10): Promise<ProductsQueryResult> {
    const trimmed = searchTerm.trim().toLowerCase();
    if (!trimmed) {
      return { products: [], cacheStatus: "MISS" };
    }

    const cacheKey = generateSearchCacheKey(trimmed, limit);

    // 1. Cache lookup
    const cached = await cacheService.getWithStatus<Product[]>(cacheKey);
    if (cached.status === "HIT" && cached.data) {
      return { products: cached.data, cacheStatus: "HIT" };
    }

    // 2. Database search
    let results: Product[] = [];

    if (isDbActive()) {
      try {
        results = await productRepository.searchProducts(trimmed, limit);
      } catch (err: any) {
        console.warn("Database search query failed:", err.message);
      }
    }

    // 3. Fallback search
    if (results.length === 0) {
      results = initialProducts
        .filter((p) => p.name.toLowerCase().includes(trimmed))
        .slice(0, limit);
    }

    // 4. Cache results
    await cacheService.set(cacheKey, results, env.SEARCH_CACHE_TTL_SECONDS);

    return { products: results, cacheStatus: "MISS" };
  },

  /**
   * Invalidate product cache upon product or offer updates.
   * If an ID is provided, invalidates the specific detail key plus all catalog lists and searches.
   * If no ID is provided, invalidates all public product caches.
   */
  async invalidateProductCache(idOrSlug?: string | number): Promise<{ deletedKeys: number }> {
    let deletedKeys = 0;

    if (idOrSlug) {
      // 1. Invalidate single detail key
      await cacheService.del(generateProductDetailCacheKey(idOrSlug));
      deletedKeys++;

      // 2. Invalidate lists and searches (as ranking or lowest price may have changed)
      const deletedLists = await cacheService.delPattern("products:list:*");
      const deletedSearches = await cacheService.delPattern("products:search:*");
      deletedKeys += deletedLists + deletedSearches;
    } else {
      // Invalidate everything under products namespace
      deletedKeys = await cacheService.delPattern("products:*");
    }

    return { deletedKeys };
  },
};
