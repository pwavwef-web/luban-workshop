"use client";

import { deleteField } from "firebase/firestore";
import { auth } from "@/lib/firebase";
import { normalizeReservationStatus } from "@/lib/status";
import { serverTimestamp, updateDocument } from "@/services/firestore";

export async function updateReservationStatus(id: string, status: unknown, reason?: string) {
  const normalized = normalizeReservationStatus(status);
  const actor = auth.currentUser?.email || "unknown";
  const updates: Record<string, unknown> = { status: normalized };

  if (normalized === "confirmed") {
    updates.decisionAt = serverTimestamp();
    updates.decisionBy = actor;
    updates.confirmedAt = serverTimestamp();
    updates.rejectedAt = deleteField();
    updates.decisionReason = deleteField();
  } else if (normalized === "rejected") {
    updates.decisionAt = serverTimestamp();
    updates.decisionBy = actor;
    updates.rejectedAt = serverTimestamp();
    updates.confirmedAt = deleteField();
    updates.decisionReason = reason || "Rejected by admin";
  } else {
    updates.decisionAt = deleteField();
    updates.decisionBy = deleteField();
    updates.confirmedAt = deleteField();
    updates.rejectedAt = deleteField();
    updates.decisionReason = deleteField();
  }

  await updateDocument("reservations", id, updates);
}
