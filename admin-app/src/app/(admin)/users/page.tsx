"use client";

import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { SearchInput } from "@/components/admin/SearchInput";
import { RealtimeBoundary, useRealtimeCollection } from "@/components/admin/RealtimeList";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDate } from "@/lib/dates";
import { byAddedDesc } from "@/services/firestore";
import { grantAdmin, revokeAdmin } from "@/services/adminUsers";
import type { AdminUser } from "@/types/models";

export default function UsersPage() {
  const { items, loading, error } = useRealtimeCollection<AdminUser>("admins", [byAddedDesc()]);
  const [query, setQuery] = useState("");
  const [email, setEmail] = useState("");
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return q ? items.filter((item) => JSON.stringify(item).toLowerCase().includes(q)) : items;
  }, [items, query]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await grantAdmin(email);
    setEmail("");
  }

  return (
    <section>
      <PageHeader title="Admin users" eyebrow="Firestore admins collection">
        <SearchInput value={query} onChange={setQuery} placeholder="Search admins" />
      </PageHeader>
      <form className="panel form-row" onSubmit={submit}>
        <label>
          Grant admin access
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" type="email" required />
        </label>
        <button className="btn btn-primary" type="submit">Grant</button>
      </form>
      <RealtimeBoundary loading={loading} error={error}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Added</th>
                <th>Added by</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((admin) => (
                <tr key={admin.id}>
                  <td><strong>{admin.id}</strong></td>
                  <td>{formatDate(admin.addedAt)}</td>
                  <td>{admin.addedBy || "-"}</td>
                  <td><ConfirmButton className="icon-button danger" confirm={`Revoke ${admin.id}?`} onConfirm={() => revokeAdmin(admin.id)}><Trash2 size={16} /></ConfirmButton></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </RealtimeBoundary>
    </section>
  );
}
