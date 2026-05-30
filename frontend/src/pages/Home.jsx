import Navbar from "../components/Navbar";
import Hero from "../components/Hero";

function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <Hero />
    </div>
  );
}

export default Home;