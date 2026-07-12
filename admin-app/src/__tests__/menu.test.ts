import { describe, expect, it } from "vitest";
import { menuCatalog, validateMenuCatalog } from "@/lib/menu";

describe("menu catalog", () => {
  it("has valid ids, categories, names, and prices", () => {
    expect(validateMenuCatalog(menuCatalog)).toEqual([]);
  });

  it("includes the copied production catalog", () => {
    expect(menuCatalog.length).toBeGreaterThan(50);
    expect(menuCatalog.some((item) => item.id === "DR4" && item.name.includes("Water"))).toBe(true);
  });
});
