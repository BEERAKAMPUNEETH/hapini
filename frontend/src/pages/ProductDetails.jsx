import { useParams } from "react-router-dom";
import products from "../data/products";

function ProductDetails() {
  const { id } = useParams();

  const product = products.find(
    (item) => item.id === Number(id)
  );

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <h1 className="text-4xl font-bold">
          Product Not Found
        </h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-10">

      <div className="max-w-6xl mx-auto">

        <div className="grid md:grid-cols-2 gap-10">

          {/* Product Image */}

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex justify-center">
            <img
              src={product.image}
              alt={product.name}
              className="rounded-2xl"
            />
          </div>

          {/* Product Info */}

          <div>

            <h1 className="text-5xl font-bold mb-6">
              {product.name}
            </h1>

            <div className="space-y-4">

              <p className="text-xl">
                ⭐ Rating: {product.rating}
              </p>

              <p className="text-xl">
                🚚 Delivery: {product.delivery}
              </p>

              <p className="text-2xl text-green-400 font-semibold">
                🏆 Best Deal: {product.bestDeal}
              </p>

            </div>

          </div>

        </div>

        {/* Price Comparison */}

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 mt-12">

          <h2 className="text-3xl font-bold mb-6">
            Price Comparison
          </h2>

          <div className="space-y-4 text-lg">

            <div className="flex justify-between">
              <span>Amazon</span>
              <span>{product.amazon}</span>
            </div>

            <div className="flex justify-between">
              <span>Flipkart</span>
              <span>{product.flipkart}</span>
            </div>

            <div className="flex justify-between">
              <span>Croma</span>
              <span>{product.croma}</span>
            </div>

          </div>

        </div>

        {/* AI Review Summary */}

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 mt-12">

          <h2 className="text-3xl font-bold mb-4">
            🤖 AI Review Summary
          </h2>

          <p className="text-slate-400 leading-8">
            {product.reviewSummary}
          </p>

        </div>

      </div>

    </div>
  );
}

export default ProductDetails;