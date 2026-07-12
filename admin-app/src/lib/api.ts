"use client";

import { auth } from "@/lib/firebase";

export async function adminApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated.");
  const token = await user.getIdToken();
  const baseUrl = (process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL || "/api").replace(/\/+$/, "");
  const cleanPath = path.replace(/^\/+/, "");
  const response = await fetch(`${baseUrl}/${cleanPath}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed with HTTP ${response.status}.`);
  }
  return data as T;
}
