import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import products from "../data/products";
import FeatureCard from "./FeatureCard";

function Hero() {
  const [search, setSearch] = useState("");

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section className="flex flex-col items-center justify-center text-center px-6 pt-24">

      <motion.h1
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-6xl md:text-7xl font-bold"
      >
        Compare Prices
        <span className="block text-indigo-500">
          Across Every Store
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-slate-400 mt-6 max-w-2xl text-lg"
      >
        Find the best deals from Amazon, Flipkart,
        Croma and more in seconds.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-10 w-full max-w-2xl"
      >
        <div className="flex items-center bg-slate-900 border border-slate-700 rounded-2xl px-5 py-4">

          <Search className="text-slate-500 pointer-events-none" />

          <input
            type="text"
            placeholder="Search for products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none flex-1 px-3 w-full"
          />

          <button className="bg-indigo-600 px-5 py-2 rounded-xl hover:bg-indigo-500 transition">
            Search
          </button>

        </div>
      </motion.div>

      {/* Search Results */}

      {search && (
        <div className="mt-8 w-full max-w-2xl">

          {filteredProducts.length > 0 ? (

            filteredProducts.map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
              >
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-3 hover:border-indigo-500 transition">

                  <h3 className="font-semibold">
                    {product.name}
                  </h3>

                  <p className="text-green-400">
                    Best Deal: {product.bestDeal}
                  </p>

                </div>
              </Link>
            ))

          ) : (

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              No products found.
            </div>

          )}

        </div>
      )}

      {/* Marketplace Badges */}

      <div className="flex flex-wrap justify-center gap-4 mt-12">

        <div className="bg-slate-900/70 border border-slate-700 px-5 py-2 rounded-full">
          Amazon
        </div>

        <div className="bg-slate-900/70 border border-slate-700 px-5 py-2 rounded-full">
          Flipkart
        </div>

        <div className="bg-slate-900/70 border border-slate-700 px-5 py-2 rounded-full">
          Croma
        </div>

        <div className="bg-slate-900/70 border border-slate-700 px-5 py-2 rounded-full">
          Reliance Digital
        </div>

      </div>

      {/* Feature Cards */}

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-24 w-full max-w-6xl">

        <FeatureCard
          icon="📈"
          title="Price Tracking"
          description="Track price changes across stores."
        />

        <FeatureCard
          icon="🤖"
          title="AI Reviews"
          description="Summarize thousands of reviews instantly."
        />

        <FeatureCard
          icon="🔔"
          title="Price Alerts"
          description="Get notified when prices drop."
        />

        <FeatureCard
          icon="❤️"
          title="Wishlist"
          description="Save products and monitor them."
        />

      </div>

    </section>
  );
}

export default Hero;