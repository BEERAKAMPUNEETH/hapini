export interface PriceHistoryPoint {
  month: string;
  price: number;
}

export interface StoreOffer {
  name: string;
  price: string;
  link: string;
  numericPrice: number;
  inStock?: boolean;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: number | string;
  uuid?: string;
  legacyId?: number;
  name: string;
  slug?: string;
  category?: string;
  brand?: string;
  image: string;
  amazon: string;
  flipkart: string;
  croma: string;
  amazonLink: string;
  flipkartLink: string;
  cromaLink: string;
  bestDeal: string;
  lowestPrice: string;
  numericPrice?: number;
  rating: string;
  reviewsCount?: number;
  delivery: string;
  inStock?: boolean;
  priceHistory: PriceHistoryPoint[];
  reviewSummary: string;
  specs?: ProductSpec[];
  pros?: string[];
  cons?: string[];
  stores?: StoreOffer[];
}

export interface StorePriceRecord {
  storeName: string;
  price: number;
  priceFormatted: string;
  affiliateUrl: string;
  inStock: boolean;
}

export interface HealthStatus {
  status: "ok" | "degraded" | "error";
  uptime: number;
  timestamp: string;
  services: {
    server: "up";
    database: "connected" | "disconnected" | "fallback_memory";
    redis: "connected" | "disconnected" | "fallback_memory";
  };
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthTokenPayload {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  product?: Product;
}

export interface PriceAlert {
  id: string;
  userId: string;
  productId: string | number;
  productUuid?: string;
  targetPrice: number;
  email: string;
  retailerName?: string;
  isActive: boolean;
  triggeredAt?: string | null;
  triggeredPrice?: number | null;
  lastNotifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  product?: Product;
}

export interface AlertJobLog {
  id: string;
  jobName: string;
  status: "SUCCESS" | "FAILED" | "PARTIAL";
  alertsEvaluated: number;
  alertsTriggered: number;
  details: Record<string, any>;
  durationMs: number;
  executedAt: string;
}

