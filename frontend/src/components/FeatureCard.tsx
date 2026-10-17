import React from "react";
import { FeatureItem } from "../types";

export const FeatureCard: React.FC<FeatureItem> = ({ icon, title, description }) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 hover:scale-105 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.25)] transition-all duration-300 flex flex-col items-center text-center">
      <div className="text-4xl mb-4 p-3 bg-slate-800/50 rounded-2xl border border-slate-700/50">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-white">
        {title}
      </h3>
      <p className="text-slate-400 text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
};

export default FeatureCard;
