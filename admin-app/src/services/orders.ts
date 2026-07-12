"use client";

import { doc, runTransaction, serverTimestamp } from "@/services/firestore";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebase";
import { canTransitionOrderStatus, normalizeOrderStatus } from "@/lib/status";
import type { Order, OrderStatus } from "@/types/models";

export function buildOrderStatusUpdate(previousStatus: unknown, nextStatus: unknown) {
  const previous = normalizeOrderStatus(previousStatus);
  const next = normalizeOrderStatus(nextStatus);
  const actor = auth.currentUser?.email || auth.currentUser?.uid || "admin";
  const update: Record<string, unknown> = {
    status: next,
    updatedAt: serverTimestamp(),
    updatedBy: actor,
  };

  if (next === "accepted" && previous === "requested") {
    update.acceptedAt = serverTimestamp();
    update.acceptedBy = actor;
  }
  if (next === "rejected" && previous === "requested") {
    update.rejectedAt = serverTimestamp();
    update.rejectedBy = actor;
  }
  if (next === "preparing") {
    update.preparingAt = serverTimestamp();
    update.preparingBy = actor;
  }
  if (next === "completed") {
    update.completedAt = serverTimestamp();
    update.completedBy = actor;
  }
  if (next === "cancelled") {
    update.cancelledAt = serverTimestamp();
    update.cancelledBy = actor;
  }
  if (next === "pending" && ["completed", "cancelled"].includes(previous)) {
    update.reopenedAt = serverTimestamp();
    update.reopenedBy = actor;
  }
  return update;
}

export async function updateOrderStatus(order: Order, nextStatus: OrderStatus) {
  const previous = normalizeOrderStatus(order.status);
  if (!canTransitionOrderStatus(previous, nextStatus)) {
    throw new Error(`Cannot move an order from ${previous.toUpperCase()} to ${nextStatus.toUpperCase()}.`);
  }
  const orderRef = doc(db, "orders", order.id);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(orderRef);
    if (!snap.exists()) throw new Error("Order not found.");
    const latestStatus = normalizeOrderStatus(snap.data().status);
    if (!canTransitionOrderStatus(latestStatus, nextStatus)) {
      throw new Error(`Order is now ${latestStatus.toUpperCase()} and cannot move to ${nextStatus.toUpperCase()}.`);
    }
    transaction.update(orderRef, buildOrderStatusUpdate(latestStatus, nextStatus));
  });
}
