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
  category: string;
  brand?: string;
  image: string;
  amazon: string;
  flipkart: string;
  croma: string;
  amazonLink: string;
  flipkartLink: string;
  cromaLink: string;
  rating: string;
  reviewsCount?: number;
  delivery: string;
  inStock?: boolean;
  priceHistory: PriceHistoryPoint[];
  reviewSummary: string;
  pros?: string[];
  cons?: string[];
  specs?: ProductSpec[];
  bestDeal: string;
  lowestPrice: string;
  numericPrice: number;
  stores?: StoreOffer[];
}

export type SortOption = "featured" | "price-asc" | "price-desc" | "rating-desc";

export interface FilterState {
  searchQuery: string;
  selectedCategory: string;
  minPrice: number | null;
  maxPrice: number | null;
  inStockOnly: boolean;
  sortBy: SortOption;
}

export interface StatItem {
  value: string;
  label: string;
}

export interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
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


