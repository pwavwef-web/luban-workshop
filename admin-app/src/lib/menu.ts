import menuCatalogJson from "@/data/menu-catalog.json";
import type { MenuCatalogItem } from "@/types/models";

export const menuCatalog = menuCatalogJson as MenuCatalogItem[];

export function getDefaultDishImage(item: MenuCatalogItem): string {
  const drinkImages: Record<string, string> = {
    DR1: "https://lubanrestaurant.com/assets/drinks/coca-cola-300ml.webp",
    DR2: "https://lubanrestaurant.com/assets/drinks/fanta-300ml.webp",
    DR3: "https://lubanrestaurant.com/assets/drinks/sprite-300ml.webp",
    DR4: "https://lubanrestaurant.com/assets/drinks/water-300ml.webp",
  };
  return drinkImages[item.id] || `https://lubanrestaurant.com/assets/menu-items-pictures/${item.id}.webp`;
}

export function validateMenuCatalog(items: MenuCatalogItem[] = menuCatalog): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const item of items) {
    if (!item.id) errors.push("Menu item is missing an id.");
    if (ids.has(item.id)) errors.push(`Duplicate menu item id: ${item.id}`);
    ids.add(item.id);
    if (!item.name) errors.push(`${item.id} is missing a name.`);
    if (!item.category) errors.push(`${item.id} is missing a category.`);
    if (!Number.isFinite(Number(item.price)) || Number(item.price) < 0) {
      errors.push(`${item.id} has an invalid price.`);
    }
  }
  return errors;
}
