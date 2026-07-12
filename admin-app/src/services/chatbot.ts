"use client";

import { auth } from "@/lib/firebase";
import { addDocument, serverTimestamp, updateDocument } from "@/services/firestore";
import type { ChatbotKnowledge } from "@/types/models";

export function getKnowledgeStatus(item: ChatbotKnowledge): "active" | "archived" {
  const status = String(item.status || "").toLowerCase();
  if (status === "archived" || item.active === false || item.archived === true) return "archived";
  return "active";
}

export async function saveKnowledge(id: string | null, title: string, answer: string, status: "active" | "archived") {
  const actor = auth.currentUser?.email || "unknown";
  const payload = {
    title: title.trim(),
    answer: answer.trim(),
    status,
    active: status === "active",
    archived: status === "archived",
    archivedAt: status === "archived" ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
    updatedBy: actor,
  };
  if (!payload.title || !payload.answer) throw new Error("Add both a title and an answer.");
  if (id) {
    await updateDocument("chatbotKnowledge", id, payload);
    return id;
  }
  const ref = await addDocument("chatbotKnowledge", {
    ...payload,
    createdAt: serverTimestamp(),
    createdBy: actor,
  });
  return ref.id;
}

export async function toggleKnowledge(item: ChatbotKnowledge) {
  const status = getKnowledgeStatus(item) === "active" ? "archived" : "active";
  await updateDocument("chatbotKnowledge", item.id, {
    status,
    active: status === "active",
    archived: status === "archived",
    archivedAt: status === "archived" ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
    updatedBy: auth.currentUser?.email || "unknown",
  });
}
