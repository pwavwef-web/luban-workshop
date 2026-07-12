"use client";

import { auth } from "@/lib/firebase";
import { deleteDocument, serverTimestamp, setDocument, updateDocument } from "@/services/firestore";
import { generateSpecialMenuCode } from "@/lib/qr";
import type { SpecialMenuItem } from "@/types/models";

export async function saveSpecialMenu(
  id: string | null,
  payload: { title: string; eventDate?: string; note?: string; active: boolean; items: SpecialMenuItem[] },
) {
  if (!payload.title.trim()) throw new Error("Add an event or menu name.");
  if (!payload.items.length) throw new Error("Add at least one special menu item.");
  const documentId = id || generateSpecialMenuCode();
  const actor = auth.currentUser?.email || "unknown";
  await setDocument("specialMenus", documentId, {
    title: payload.title.trim(),
    eventDate: payload.eventDate || "",
    note: payload.note || "",
    items: payload.items,
    active: payload.active,
    status: payload.active ? "active" : "hidden",
    updatedAt: serverTimestamp(),
    updatedBy: actor,
    ...(id ? {} : { createdAt: serverTimestamp(), createdBy: actor }),
  });
  return documentId;
}

export async function toggleSpecialMenu(id: string, active: boolean) {
  await updateDocument("specialMenus", id, {
    active,
    status: active ? "active" : "hidden",
    updatedAt: serverTimestamp(),
    updatedBy: auth.currentUser?.email || "unknown",
  });
}

export async function removeSpecialMenu(id: string) {
  await deleteDocument("specialMenus", id);
}
