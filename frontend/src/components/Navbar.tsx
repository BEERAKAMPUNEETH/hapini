import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, Heart, Menu, X, ArrowUpRight, LogOut, User as UserIcon, Bell } from "lucide-react";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";

export const Navbar: React.FC = () => {
  const { wishlistCount } = useWishlist();
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isHome = location.pathname === "/";
  const isWishlist = location.pathname === "/wishlist";

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-900 transition-all">
      <nav className="flex items-center justify-between px-6 md:px-10 py-4 max-w-7xl mx-auto w-full">
        {/* Hapini Branding */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="bg-indigo-600/20 p-2 rounded-xl border border-indigo-500/30 group-hover:bg-indigo-600/30 group-hover:border-indigo-500/50 transition">
            <ShoppingBag className="text-indigo-400 group-hover:text-indigo-300 transition" size={24} />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
              Hapini
            </span>
            <span className="hidden sm:inline-block text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full ml-2 border border-indigo-500/20">
              Smart Arbitrage
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8 text-slate-300 font-medium text-sm">
          <Link
            to="/"
            className={`transition ${isHome ? "text-indigo-400 font-semibold" : "hover:text-white"}`}
          >
            Home
          </Link>
          <a href="/#products" className="hover:text-white transition">
            All Deals
          </a>
          <a href="/#categories" className="hover:text-white transition">
            Categories
          </a>
          <a href="/#features" className="hover:text-white transition">
            Why Hapini
          </a>
          <Link
            to="/alerts"
            className={`transition ${location.pathname === "/alerts" ? "text-amber-400 font-semibold" : "hover:text-white"}`}
          >
            Price Alerts
          </Link>
        </div>

        {/* Action Buttons: Wishlist & Auth */}
        <div className="flex items-center gap-3">
          {/* Wishlist Link with Badge */}
          <Link
            to="/wishlist"
            className={`relative p-2.5 rounded-xl border transition flex items-center gap-1.5 ${
              isWishlist
                ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-400"
                : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700"
            }`}
            aria-label="View Saved Wishlist"
          >
            <Heart size={18} className={wishlistCount > 0 ? "fill-rose-500 text-rose-500" : ""} />
            <span className="hidden sm:inline text-xs font-semibold">Wishlist</span>
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-lg shadow-rose-500/40">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Authentication State Controls */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 p-1.5 sm:px-3 sm:py-1.5 rounded-xl transition cursor-pointer text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 text-xs font-bold">
                  {getInitials(user.name)}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-semibold text-white leading-tight">
                    {user.name.split(" ")[0]}
                  </div>
                </div>
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-800/80">
                    <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</p>
                  </div>
                  <Link
                    to="/wishlist"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition"
                  >
                    <Heart size={14} className="text-rose-400" />
                    <span>My Wishlist ({wishlistCount})</span>
                  </Link>
                  <Link
                    to="/alerts"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition"
                  >
                    <Bell size={14} className="text-amber-400" />
                    <span>Price Alerts</span>
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition cursor-pointer text-left"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 px-3.5 sm:px-4 py-2 rounded-xl font-semibold text-xs text-white transition shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer"
            >
              <UserIcon size={14} />
              <span>Sign In</span>
              <ArrowUpRight size={13} className="hidden sm:inline" />
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-900 bg-slate-950 px-6 py-4 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-300 hover:text-indigo-400 font-medium py-1 text-sm"
          >
            Home
          </Link>
          <a
            href="/#products"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-300 hover:text-indigo-400 font-medium py-1 text-sm"
          >
            All Deals
          </a>
          <a
            href="/#categories"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-300 hover:text-indigo-400 font-medium py-1 text-sm"
          >
            Categories
          </a>
          <Link
            to="/wishlist"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between text-slate-300 hover:text-indigo-400 font-medium py-1 text-sm"
          >
            <span>Saved Wishlist</span>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold">
              {wishlistCount}
            </span>
          </Link>
          <Link
            to="/alerts"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-300 hover:text-indigo-400 font-medium py-1 text-sm"
          >
            Price Drop Alerts
          </Link>

          {isAuthenticated && user ? (
            <div className="pt-3 border-t border-slate-900 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-white">{user.name}</p>
                <p className="text-[11px] text-slate-400">{user.email}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-2 py-1"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-900">
              <button
                type="button"
                onClick={() => {
                  openAuthModal("login");
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold text-center"
              >
                Sign In / Register
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
