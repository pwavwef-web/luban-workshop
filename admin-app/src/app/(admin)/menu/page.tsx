"use client";

import { Eye, EyeOff, Image as ImageIcon, Pencil, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { SearchInput } from "@/components/admin/SearchInput";
import { RealtimeBoundary, useRealtimeCollection } from "@/components/admin/RealtimeList";
import { Badge } from "@/components/ui/Badge";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { useUI } from "@/components/ui/UIProvider";
import { money } from "@/lib/dates";
import { getDefaultDishImage, menuCatalog } from "@/lib/menu";
import { revertDishImage, revertDishPrice, setDishImage, setDishPrice, setDishVisibility } from "@/services/menu";

interface OverlayDoc {
  id: string;
  hidden?: boolean;
  price?: number;
  imageUrl?: string;
}

export default function MenuPage() {
  const ui = useUI();
  const availability = useRealtimeCollection<OverlayDoc>("dishAvailability");
  const prices = useRealtimeCollection<OverlayDoc>("menuPrices");
  const images = useRealtimeCollection<OverlayDoc>("menuImages");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const hidden = new Set(availability.items.filter((item) => item.hidden === true).map((item) => item.id));
    const priceMap = new Map(prices.items.map((item) => [item.id, item.price]));
    const imageMap = new Map(images.items.map((item) => [item.id, item.imageUrl]));
    const q = query.toLowerCase().trim();
    return menuCatalog
      .map((item) => ({
        ...item,
        hidden: hidden.has(item.id),
        currentPrice: Number(priceMap.get(item.id) ?? item.price),
        hasPriceOverride: priceMap.has(item.id),
        imageUrl: imageMap.get(item.id) || getDefaultDishImage(item),
        hasImageOverride: imageMap.has(item.id),
      }))
      .filter((item) => !q || `${item.id} ${item.name} ${item.category}`.toLowerCase().includes(q));
  }, [availability.items, images.items, prices.items, query]);

  async function editPrice(id: string, currentPrice: number, name: string) {
    const next = await ui.prompt({
      title: `Edit price — ${name}`,
      label: "New price (GHS)",
      defaultValue: String(currentPrice),
      inputType: "number",
      confirmLabel: "Update price",
    });
    if (next === null) return;
    const parsed = Number(next);
    if (!Number.isFinite(parsed) || parsed < 0) {
      ui.toast.error("Enter a valid price.");
      return;
    }
    try {
      await setDishPrice(id, parsed);
      ui.toast.success(`${name} price set to ${money(parsed)}.`);
    } catch (error) {
      ui.toast.error(error instanceof Error ? error.message : "Could not update the price.");
    }
  }

  async function editImage(id: string, name: string) {
    const imageUrl = await ui.prompt({
      title: `Custom image — ${name}`,
      label: "Image URL or data URL",
      placeholder: "https://…",
      confirmLabel: "Save image",
    });
    if (!imageUrl) return;
    try {
      await setDishImage(id, imageUrl);
      ui.toast.success(`Custom image saved for ${name}.`);
    } catch (error) {
      ui.toast.error(error instanceof Error ? error.message : "Could not update the image.");
    }
  }

  async function toggleVisibility(id: string, name: string, hidden: boolean) {
    try {
      await setDishVisibility(id, !hidden);
      ui.toast.success(hidden ? `${name} is now visible.` : `${name} is now hidden.`);
    } catch (error) {
      ui.toast.error(error instanceof Error ? error.message : "Could not update visibility.");
    }
  }

  return (
    <section>
      <PageHeader title="Menu manager" eyebrow="Catalog overlays">
        <SearchInput value={query} onChange={setQuery} placeholder="Search menu" />
      </PageHeader>
      <RealtimeBoundary loading={availability.loading || prices.loading || images.loading} error={availability.error || prices.error || images.error}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Dish</th>
                <th>Category</th>
                <th>Price</th>
                <th>Visibility</th>
                <th>Image</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr className={item.hidden ? "dim-row" : ""} key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                    <small>{item.id}</small>
                  </td>
                  <td><Badge tone="stone">{item.category}</Badge></td>
                  <td>
                    <span>{money(item.currentPrice)}</span>
                    {item.hasPriceOverride ? <small>Edited from {money(item.price)}</small> : null}
                  </td>
                  <td><Badge tone={item.hidden ? "red" : "green"}>{item.hidden ? "Hidden" : "Visible"}</Badge></td>
                  <td>{item.hasImageOverride ? <Badge tone="blue">Custom</Badge> : <span className="muted">Default</span>}</td>
                  <td>
                    <div className="row-actions">
                      <button className="icon-button" title="Edit price" onClick={() => editPrice(item.id, item.currentPrice, item.name)} type="button"><Pencil size={16} /></button>
                      {item.hasPriceOverride ? <ConfirmButton className="icon-button" confirm={`Revert ${item.name} to the catalog price of ${money(item.price)}?`} title="Revert price" successMessage={`${item.name} price reverted.`} onConfirm={() => revertDishPrice(item.id)}><RotateCcw size={16} /></ConfirmButton> : null}
                      <button className="icon-button" title="Edit image" onClick={() => editImage(item.id, item.name)} type="button"><ImageIcon size={16} /></button>
                      {item.hasImageOverride ? <ConfirmButton className="icon-button" confirm={`Remove the custom image for ${item.name}?`} title="Remove image" successMessage={`Custom image removed for ${item.name}.`} onConfirm={() => revertDishImage(item.id)}><RotateCcw size={16} /></ConfirmButton> : null}
                      <button className="icon-button" title={item.hidden ? "Show" : "Hide"} onClick={() => toggleVisibility(item.id, item.name, item.hidden)} type="button">{item.hidden ? <Eye size={16} /> : <EyeOff size={16} />}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </RealtimeBoundary>
    </section>
  );
}
