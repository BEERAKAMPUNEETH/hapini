import React from "react";
import { StatItem } from "../types";

export const Stats: React.FC = () => {
  const stats: StatItem[] = [
    { value: "100K+", label: "Products Tracked" },
    { value: "20+", label: "Retail Stores" },
    { value: "24/7", label: "Real-time Alerts" },
    { value: "AI", label: "Review Summaries" },
  ];

  return (
    <section id="stats" className="max-w-6xl mx-auto mt-20 px-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm"
          >
            <h2 className="text-4xl font-extrabold text-indigo-400 tracking-tight">
              {stat.value}
            </h2>
            <p className="text-slate-400 mt-2 text-sm font-medium">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Stats;
