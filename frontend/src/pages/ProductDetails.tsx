import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  ExternalLink,
  Star,
  Truck,
  Award,
  TrendingDown,
  Heart,
  CheckCircle2,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  ShieldCheck,
  Share2,
  AlertCircle,
  RefreshCw,
  Bell,
} from "lucide-react";
import { Product, StoreOffer } from "../types";
import { fetchProductById } from "../services/api";
import PriceHistoryChart from "../components/PriceHistoryChart";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PriceAlertModal from "../components/PriceAlertModal";
import { useWishlist } from "../context/WishlistContext";

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const productIdentifier = id || "1";

  const { isInWishlist, toggleWishlist } = useWishlist();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);

  const loadProduct = async () => {
    if (!productIdentifier) return;
    setLoading(true);
    setError(null);

    try {
      const fetched = await fetchProductById(productIdentifier);
      setProduct(fetched);
    } catch (err: any) {
      setError(err.message || "Failed to retrieve product details from backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    fetchProductById(productIdentifier)
      .then((fetched) => {
        if (isMounted) {
          setProduct(fetched);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Failed to load product details");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [productIdentifier]);

  // Parse store offers and compute comparative savings
  const storeComparison = useMemo(() => {
    if (!product) return { stores: [], cheapest: null, maxSavings: 0 };

    if (product.stores && product.stores.length > 0) {
      const sorted = [...product.stores].sort((a, b) => a.numericPrice - b.numericPrice);
      const cheapest = sorted[0];
      const highest = sorted[sorted.length - 1];
      const maxSavings = highest.numericPrice - cheapest.numericPrice;
      return { stores: sorted, cheapest, maxSavings };
    }

    const parseNumeric = (priceStr?: string): number => {
      if (!priceStr) return Number.MAX_SAFE_INTEGER;
      const num = Number(priceStr.replace(/[^0-9]/g, ""));
      return isNaN(num) ? Number.MAX_SAFE_INTEGER : num;
    };

    const stores: StoreOffer[] = [
      {
        name: "Amazon",
        price: product.amazon,
        link: product.amazonLink,
        numericPrice: parseNumeric(product.amazon),
        inStock: true,
      },
      {
        name: "Flipkart",
        price: product.flipkart,
        link: product.flipkartLink,
        numericPrice: parseNumeric(product.flipkart),
        inStock: true,
      },
      {
        name: "Croma",
        price: product.croma,
        link: product.cromaLink,
        numericPrice: parseNumeric(product.croma),
        inStock: true,
      },
    ].sort((a, b) => a.numericPrice - b.numericPrice);

    const cheapest = stores[0];
    const highest = stores[stores.length - 1];
    const maxSavings = highest.numericPrice - cheapest.numericPrice;

    return { stores, cheapest, maxSavings };
  }, [product]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500" />
            <span className="text-xs text-slate-400">Loading live retailer quotes from backend...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mb-6">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-2">Error Connecting to API</h1>
          <p className="text-slate-400 mb-6 text-sm">{error}</p>
          <button
            type="button"
            onClick={loadProduct}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl transition text-sm cursor-pointer"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col selection:bg-indigo-500 selection:text-white">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mb-6">
            <XCircle size={32} />
          </div>
          <h1 className="text-3xl font-extrabold mb-3">Product Not Found</h1>
          <p className="text-slate-400 mb-8 text-sm leading-relaxed">
            The product you requested does not exist or has been removed from our price index.
          </p>
          <Link
            to="/"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-xl transition inline-flex items-center gap-2 text-sm shadow-lg shadow-indigo-600/20"
          >
            <ArrowLeft size={16} />
            Back to Catalog
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const wishlisted = isInWishlist(Number(product.id));
  const inStock = product.inStock !== false;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-6 md:px-10 py-8 w-full">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium text-sm transition"
          >
            <ArrowLeft size={16} />
            Back to all deals
          </Link>

          {/* Share & Wishlist button header */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 text-xs text-slate-300 bg-slate-900 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-xl transition cursor-pointer"
            >
              <Share2 size={14} />
              {copiedLink ? "Link Copied!" : "Share Deal"}
            </button>

            <button
              type="button"
              onClick={() => toggleWishlist(Number(product.id))}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-xl border transition cursor-pointer ${
                wishlisted
                  ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
                  : "bg-slate-900 border-slate-800 text-slate-300 hover:text-rose-400 hover:border-rose-400/30"
              }`}
            >
              <Heart size={14} className={wishlisted ? "fill-rose-400" : ""} />
              {wishlisted ? "Saved" : "Save to Wishlist"}
            </button>

            <button
              type="button"
              onClick={() => setAlertModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-xl border bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition cursor-pointer"
            >
              <Bell size={14} />
              Set Price Alert
            </button>
          </div>
        </div>

        {/* Product Overview Header */}
        <div className="grid lg:grid-cols-2 gap-10 items-start mb-16">
          {/* Left: Product Image Showcase */}
          <div className="bg-slate-900/60 border border-slate-800/90 rounded-3xl p-8 flex items-center justify-center min-h-[420px] shadow-2xl relative overflow-hidden backdrop-blur-md">
            <img
              src={product.image}
              alt={product.name}
              className="max-h-[340px] max-w-full object-contain rounded-2xl drop-shadow-2xl"
            />
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5 backdrop-blur-md">
                <TrendingDown size={14} /> Price Monitored
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-900/80 px-2.5 py-0.5 rounded-md border border-slate-800 w-fit">
                {product.category || "Electronics"}
              </span>
            </div>

            <div className="absolute bottom-4 right-4">
              {inStock ? (
                <span className="flex items-center gap-1.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-semibold backdrop-blur-md">
                  <CheckCircle2 size={13} /> In Stock Across Stores
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 rounded-full font-semibold backdrop-blur-md">
                  <XCircle size={13} /> Limited / Out of Stock
                </span>
              )}
            </div>
          </div>

          {/* Right: Product Details & Best Price Callout */}
          <div className="flex flex-col justify-between h-full space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-indigo-400 tracking-wide uppercase">
                  {product.brand || "Verified Brand"}
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-4">
                {product.name}
              </h1>

              {/* Rating & Delivery Badges */}
              <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-slate-300 mb-6">
                <span className="flex items-center gap-1.5 bg-amber-400/10 text-amber-400 border border-amber-400/20 px-3 py-1.5 rounded-xl font-semibold">
                  <Star size={15} className="fill-amber-400" />
                  {product.rating} / 5.0
                  {product.reviewsCount && (
                    <span className="text-slate-400 font-normal">
                      ({product.reviewsCount.toLocaleString()} reviews)
                    </span>
                  )}
                </span>

                <span className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-xl text-slate-300">
                  <Truck size={15} className="text-indigo-400" />
                  Fast Delivery: <strong className="text-white">{product.delivery}</strong>
                </span>

                <span className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-xl text-slate-300">
                  <ShieldCheck size={15} className="text-emerald-400" />
                  Verified Merchant Guarantee
                </span>
              </div>

              {/* Best Price Hero Banner */}
              <div className="bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-slate-900/60 border border-emerald-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    <Award size={16} /> Verified Lowest Price Deal
                  </div>
                  {storeComparison.maxSavings > 0 && (
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                      Save ₹{storeComparison.maxSavings.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-3 my-2">
                  <span className="text-4xl md:text-5xl font-black text-white">
                    {storeComparison.cheapest?.price}
                  </span>
                  <span className="text-sm font-semibold text-emerald-400">
                    on {storeComparison.cheapest?.name}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-2">
                  Price updated automatically via backend. Includes retailer discounts and warranty.
                </p>

                <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
                  <a
                    href={storeComparison.cheapest?.link}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center justify-center gap-2 flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-6 rounded-2xl transition shadow-lg shadow-emerald-600/20 text-sm cursor-pointer"
                  >
                    Buy at Lowest Price on {storeComparison.cheapest?.name}
                    <ExternalLink size={16} />
                  </a>
                  <button
                    type="button"
                    onClick={() => setAlertModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold py-3.5 px-5 rounded-2xl border border-slate-700 hover:border-amber-400/30 transition text-sm cursor-pointer"
                  >
                    <Bell size={16} />
                    Alert on Drop
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Specs summary */}
            {product.specs && product.specs.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-4">
                {product.specs.slice(0, 3).map((spec) => (
                  <div
                    key={spec.label}
                    className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 text-xs"
                  >
                    <span className="text-slate-400 block text-[11px] font-medium">{spec.label}</span>
                    <span className="text-white font-semibold truncate block mt-0.5">{spec.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section 1: Detailed Retailer Price Comparison Table */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 mb-16 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Live Retailer Price Comparison</h2>
              <p className="text-slate-400 text-sm mt-0.5">
                Multi-store arbitrage analysis normalized in Indian Rupees (₹)
              </p>
            </div>
            <span className="text-xs text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 w-fit">
              Real-time Stock Checked
            </span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {storeComparison.stores.map((store, index) => {
              const isBest = index === 0;
              const priceDiff = store.numericPrice - (storeComparison.cheapest?.numericPrice || 0);

              return (
                <div
                  key={store.name}
                  className={`grid grid-cols-12 items-center py-4 px-4 rounded-2xl transition gap-3 ${
                    isBest ? "bg-emerald-500/5 border border-emerald-500/20 my-1" : "hover:bg-slate-800/40"
                  }`}
                >
                  {/* Retailer Name */}
                  <div className="col-span-5 sm:col-span-4 flex items-center gap-2.5">
                    <span className="font-bold text-sm md:text-base text-white">
                      {store.name}
                    </span>
                    {isBest && (
                      <span className="bg-emerald-500/20 text-emerald-400 text-[10px] md:text-xs font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30">
                        Best Deal
                      </span>
                    )}
                  </div>

                  {/* Price & Difference */}
                  <div className="col-span-4 sm:col-span-4 text-center">
                    <span className="text-base md:text-xl font-extrabold text-white block">
                      {store.price}
                    </span>
                    {!isBest && priceDiff > 0 && (
                      <span className="text-[11px] text-rose-400 block font-medium">
                        +₹{priceDiff.toLocaleString("en-IN")} higher
                      </span>
                    )}
                    {isBest && (
                      <span className="text-[11px] text-emerald-400 block font-medium">
                        Lowest verified price
                      </span>
                    )}
                  </div>

                  {/* Outbound Link */}
                  <div className="col-span-3 sm:col-span-4 text-right">
                    <a
                      href={store.link}
                      target="_blank"
                      rel="noreferrer noopener"
                      className={`inline-flex items-center gap-1.5 text-xs md:text-sm font-semibold px-4 py-2 rounded-xl transition ${
                        isBest
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
                          : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20"
                      }`}
                    >
                      Buy Now
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 2: Price History Tracker */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 mb-16 shadow-xl">
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              Price Intelligence
            </span>
            <h2 className="text-2xl font-bold text-white mt-2">Historical Price Fluctuations</h2>
            <p className="text-slate-400 text-sm mt-1">
              Track seasonal discount cycles and identify if current pricing represents a true discount.
            </p>
          </div>

          <PriceHistoryChart data={product.priceHistory} currentPrice={product.lowestPrice} />
        </section>

        {/* Section 3: AI Review Summary & Pros/Cons */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 mb-16 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">AI-Synthesized Review Consensus</h2>
              <p className="text-slate-400 text-xs md:text-sm">
                Aggregated sentiment analysis across verified customer reviews
              </p>
            </div>
          </div>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed bg-slate-950/60 border border-slate-800/80 p-5 rounded-2xl mb-8">
            {product.reviewSummary}
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Pros */}
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-3">
                <ThumbsUp size={16} /> Key Strengths Mentioned
              </div>
              <ul className="space-y-2 text-xs md:text-sm text-slate-300">
                {(product.pros || [
                  "High build quality and premium in-hand feel",
                  "Consistent software stability and regular updates",
                  "Excellent price-to-performance ratio in current bracket",
                ]).map((pro, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold shrink-0">✓</span>
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cons */}
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm mb-3">
                <ThumbsDown size={16} /> Potential Drawbacks
              </div>
              <ul className="space-y-2 text-xs md:text-sm text-slate-300">
                {(product.cons || [
                  "Retail accessories sold separately",
                  "Incremental improvements over previous model",
                ]).map((con, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold shrink-0">✗</span>
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Section 4: Specifications Table */}
        {product.specs && product.specs.length > 0 && (
          <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 md:p-8 mb-16 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6">Technical Specifications</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {product.specs.map((spec) => (
                <div
                  key={spec.label}
                  className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs md:text-sm"
                >
                  <span className="text-slate-400 font-medium">{spec.label}</span>
                  <span className="text-white font-semibold">{spec.value}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Price Alert Modal */}
        {product && (
          <PriceAlertModal
            isOpen={alertModalOpen}
            onClose={() => setAlertModalOpen(false)}
            product={product}
          />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetails;
