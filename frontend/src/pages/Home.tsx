import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Stats from "../components/Stats";
import CategoryPills from "../components/CategoryPills";
import FilterBar from "../components/FilterBar";
import ProductCard from "../components/ProductCard";
import ProductGridSkeleton from "../components/LoadingSkeleton";
import EmptyState from "../components/EmptyState";
import Footer from "../components/Footer";
import { Product, FilterState } from "../types";
import { fetchProducts } from "../services/api";

const initialFilters: FilterState = {
  searchQuery: "",
  selectedCategory: "All",
  minPrice: null,
  maxPrice: null,
  inStockOnly: false,
  sortBy: "featured",
};

export const Home: React.FC = () => {
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [allProductsForCounts, setAllProductsForCounts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  // Load products based on current backend filters
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchProducts({
        category: filters.selectedCategory !== "All" ? filters.selectedCategory : undefined,
        search: filters.searchQuery.trim() || undefined,
        sortBy: filters.sortBy,
        inStockOnly: filters.inStockOnly,
      });
      setProductsList(data);

      // Keep baseline for category count pill badges if empty
      if (allProductsForCounts.length === 0 && data.length > 0) {
        setAllProductsForCounts(data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to retrieve live product offers from server.");
    } finally {
      setLoading(false);
    }
  }, [filters, allProductsForCounts.length]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 200);

    return () => clearTimeout(timer);
  }, [loadProducts]);

  const handleFilterUpdate = (updates: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
  };

  // Compute category count breakdown
  const categoryCounts = useMemo(() => {
    const source = allProductsForCounts.length > 0 ? allProductsForCounts : productsList;
    const counts: Record<string, number> = { All: source.length };
    source.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [allProductsForCounts, productsList]);

  return (
    <div className="relative min-h-screen bg-slate-950 text-white flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Decorative Radial Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[650px] bg-indigo-600/15 blur-[180px] pointer-events-none rounded-full" />
      <div className="absolute top-[900px] right-[-200px] w-[500px] h-[500px] bg-purple-600/10 blur-[160px] pointer-events-none rounded-full" />

      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <Hero productsList={productsList.length > 0 ? productsList : allProductsForCounts} />

        {/* Platform Statistics */}
        <Stats />

        {/* Main Catalog & Price Comparison Section */}
        <section id="products" className="max-w-7xl mx-auto px-6 md:px-10 mt-28 mb-20 w-full scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
                Live Price Arbitrage
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mt-3">
                Explore Verified Products & Deals
              </h2>
              <p className="text-slate-400 text-sm md:text-base mt-1.5 max-w-xl">
                Compare prices updated across verified stores like Amazon, Flipkart, and Croma in real-time.
              </p>
            </div>

            {/* Category Pills Header */}
            <div id="categories" className="max-w-md w-full overflow-hidden">
              <CategoryPills
                selectedCategory={filters.selectedCategory}
                onSelectCategory={(cat) => handleFilterUpdate({ selectedCategory: cat })}
                productCounts={categoryCounts}
              />
            </div>
          </div>

          {/* Filter, Sort & Controls Bar */}
          <FilterBar
            filters={filters}
            onFilterChange={handleFilterUpdate}
            onReset={handleResetFilters}
            totalResults={productsList.length}
          />

          {/* Error Banner with Retry State */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 mb-8 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-rose-400 text-sm">
                <AlertCircle size={20} className="shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={loadProducts}
                className="inline-flex items-center gap-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold px-3 py-1.5 rounded-xl border border-rose-500/30 transition cursor-pointer"
              >
                <RefreshCw size={13} /> Retry
              </button>
            </div>
          )}

          {/* Products Grid / Loading / Empty States */}
          {loading ? (
            <ProductGridSkeleton count={6} />
          ) : productsList.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-7">
              {productsList.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No Products Match Your Criteria"
              description={`We couldn't find any products matching "${filters.searchQuery}" in ${filters.selectedCategory}. Try resetting filters or using a broader term.`}
              actionText="Reset All Filters"
              onActionClick={handleResetFilters}
            />
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
