function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 hover:scale-105 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.25)] transition-all duration-300">

      <div className="text-4xl mb-4">
        {icon}
      </div>

      <h3 className="text-xl font-semibold mb-2">
        {title}
      </h3>

      <p className="text-slate-400">
        {description}
      </p>

    </div>
  );
}

export default FeatureCard;