"use client";

import { useEffect, useState } from "react";
import type { QueryConstraint } from "firebase/firestore";
import { ErrorState, LoadingState } from "@/components/ui/State";
import { subscribeCollection } from "@/services/firestore";

export function useRealtimeCollection<T extends { id: string }>(collectionName: string, constraints: QueryConstraint[] = []) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeCollection<T>(
      collectionName,
      (nextItems) => {
        setItems(nextItems);
        setLoading(false);
        setError("");
      },
      (firestoreError) => {
        setError(firestoreError.message);
        setLoading(false);
      },
      constraints,
    );
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName]);

  return { items, loading, error };
}

export function RealtimeBoundary({
  loading,
  error,
  children,
}: {
  loading: boolean;
  error: string;
  children: React.ReactNode;
}) {
  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  return <>{children}</>;
}
