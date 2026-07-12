import type { Order, OrderStatus, ReservationStatus } from "@/types/models";

export const orderTransitions: Record<OrderStatus, OrderStatus[]> = {
  requested: ["accepted", "rejected"],
  accepted: ["preparing", "cancelled"],
  pending: ["preparing", "cancelled"],
  preparing: ["completed", "cancelled"],
  completed: ["pending"],
  cancelled: ["pending"],
  rejected: [],
};

export function normalizeOrderStatus(status: unknown): OrderStatus {
  const normalized = String(status || "pending").toLowerCase();
  if (
    normalized === "requested" ||
    normalized === "accepted" ||
    normalized === "rejected" ||
    normalized === "pending" ||
    normalized === "preparing" ||
    normalized === "completed" ||
    normalized === "cancelled"
  ) {
    return normalized;
  }
  return "pending";
}

export function canTransitionOrderStatus(fromStatus: unknown, toStatus: unknown): boolean {
  const from = normalizeOrderStatus(fromStatus);
  const to = normalizeOrderStatus(toStatus);
  return orderTransitions[from].includes(to);
}

export function normalizeReservationStatus(status: unknown): ReservationStatus {
  const normalized = String(status || "pending").trim().toLowerCase();
  if (normalized === "completed") return "confirmed";
  if (normalized === "confirmed" || normalized === "rejected" || normalized === "pending") return normalized;
  return "pending";
}

export function orderStatusLabel(status: unknown): string {
  return normalizeOrderStatus(status).replace(/^\w/, (letter) => letter.toUpperCase());
}

export function isActiveOrder(order: Pick<Order, "status">): boolean {
  return ["requested", "accepted", "pending", "preparing"].includes(normalizeOrderStatus(order.status));
}

export function getBadgeTone(status: string): "amber" | "blue" | "green" | "red" | "stone" | "teal" {
  const normalized = status.toLowerCase();
  if (["pending", "requested", "partial_failed"].includes(normalized)) return "amber";
  if (["preparing", "sending", "scheduled", "scheduling"].includes(normalized)) return "blue";
  if (["accepted", "confirmed", "completed", "active", "visible", "sent"].includes(normalized)) return "green";
  if (["cancelled", "rejected", "hidden", "failed", "archived"].includes(normalized)) return "red";
  if (["assistant"].includes(normalized)) return "teal";
  return "stone";
}
