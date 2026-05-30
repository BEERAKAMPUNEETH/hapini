import { motion } from "framer-motion";
import { Search } from "lucide-react";

function Hero() {
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

          <Search className="text-slate-500" />

          <input
            type="text"
            placeholder="Search for products..."
            className="bg-transparent outline-none flex-1 px-3"
          />

          <button className="bg-indigo-600 px-5 py-2 rounded-xl hover:bg-indigo-500 transition">
            Search
          </button>

        </div>
      </motion.div>

    </section>
  );
}

export default Hero;