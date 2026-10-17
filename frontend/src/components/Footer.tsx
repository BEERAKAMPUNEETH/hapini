import React from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, ShieldCheck, Zap, Sparkles } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-900 bg-slate-950/80 pt-16 pb-12 mt-24 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Col 1: Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-indigo-600/20 p-2 rounded-xl border border-indigo-500/30">
                <ShoppingBag className="text-indigo-400" size={20} />
              </div>
              <span className="text-xl font-black text-white">Hapini</span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              Smart automated price arbitrage platform tracking real-time electronics prices across Amazon, Flipkart, Croma, and more.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 w-fit">
              <ShieldCheck size={14} /> 100% Unbiased Price Tracking
            </div>
          </div>

          {/* Col 2: Categories */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-xs uppercase tracking-wider">
              Top Categories
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li><Link to="/?category=Smartphones" className="hover:text-white transition">Flagship Smartphones</Link></li>
              <li><Link to="/?category=Laptops" className="hover:text-white transition">Pro Laptops & Workstations</Link></li>
              <li><Link to="/?category=Audio" className="hover:text-white transition">Wireless Audio & ANC</Link></li>
              <li><Link to="/?category=Smartwatches" className="hover:text-white transition">Wearables & Smartwatches</Link></li>
              <li><Link to="/?category=Gaming" className="hover:text-white transition">Next-Gen Gaming Consoles</Link></li>
            </ul>
          </div>

          {/* Col 3: Key Features */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-xs uppercase tracking-wider">
              Platform Features
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-1.5"><Zap size={13} className="text-indigo-400" /> Multi-Store Arbitrage</li>
              <li className="flex items-center gap-1.5"><Sparkles size={13} className="text-indigo-400" /> AI Review Summarization</li>
              <li className="flex items-center gap-1.5">📈 Historical Price Trends</li>
              <li className="flex items-center gap-1.5">🔔 Custom Price Drop Alerts</li>
            </ul>
          </div>

          {/* Col 4: Tech Stack Badge for SDE Portfolio */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl">
            <h4 className="text-white font-semibold mb-2 text-xs uppercase tracking-wider">
              SDE Placement Project
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              Built with React 19, TypeScript, Vite, Tailwind CSS v4, Node.js, Express, PostgreSQL, Redis, and Docker.
            </p>
            <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
              Clean Monorepo Architecture
            </span>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Hapini. All trademarks and store logos belong to their respective owners.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-400 transition">Privacy Policy</a>
            <a href="#" className="hover:text-slate-400 transition">Terms of Service</a>
            <a href="#" className="hover:text-slate-400 transition">API Documentation</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
