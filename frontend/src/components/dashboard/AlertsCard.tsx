import { useState, useEffect, type ReactNode } from "react";
import { Bell, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card } from "../ui/Card";
import { Modal } from "../ui/Modal";
import { useSession } from "../../lib/SessionContext";

export interface AlertRow {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  subject: string;
  from: string;
  preview: string;
  meta: string;
  action: "Respond Now" | "Add Commitment" | "Review";
}

export function AlertsCard({
  alerts,
  onOpenCountChange,
}: {
  alerts: AlertRow[];
  onOpenCountChange?: (count: number) => void;
}) {
  const { pushToast } = useSession();
  const [open, setOpen] = useState<AlertRow[]>(alerts);
  const [resolvedCount, setResolvedCount] = useState(0);
  const [modalAlert, setModalAlert] = useState<AlertRow | null>(null);
  const [form, setForm] = useState({ owner: "", due: "", next: "" });

  useEffect(() => {
    onOpenCountChange?.(open.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open.length]);

  function resolve(alert: AlertRow, note: string) {
    setOpen((prev) => prev.filter((a) => a.id !== alert.id));
    setResolvedCount((c) => c + 1);
    setModalAlert(null);
    setForm({ owner: "", due: "", next: "" });
    pushToast(`"${alert.title}" marked resolved — ${note}`, "success");
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-[var(--color-ink-900)]">
          <Bell size={16} className="text-[var(--color-blue-600)]" /> Needs Your Attention
        </h2>
        <span className="text-xs text-[var(--color-ink-500)]">{open.length} open</span>
      </div>

      {open.length === 0 && (
        <div className="rounded-lg border border-dashed border-[var(--color-line)] py-8 text-center text-sm text-[var(--color-ink-500)]">
          All caught up — nice work.
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {open.map((a) => (
          <div
            key={a.id}
            className="rounded-lg border border-[var(--color-line)] p-3"
            style={{ borderLeft: `4px solid ${a.severity === "high" ? "var(--color-red-600)" : "var(--color-blue-600)"}` }}
          >
            <p className="text-[13px] font-semibold text-[var(--color-ink-900)]">{a.title}</p>
            <p className="mt-0.5 mb-2.5 text-[11px] text-[var(--color-ink-500)]">
              {a.subject} · {a.meta}
            </p>
            <button
              onClick={() => setModalAlert(a)}
              className="rounded-md px-2.5 py-1.5 text-xs font-medium text-white"
              style={{ background: a.severity === "high" ? "var(--color-red-600)" : "var(--color-blue-600)" }}
            >
              {a.action}
            </button>
          </div>
        ))}
      </div>

      {resolvedCount > 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[var(--color-green-600)]">
          <CheckCircle2 size={13} /> {resolvedCount} resolved this session
        </p>
      )}

      <Modal open={!!modalAlert} onClose={() => setModalAlert(null)} title={modalAlert?.subject ?? ""}>
        {modalAlert && (
          <div>
            <p className="mb-2 text-xs text-[var(--color-ink-500)]">From {modalAlert.from}</p>
            <p className="mb-4 rounded-md bg-[var(--color-surface)] p-3 text-[13px] text-[var(--color-ink-700)]">{modalAlert.preview}</p>

            {modalAlert.action === "Add Commitment" ? (
              <div className="space-y-3">
                <Field label="Owner">
                  <input
                    value={form.owner}
                    onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
                    placeholder="e.g. Diego Reyes"
                    className="w-full rounded-md border border-[var(--color-line)] px-2.5 py-1.5 text-sm"
                  />
                </Field>
                <Field label="Due date">
                  <input
                    type="date"
                    value={form.due}
                    onChange={(e) => setForm((f) => ({ ...f, due: e.target.value }))}
                    className="w-full rounded-md border border-[var(--color-line)] px-2.5 py-1.5 text-sm"
                  />
                </Field>
                <Field label="Next step">
                  <textarea
                    value={form.next}
                    onChange={(e) => setForm((f) => ({ ...f, next: e.target.value }))}
                    rows={3}
                    placeholder="What happens next, and by whom"
                    className="w-full resize-y rounded-md border border-[var(--color-line)] px-2.5 py-1.5 text-sm"
                  />
                </Field>
                <button
                  disabled={!form.owner || !form.due}
                  onClick={() => resolve(modalAlert, `commitment logged for ${form.owner}, due ${form.due}.`)}
                  className="w-full rounded-md bg-[var(--color-blue-600)] py-2 text-sm font-medium text-white disabled:opacity-40"
                >
                  Save commitment
                </button>
              </div>
            ) : (
              <button
                onClick={() =>
                  resolve(modalAlert, modalAlert.action === "Respond Now" ? "marked as responded." : "marked as reviewed.")
                }
                className="w-full rounded-md bg-[var(--color-blue-600)] py-2 text-sm font-medium text-white"
              >
                {modalAlert.action === "Respond Now" ? "Mark as responded" : "Mark as reviewed"}
              </button>
            )}

            <p className="mt-3 flex items-start gap-1.5 text-[11px] text-[var(--color-ink-400)]">
              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
              This updates the demo state only — no live mailbox is connected.
            </p>
          </div>
        )}
      </Modal>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-[var(--color-ink-700)]">{label}</p>
      {children}
    </div>
  );
}
