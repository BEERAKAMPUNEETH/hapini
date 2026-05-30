import { useParams } from "react-router-dom";
import products from "../data/products";

function ProductDetails() {

  const { id } = useParams();

  const product = products.find(
    (item) => item.id === Number(id)
  );

  if (!product) {
    return (
      <h1 className="text-white text-center mt-20">
        Product Not Found
      </h1>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-10">

      <h1 className="text-5xl font-bold mb-10">
        {product.name}
      </h1>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-3xl">

        <h2 className="text-2xl text-green-400 mb-6">
          🏆 Best Deal: {product.bestDeal}
        </h2>

        <div className="space-y-4">

          <p>
            Amazon: {product.amazon}
          </p>

          <p>
            Flipkart: {product.flipkart}
          </p>

          <p>
            Croma: {product.croma}
          </p>

        </div>

      </div>

    </div>
  );
}

export default ProductDetails;