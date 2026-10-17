import "@testing-library/jest-dom/vitest";
import React from "react";
import { vi } from "vitest";

vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<Record<string, any>>();
  const mockIcon = (name: string) => (props: any) =>
    React.createElement("span", { "data-testid": `icon-${name}`, ...props });

  const mocks: Record<string, any> = {};
  for (const key of Object.keys(actual)) {
    mocks[key] = mockIcon(key);
  }

  // Ensure common icons are present
  mocks["Search"] = mockIcon("Search");
  mocks["SearchX"] = mockIcon("SearchX");
  mocks["Heart"] = mockIcon("Heart");
  mocks["Bell"] = mockIcon("Bell");
  mocks["Star"] = mockIcon("Star");
  mocks["ExternalLink"] = mockIcon("ExternalLink");
  mocks["TrendingDown"] = mockIcon("TrendingDown");
  mocks["ArrowLeft"] = mockIcon("ArrowLeft");

  return mocks;
});
