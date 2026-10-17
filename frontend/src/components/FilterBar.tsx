import React from "react";
import { SlidersHorizontal, ArrowDownUp, CheckSquare, Square, RotateCcw } from "lucide-react";
import { FilterState, SortOption } from "../types";

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onReset: () => void;
  totalResults: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  totalResults,
}) => {
  const hasActiveFilters =
    filters.selectedCategory !== "All" ||
    filters.searchQuery.trim() !== "" ||
    filters.inStockOnly ||
    filters.sortBy !== "featured";

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 md:p-5 backdrop-blur-md mb-8 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Results counter & Status */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg border border-indigo-500/20">
            <SlidersHorizontal size={18} />
          </div>
          <div>
            <span className="text-white font-bold text-sm md:text-base">
              {totalResults} {totalResults === 1 ? "Product" : "Products"} Found
            </span>
            {filters.selectedCategory !== "All" && (
              <span className="text-xs text-indigo-400 block font-medium">
                in {filters.selectedCategory}
              </span>
            )}
          </div>
        </div>

        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-3 md:gap-4 ml-auto">
          {/* In-Stock Only Toggle */}
          <button
            type="button"
            onClick={() => onFilterChange({ inStockOnly: !filters.inStockOnly })}
            className={`flex items-center gap-1.5 text-xs md:text-sm font-medium px-3.5 py-2 rounded-xl border transition cursor-pointer ${
              filters.inStockOnly
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white"
            }`}
          >
            {filters.inStockOnly ? (
              <CheckSquare size={16} className="text-emerald-400" />
            ) : (
              <Square size={16} />
            )}
            In Stock Only
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs md:text-sm text-slate-300">
            <ArrowDownUp size={15} className="text-indigo-400 shrink-0" />
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ sortBy: e.target.value as SortOption })}
              className="bg-transparent text-white outline-none cursor-pointer pr-2 font-medium"
            >
              <option value="featured" className="bg-slate-900 text-white">
                Featured
              </option>
              <option value="price-asc" className="bg-slate-900 text-white">
                Price: Low to High
              </option>
              <option value="price-desc" className="bg-slate-900 text-white">
                Price: High to Low
              </option>
              <option value="rating-desc" className="bg-slate-900 text-white">
                Highest Rated
              </option>
            </select>
          </div>

          {/* Reset Filters button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
            >
              <RotateCcw size={13} />
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
