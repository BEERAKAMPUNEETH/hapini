import React, { useState } from "react";
import { X, Bell, CheckCircle2, AlertCircle, Loader2, Store } from "lucide-react";
import { Product, PriceAlert } from "../types";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

interface PriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onAlertCreated?: (alert: PriceAlert) => void;
}

export const PriceAlertModal: React.FC<PriceAlertModalProps> = ({
  isOpen,
  onClose,
  product,
  onAlertCreated,
}) => {
  const { isAuthenticated, user, openAuthModal } = useAuth();

  const currentPrice = product.numericPrice || 50000;
  const [targetPrice, setTargetPrice] = useState<string>(
    String(Math.floor(currentPrice * 0.9)) // Default to 10% drop
  );
  const [retailerName, setRetailerName] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handlePreset = (percentage: number) => {
    const calculated = Math.floor(currentPrice * (1 - percentage / 100));
    setTargetPrice(String(calculated));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal("login");
      return;
    }

    const num = Number(targetPrice);
    if (isNaN(num) || num <= 0) {
      setError("Please enter a valid positive target price");
      return;
    }

    if (num >= currentPrice) {
      setError(`Target price should be lower than the current price (₹${currentPrice.toLocaleString("en-IN")})`);
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const alert = await api.createPriceAlert(
        product.id,
        num,
        retailerName || undefined
      );
      setSuccess(true);
      if (onAlertCreated) {
        onAlertCreated(alert);
      }
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || "Failed to create price alert. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow decoration */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl">
            <Bell size={24} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Set Price Drop Alert
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              We'll notify you as soon as the price falls to or below your target.
            </p>
          </div>
        </div>

        {/* Product Snapshot */}
        <div className="flex items-center gap-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 mb-6">
          <div className="w-14 h-14 bg-slate-900 rounded-xl p-2 shrink-0 flex items-center justify-center border border-slate-800">
            <img
              src={product.image}
              alt={product.name}
              className="max-h-full max-w-full object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase font-bold text-indigo-400">{product.brand || product.category}</p>
            <h3 className="text-sm font-semibold text-white truncate">{product.name}</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Current Best: <strong className="text-emerald-400 font-bold">₹{currentPrice.toLocaleString("en-IN")}</strong>
            </p>
          </div>
        </div>

        {/* Success Confirmation */}
        {success ? (
          <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-col items-center justify-center text-center my-4">
            <CheckCircle2 size={40} className="text-emerald-400 mb-2" />
            <h4 className="text-base font-bold text-white">Alert Activated!</h4>
            <p className="text-xs text-slate-300 mt-1">
              Tracking {product.name} for drops below ₹{Number(targetPrice).toLocaleString("en-IN")}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-2.5 text-rose-400 text-xs">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Target Price */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Target Price (₹)
                </label>
                <span className="text-[11px] text-slate-400">
                  Current: ₹{currentPrice.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-sm font-bold">
                  ₹
                </div>
                <input
                  type="number"
                  required
                  min={1}
                  max={currentPrice - 1}
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="e.g. 69999"
                  className="w-full pl-9 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white text-base font-bold placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Discount Presets */}
              <div className="flex items-center gap-2 mt-2.5">
                <span className="text-[11px] text-slate-500">Quick set:</span>
                {[5, 10, 15, 20].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handlePreset(pct)}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition cursor-pointer"
                  >
                    -{pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Retailer Preference */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Retailer Preference (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Store size={16} />
                </div>
                <select
                  value={retailerName}
                  onChange={(e) => setRetailerName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-xs focus:outline-none focus:border-amber-500 transition"
                >
                  <option value="">Any Retailer (Best Deal Across All)</option>
                  {product.stores && product.stores.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name} (Current: {s.price})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notification Destination */}
            <div className="text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 flex items-center justify-between">
              <span>Notify Email:</span>
              <strong className="text-white font-mono">
                {isAuthenticated && user ? user.email : "Sign in required to verify email"}
              </strong>
            </div>

            {/* Submit Button */}
            {isAuthenticated ? (
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-2xl shadow-lg shadow-amber-500/25 transition duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 text-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Activating Alert...</span>
                  </>
                ) : (
                  <>
                    <Bell size={16} />
                    <span>Activate Price Alert</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal("login")}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/25 transition flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <span>Sign In to Activate Price Alert</span>
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default PriceAlertModal;
