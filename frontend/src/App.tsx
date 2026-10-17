import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ProductDetails from "./pages/ProductDetails";
import Wishlist from "./pages/Wishlist";
import Alerts from "./pages/Alerts";
import { AuthProvider } from "./context/AuthContext";
import { WishlistProvider } from "./context/WishlistContext";
import AuthModal from "./components/AuthModal";

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <WishlistProvider>
        <BrowserRouter>
          <AuthModal />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/alerts" element={<Alerts />} />
            {/* Fallback to Home for unknown routes */}
            <Route path="*" element={<Home />} />
          </Routes>
        </BrowserRouter>
      </WishlistProvider>
    </AuthProvider>
  );
};

export default App;
