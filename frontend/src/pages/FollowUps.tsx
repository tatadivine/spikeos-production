import { AppShell } from "../components/layout/AppShell";
import { Card } from "../components/ui/Card";
import { DataTable, type Column } from "../components/ui/DataTable";
import { StatusBadge, statusToTone } from "../components/ui/Badge";
import { followUpsForOwner } from "../mock/generator";
import { ALEX_ID } from "../services";
import { formatDate } from "../lib/format";
import type { FollowUp } from "../types";
import { useSession } from "../lib/SessionContext";

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  overdue: "Overdue",
  due_today: "Due today",
  completed: "Completed",
  escalated: "Escalated",
};

export function FollowUps() {
  const { pushToast } = useSession();
  const items = followUpsForOwner(ALEX_ID);
  const cards = [
    { label: "Open Follow-ups", count: items.filter((f) => f.status === "open").length },
    { label: "Overdue", count: items.filter((f) => f.status === "overdue").length },
    { label: "Due Today", count: items.filter((f) => f.status === "due_today").length },
    { label: "Completed", count: items.filter((f) => f.status === "completed").length },
    { label: "Escalated", count: items.filter((f) => f.status === "escalated").length },
  ];

  const columns: Column<FollowUp>[] = [
    { key: "contact", header: "Contact", render: (r) => r.contact },
    { key: "subject", header: "Subject", render: (r) => <span className="line-clamp-1 max-w-xs">{r.subject}</span> },
    { key: "owner", header: "Owner", render: () => "Alex Johnson" },
    { key: "due", header: "Due Date", render: (r) => formatDate(r.dueDate), sortValue: (r) => r.dueDate },
    { key: "status", header: "Status", render: (r) => <StatusBadge label={STATUS_LABEL[r.status]} tone={statusToTone(r.status)} /> },
    { key: "last", header: "Last Activity", render: (r) => formatDate(r.lastActivity) },
    {
      key: "actions",
      header: "Next Action",
      render: (r) => (
        <div className="flex gap-2">
          <button onClick={() => pushToast("Follow-up marked complete.", "success")} className="text-xs font-medium text-[var(--color-blue-600)]">Complete</button>
          <button onClick={() => pushToast("Follow-up rescheduled.")} className="text-xs text-[var(--color-ink-500)]">Reschedule</button>
          <button onClick={() => pushToast("Follow-up assigned.")} className="text-xs text-[var(--color-ink-500)]">Assign</button>
        </div>
      ),
    },
  ];

  return (
    <AppShell pageTitle="Follow-ups">
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {cards.map((c) => (
          <Card key={c.label}>
            <p className="text-xs text-[var(--color-ink-500)]">{c.label}</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--color-ink-900)]">{c.count}</p>
          </Card>
        ))}
      </div>
      <DataTable columns={columns} rows={items} />
    </AppShell>
  );
}
