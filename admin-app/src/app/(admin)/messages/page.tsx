"use client";

import { Mail, MailCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { SearchInput } from "@/components/admin/SearchInput";
import { RealtimeBoundary, useRealtimeCollection } from "@/components/admin/RealtimeList";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/State";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDateTime, truncate } from "@/lib/dates";
import { byCreatedDesc } from "@/services/firestore";
import { isAssistantMessage, markMessageRead } from "@/services/messages";
import type { ContactMessage } from "@/types/models";

export default function MessagesPage() {
  const { items, loading, error } = useRealtimeCollection<ContactMessage>("contact_messages", [byCreatedDesc()]);
  const [filter, setFilter] = useState<"all" | "unread" | "assistant">("all");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return items.filter((item) => {
      if (filter === "unread" && item.read) return false;
      if (filter === "assistant" && !isAssistantMessage(item)) return false;
      return !q || JSON.stringify(item).toLowerCase().includes(q);
    });
  }, [filter, items, query]);

  return (
    <section>
      <PageHeader title="Messages" eyebrow="Contact inbox">
        <SearchInput value={query} onChange={setQuery} placeholder="Search messages" />
      </PageHeader>
      <div className="segmented">
        {(["all", "unread", "assistant"] as const).map((key) => (
          <button className={filter === key ? "active" : ""} key={key} onClick={() => setFilter(key)} type="button">{key}</button>
        ))}
      </div>
      <RealtimeBoundary loading={loading} error={error}>
        {!filtered.length ? <EmptyState title="No messages in this view" /> : null}
        <div className="card-list">
          {filtered.map((message) => (
            <article className={message.read ? "message-card" : "message-card unread"} key={message.id}>
              <div className="card-row">
                <div>
                  <div className="inline-row">
                    <strong>{message.name || "Unknown"}</strong>
                    <Badge tone={isAssistantMessage(message) ? "teal" : "stone"}>{isAssistantMessage(message) ? "Assistant" : "Contact"}</Badge>
                    {!message.read ? <Badge tone="red">Unread</Badge> : null}
                  </div>
                  <span className="muted">{message.email || "No email"} - {formatDateTime(message.createdAt)}</span>
                </div>
                <div className="row-actions">
                  {message.email ? <a className="icon-button" href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject || "Contact message"}`)}`}><Mail size={16} /></a> : null}
                  {!message.read ? <button className="icon-button" onClick={() => markMessageRead(message.id)} type="button"><MailCheck size={16} /></button> : null}
                </div>
              </div>
              <h2>{message.subject || "Message"}</h2>
              <p>{truncate(message.message || "", 900)}</p>
              {message.pageUrl ? <small className="break-anywhere">Page: {message.pageUrl}</small> : null}
            </article>
          ))}
        </div>
      </RealtimeBoundary>
    </section>
  );
}
