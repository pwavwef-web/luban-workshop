"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/admin/MetricCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { RealtimeBoundary, useRealtimeCollection } from "@/components/admin/RealtimeList";
import { byCreatedDesc } from "@/services/firestore";
import { formatDateTime, money } from "@/lib/dates";
import { isActiveOrder, normalizeReservationStatus } from "@/lib/status";
import { isAssistantMessage } from "@/services/messages";
import type { ContactMessage, Order, Reservation } from "@/types/models";

export default function OverviewPage() {
  const orders = useRealtimeCollection<Order>("orders", [byCreatedDesc()]);
  const reservations = useRealtimeCollection<Reservation>("reservations", [byCreatedDesc()]);
  const messages = useRealtimeCollection<ContactMessage>("contact_messages", [byCreatedDesc()]);

  const activeOrders = orders.items.filter(isActiveOrder);
  const pendingReservations = reservations.items.filter((item) => normalizeReservationStatus(item.status) === "pending");
  const unreadMessages = messages.items.filter((item) => !item.read);
  const assistantReports = messages.items.filter(isAssistantMessage);
  const completedRevenue = orders.items
    .filter((item) => item.status === "completed")
    .reduce((total, item) => total + Number(item.total || 0), 0);

  return (
    <section>
      <PageHeader title="Operations overview" eyebrow="Today at a glance">
        <Link className="btn btn-primary" href="/orders">
          Open orders
        </Link>
      </PageHeader>
      <RealtimeBoundary loading={orders.loading || reservations.loading || messages.loading} error={orders.error || reservations.error || messages.error}>
        <div className="metric-grid">
          <MetricCard label="Active orders" value={activeOrders.length} helper="Requested, accepted, pending, preparing" />
          <MetricCard label="Pending reservations" value={pendingReservations.length} helper="Needs host decision" />
          <MetricCard label="Unread messages" value={unreadMessages.length} helper={`${assistantReports.length} assistant reports`} />
          <MetricCard label="Completed revenue" value={money(completedRevenue)} helper="Loaded order history" />
        </div>
        <div className="split-grid">
          <article className="panel">
            <div className="panel-head">
              <h2>Recent orders</h2>
              <Link href="/orders">View all</Link>
            </div>
            <div className="stack-list">
              {orders.items.slice(0, 6).map((order) => (
                <div className="list-row" key={order.id}>
                  <div>
                    <strong>#{order.id.slice(-6).toUpperCase()}</strong>
                    <span>{order.customerName || "Guest"} - {money(order.total)}</span>
                  </div>
                  <Badge>{order.status || "pending"}</Badge>
                </div>
              ))}
            </div>
          </article>
          <article className="panel">
            <div className="panel-head">
              <h2>Reservation queue</h2>
              <Link href="/reservations">View all</Link>
            </div>
            <div className="stack-list">
              {reservations.items.slice(0, 6).map((reservation) => (
                <div className="list-row" key={reservation.id}>
                  <div>
                    <strong>{reservation.name || "Guest"}</strong>
                    <span>{reservation.date || "No date"} at {reservation.time || "No time"} - {reservation.guests || "?"} guests</span>
                  </div>
                  <Badge>{normalizeReservationStatus(reservation.status)}</Badge>
                </div>
              ))}
            </div>
          </article>
          <article className="panel wide-panel">
            <div className="panel-head">
              <h2>Recent messages</h2>
              <Link href="/messages">Open inbox</Link>
            </div>
            <div className="stack-list">
              {messages.items.slice(0, 5).map((message) => (
                <div className="list-row" key={message.id}>
                  <div>
                    <strong>{message.subject || "Message"}</strong>
                    <span>{message.name || "Unknown"} - {formatDateTime(message.createdAt)}</span>
                  </div>
                  <Badge tone={message.read ? "stone" : "red"}>{message.read ? "Read" : "Unread"}</Badge>
                </div>
              ))}
            </div>
          </article>
        </div>
      </RealtimeBoundary>
    </section>
  );
}
