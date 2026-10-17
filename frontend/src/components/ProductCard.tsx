import React from "react";
import { Link } from "react-router-dom";
import { Star, Truck, Heart, ArrowUpRight, CheckCircle2, XCircle } from "lucide-react";
import { Product } from "../types";
import { useWishlist } from "../context/WishlistContext";

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const wishlisted = isInWishlist(product.id);

  const displayPrice = product.lowestPrice || product.flipkart || product.amazon;
  const bestDealStore = product.bestDeal || "Best Deal";
  const inStock = product.inStock !== false;

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <div className="group relative bg-slate-900/60 border border-slate-800/90 rounded-3xl p-5 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300 flex flex-col justify-between h-full backdrop-blur-sm">
      {/* Top action row: Category & Wishlist Button */}
      <div className="flex items-center justify-between mb-3 z-10">
        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full">
          {product.category}
        </span>

        <button
          type="button"
          onClick={handleWishlistClick}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={`p-2 rounded-full border transition-all duration-200 cursor-pointer ${
            wishlisted
              ? "bg-rose-500/20 border-rose-500/40 text-rose-400 scale-110"
              : "bg-slate-800/70 border-slate-700/60 text-slate-400 hover:text-rose-400 hover:border-rose-400/30 hover:bg-slate-800"
          }`}
        >
          <Heart size={16} className={wishlisted ? "fill-rose-400" : ""} />
        </button>
      </div>

      {/* Product Image Frame */}
      <Link to={`/product/${product.id}`} className="block overflow-hidden mb-4 rounded-2xl">
        <div className="w-full h-48 bg-slate-950/70 border border-slate-800/60 rounded-2xl flex items-center justify-center p-4 relative overflow-hidden group-hover:border-slate-700 transition">
          <img
            src={product.image}
            alt={product.name}
            className="max-h-full max-w-full object-contain rounded-xl group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Best Deal Badge */}
          <div className="absolute bottom-2.5 left-2.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-md">
            Best on {bestDealStore}
          </div>

          {/* Stock Badge */}
          <div className="absolute top-2.5 left-2.5">
            {inStock ? (
              <span className="flex items-center gap-1 text-[10px] bg-slate-900/90 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                <CheckCircle2 size={11} /> In Stock
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] bg-slate-900/90 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-semibold">
                <XCircle size={11} /> Out of Stock
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Product Title & Ratings */}
      <div className="mb-4">
        <Link to={`/product/${product.id}`}>
          <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition line-clamp-1 mb-1.5">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1 text-amber-400 font-semibold bg-amber-400/10 px-2 py-0.5 rounded-md">
            <Star size={13} className="fill-amber-400" />
            {product.rating}
            {product.reviewsCount && (
              <span className="text-slate-500 text-[11px] font-normal">
                ({product.reviewsCount})
              </span>
            )}
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <Truck size={13} />
            {product.delivery}
          </span>
        </div>
      </div>

      {/* Multi-store quick price comparison preview */}
      <div className="grid grid-cols-3 gap-1.5 py-2.5 px-3 bg-slate-950/50 border border-slate-800/80 rounded-xl mb-4 text-[11px]">
        <div className="text-center">
          <span className="text-slate-400 block text-[10px]">Amazon</span>
          <span className="text-white font-medium">{product.amazon || "—"}</span>
        </div>
        <div className="text-center border-x border-slate-800">
          <span className="text-slate-400 block text-[10px]">Flipkart</span>
          <span className="text-white font-medium">{product.flipkart || "—"}</span>
        </div>
        <div className="text-center">
          <span className="text-slate-400 block text-[10px]">Croma</span>
          <span className="text-white font-medium">{product.croma || "—"}</span>
        </div>
      </div>

      {/* Price Footer & CTA */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between mt-auto">
        <div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
            Lowest Verified Price
          </span>
          <span className="text-xl font-extrabold text-white">
            {displayPrice}
          </span>
        </div>

        <Link
          to={`/product/${product.id}`}
          className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition shadow-md shadow-indigo-600/20 group-hover:scale-105"
        >
          Compare
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;
