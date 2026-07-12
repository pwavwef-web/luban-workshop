"use client";

import { updateDocument } from "@/services/firestore";
import type { ContactMessage } from "@/types/models";

export function isAssistantMessage(message: ContactMessage) {
  return String(message.source || "").toLowerCase() === "assistant";
}

export async function markMessageRead(id: string) {
  await updateDocument("contact_messages", id, { read: true });
}
