import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Card } from "../components/ui/Card";
import { DataTable, type Column } from "../components/ui/DataTable";
import { StatusBadge, statusToTone } from "../components/ui/Badge";
import { EmptyState, ErrorState } from "../components/ui/States";
import { Tabs } from "../components/ui/FilterBar";
import { Modal } from "../components/ui/Modal";
import { api } from "../lib/api";
import { formatDate } from "../lib/format";
import { loadLiveBootstrap } from "../lib/liveBootstrap";
import { employeeService } from "../services";
import type { FollowUp } from "../types";
import { useSession } from "../lib/SessionContext";

const STATUS_LABEL: Record<string, string> = {
  open: "Open",
  overdue: "Overdue",
  due_today: "Due today",
  completed: "Completed",
  escalated: "Escalated",
};

type Dialog =
  | { mode: "create" }
  | { mode: "reschedule"; row: FollowUp }
  | { mode: "assign"; row: FollowUp };

const EMPTY_FORM = {
  subject: "",
  contact: "",
  due: "",
  next: "",
  owner: "",
};

function ownerName(id: string | null | undefined) {
  if (!id) return "Unassigned";
  return employeeService.get(id)?.name ?? "Unknown employee";
}

export function FollowUps() {
  const { pushToast, employeeId } = useSession();

  const [items, setItems] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tab, setTab] = useState("active");
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

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

  // Reload this page and re-sync the shared bootstrap state used elsewhere.
  async function afterChange() {
    await loadFollowUps();
    void loadLiveBootstrap().catch(() => undefined);
  }

  async function completeFollowUp(id: string) {
    setBusyId(id);

    try {
      await api(`/followups/${id}/complete`, {
        method: "POST",
      });

      pushToast("Follow-up marked complete.", "success");
      await afterChange();
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

  function openDialog(next: Dialog) {
    setForm({
      ...EMPTY_FORM,
      due:
        next.mode === "reschedule" && next.row.dueDate
          ? next.row.dueDate.slice(0, 10)
          : "",
      owner:
        next.mode === "assign"
          ? next.row.ownerId
          : employeeId ?? "",
    });
    setDialog(next);
  }

  async function submitDialog() {
    if (!dialog) return;

    setSaving(true);

    try {
      if (dialog.mode === "create") {
        await api("/followups", {
          method: "POST",
          body: JSON.stringify({
            subject: form.subject,
            contact: form.contact || null,
            due_date: form.due || null,
            next_action: form.next || null,
            employee_id: form.owner || null,
          }),
        });
        pushToast("Follow-up created.", "success");
      } else if (dialog.mode === "reschedule") {
        await api(`/followups/${dialog.row.id}/reschedule`, {
          method: "POST",
          body: JSON.stringify({
            due_date: form.due,
          }),
        });
        pushToast("Follow-up rescheduled.", "success");
      } else {
        await api(`/followups/${dialog.row.id}/assign`, {
          method: "POST",
          body: JSON.stringify({
            employee_id: form.owner,
          }),
        });
        pushToast("Follow-up assigned.", "success");
      }

      setDialog(null);
      await afterChange();
    } catch (err) {
      pushToast(
        err instanceof Error
          ? err.message
          : "Unable to save follow-up.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  const active = items.filter((f) => f.status !== "completed");

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

  const filtered =
    tab === "all"
      ? items
      : tab === "active"
        ? active
        : items.filter((f) => f.status === tab);

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
        <div className="max-w-xs">
          {row.communicationId ? (
            <Link
              to={`/communication/${row.communicationId}`}
              className="line-clamp-1 text-[var(--color-blue-600)] hover:underline"
            >
              {row.subject}
            </Link>
          ) : (
            <span className="line-clamp-1">{row.subject}</span>
          )}
          <span className="text-[11px] text-[var(--color-ink-400)]">
            {row.source === "auto"
              ? "Flagged in Outlook"
              : "Created in SpikeOS"}
          </span>
        </div>
      ),
    },
    {
      key: "owner",
      header: "Owner",
      render: (row) => ownerName(row.ownerId),
      sortValue: (row) => ownerName(row.ownerId),
    },
    {
      key: "due",
      header: "Due Date",
      render: (row) =>
        row.dueDate ? formatDate(row.dueDate) : "No due date",
      sortValue: (row) => row.dueDate || "9999",
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
      render: (row) =>
        row.lastActivity ? formatDate(row.lastActivity) : "—",
      sortValue: (row) => row.lastActivity || "",
    },
    {
      key: "actions",
      header: "Next Action",
      render: (row) => {
        const busy = busyId === row.id;
        const completed = row.status === "completed";

        if (completed) {
          return (
            <span className="text-xs text-[var(--color-ink-400)]">
              Completed
              {row.completedAt ? ` ${formatDate(row.completedAt)}` : ""}
            </span>
          );
        }

        return (
          <div>
            {row.nextAction && row.nextAction !== "Complete" && (
              <p className="mb-1 line-clamp-1 max-w-[14rem] text-xs text-[var(--color-ink-700)]">
                {row.nextAction}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void completeFollowUp(row.id)}
                className="text-xs font-medium text-[var(--color-blue-600)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Working..." : "Complete"}
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => openDialog({ mode: "reschedule", row })}
                className="text-xs text-[var(--color-ink-500)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reschedule
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => openDialog({ mode: "assign", row })}
                className="text-xs text-[var(--color-ink-500)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Assign
              </button>
            </div>
          </div>
        );
      },
    },
  ];

  const assignable = employeeService.list();

  const canSubmit =
    dialog?.mode === "create"
      ? form.subject.trim().length > 0
      : dialog?.mode === "reschedule"
        ? form.due.length > 0
        : form.owner.length > 0;

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

      <div className="flex flex-wrap items-start justify-between gap-3">
        <Tabs
          active={tab}
          onChange={setTab}
          tabs={[
            { key: "active", label: "Active", count: active.length },
            { key: "overdue", label: "Overdue", count: cards[1].count },
            { key: "due_today", label: "Due today", count: cards[2].count },
            { key: "completed", label: "Completed", count: cards[3].count },
            { key: "all", label: "All", count: items.length },
          ]}
        />

        <button
          type="button"
          onClick={() => openDialog({ mode: "create" })}
          className="rounded-md bg-[var(--color-blue-600)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--color-blue-500)]"
        >
          New follow-up
        </button>
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
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No follow-ups"
          description={
            items.length === 0
              ? "Messages you flag for follow-up in Outlook appear here automatically, or create one with “New follow-up”."
              : "No follow-ups match this filter."
          }
        />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
        />
      )}

      <Modal
        open={!!dialog}
        onClose={() => setDialog(null)}
        title={
          dialog?.mode === "create"
            ? "New follow-up"
            : dialog?.mode === "reschedule"
              ? "Reschedule follow-up"
              : "Assign follow-up"
        }
      >
        <div className="space-y-3">
          {dialog?.mode === "create" && (
            <>
              <Field label="Subject">
                <input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full rounded-md border border-[var(--color-line)] px-2.5 py-1.5 text-sm"
                />
              </Field>
              <Field label="Contact">
                <input
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  className="w-full rounded-md border border-[var(--color-line)] px-2.5 py-1.5 text-sm"
                />
              </Field>
              <Field label="Next action">
                <input
                  value={form.next}
                  onChange={(e) => setForm({ ...form, next: e.target.value })}
                  className="w-full rounded-md border border-[var(--color-line)] px-2.5 py-1.5 text-sm"
                />
              </Field>
            </>
          )}

          {(dialog?.mode === "create" || dialog?.mode === "reschedule") && (
            <Field label="Due date">
              <input
                type="date"
                value={form.due}
                onChange={(e) => setForm({ ...form, due: e.target.value })}
                className="w-full rounded-md border border-[var(--color-line)] px-2.5 py-1.5 text-sm"
              />
            </Field>
          )}

          {(dialog?.mode === "create" || dialog?.mode === "assign") &&
            assignable.length > 0 && (
              <Field label="Owner">
                <select
                  value={form.owner}
                  onChange={(e) => setForm({ ...form, owner: e.target.value })}
                  className="w-full rounded-md border border-[var(--color-line)] px-2.5 py-1.5 text-sm"
                >
                  {assignable.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}

          <button
            type="button"
            disabled={!canSubmit || saving}
            onClick={() => void submitDialog()}
            className="w-full rounded-md bg-[var(--color-blue-600)] py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[var(--color-ink-700)]">
        {label}
      </span>
      {children}
    </label>
  );
}
