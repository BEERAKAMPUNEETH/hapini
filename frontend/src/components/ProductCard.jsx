import { Link } from "react-router-dom";

function ProductCard({ product }) {
  return (
    <Link to={`/product/${product.id}`}>
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 hover:scale-105 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.25)] transition-all duration-300">

        <h3 className="text-xl font-semibold mb-3">
          {product.name}
        </h3>

        <p className="text-green-400 mb-2">
          Best Deal: {product.bestDeal}
        </p>

        <p className="text-2xl font-bold">
          {product.price}
        </p>

      </div>
    </Link>
  );
}

export default ProductCard;