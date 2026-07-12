"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/State";
import { PageHeader } from "@/components/ui/PageHeader";
import { fetchFraudReview } from "@/services/reviews";
import type { FraudReview } from "@/types/models";

function SignalList({ title, items }: { title: string; items: unknown[] }) {
  return (
    <article className="panel">
      <div className="panel-head"><h2>{title}</h2><span>{items.length}</span></div>
      {items.length ? (
        <pre className="json-preview">{JSON.stringify(items, null, 2)}</pre>
      ) : (
        <EmptyState title="No signals" />
      )}
    </article>
  );
}

export default function ReviewsPage() {
  const [data, setData] = useState<FraudReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setData(await fetchFraudReview());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load review queue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <section>
      <PageHeader title="Review queue" eyebrow="Fraud and security signals">
        <button className="btn btn-secondary" onClick={load} type="button"><RefreshCw size={16} /> Refresh</button>
      </PageHeader>
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} /> : null}
      {data ? (
        <div className="split-grid">
          <SignalList title="Duplicate phones" items={data.duplicatePhones || []} />
          <SignalList title="OTP sends" items={data.repeatedOtpSends || []} />
          <SignalList title="OTP failures" items={data.repeatedOtpFailures || []} />
          <SignalList title="Repeated cancellations" items={data.repeatedCancellations || []} />
          <SignalList title="Price mismatches" items={data.priceMismatches || []} />
          <SignalList title="Rate-limit bursts" items={data.suspiciousBursts || []} />
          <SignalList title="Recent security events" items={data.recentEvents || []} />
        </div>
      ) : null}
    </section>
  );
}
