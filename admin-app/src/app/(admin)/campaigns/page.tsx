"use client";

import { RefreshCw, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { ErrorState, LoadingState } from "@/components/ui/State";
import { PageHeader } from "@/components/ui/PageHeader";
import { fetchSmsAudience, fetchSmsBalance, sendSmsCampaign, type SmsAudienceResponse } from "@/services/campaigns";

export default function CampaignsPage() {
  const [data, setData] = useState<SmsAudienceResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [audience, setAudience] = useState<"verified_users" | "all_users" | "manual">("verified_users");
  const [manualRecipients, setManualRecipients] = useState("");
  const [feedback, setFeedback] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setData(await fetchSmsAudience());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load SMS data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setFeedback("");
    const result = await sendSmsCampaign({
      title,
      message,
      audience,
      manualRecipients,
      scheduleMode: "now",
      scheduleTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      scheduleTimezoneOffsetMinutes: new Date().getTimezoneOffset(),
    });
    setFeedback(`${result.status}: ${result.successCount} of ${result.recipientCount} accepted.`);
    setTitle("");
    setMessage("");
    setManualRecipients("");
    await load();
  }

  async function checkBalance() {
    const result = await fetchSmsBalance();
    setFeedback(`Balance response: ${JSON.stringify(result.balance)}`);
  }

  return (
    <section>
      <PageHeader title="Campaigns" eyebrow="Server-side SMS tools">
        <button className="btn btn-secondary" onClick={load} type="button"><RefreshCw size={16} /> Refresh</button>
        <button className="btn btn-secondary" onClick={checkBalance} type="button">Check balance</button>
      </PageHeader>
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {data ? (
        <>
          <div className="metric-grid">
            <article className="metric-card"><span>Verified users</span><strong>{data.counts.verifiedUsers}</strong></article>
            <article className="metric-card"><span>Users with phones</span><strong>{data.counts.usersWithPhone}</strong></article>
            <article className="metric-card"><span>Max recipients</span><strong>{data.limits.maxRecipients}</strong></article>
            <article className="metric-card"><span>Message limit</span><strong>{data.limits.messageMaxLength}</strong></article>
          </div>
          <form className="panel form-grid" onSubmit={submit}>
            <label>Campaign name<input value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
            <label>Audience<select value={audience} onChange={(event) => setAudience(event.target.value as typeof audience)}><option value="verified_users">Verified users</option><option value="all_users">All users with phones</option><option value="manual">Manual list</option></select></label>
            {audience === "manual" ? <label className="span-2">Manual recipients<textarea value={manualRecipients} onChange={(event) => setManualRecipients(event.target.value)} placeholder="+233..." /></label> : null}
            <label className="span-2">Message<textarea value={message} maxLength={data.limits.messageMaxLength} onChange={(event) => setMessage(event.target.value)} required /></label>
            <button className="btn btn-primary" type="submit"><Send size={16} /> Send campaign</button>
          </form>
          {feedback ? <p className="panel">{feedback}</p> : null}
          <article className="panel">
            <div className="panel-head"><h2>Recent campaigns</h2><span>{data.campaigns.length} records</span></div>
            <div className="stack-list">
              {data.campaigns.map((campaign) => (
                <div className="list-row" key={campaign.id || `${campaign.title}-${campaign.createdAt}`}>
                  <div><strong>{campaign.title || "SMS campaign"}</strong><span>{campaign.messagePreview || ""}</span></div>
                  <Badge>{campaign.status || "unknown"}</Badge>
                </div>
              ))}
            </div>
          </article>
        </>
      ) : null}
    </section>
  );
}
