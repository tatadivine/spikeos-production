import { useEffect, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { Card } from "../components/ui/Card";
import { DataTable, type Column } from "../components/ui/DataTable";
import { StatusBadge, statusToTone } from "../components/ui/Badge";
import { EmptyState, ErrorState } from "../components/ui/States";
import { api } from "../lib/api";
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

  const [items, setItems] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function loadFollowUps() {
    setLoading(true);
    setError(null);

    try {
      const data = await api<FollowUp[]>("/followups");
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load follow-ups."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFollowUps();
  }, []);

  async function completeFollowUp(id: string) {
    setBusyId(id);

    try {
      await api(`/followups/${id}/complete`, {
        method: "POST",
      });

      pushToast("Follow-up marked complete.", "success");
      await loadFollowUps();
    } catch (err) {
      pushToast(
        err instanceof Error
          ? err.message
          : "Unable to complete follow-up.",
        "error"
      );
    } finally {
      setBusyId(null);
    }
  }

  async function rescheduleFollowUp(id: string) {
    const dueDate = window.prompt(
      "Enter the new due date (YYYY-MM-DD):"
    );

    if (!dueDate) {
      return;
    }

    setBusyId(id);

    try {
      await api(`/followups/${id}/reschedule`, {
        method: "POST",
        body: JSON.stringify({
          due_date: dueDate,
        }),
      });

      pushToast("Follow-up rescheduled.", "success");
      await loadFollowUps();
    } catch (err) {
      pushToast(
        err instanceof Error
          ? err.message
          : "Unable to reschedule follow-up.",
        "error"
      );
    } finally {
      setBusyId(null);
    }
  }

  async function assignFollowUp(id: string) {
    const employeeId = window.prompt(
      "Enter the employee ID to assign this follow-up to:"
    );

    if (!employeeId) {
      return;
    }

    setBusyId(id);

    try {
      await api(`/followups/${id}/assign`, {
        method: "POST",
        body: JSON.stringify({
          employee_id: employeeId,
        }),
      });

      pushToast("Follow-up assigned.", "success");
      await loadFollowUps();
    } catch (err) {
      pushToast(
        err instanceof Error
          ? err.message
          : "Unable to assign follow-up.",
        "error"
      );
    } finally {
      setBusyId(null);
    }
  }

  const cards = [
    {
      label: "Open Follow-ups",
      count: items.filter((f) => f.status === "open").length,
    },
    {
      label: "Overdue",
      count: items.filter((f) => f.status === "overdue").length,
    },
    {
      label: "Due Today",
      count: items.filter((f) => f.status === "due_today").length,
    },
    {
      label: "Completed",
      count: items.filter((f) => f.status === "completed").length,
    },
    {
      label: "Escalated",
      count: items.filter((f) => f.status === "escalated").length,
    },
  ];

  const columns: Column<FollowUp>[] = [
    {
      key: "contact",
      header: "Contact",
      render: (row) => row.contact,
    },
    {
      key: "subject",
      header: "Subject",
      render: (row) => (
        <span className="line-clamp-1 max-w-xs">
          {row.subject}
        </span>
      ),
    },
    {
      key: "owner",
      header: "Owner",
      render: (row) => row.ownerId || "Unknown",
    },
    {
      key: "due",
      header: "Due Date",
      render: (row) => formatDate(row.dueDate),
      sortValue: (row) => row.dueDate,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <StatusBadge
          label={STATUS_LABEL[row.status] || row.status}
          tone={statusToTone(row.status)}
        />
      ),
    },
    {
      key: "last",
      header: "Last Activity",
      render: (row) => formatDate(row.lastActivity),
    },
    {
      key: "actions",
      header: "Next Action",
      render: (row) => {
        const busy = busyId === row.id;
        const completed = row.status === "completed";

        return (
          <div className="flex flex-wrap gap-2">
            {!completed && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void completeFollowUp(row.id)}
                className="text-xs font-medium text-[var(--color-blue-600)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Working..." : "Complete"}
              </button>
            )}

            {!completed && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void rescheduleFollowUp(row.id)}
                className="text-xs text-[var(--color-ink-500)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reschedule
              </button>
            )}

            {!completed && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void assignFollowUp(row.id)}
                className="text-xs text-[var(--color-ink-500)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Assign
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <AppShell pageTitle="Follow-ups">
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {cards.map((card) => (
          <Card key={card.label}>
            <p className="text-xs text-[var(--color-ink-500)]">
              {card.label}
            </p>

            <p className="mt-2 text-2xl font-semibold text-[var(--color-ink-900)]">
              {card.count}
            </p>
          </Card>
        ))}
      </div>

      {loading ? (
        <Card>
          <p className="text-sm text-[var(--color-ink-500)]">
            Loading follow-ups...
          </p>
        </Card>
      ) : error ? (
        <ErrorState
          message={error}
          onRetry={() => void loadFollowUps()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="No follow-ups"
          description="There are no follow-ups available for your current access scope."
        />
      ) : (
        <DataTable
          columns={columns}
          rows={items}
        />
      )}
    </AppShell>
  );
}