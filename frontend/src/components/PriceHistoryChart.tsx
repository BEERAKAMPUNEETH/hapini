import React, { useMemo } from "react";
import {
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  ComposedChart,
} from "recharts";
import { TrendingDown, ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { PriceHistoryPoint } from "../types";

interface PriceHistoryChartProps {
  data: PriceHistoryPoint[];
  currentPrice?: string;
}

export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({
  data,
  currentPrice,
}) => {
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;
    const prices = data.map((d) => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const first = prices[0];
    const last = prices[prices.length - 1];
    const drop = first - last;
    const percentDrop = ((drop / first) * 100).toFixed(1);

    return { min, max, drop, percentDrop };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500 text-sm">
        No price history recorded yet for this product.
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Chart Summary Metrics */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 text-xs">
          <div>
            <span className="text-slate-400 block mb-0.5">Current Best Price</span>
            <span className="text-white font-bold text-base">
              {currentPrice || `₹${stats.min.toLocaleString("en-IN")}`}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">All-Time High</span>
            <span className="text-slate-300 font-bold text-base">
              ₹{stats.max.toLocaleString("en-IN")}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Recent Trajectory</span>
            <span
              className={`font-bold text-base flex items-center gap-1 ${
                stats.drop > 0
                  ? "text-emerald-400"
                  : stats.drop < 0
                  ? "text-rose-400"
                  : "text-slate-300"
              }`}
            >
              {stats.drop > 0 ? (
                <>
                  <ArrowDownRight size={16} /> -{stats.percentDrop}%
                </>
              ) : stats.drop < 0 ? (
                <>
                  <ArrowUpRight size={16} /> +{Math.abs(Number(stats.percentDrop))}%
                </>
              ) : (
                <>
                  <Minus size={16} /> Stable
                </>
              )}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-0.5">Market Status</span>
            <span className="text-indigo-400 font-semibold text-xs flex items-center gap-1 mt-1">
              <TrendingDown size={14} /> At Recent Low
            </span>
          </div>
        </div>
      )}

      {/* Chart Canvas */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 15, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="#64748b"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              axisLine={{ stroke: "#334155" }}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              axisLine={{ stroke: "#334155" }}
              domain={["dataMin - 2000", "dataMax + 2000"]}
              tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#090d16",
                borderColor: "#334155",
                borderRadius: "0.75rem",
                color: "#fff",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
              }}
              formatter={(value: any) => [
                `₹${Number(value).toLocaleString("en-IN")}`,
                "Recorded Price",
              ]}
              labelStyle={{ color: "#94a3b8", fontWeight: 600, marginBottom: "4px" }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="none"
              fill="url(#priceGradient)"
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#6366f1"
              strokeWidth={3}
              dot={{ fill: "#6366f1", r: 4, stroke: "#0f172a", strokeWidth: 2 }}
              activeDot={{ r: 7, stroke: "#818cf8", strokeWidth: 2, fill: "#fff" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PriceHistoryChart;
