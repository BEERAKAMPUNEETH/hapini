import React from "react";

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 h-full flex flex-col justify-between animate-pulse">
      <div>
        <div className="w-full h-48 bg-slate-800/60 rounded-2xl mb-5" />
        <div className="h-4 bg-slate-800/80 rounded-md w-1/3 mb-3" />
        <div className="h-6 bg-slate-800 rounded-md w-3/4 mb-3" />
        <div className="h-4 bg-slate-800/70 rounded-md w-1/2 mb-4" />
      </div>
      <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
        <div className="space-y-1.5 w-1/2">
          <div className="h-3 bg-slate-800/60 rounded w-1/3" />
          <div className="h-6 bg-slate-800 rounded w-3/4" />
        </div>
        <div className="w-10 h-10 bg-slate-800 rounded-xl" />
      </div>
    </div>
  );
};

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
};

export default ProductGridSkeleton;
