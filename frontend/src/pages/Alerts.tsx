import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  ArrowLeft,
  Trash2,
  Play,
  Pause,
  Zap,
  CheckCircle2,
  Clock,
  Store,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import EmptyState from "../components/EmptyState";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { PriceAlert } from "../types";

export const Alerts: React.FC = () => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [simulatingId, setSimulatingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadAlerts = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await api.getUserAlerts();
      setAlerts(data);
    } catch (err) {
      console.warn("Failed to load user alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [isAuthenticated]);

  const handleToggleActive = async (alert: PriceAlert) => {
    try {
      const updated = await api.updatePriceAlert(alert.id, {
        isActive: !alert.isActive,
      });
      setAlerts((prev) => prev.map((a) => (a.id === alert.id ? updated : a)));
      showMessage(updated.isActive ? "Alert resumed" : "Alert paused");
    } catch (err: any) {
      showMessage(err.message || "Failed to update alert");
    }
  };

  const handleDelete = async (alertId: string) => {
    try {
      await api.deletePriceAlert(alertId);
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      showMessage("Alert deleted successfully");
    } catch (err: any) {
      showMessage(err.message || "Failed to delete alert");
    }
  };

  const handleSimulateDrop = async (alert: PriceAlert) => {
    setSimulatingId(alert.id);
    try {
      // Simulate price dropping to 2% below the user's target price
      const simulatedPrice = Math.floor(alert.targetPrice * 0.98);
      await api.simulatePriceChange(alert.productId, simulatedPrice, alert.retailerName);
      showMessage(`Simulated price drop to ₹${simulatedPrice.toLocaleString("en-IN")}. Alert triggered!`);
      // Reload alerts to see triggered status
      await loadAlerts();
    } catch (err: any) {
      showMessage(err.message || "Simulation failed");
    } finally {
      setSimulatingId(null);
    }
  };

  const showMessage = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3000);
  };

  const activeCount = alerts.filter((a) => a.isActive).length;
  const triggeredCount = alerts.filter((a) => a.triggeredAt).length;

  return (
    <div className="relative min-h-screen bg-slate-950 text-white flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Glow accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-amber-500/10 blur-[160px] pointer-events-none rounded-full" />

      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-6 md:px-10 py-10 w-full">
        {/* Navigation Breadcrumb */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium text-sm transition mb-8"
        >
          <ArrowLeft size={16} />
          Back to all products
        </Link>

        {/* Action toast message */}
        {actionMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-amber-500/40 text-amber-300 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-bottom-3 duration-200">
            <Zap size={18} className="text-amber-400 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Unauthenticated Security Banner */}
        {!isAuthenticated && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <ShieldAlert size={24} className="text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <p className="text-sm font-semibold text-white">Sign In to Manage Your Price Alerts</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Track price drops across Amazon, Flipkart, and Croma with real-time notifications.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => openAuthModal("login")}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-amber-500/20 shrink-0"
            >
              Sign In to View Alerts
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-900">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                <Bell size={24} />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                  Price Drop Alerts
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  Active monitors scanning retailer prices for target drop thresholds.
                </p>
              </div>
            </div>
          </div>

          {alerts.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs bg-slate-900 border border-slate-800 text-emerald-400 px-3 py-1.5 rounded-xl font-medium">
                {activeCount} Active
              </span>
              <span className="text-xs bg-slate-900 border border-slate-800 text-amber-400 px-3 py-1.5 rounded-xl font-medium">
                {triggeredCount} Triggered
              </span>
            </div>
          )}
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 size={32} className="animate-spin text-amber-500 mb-3" />
            <p className="text-sm">Loading your active price alerts...</p>
          </div>
        ) : alerts.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {alerts.map((alert) => {
              const product = alert.product;
              const currentPrice = product?.numericPrice || 0;
              const isTriggered = !!alert.triggeredAt;

              return (
                <div
                  key={alert.id}
                  className={`bg-slate-900/70 border rounded-3xl p-5 flex flex-col justify-between transition-all duration-300 backdrop-blur-sm ${
                    isTriggered
                      ? "border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.15)]"
                      : alert.isActive
                      ? "border-slate-800 hover:border-amber-500/40"
                      : "border-slate-800/50 opacity-60"
                  }`}
                >
                  {/* Top row: Status Badge & Delete */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      {isTriggered ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                          <CheckCircle2 size={13} />
                          Triggered (Target Reached)
                        </span>
                      ) : alert.isActive ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full animate-pulse">
                          <Clock size={13} />
                          Active Tracking
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-full">
                          Paused
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(alert.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                        title="Delete alert"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Product Summary */}
                    {product && (
                      <Link
                        to={`/product/${product.id}`}
                        className="flex items-center gap-3 group mb-4"
                      >
                        <div className="w-14 h-14 bg-slate-950 border border-slate-800 rounded-xl p-2 shrink-0 flex items-center justify-center">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold uppercase text-indigo-400">
                            {product.category}
                          </p>
                          <h3 className="text-sm font-semibold text-white truncate group-hover:text-indigo-300 transition">
                            {product.name}
                          </h3>
                        </div>
                      </Link>
                    )}

                    {/* Target vs Live Metrics */}
                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 mb-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Your Target:</span>
                        <strong className="text-amber-400 font-bold text-sm">
                          ₹{alert.targetPrice.toLocaleString("en-IN")}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Current Market:</span>
                        <span className="text-white font-semibold">
                          ₹{currentPrice.toLocaleString("en-IN")}
                        </span>
                      </div>

                      {alert.retailerName && (
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-900">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Store size={12} />
                            Store:
                          </span>
                          <span className="text-slate-300 font-medium">
                            {alert.retailerName}
                          </span>
                        </div>
                      )}

                      {alert.triggeredPrice && (
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-900 text-emerald-400 font-semibold">
                          <span>Trigger Price:</span>
                          <span>₹{alert.triggeredPrice.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & Simulation Trigger */}
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(alert)}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer font-medium"
                    >
                      {alert.isActive ? (
                        <>
                          <Pause size={12} />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play size={12} />
                          Resume
                        </>
                      )}
                    </button>

                    {/* Developer Simulation Trigger */}
                    <button
                      type="button"
                      disabled={simulatingId === alert.id}
                      onClick={() => handleSimulateDrop(alert)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 px-3 py-1.5 rounded-xl transition cursor-pointer disabled:opacity-50"
                      title="Simulate price drop below target to test real-time alert trigger"
                    >
                      {simulatingId === alert.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Zap size={12} />
                      )}
                      <span>Test Trigger</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Bell}
            title="No Price Alerts Active"
            description="You haven't set any price drop alerts yet. Open any product page and click 'Set Price Alert' to automatically track when prices reach your budget."
            actionText="Explore Products"
            actionLink="/"
          />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Alerts;
