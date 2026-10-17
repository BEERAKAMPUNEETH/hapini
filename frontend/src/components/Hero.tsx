import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Tag } from "lucide-react";
import { Product } from "../types";
import defaultProducts from "../data/products";
import FeatureCard from "./FeatureCard";
import SearchBar from "./SearchBar";

interface HeroProps {
  productsList?: Product[];
}

export const Hero: React.FC<HeroProps> = ({ productsList = defaultProducts }) => {
  const [search, setSearch] = useState("");

  const filteredProducts = productsList.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="flex flex-col items-center justify-center text-center px-6 pt-16 md:pt-24 max-w-6xl mx-auto w-full">
      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-5xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl"
      >
        Compare Prices
        <span className="block bg-gradient-to-r from-indigo-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent mt-2">
          Across Every Store
        </span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.7 }}
        className="text-slate-400 mt-6 max-w-2xl text-base md:text-lg leading-relaxed"
      >
        Find the verified best deals across Amazon, Flipkart, Croma and more in seconds.
        Track historical price drops and review insights.
      </motion.p>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.7 }}
        className="mt-10 w-full max-w-2xl relative z-20"
      >
        <SearchBar value={search} onChange={setSearch} />

        {/* Live Search Results Dropdown */}
        {search.trim() && (
          <div className="absolute top-full left-0 right-0 mt-3 bg-slate-900/95 border border-slate-700/80 rounded-2xl p-3 shadow-2xl backdrop-blur-xl text-left max-h-96 overflow-y-auto z-30">
            {filteredProducts.length > 0 ? (
              <div className="space-y-2">
                {filteredProducts.map((product) => {
                  const bestStore = product.bestDeal || "Best Price";
                  const price = product.lowestPrice || product.flipkart || product.amazon;
                  return (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      className="flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition group"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-contain bg-slate-950 p-1 border border-slate-800"
                        />
                        <div>
                          <h4 className="font-semibold text-white group-hover:text-indigo-400 transition text-sm md:text-base">
                            {product.name}
                          </h4>
                          <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Tag size={12} className="text-emerald-400" />
                            Best Deal at {bestStore}: <strong className="text-emerald-400">{price}</strong>
                          </span>
                        </div>
                      </div>
                      <ArrowRight size={18} className="text-slate-500 group-hover:text-indigo-400 transition transform group-hover:translate-x-1" />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-sm">
                No matching products found for "{search}".
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Marketplace Badges */}
      <div className="flex flex-wrap justify-center gap-3 mt-10">
        {["Amazon", "Flipkart", "Croma", "Reliance Digital", "Vijay Sales"].map((store) => (
          <div
            key={store}
            className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs md:text-sm font-medium px-4 py-2 rounded-full backdrop-blur-sm transition"
          >
            {store}
          </div>
        ))}
      </div>

      {/* Feature Cards Grid */}
      <div id="features" className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-20 w-full">
        <FeatureCard
          icon="📈"
          title="Price Tracking"
          description="Visual charts tracking historical price changes across all major stores."
        />
        <FeatureCard
          icon="🤖"
          title="AI Reviews"
          description="Synthesized feedback condensing hundreds of customer reviews into pros & cons."
        />
        <FeatureCard
          icon="🔔"
          title="Price Alerts"
          description="Instant notifications whenever your saved items drop to target threshold prices."
        />
        <FeatureCard
          icon="❤️"
          title="Wishlist"
          description="Bookmark high-ticket tech products and monitor deal changes in one dashboard."
        />
      </div>
    </section>
  );
};

export default Hero;
