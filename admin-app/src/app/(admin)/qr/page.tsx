"use client";

/* eslint-disable @next/next/no-img-element */

import { ExternalLink, QrCode, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { RealtimeBoundary, useRealtimeCollection } from "@/components/admin/RealtimeList";
import { Badge } from "@/components/ui/Badge";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { EmptyState } from "@/components/ui/State";
import { PageHeader } from "@/components/ui/PageHeader";
import { createQrSvgDataUrl, getSpecialMenuUrl } from "@/lib/qr";
import { removeSpecialMenu, saveSpecialMenu, toggleSpecialMenu } from "@/services/specialMenus";
import type { SpecialMenu, SpecialMenuItem } from "@/types/models";

export default function QrPage() {
  const { items, loading, error } = useRealtimeCollection<SpecialMenu>("specialMenus");
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [note, setNote] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [menuItems, setMenuItems] = useState<SpecialMenuItem[]>([]);
  const sorted = useMemo(() => [...items].sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""))), [items]);

  function addItem() {
    if (!itemName.trim()) return;
    setMenuItems((current) => [...current, { name: itemName.trim(), price: itemPrice ? Number(itemPrice) : null }]);
    setItemName("");
    setItemPrice("");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await saveSpecialMenu(null, { title, eventDate, note, active: true, items: menuItems });
    setTitle("");
    setEventDate("");
    setNote("");
    setMenuItems([]);
  }

  return (
    <section>
      <PageHeader title="QR tools" eyebrow="Special event menus" />
      <form className="panel form-grid" onSubmit={submit}>
        <label>Menu name<input value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
        <label>Event date<input value={eventDate} onChange={(event) => setEventDate(event.target.value)} type="date" /></label>
        <label className="span-2">Guest note<textarea value={note} onChange={(event) => setNote(event.target.value)} /></label>
        <label>Item name<input value={itemName} onChange={(event) => setItemName(event.target.value)} /></label>
        <label>Price<input value={itemPrice} onChange={(event) => setItemPrice(event.target.value)} type="number" min="0" /></label>
        <button className="btn btn-secondary" type="button" onClick={addItem}>Add item</button>
        <div className="span-2 inline-row">{menuItems.map((item, index) => <Badge key={`${item.name}-${index}`}>{item.name}</Badge>)}</div>
        <button className="btn btn-primary" type="submit"><QrCode size={16} /> Create QR menu</button>
      </form>
      <RealtimeBoundary loading={loading} error={error}>
        {!sorted.length ? <EmptyState title="No QR menus yet" /> : null}
        <div className="qr-grid">
          {sorted.map((menu) => {
            const url = getSpecialMenuUrl(menu.id);
            const active = menu.active === true;
            return (
              <article className="panel qr-card" key={menu.id}>
                <img alt={`QR for ${menu.title || menu.id}`} src={createQrSvgDataUrl(url)} />
                <div>
                  <div className="inline-row">
                    <h2>{menu.title || menu.id}</h2>
                    <Badge tone={active ? "green" : "red"}>{active ? "Active" : "Hidden"}</Badge>
                  </div>
                  <p className="muted">{menu.eventDate || "No event date"} - {menu.items?.length || 0} items</p>
                  <p className="break-anywhere">{url}</p>
                  <div className="row-actions">
                    <a className="btn btn-secondary" href={url} target="_blank"><ExternalLink size={16} /> Open</a>
                    <button className="btn btn-secondary" onClick={() => toggleSpecialMenu(menu.id, !active)} type="button">{active ? "Hide" : "Show"}</button>
                    <ConfirmButton className="btn btn-danger" confirm={`Delete ${menu.title || menu.id}?`} onConfirm={() => removeSpecialMenu(menu.id)}><Trash2 size={16} /> Delete</ConfirmButton>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </RealtimeBoundary>
    </section>
  );
}
