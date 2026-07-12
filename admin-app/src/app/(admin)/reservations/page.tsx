"use client";

import { Check, RotateCcw, X } from "lucide-react";
import { useMemo, useState } from "react";
import { SearchInput } from "@/components/admin/SearchInput";
import { RealtimeBoundary, useRealtimeCollection } from "@/components/admin/RealtimeList";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/State";
import { PageHeader } from "@/components/ui/PageHeader";
import { useUI } from "@/components/ui/UIProvider";
import { formatDateTime, truncate } from "@/lib/dates";
import { normalizeReservationStatus } from "@/lib/status";
import { byCreatedDesc } from "@/services/firestore";
import { updateReservationStatus } from "@/services/reservations";
import type { Reservation } from "@/types/models";

function ReservationActions({ reservation }: { reservation: Reservation }) {
  const ui = useUI();
  const status = normalizeReservationStatus(reservation.status);

  async function setStatus(next: "confirmed" | "pending") {
    try {
      await updateReservationStatus(reservation.id, next);
      ui.toast.success(next === "confirmed" ? "Reservation confirmed." : "Moved to pending.");
    } catch (error) {
      ui.toast.error(error instanceof Error ? error.message : "Could not update reservation.");
    }
  }

  async function reject() {
    const reason = await ui.prompt({
      title: "Reject reservation",
      message: `Add a short note for ${reservation.name || "the guest"} (optional).`,
      label: "Reason",
      placeholder: "e.g. Fully booked for that time",
      multiline: true,
      confirmLabel: "Reject reservation",
    });
    if (reason === null) return;
    try {
      await updateReservationStatus(reservation.id, "rejected", reason);
      ui.toast.success("Reservation rejected.");
    } catch (error) {
      ui.toast.error(error instanceof Error ? error.message : "Could not update reservation.");
    }
  }

  if (status === "pending") {
    return (
      <div className="row-actions">
        <button className="icon-button" onClick={() => setStatus("confirmed")} title="Confirm" type="button"><Check size={16} /></button>
        <button className="icon-button" onClick={reject} title="Reject" type="button"><X size={16} /></button>
      </div>
    );
  }
  if (status === "confirmed") {
    return (
      <div className="row-actions">
        <button className="icon-button" onClick={() => setStatus("pending")} title="Move to pending" type="button"><RotateCcw size={16} /></button>
        <button className="icon-button" onClick={reject} title="Reject" type="button"><X size={16} /></button>
      </div>
    );
  }
  return (
    <div className="row-actions">
      <button className="icon-button" onClick={() => setStatus("confirmed")} title="Confirm" type="button"><Check size={16} /></button>
      <button className="icon-button" onClick={() => setStatus("pending")} title="Move to pending" type="button"><RotateCcw size={16} /></button>
    </div>
  );
}

export default function ReservationsPage() {
  const { items, loading, error } = useRealtimeCollection<Reservation>("reservations", [byCreatedDesc()]);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return q ? items.filter((item) => JSON.stringify(item).toLowerCase().includes(q)) : items;
  }, [items, query]);

  return (
    <section>
      <PageHeader title="Reservations" eyebrow="Host decisions">
        <SearchInput value={query} onChange={setQuery} placeholder="Search reservations" />
      </PageHeader>
      <RealtimeBoundary loading={loading} error={error}>
        {!filtered.length ? <EmptyState title="No reservations found" /> : null}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Guest</th>
                <th>Contact</th>
                <th>Visit</th>
                <th>Party</th>
                <th>Status</th>
                <th>Requested</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((reservation) => (
                <tr key={reservation.id}>
                  <td>
                    <strong>{reservation.name || "Guest"}</strong>
                    {reservation.notes ? <small>{truncate(reservation.notes, 90)}</small> : null}
                  </td>
                  <td>
                    <span>{reservation.phone || "No phone"}</span>
                    <small>{reservation.email || "No email"}</small>
                  </td>
                  <td>
                    <strong>{reservation.date || "No date"}</strong>
                    <span>{reservation.time || "No time"}</span>
                  </td>
                  <td>{reservation.guests || "?"}</td>
                  <td>
                    <Badge>{normalizeReservationStatus(reservation.status)}</Badge>
                    {reservation.decisionReason ? <small>{truncate(reservation.decisionReason, 80)}</small> : null}
                  </td>
                  <td>{formatDateTime(reservation.createdAt)}</td>
                  <td><ReservationActions reservation={reservation} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </RealtimeBoundary>
    </section>
  );
}
