import products from "../data/products";
import ProductCard from "./ProductCard";

function FeaturedProducts() {
  return (
    <section className="max-w-6xl mx-auto mt-24 px-6">

      <h2 className="text-4xl font-bold text-center mb-12">
        Featured Products
      </h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
          />
        ))}

      </div>

    </section>
  );
}

export default FeaturedProducts;