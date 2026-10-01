import { useEffect, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { Tabs } from "../components/ui/FilterBar";
import { ReviewCard } from "../components/team/ReviewCard";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { api } from "../lib/api";
import type { Review } from "../types";

export function Reviews() {
  const [tab, setTab] = useState("pending_review");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(showSpinner = true) {
    if (showSpinner) setLoading(true);
    setError(null);
    try {
      const data = await api<Review[]>("/reviews");
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load reviews.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = tab === "all" ? reviews : reviews.filter((r) => r.status === tab);
  const count = (s: Review["status"]) => reviews.filter((r) => r.status === s).length;

  return (
    <AppShell pageTitle="Manager Review Center">
      <div className="mb-6 rounded-lg border border-[var(--color-blue-100)] bg-[var(--color-blue-50)] p-4 text-sm text-[var(--color-blue-600)]">
        Findings are never automatically final. Each item below is an SLA breach from a tracked
        communication and requires a manager decision — confirm, dismiss, request context, or mark
        incorrect. Decisions are saved and do not change performance records on their own.
      </div>
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : (
        <>
          <Tabs
            active={tab}
            onChange={setTab}
            tabs={[
              { key: "pending_review", label: "Pending Review", count: count("pending_review") },
              { key: "needs_context", label: "Needs Context", count: count("needs_context") },
              { key: "confirmed", label: "Confirmed", count: count("confirmed") },
              { key: "dismissed", label: "Dismissed", count: count("dismissed") },
              { key: "incorrect", label: "Incorrect", count: count("incorrect") },
              { key: "all", label: "All", count: reviews.length },
            ]}
          />
          {filtered.length === 0 ? (
            <EmptyState
              title="No findings in this category"
              description={
                reviews.length === 0
                  ? "SLA breaches for employees in your scope appear here for review."
                  : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {filtered.map((r) => (
                <ReviewCard key={`${r.id}-${r.status}`} review={r} onDecided={() => void load(false)} />
              ))}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
