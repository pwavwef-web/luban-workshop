"use client";

import { Archive, RotateCcw, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import { SearchInput } from "@/components/admin/SearchInput";
import { RealtimeBoundary, useRealtimeCollection } from "@/components/admin/RealtimeList";
import { Badge } from "@/components/ui/Badge";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { EmptyState } from "@/components/ui/State";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatDateTime, truncate } from "@/lib/dates";
import { getKnowledgeStatus, saveKnowledge, toggleKnowledge } from "@/services/chatbot";
import { seedSecureChatbotFacts } from "@/services/reviews";
import type { ChatbotKnowledge } from "@/types/models";

export default function ChatbotPage() {
  const { items, loading, error } = useRealtimeCollection<ChatbotKnowledge>("chatbotKnowledge");
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");
  const [answer, setAnswer] = useState("");
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return q ? items.filter((item) => JSON.stringify(item).toLowerCase().includes(q)) : items;
  }, [items, query]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await saveKnowledge(null, title, answer, "active");
    setTitle("");
    setAnswer("");
  }

  return (
    <section>
      <PageHeader title="Chatbot knowledge" eyebrow="Public Bao facts">
        <SearchInput value={query} onChange={setQuery} placeholder="Search facts" />
        <ConfirmButton className="btn btn-secondary" confirm="Seed the secure default chatbot facts?" onConfirm={async () => { await seedSecureChatbotFacts(); }}><Wand2 size={16} /> Seed defaults</ConfirmButton>
      </PageHeader>
      <form className="panel form-grid" onSubmit={submit}>
        <label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
        <label className="span-2">Answer<textarea value={answer} onChange={(event) => setAnswer(event.target.value)} maxLength={2500} required /></label>
        <button className="btn btn-primary" type="submit">Save fact</button>
      </form>
      <RealtimeBoundary loading={loading} error={error}>
        {!filtered.length ? <EmptyState title="No chatbot facts found" /> : null}
        <div className="table-wrap">
          <table>
            <thead><tr><th>Fact</th><th>Status</th><th>Updated</th><th /></tr></thead>
            <tbody>
              {filtered.map((fact) => {
                const status = getKnowledgeStatus(fact);
                const titleText = fact.title || fact.name || fact.question || fact.id;
                const answerText = fact.answer || fact.content || fact.body || fact.description || fact.text || "";
                return (
                  <tr className={status === "archived" ? "dim-row" : ""} key={fact.id}>
                    <td><strong>{titleText}</strong><small>{truncate(answerText, 180)}</small></td>
                    <td><Badge tone={status === "active" ? "green" : "red"}>{status}</Badge></td>
                    <td>{formatDateTime(fact.updatedAt || fact.createdAt)}</td>
                    <td><ConfirmButton className="icon-button" confirm={`${status === "active" ? "Archive" : "Restore"} ${titleText}?`} onConfirm={() => toggleKnowledge(fact)}>{status === "active" ? <Archive size={16} /> : <RotateCcw size={16} />}</ConfirmButton></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </RealtimeBoundary>
    </section>
  );
}
