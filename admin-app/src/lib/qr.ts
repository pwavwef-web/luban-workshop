"use client";

import qrcode from "qrcode-generator";

export function createQrSvgDataUrl(text: string): string {
  const qr = qrcode(0, "M");
  qr.addData(text);
  qr.make();
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(qr.createSvgTag({ cellSize: 8, margin: 4, scalable: true }))}`;
}

export function sanitizeFilename(filename: string, extension = "png"): string {
  const safeBase = String(filename || "luban-qr")
    .replace(new RegExp(`\\.${extension}$`, "i"), "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "luban-qr";
  return `${safeBase}.${extension}`;
}

export function getSpecialMenuUrl(id: string): string {
  const publicSite = (process.env.NEXT_PUBLIC_PUBLIC_SITE_URL || "https://lubanrestaurant.com").replace(/\/+$/, "");
  return `${publicSite}/special-menu.html?menu=${encodeURIComponent(id)}`;
}

export function generateSpecialMenuCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "event-";
  for (let i = 0; i < 8; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)].toLowerCase();
  }
  return code;
}
