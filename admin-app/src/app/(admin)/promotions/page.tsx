"use client";

import { Eye, EyeOff, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { SearchInput } from "@/components/admin/SearchInput";
import { RealtimeBoundary, useRealtimeCollection } from "@/components/admin/RealtimeList";
import { Badge } from "@/components/ui/Badge";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { EmptyState } from "@/components/ui/State";
import { PageHeader } from "@/components/ui/PageHeader";
import { truncate } from "@/lib/dates";
import { byCreatedDesc } from "@/services/firestore";
import { isPromotionVisible, removePromotion, savePromotion, togglePromotion } from "@/services/promotions";
import type { Promotion } from "@/types/models";

export default function PromotionsPage() {
  const { items, loading, error } = useRealtimeCollection<Promotion>("promotions", [byCreatedDesc()]);
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [offer, setOffer] = useState("");
  const [code, setCode] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return q ? items.filter((item) => JSON.stringify(item).toLowerCase().includes(q)) : items;
  }, [items, query]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await savePromotion(null, {
      type: "promotion",
      title,
      description,
      offer,
      code,
      expiresAt,
      active: true,
      discountType: "custom",
      items: [],
    });
    setTitle("");
    setDescription("");
    setOffer("");
    setCode("");
    setExpiresAt("");
  }

  return (
    <section>
      <PageHeader title="Promotions" eyebrow="Customer-visible offers">
        <SearchInput value={query} onChange={setQuery} placeholder="Search offers" />
      </PageHeader>
      <form className="panel form-grid" onSubmit={submit}>
        <label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
        <label>Offer line<input value={offer} onChange={(event) => setOffer(event.target.value)} /></label>
        <label>Code<input value={code} onChange={(event) => setCode(event.target.value)} /></label>
        <label>Expiry<input value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} type="date" /></label>
        <label className="span-2">Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} required /></label>
        <button className="btn btn-primary" type="submit">Create offer</button>
      </form>
      <RealtimeBoundary loading={loading} error={error}>
        {!filtered.length ? <EmptyState title="No promotions found" /> : null}
        <div className="table-wrap">
          <table>
            <thead><tr><th>Offer</th><th>Status</th><th>Expiry</th><th>Dishes</th><th /></tr></thead>
            <tbody>
              {filtered.map((promotion) => {
                const visible = isPromotionVisible(promotion);
                return (
                  <tr className={visible ? "" : "dim-row"} key={promotion.id}>
                    <td>
                      <strong>{promotion.title || promotion.id}</strong>
                      <small>{promotion.offer || truncate(promotion.description, 120)}</small>
                    </td>
                    <td><Badge tone={visible ? "green" : "red"}>{visible ? "Visible" : "Hidden"}</Badge></td>
                    <td>{promotion.expiresAt || "No expiry"}</td>
                    <td>{promotion.items?.length || 0}</td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-button" type="button" onClick={() => togglePromotion(promotion)}>{visible ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                        <ConfirmButton className="icon-button danger" confirm={`Delete ${promotion.title || "this offer"}?`} onConfirm={() => removePromotion(promotion.id)}><Trash2 size={16} /></ConfirmButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </RealtimeBoundary>
    </section>
  );
}
