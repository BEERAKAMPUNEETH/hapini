import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Trash2, ArrowLeft, TrendingDown, ShieldAlert, LogIn, Loader2 } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import EmptyState from "../components/EmptyState";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import { api, fetchProducts } from "../services/api";
import { Product } from "../types";

export const Wishlist: React.FC = () => {
  const { wishlist, clearWishlist } = useWishlist();
  const { isAuthenticated, user, openAuthModal } = useAuth();
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function loadWishlistItems() {
      setLoading(true);
      try {
        if (isAuthenticated) {
          // Fetch user-scoped items from persistent PostgreSQL API
          const items = await api.getWishlist();
          if (isMounted) {
            setWishlistProducts(items);
          }
        } else {
          // Unauthenticated fallback: resolve from catalog by local IDs
          const allProducts = await fetchProducts();
          if (isMounted) {
            const localMatches = allProducts.filter((product) =>
              wishlist.some(
                (wId) =>
                  String(wId) === String(product.id) ||
                  (product.uuid && String(wId) === String(product.uuid))
              )
            );
            setWishlistProducts(localMatches);
          }
        }
      } catch (err) {
        console.warn("Failed to load wishlist products:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadWishlistItems();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, wishlist]);

  return (
    <div className="relative min-h-screen bg-slate-950 text-white flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-rose-600/10 blur-[160px] pointer-events-none rounded-full" />

      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-6 md:px-10 py-10 w-full">
        {/* Breadcrumb & Navigation */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium text-sm transition mb-8"
        >
          <ArrowLeft size={16} />
          Back to all products
        </Link>

        {/* Unauthenticated Security Banner */}
        {!isAuthenticated && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 sm:p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <ShieldAlert size={22} className="text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <p className="text-sm font-semibold text-white">
                  Save your wishlist permanently
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sign in or register to sync your tracked products across devices with real-time PostgreSQL storage.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="inline-flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-amber-500/20 shrink-0"
            >
              <LogIn size={14} />
              Sign In to Sync
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-900">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
                <Heart size={24} className="fill-rose-400" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                  {isAuthenticated && user ? `${user.name.split(" ")[0]}'s Saved Wishlist` : "My Saved Wishlist"}
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  Monitoring price drops and deals across your saved items.
                </p>
              </div>
            </div>
          </div>

          {wishlistProducts.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-xl font-medium">
                {wishlistProducts.length} {wishlistProducts.length === 1 ? "item" : "items"}
              </span>

              <button
                type="button"
                onClick={clearWishlist}
                className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-3.5 py-1.5 rounded-xl transition cursor-pointer font-semibold"
              >
                <Trash2 size={14} />
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 size={32} className="animate-spin text-indigo-500 mb-3" />
            <p className="text-sm">Loading your saved products...</p>
          </div>
        ) : wishlistProducts.length > 0 ? (
          <div>
            {/* Wishlist Notice Banner */}
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 mb-8 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <TrendingDown size={20} className="text-indigo-400 shrink-0" />
                <p className="text-xs md:text-sm text-slate-300">
                  <strong className="text-white">Price alert tracking active:</strong> We scan retailer price updates for these {wishlistProducts.length} items every 2 hours.
                </p>
              </div>
              <Link
                to="/"
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline whitespace-nowrap"
              >
                + Add more
              </Link>
            </div>

            {/* Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {wishlistProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Heart}
            title="Your Wishlist is Empty"
            description="You haven't saved any products yet. Explore our live price comparison catalog and click the heart icon on any product to monitor its price drops."
            actionText="Explore Products"
            actionLink="/"
          />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Wishlist;
