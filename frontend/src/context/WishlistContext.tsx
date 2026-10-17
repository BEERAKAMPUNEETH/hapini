import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { api } from "../services/api";

interface WishlistContextType {
  wishlist: (number | string)[];
  toggleWishlist: (productId: number | string) => Promise<void>;
  isInWishlist: (productId: number | string) => boolean;
  removeFromWishlist: (productId: number | string) => Promise<void>;
  clearWishlist: () => Promise<void>;
  wishlistCount: number;
  isLoading: boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = "hapini_local_wishlist";

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [wishlist, setWishlist] = useState<(number | string)[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync with backend whenever authentication state changes
  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        setWishlist(saved ? JSON.parse(saved) : []);
      } catch {
        setWishlist([]);
      }
      return;
    }

    setIsLoading(true);
    try {
      const backendIds = await api.getWishlistIds();
      setWishlist(backendIds);
    } catch (err) {
      console.warn("Failed to retrieve user wishlist from server:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const toggleWishlist = async (productId: number | string): Promise<void> => {
    if (!isAuthenticated) {
      // Prompt user to log in before adding to persistent wishlist
      openAuthModal("login");
      return;
    }

    // Optimistic UI update
    const isCurrentlyWishlisted = wishlist.some(
      (id) => String(id) === String(productId)
    );

    setWishlist((prev) =>
      isCurrentlyWishlisted
        ? prev.filter((id) => String(id) !== String(productId))
        : [...prev, productId]
    );

    try {
      await api.toggleWishlist(productId);
    } catch (err) {
      console.error("Failed to toggle product in backend wishlist:", err);
      // Rollback on failure
      setWishlist((prev) =>
        isCurrentlyWishlisted
          ? [...prev, productId]
          : prev.filter((id) => String(id) !== String(productId))
      );
    }
  };

  const removeFromWishlist = async (productId: number | string): Promise<void> => {
    setWishlist((prev) => prev.filter((id) => String(id) !== String(productId)));

    if (isAuthenticated) {
      try {
        await api.removeFromWishlist(productId);
      } catch (err) {
        console.error("Failed to remove product from backend wishlist:", err);
      }
    } else {
      try {
        const updated = wishlist.filter((id) => String(id) !== String(productId));
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn("Local storage write failed:", e);
      }
    }
  };

  const isInWishlist = (productId: number | string): boolean => {
    return wishlist.some((id) => String(id) === String(productId));
  };

  const clearWishlist = async (): Promise<void> => {
    const previous = [...wishlist];
    setWishlist([]);

    if (isAuthenticated) {
      try {
        for (const id of previous) {
          await api.removeFromWishlist(id);
        }
      } catch (err) {
        console.error("Failed to clear backend wishlist:", err);
      }
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        toggleWishlist,
        isInWishlist,
        removeFromWishlist,
        clearWishlist,
        wishlistCount: wishlist.length,
        isLoading,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};
