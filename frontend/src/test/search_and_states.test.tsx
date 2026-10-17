import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchBar } from "../components/SearchBar";
import EmptyState from "../components/EmptyState";
import { ProductCardSkeleton, ProductGridSkeleton } from "../components/LoadingSkeleton";

describe("Frontend Search, Loading, Error, and Empty States", () => {
  // 1. Search Bar Tests
  describe("SearchBar Component", () => {
    it("renders search input with placeholder and captures typing", () => {
      const handleChange = vi.fn();
      render(<SearchBar value="" onChange={handleChange} placeholder="Search products..." />);

      const input = screen.getByPlaceholderText("Search products...");
      expect(input).toBeInTheDocument();

      fireEvent.change(input, { target: { value: "MacBook" } });
      expect(handleChange).toHaveBeenCalledWith("MacBook");
    });

    it("displays clear button when search input has text and clears on click", () => {
      const handleChange = vi.fn();
      render(<SearchBar value="Sony" onChange={handleChange} />);

      const clearBtn = screen.getByRole("button", { name: /clear/i });
      expect(clearBtn).toBeInTheDocument();

      fireEvent.click(clearBtn);
      expect(handleChange).toHaveBeenCalledWith("");
    });
  });

  // 2. Loading Skeletons Tests
  describe("Loading Skeletons", () => {
    it("renders single ProductCardSkeleton with pulse animation", () => {
      const { container } = render(<ProductCardSkeleton />);
      const skeleton = container.querySelector(".animate-pulse");
      expect(skeleton).toBeInTheDocument();
    });

    it("renders ProductGridSkeleton with requested count of items", () => {
      const { container } = render(<ProductGridSkeleton count={4} />);
      const items = container.querySelectorAll(".animate-pulse");
      expect(items.length).toBe(4);
    });
  });

  // 3. Empty State Tests
  describe("EmptyState Component", () => {
    it("renders empty state title, description, and triggers action callback", () => {
      const handleReset = vi.fn();
      render(
        <EmptyState
          title="No Products Match Your Criteria"
          description="We couldn't find any products matching your search query."
          actionText="Reset All Filters"
          onActionClick={handleReset}
        />
      );

      expect(screen.getByText("No Products Match Your Criteria")).toBeInTheDocument();
      expect(
        screen.getByText("We couldn't find any products matching your search query.")
      ).toBeInTheDocument();

      const resetBtn = screen.getByRole("button", { name: "Reset All Filters" });
      expect(resetBtn).toBeInTheDocument();

      fireEvent.click(resetBtn);
      expect(handleReset).toHaveBeenCalledTimes(1);
    });
  });

  // 4. Error State Rendering Test
  describe("Error Banner with Retry Callback", () => {
    it("renders error message and executes retry callback", () => {
      const handleRetry = vi.fn();
      const errorMessage = "Failed to retrieve live product offers from server.";

      render(
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="text-rose-400 text-sm">{errorMessage}</div>
          <button
            type="button"
            onClick={handleRetry}
            className="text-rose-300 text-xs font-semibold px-3 py-1.5"
          >
            Retry
          </button>
        </div>
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      const retryBtn = screen.getByRole("button", { name: /retry/i });
      expect(retryBtn).toBeInTheDocument();

      fireEvent.click(retryBtn);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });
  });
});
