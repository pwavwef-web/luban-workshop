"use client";

import { adminApi } from "@/lib/api";
import type { SmsCampaign } from "@/types/models";

export interface SmsAudienceResponse {
  counts: {
    verifiedUsers: number;
    usersWithPhone: number;
    totalProfiles: number;
  };
  campaigns: SmsCampaign[];
  limits: {
    maxRecipients: number;
    messageMaxLength: number;
  };
}

export interface SmsPayload {
  title: string;
  audience: "verified_users" | "all_users" | "manual";
  message: string;
  manualRecipients?: string;
  scheduleMode: "now" | "scheduled";
  scheduleAt?: string;
  scheduleTimezone?: string;
  scheduleTimezoneOffsetMinutes?: number;
  syncContacts?: boolean;
  phoneBookName?: string;
}

export async function fetchSmsAudience() {
  return adminApi<SmsAudienceResponse>("admin/sms/audience");
}

export async function fetchSmsBalance() {
  return adminApi<{ ok: boolean; balance: unknown }>("admin/sms/balance");
}

export async function sendSmsCampaign(payload: SmsPayload) {
  return adminApi<{
    ok: boolean;
    campaignId: string;
    status: string;
    recipientCount: number;
    successCount: number;
    failedCount: number;
  }>("admin/sms/send", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
