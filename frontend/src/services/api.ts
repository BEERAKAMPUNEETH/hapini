import { Product, User, AuthResponse, PriceAlert } from "../types";
import { mockProducts } from "../data/mockProducts";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

let authToken: string | null =
  typeof window !== "undefined" ? localStorage.getItem("hapini_token") : null;

export function setAuthToken(token: string | null): void {
  authToken = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("hapini_token", token);
    } else {
      localStorage.removeItem("hapini_token");
    }
  }
}

export function getAuthToken(): string | null {
  if (!authToken && typeof window !== "undefined") {
    authToken = localStorage.getItem("hapini_token");
  }
  return authToken;
}

export interface ProductQueryParams {
  category?: string;
  search?: string;
  sortBy?: "featured" | "price-asc" | "price-desc" | "rating-desc";
  inStockOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
  inWishlist?: boolean;
}

export class ApiError extends Error {
  statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

/**
 * Executes HTTP fetch with timeout, JWT headers, and graceful error reporting
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const body = await res.json();
        if (body.message) errorMessage = body.message;
      } catch {
        // fallback
      }
      throw new ApiError(errorMessage, res.status);
    }

    return (await res.json()) as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new ApiError("Request timeout. The server took too long to respond.", 408);
    }
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || "Network error. Please check backend connectivity.", 0);
  }
}

export const api = {
  // -------------------------------------------------------------
  // Authentication Endpoints
  // -------------------------------------------------------------
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const res = await request<ApiResponse<AuthResponse>>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    setAuthToken(res.data.token);
    return res.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await request<ApiResponse<AuthResponse>>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(res.data.token);
    return res.data;
  },

  async getMe(): Promise<User> {
    const res = await request<ApiResponse<{ user: User }>>("/auth/me");
    return res.data.user;
  },

  async logout(): Promise<void> {
    try {
      await request<ApiResponse<null>>("/auth/logout", { method: "POST" });
    } finally {
      setAuthToken(null);
    }
  },

  // -------------------------------------------------------------
  // Wishlist Endpoints (Securely Scoped to Authenticated User)
  // -------------------------------------------------------------
  async getWishlist(): Promise<Product[]> {
    const res = await request<ApiResponse<Product[]>>("/wishlist");
    return res.data;
  },

  async getWishlistIds(): Promise<(string | number)[]> {
    const res = await request<ApiResponse<(string | number)[]>>("/wishlist/ids");
    return res.data;
  },

  async addToWishlist(productId: string | number): Promise<void> {
    await request<ApiResponse<null>>("/wishlist", {
      method: "POST",
      body: JSON.stringify({ productId }),
    });
  },

  async removeFromWishlist(productId: string | number): Promise<void> {
    await request<ApiResponse<null>>(`/wishlist/${productId}`, {
      method: "DELETE",
    });
  },

  async toggleWishlist(productId: string | number): Promise<boolean> {
    const res = await request<ApiResponse<{ inWishlist: boolean }>>("/wishlist/toggle", {
      method: "POST",
      body: JSON.stringify({ productId }),
    });
    return res.data?.inWishlist ?? true;
  },

  // -------------------------------------------------------------
  // Price Alert Endpoints
  // -------------------------------------------------------------
  async createPriceAlert(
    productId: string | number,
    targetPrice: number,
    retailerName?: string
  ): Promise<PriceAlert> {
    const res = await request<ApiResponse<PriceAlert>>("/alerts", {
      method: "POST",
      body: JSON.stringify({ productId, targetPrice, retailerName }),
    });
    return res.data;
  },

  async getUserAlerts(): Promise<PriceAlert[]> {
    const res = await request<ApiResponse<PriceAlert[]>>("/alerts");
    return res.data;
  },

  async updatePriceAlert(
    alertId: string,
    data: { targetPrice?: number; isActive?: boolean; retailerName?: string }
  ): Promise<PriceAlert> {
    const res = await request<ApiResponse<PriceAlert>>(`/alerts/${alertId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async deletePriceAlert(alertId: string): Promise<void> {
    await request<ApiResponse<null>>(`/alerts/${alertId}`, {
      method: "DELETE",
    });
  },

  async simulatePriceChange(
    productId: string | number,
    newPrice: number,
    retailerName?: string
  ): Promise<any> {
    const res = await request<ApiResponse<any>>("/alerts/simulate-price", {
      method: "POST",
      body: JSON.stringify({ productId, newPrice, retailerName }),
    });
    return res.data;
  },

  async runPriceCheckJob(): Promise<any> {
    const res = await request<ApiResponse<any>>("/alerts/run-check", {
      method: "POST",
    });
    return res.data;
  },

  // -------------------------------------------------------------
  // Catalog Endpoints
  // -------------------------------------------------------------
  async getProducts(params: ProductQueryParams = {}): Promise<Product[]> {
    const query = new URLSearchParams();

    if (params.category && params.category !== "All") query.set("category", params.category);
    if (params.search && params.search.trim()) query.set("search", params.search.trim());
    if (params.sortBy) query.set("sortBy", params.sortBy);
    if (params.inStockOnly) query.set("inStockOnly", "true");
    if (params.limit) query.set("limit", String(params.limit));
    if (params.offset) query.set("offset", String(params.offset));

    const qs = query.toString();
    const endpoint = `/products${qs ? `?${qs}` : ""}`;

    try {
      const res = await request<ApiResponse<Product[]>>(endpoint);
      return res.data;
    } catch (error) {
      console.warn("Backend API error, falling back to local dataset:", error);
      let list = [...mockProducts];
      if (params.category && params.category !== "All") {
        list = list.filter((p) => p.category === params.category);
      }
      if (params.search && params.search.trim()) {
        const q = params.search.toLowerCase();
        list = list.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            (p.brand && p.brand.toLowerCase().includes(q))
        );
      }
      if (params.inStockOnly) {
        list = list.filter((p) => p.inStock !== false);
      }
      if (params.sortBy === "price-asc") {
        list.sort((a, b) => a.numericPrice - b.numericPrice);
      } else if (params.sortBy === "price-desc") {
        list.sort((a, b) => b.numericPrice - a.numericPrice);
      } else if (params.sortBy === "rating-desc") {
        list.sort((a, b) => Number(b.rating) - Number(a.rating));
      }
      return list;
    }
  },

  async getProductById(idOrSlug: string | number): Promise<Product | null> {
    const endpoint = `/products/${idOrSlug}`;

    try {
      const res = await request<ApiResponse<Product>>(endpoint);
      return res.data;
    } catch (error: any) {
      if (error.statusCode === 404) return null;
      console.warn(`Backend error fetching product ${idOrSlug}, falling back to mock:`, error);
      const numericId = Number(idOrSlug);
      const match = mockProducts.find(
        (p) => p.id === numericId || (p as any).slug === idOrSlug
      );
      return match || null;
    }
  },

  async searchProducts(query: string): Promise<Product[]> {
    if (!query.trim()) return [];

    try {
      const res = await request<ApiResponse<Product[]>>(
        `/products/search?q=${encodeURIComponent(query)}`
      );
      return res.data;
    } catch (error) {
      console.warn("Backend search error, falling back to mock:", error);
      const q = query.toLowerCase();
      return mockProducts.filter((p) => p.name.toLowerCase().includes(q));
    }
  },

  async getHealth(): Promise<{ status: string; services: Record<string, string> }> {
    return request<{ status: string; services: Record<string, string> }>("/health");
  },
};

// Backwards-compatible legacy exports
export const fetchProducts = (params?: ProductQueryParams) => api.getProducts(params);
export const fetchProductById = (id: string | number) => api.getProductById(id);
export const searchProducts = (q: string) => api.searchProducts(q);

export default api;
