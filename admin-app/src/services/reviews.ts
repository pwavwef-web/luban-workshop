"use client";

import { adminApi } from "@/lib/api";
import type { FraudReview } from "@/types/models";

export async function fetchFraudReview() {
  return adminApi<FraudReview>("admin/fraud-review");
}

export async function seedSecureChatbotFacts() {
  return adminApi<{ ok: boolean; count: number }>("admin/bootstrap-chatbot-knowledge", { method: "POST" });
}
