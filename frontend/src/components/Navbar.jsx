import { ShoppingBag } from "lucide-react";

function Navbar() {
  return (
    <nav className="flex items-center justify-between px-10 py-6">
      <div className="flex items-center gap-2">
        <ShoppingBag size={30} />
        <h1 className="text-2xl font-bold">Hapini</h1>
      </div>

      <div className="hidden md:flex gap-8 text-slate-300">
        <a href="#">Home</a>
        <a href="#">Compare</a>
        <a href="#">Categories</a>
        <a href="#">Wishlist</a>
      </div>

      <button className="bg-indigo-600 px-5 py-2 rounded-xl hover:bg-indigo-500 transition">
        Sign In
      </button>
    </nav>
  );
}

export default Navbar;