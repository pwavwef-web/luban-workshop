"use client";

import { auth } from "@/lib/firebase";
import { deleteDocument, serverTimestamp, setDocument } from "@/services/firestore";

export function normalizeAdminEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function grantAdmin(email: string) {
  const normalized = normalizeAdminEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error("Enter a valid email address.");
  await setDocument("admins", normalized, {
    email: normalized,
    addedAt: serverTimestamp(),
    addedBy: auth.currentUser?.email || "unknown",
  });
}

export async function revokeAdmin(email: string) {
  const normalized = normalizeAdminEmail(email);
  if (auth.currentUser?.email?.toLowerCase() === normalized) {
    throw new Error("You cannot revoke your own admin access.");
  }
  await deleteDocument("admins", normalized);
}
