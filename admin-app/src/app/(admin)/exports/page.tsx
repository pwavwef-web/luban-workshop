"use client";

import { Download } from "lucide-react";
import { useRealtimeCollection } from "@/components/admin/RealtimeList";
import { PageHeader } from "@/components/ui/PageHeader";
import { buildCsv, downloadText } from "@/lib/export";
import { formatDateTime, money } from "@/lib/dates";
import { menuCatalog } from "@/lib/menu";
import { byCreatedDesc } from "@/services/firestore";
import type { ContactMessage, Order, Reservation } from "@/types/models";

export default function ExportsPage() {
  const orders = useRealtimeCollection<Order>("orders", [byCreatedDesc()]);
  const reservations = useRealtimeCollection<Reservation>("reservations", [byCreatedDesc()]);
  const messages = useRealtimeCollection<ContactMessage>("contact_messages", [byCreatedDesc()]);

  const actions = [
    {
      label: "Orders CSV",
      run: () => downloadText("luban-orders.csv", buildCsv(["ID", "Customer", "Phone", "Status", "Total", "Created"], orders.items.map((item) => [item.id, item.customerName || "", item.customerPhone || "", String(item.status || "pending"), money(item.total), formatDateTime(item.createdAt)]))),
    },
    {
      label: "Reservations CSV",
      run: () => downloadText("luban-reservations.csv", buildCsv(["ID", "Guest", "Phone", "Date", "Time", "Guests", "Status"], reservations.items.map((item) => [item.id, item.name || "", item.phone || "", item.date || "", item.time || "", String(item.guests || ""), String(item.status || "pending")]))),
    },
    {
      label: "Messages CSV",
      run: () => downloadText("luban-messages.csv", buildCsv(["ID", "Name", "Email", "Subject", "Read", "Created"], messages.items.map((item) => [item.id, item.name || "", item.email || "", item.subject || "", item.read ? "read" : "unread", formatDateTime(item.createdAt)]))),
    },
    {
      label: "Menu CSV",
      run: () => downloadText("luban-menu.csv", buildCsv(["ID", "Name", "Category", "Price"], menuCatalog.map((item) => [item.id, item.name, item.category, item.price]))),
    },
  ];

  return (
    <section>
      <PageHeader title="Exports" eyebrow="Operational data downloads" />
      <div className="action-grid">
        {actions.map((action) => (
          <button className="panel export-tile" key={action.label} onClick={action.run} type="button">
            <Download size={18} />
            <span>{action.label}</span>
          </button>
        ))}
      </div>
      <p className="muted page-note">CSV exports are generated client-side from the admin-readable Firestore data already loaded by this app. The legacy admin export engine remains available until the old dashboard is retired.</p>
    </section>
  );
}
