import React from "react";
import { Product } from "../types";
import defaultProducts from "../data/products";
import ProductCard from "./ProductCard";

interface FeaturedProductsProps {
  productsList?: Product[];
}

export const FeaturedProducts: React.FC<FeaturedProductsProps> = ({
  productsList = defaultProducts,
}) => {
  return (
    <section id="featured" className="max-w-6xl mx-auto mt-24 mb-20 px-6">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Featured Comparisons
        </h2>
        <p className="text-slate-400 mt-2 text-sm md:text-base">
          Hand-picked tech deals analyzed across top e-commerce retailers.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {productsList.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default FeaturedProducts;
