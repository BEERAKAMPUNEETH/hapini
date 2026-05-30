function Stats() {
  const stats = [
    { value: "100K+", label: "Products" },
    { value: "20+", label: "Stores" },
    { value: "24/7", label: "Price Tracking" },
    { value: "AI", label: "Review Analysis" },
  ];

  return (
    <section className="max-w-6xl mx-auto mt-24 px-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">

        {stats.map((stat) => (
          <div key={stat.label}>
            <h2 className="text-4xl font-bold text-indigo-400">
              {stat.value}
            </h2>

            <p className="text-slate-400 mt-2">
              {stat.label}
            </p>
          </div>
        ))}

      </div>
    </section>
  );
}

export default Stats;