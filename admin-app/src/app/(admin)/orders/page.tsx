"use client";

import { Check, ChefHat, RotateCcw, X } from "lucide-react";
import { useMemo, useState } from "react";
import { SearchInput } from "@/components/admin/SearchInput";
import { RealtimeBoundary, useRealtimeCollection } from "@/components/admin/RealtimeList";
import { Badge } from "@/components/ui/Badge";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { EmptyState } from "@/components/ui/State";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDateTime, money, truncate } from "@/lib/dates";
import { normalizeOrderStatus, orderStatusLabel } from "@/lib/status";
import { byCreatedDesc } from "@/services/firestore";
import { updateOrderStatus } from "@/services/orders";
import type { Order, OrderStatus } from "@/types/models";

function OrderActions({ order }: { order: Order }) {
  const status = normalizeOrderStatus(order.status);
  const action = (next: OrderStatus, label: string, icon: React.ReactNode, confirm?: string) => {
    const button = (
      <button className="icon-button" type="button" title={label} onClick={() => updateOrderStatus(order, next)}>
        {icon}
      </button>
    );
    return confirm ? (
      <ConfirmButton className="icon-button" confirm={confirm} onConfirm={() => updateOrderStatus(order, next)}>
        {icon}
      </ConfirmButton>
    ) : button;
  };

  if (status === "requested") {
    return (
      <div className="row-actions">
        {action("accepted", "Accept request", <Check size={16} />)}
        {action("rejected", "Reject request", <X size={16} />, "Reject this pre-order request?")}
      </div>
    );
  }
  if (status === "accepted" || status === "pending") {
    return (
      <div className="row-actions">
        {action("preparing", "Start preparing", <ChefHat size={16} />)}
        {action("cancelled", "Cancel order", <X size={16} />, "Cancel this order?")}
      </div>
    );
  }
  if (status === "preparing") {
    return (
      <div className="row-actions">
        {action("completed", "Mark completed", <Check size={16} />)}
        {action("cancelled", "Cancel order", <X size={16} />, "Cancel this order?")}
      </div>
    );
  }
  if (status === "completed" || status === "cancelled") {
    return <div className="row-actions">{action("pending", "Reopen", <RotateCcw size={16} />)}</div>;
  }
  return <span className="muted">No actions</span>;
}

export default function OrdersPage() {
  const { items, loading, error } = useRealtimeCollection<Order>("orders", [byCreatedDesc()]);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return q ? items.filter((item) => JSON.stringify(item).toLowerCase().includes(q)) : items;
  }, [items, query]);

  return (
    <section>
      <PageHeader title="Orders" eyebrow="Kitchen workflow">
        <SearchInput value={query} onChange={setQuery} placeholder="Search orders" />
      </PageHeader>
      <RealtimeBoundary loading={loading} error={error}>
        {!filtered.length ? <EmptyState title="No orders found" description="Incoming orders appear here in real time." /> : null}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Placed</th>
                <th>Total</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id}>
                  <td className="mono">#{order.id.slice(-6).toUpperCase()}</td>
                  <td>
                    <strong>{order.customerName || "Guest"}</strong>
                    <span>{order.customerPhone || order.customerEmail || order.userEmail || "-"}</span>
                  </td>
                  <td>{truncate(order.items?.map((item) => `${item.quantity}x ${item.name}`).join(", ") || "No items", 96)}</td>
                  <td>
                    <span>{formatDateTime(order.createdAt)}</span>
                    {order.requestedForLabel ? <small>Requested for {order.requestedForLabel}</small> : null}
                  </td>
                  <td>{money(order.total)}</td>
                  <td><Badge>{orderStatusLabel(order.status)}</Badge></td>
                  <td><OrderActions order={order} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </RealtimeBoundary>
    </section>
  );
}
