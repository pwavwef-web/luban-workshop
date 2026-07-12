"use client";

import { auth } from "@/lib/firebase";
import { addDocument, deleteDocument, serverTimestamp, updateDocument } from "@/services/firestore";
import type { Promotion, PromotionItem } from "@/types/models";

export function isPromotionVisible(data: Promotion) {
  return data.active === true || data.status === "active" || data.visible === true;
}

export async function savePromotion(
  existingId: string | null,
  payload: Omit<Promotion, "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy"> & { items?: PromotionItem[] },
) {
  const actor = auth.currentUser?.email || "unknown";
  const active = payload.active === true;
  const documentPayload = {
    ...payload,
    active,
    visible: active,
    status: active ? "active" : "hidden",
    updatedAt: serverTimestamp(),
    updatedBy: actor,
  };

  if (existingId) {
    await updateDocument("promotions", existingId, documentPayload);
    return existingId;
  }

  const ref = await addDocument("promotions", {
    ...documentPayload,
    createdAt: serverTimestamp(),
    createdBy: actor,
  });
  return ref.id;
}

export async function togglePromotion(promotion: Promotion) {
  const active = !isPromotionVisible(promotion);
  await updateDocument("promotions", promotion.id, {
    active,
    visible: active,
    status: active ? "active" : "hidden",
    updatedAt: serverTimestamp(),
    updatedBy: auth.currentUser?.email || "unknown",
  });
}

export async function removePromotion(id: string) {
  await deleteDocument("promotions", id);
}
