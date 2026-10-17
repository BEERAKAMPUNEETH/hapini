import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProductDetails from "../pages/ProductDetails";
import Hero from "../components/Hero";
import { AuthProvider } from "../context/AuthContext";
import { WishlistProvider } from "../context/WishlistContext";
import * as api from "../services/api";
import { Product } from "../types";

const mockSampleProduct: Product = {
  id: "1",
  name: "iPhone 17 Pro",
  category: "Smartphones",
  lowestPrice: "₹68,999",
  flipkart: "₹68,999",
  amazon: "₹74,999",
  croma: "₹76,500",
  amazonLink: "https://amazon.in",
  flipkartLink: "https://flipkart.com",
  cromaLink: "https://croma.com",
  numericPrice: 68999,
  image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=800",
  rating: "4.9",
  reviewsCount: 1420,
  bestDeal: "Flipkart",
  delivery: "Tomorrow, by 11 AM",
  inStock: true,
  reviewSummary: "Consistently rated 4.9 across verified stores.",
  stores: [
    { name: "Flipkart", price: "₹68,999", numericPrice: 68999, link: "https://flipkart.com", inStock: true },
    { name: "Amazon", price: "₹74,999", numericPrice: 74999, link: "https://amazon.in", inStock: true },
    { name: "Croma", price: "₹76,500", numericPrice: 76500, link: "https://croma.com", inStock: true },
  ],
  priceHistory: [
    { month: "Month 1", price: 78000 },
    { month: "Month 2", price: 74999 },
    { month: "Month 3", price: 68999 },
  ],
  specs: [
    { label: "Processor", value: "A19 Pro Bionic" },
    { label: "Display", value: "6.3-inch Super Retina XDR" },
  ],
  pros: ["Fast performance", "Incredible camera system"],
  cons: ["Premium pricing"],
};

describe("End-to-End User Flow: Search Product & View Offers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, "fetchProductById").mockResolvedValue(mockSampleProduct);
    vi.spyOn(api.default, "getProductById").mockResolvedValue(mockSampleProduct);
    vi.spyOn(api.default, "getWishlist").mockResolvedValue([]);
    vi.spyOn(api.default, "getWishlistIds").mockResolvedValue([]);
  });

  it("searches products via interactive search bar and displays live matching results", () => {
    render(
      <MemoryRouter>
        <Hero productsList={[mockSampleProduct]} />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toBeInTheDocument();

    // User searches for "iPhone"
    fireEvent.change(searchInput, { target: { value: "iPhone" } });

    // Live search results dropdown appears
    expect(screen.getByText("iPhone 17 Pro")).toBeInTheDocument();
    expect(screen.getByText(/Best Deal at Flipkart/i)).toBeInTheDocument();
    const resultLink = screen.getByRole("link");
    expect(resultLink).toHaveAttribute("href", "/product/1");
  });

  it("loads product details page and compares verified retailer offers across stores", async () => {
    render(
      <AuthProvider>
        <WishlistProvider>
          <MemoryRouter initialEntries={["/product/1"]}>
            <Routes>
              <Route path="/product/:id" element={<ProductDetails />} />
            </Routes>
          </MemoryRouter>
        </WishlistProvider>
      </AuthProvider>
    );

    // Step 1: Wait for product detail data to load
    await waitFor(() => {
      expect(screen.getByText("iPhone 17 Pro")).toBeInTheDocument();
    });

    // Step 2: Verify Lowest Price Deal banner
    expect(screen.getByText(/Verified Lowest Price Deal/i)).toBeInTheDocument();
    expect(screen.getAllByText(/on Flipkart/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Save ₹7,501/i)).toBeInTheDocument();

    // Step 3: Verify retailer stores list in comparison table
    expect(screen.getByText("Amazon")).toBeInTheDocument();
    expect(screen.getByText("Croma")).toBeInTheDocument();
    expect(screen.getByText("₹74,999")).toBeInTheDocument();
    expect(screen.getByText("₹76,500")).toBeInTheDocument();

    // Step 4: Verify action controls (Lowest price purchase link, Wishlist, Price Alert)
    const buyButton = screen.getByRole("link", { name: /buy at lowest price on flipkart/i });
    expect(buyButton).toBeInTheDocument();
    expect(buyButton).toHaveAttribute("href", "https://flipkart.com");

    expect(screen.getByRole("button", { name: /save to wishlist/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /set price alert/i })).toBeInTheDocument();
  });
});
