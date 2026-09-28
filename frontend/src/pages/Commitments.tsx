import { useEffect, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { Card, SectionHeader } from "../components/ui/Card";
import { CommitmentCard } from "../components/communication/CommitmentCard";
import { EmptyState, ErrorState } from "../components/ui/States";
import { api } from "../lib/api";
import type { Commitment } from "../types";

export function Commitments() {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadCommitments() {
    setLoading(true);
    setError(null);

    try {
      const data = await api<Commitment[]>("/commitments");
      setCommitments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load commitments."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCommitments();
  }, []);

  const groups: {
    key: string;
    label: string;
    filter: (commitment: Commitment) => boolean;
  }[] = [
    {
      key: "due_today",
      label: "Due Today",
      filter: (commitment) => commitment.status === "due_today",
    },
    {
      key: "overdue",
      label: "Overdue",
      filter: (commitment) => commitment.status === "overdue",
    },
    {
      key: "due_this_week",
      label: "Due This Week",
      filter: (commitment) => commitment.status === "due_this_week",
    },
    {
      key: "active",
      label: "Active Commitments",
      filter: (commitment) => commitment.status === "active",
    },
    {
      key: "completed",
      label: "Completed",
      filter: (commitment) => commitment.status === "completed",
    },
  ];

  const summary = groups.map((group) => ({
    ...group,
    count: commitments.filter(group.filter).length,
  }));

  return (
    <AppShell pageTitle="Commitments">
      {loading ? (
        <Card>
          <p className="text-sm text-[var(--color-ink-500)]">
            Loading commitments...
          </p>
        </Card>
      ) : error ? (
        <ErrorState
          message={`Unable to load commitments: ${error}`}
          onRetry={() => void loadCommitments()}
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
            {summary.map((group) => (
              <Card key={group.key}>
                <p className="text-xs text-[var(--color-ink-500)]">
                  {group.label}
                </p>

                <p className="mt-2 text-2xl font-semibold text-[var(--color-ink-900)]">
                  {group.count}
                </p>
              </Card>
            ))}
          </div>

          {groups.map((group) => {
            const items = commitments.filter(group.filter);

            if (items.length === 0) {
              return null;
            }

            return (
              <div key={group.key} className="mb-6">
                <SectionHeader title={group.label} />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((commitment) => (
                    <CommitmentCard
                      key={commitment.id}
                      commitment={commitment}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {commitments.length === 0 && (
            <EmptyState
              title="No commitments found"
              description="Commitments created from your communications will appear here."
            />
          )}
        </>
      )}
    </AppShell>
  );
}