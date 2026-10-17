import React from "react";
import { categories } from "../data/products";

interface CategoryPillsProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  productCounts?: Record<string, number>;
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  selectedCategory,
  onSelectCategory,
  productCounts,
}) => {
  return (
    <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none max-w-full">
      {categories.map((category) => {
        const isSelected = selectedCategory === category;
        const count = productCounts ? productCounts[category] : undefined;

        return (
          <button
            key={category}
            type="button"
            onClick={() => onSelectCategory(category)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 border cursor-pointer select-none ${
              isSelected
                ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30 scale-105"
                : "bg-slate-900/70 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-800/80"
            }`}
          >
            {category}
            {count !== undefined && (
              <span
                className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  isSelected ? "bg-indigo-700/60 text-white" : "bg-slate-800 text-slate-400"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryPills;
