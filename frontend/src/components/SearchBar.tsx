import React from "react";
import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search for smartphones, laptops, electronics...",
  className = "",
}) => {
  return (
    <div className={`relative w-full ${className}`}>
      <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-2xl px-5 py-4 shadow-xl shadow-slate-950/50 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition">
        <Search className="text-slate-400 pointer-events-none mr-3 shrink-0" size={20} />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent outline-none flex-1 text-white placeholder-slate-500 text-base w-full"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg ml-2 transition"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
