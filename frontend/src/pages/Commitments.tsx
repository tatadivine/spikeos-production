import { AppShell } from "../components/layout/AppShell";
import { Card, SectionHeader } from "../components/ui/Card";
import { CommitmentCard } from "../components/communication/CommitmentCard";
import { commitmentsForOwner } from "../mock/generator";
import { ALEX_ID } from "../services";
import { EmptyState } from "../components/ui/States";

export function Commitments() {
  const all = commitmentsForOwner(ALEX_ID);
  const groups: { key: string; label: string; filter: (c: (typeof all)[0]) => boolean }[] = [
    { key: "due_today", label: "Due Today", filter: (c) => c.status === "due_today" },
    { key: "overdue", label: "Overdue", filter: (c) => c.status === "overdue" },
    { key: "due_this_week", label: "Due This Week", filter: (c) => c.status === "due_this_week" },
    { key: "active", label: "Active Commitments", filter: (c) => c.status === "active" },
    { key: "completed", label: "Completed", filter: (c) => c.status === "completed" },
  ];

  const summary = groups.map((g) => ({ ...g, count: all.filter(g.filter).length }));

  return (
    <AppShell pageTitle="Commitments">
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {summary.map((g) => (
          <Card key={g.key}>
            <p className="text-xs text-[var(--color-ink-500)]">{g.label}</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--color-ink-900)]">{g.count}</p>
          </Card>
        ))}
      </div>

      {groups.map((g) => {
        const items = all.filter(g.filter);
        if (items.length === 0) return null;
        return (
          <div key={g.key} className="mb-6">
            <SectionHeader title={g.label} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((c) => (
                <CommitmentCard key={c.id} commitment={c} />
              ))}
            </div>
          </div>
        );
      })}
      {all.length === 0 && <EmptyState title="No commitments found" description="Commitments detected in your communications will appear here." />}
    </AppShell>
  );
}
