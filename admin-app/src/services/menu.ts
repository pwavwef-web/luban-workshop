"use client";

import { deleteDocument, setDocument } from "@/services/firestore";

export async function setDishPrice(id: string, price: number) {
  if (!Number.isFinite(price) || price < 0) throw new Error("Enter a valid non-negative price.");
  await setDocument("menuPrices", id, { price });
}

export async function revertDishPrice(id: string) {
  await deleteDocument("menuPrices", id);
}

export async function setDishVisibility(id: string, hidden: boolean) {
  await setDocument("dishAvailability", id, { hidden });
}

export async function setDishImage(id: string, imageUrl: string) {
  if (!imageUrl.trim()) throw new Error("Image URL is required.");
  await setDocument("menuImages", id, { imageUrl: imageUrl.trim() });
}

export async function revertDishImage(id: string) {
  await deleteDocument("menuImages", id);
}
