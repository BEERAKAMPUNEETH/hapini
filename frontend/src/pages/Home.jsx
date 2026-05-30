import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import FeaturedProducts from "../components/FeaturedProducts";

function Home() {
  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-hidden">

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-indigo-500/20 blur-[150px]" />

      <Navbar />
      <Hero />
      <FeaturedProducts />

    </div>
  );
}

export default Home;