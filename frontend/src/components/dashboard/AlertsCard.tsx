import {
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Card } from "../ui/Card";
import { Modal } from "../ui/Modal";
import { useSession } from "../../lib/SessionContext";
import { api } from "../../lib/api";
import { loadLiveBootstrap } from "../../lib/liveBootstrap";

export interface AlertRow {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  subject: string;
  from: string;
  preview: string;
  meta: string;
  action:
    | "Respond Now"
    | "Add Commitment"
    | "Review";
  webLink?: string | null;
}

// Re-sync the shared bootstrap state so other pages (and a remount of this
// card) reflect the persisted alert status instead of the stale snapshot.
function refreshSharedState() {
  void loadLiveBootstrap().catch(() => undefined);
}

export function AlertsCard({
  alerts,
  onOpenCountChange,
}: {
  alerts: AlertRow[];
  onOpenCountChange?: (
    count: number
  ) => void;
}) {
  const { pushToast } =
    useSession();

  const [open, setOpen] =
    useState<AlertRow[]>(alerts);

  const [resolvedCount, setResolvedCount] =
    useState(0);

  const [modalAlert, setModalAlert] =
    useState<AlertRow | null>(null);

  const [form, setForm] = useState({
    owner: "",
    due: "",
    next: "",
  });

  useEffect(() => {
    setOpen(alerts);
  }, [alerts]);

  useEffect(() => {
    onOpenCountChange?.(
      open.length
    );
  }, [
    open.length,
    onOpenCountChange,
  ]);

  async function resolveAlert(
    alert: AlertRow,
    note: string
  ) {
    try {
      await api(
        `/alerts/${alert.id}/review`,
        {
          method: "POST",
        }
      );

      setOpen((previous) =>
        previous.filter(
          (item) =>
            item.id !== alert.id
        )
      );

      setResolvedCount(
        (count) => count + 1
      );

      refreshSharedState();

      setModalAlert(null);

      setForm({
        owner: "",
        due: "",
        next: "",
      });

      pushToast(
        `"${alert.title}" marked reviewed — ${note}`,
        "success"
      );
    } catch (error) {
      pushToast(
        error instanceof Error
          ? error.message
          : "Unable to update alert.",
        "error"
      );
    }
  }

  async function dismissAlert(
    alert: AlertRow
  ) {
    try {
      await api(
        `/alerts/${alert.id}/dismiss`,
        {
          method: "POST",
        }
      );

      setOpen((previous) =>
        previous.filter(
          (item) =>
            item.id !== alert.id
        )
      );

      setResolvedCount(
        (count) => count + 1
      );

      refreshSharedState();

      setModalAlert(null);

      pushToast(
        `"${alert.title}" dismissed.`,
        "success"
      );
    } catch (error) {
      pushToast(
        error instanceof Error
          ? error.message
          : "Unable to dismiss alert.",
        "error"
      );
    }
  }

  async function createCommitment(
    alert: AlertRow
  ) {
    if (!form.due) {
      return;
    }

    try {
      await api(
        `/alerts/${alert.id}/commitment`,
        {
          method: "POST",
          body: JSON.stringify({
            due_date: form.due,
            next_step: form.next || null,
          }),
        }
      );

      setOpen((previous) =>
        previous.filter(
          (item) =>
            item.id !== alert.id
        )
      );

      setResolvedCount(
        (count) => count + 1
      );

      refreshSharedState();

      setModalAlert(null);

      setForm({
        owner: "",
        due: "",
        next: "",
      });

      pushToast(
        `"${alert.title}" converted to a commitment.`,
        "success"
      );
    } catch (error) {
      pushToast(
        error instanceof Error
          ? error.message
          : "Unable to create commitment.",
        "error"
      );
    }
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold text-[var(--color-ink-900)]">
          <Bell
            size={16}
            className="text-[var(--color-blue-600)]"
          />

          Needs Your Attention
        </h2>

        <span className="text-xs text-[var(--color-ink-500)]">
          {open.length} open
        </span>
      </div>

      {open.length === 0 && (
        <div className="rounded-lg border border-dashed border-[var(--color-line)] py-8 text-center text-sm text-[var(--color-ink-500)]">
          All caught up — nice work.
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {open.map((alert) => (
          <div
            key={alert.id}
            className="rounded-lg border border-[var(--color-line)] p-3"
            style={{
              borderLeft: `4px solid ${
                alert.severity === "high"
                  ? "var(--color-red-600)"
                  : "var(--color-blue-600)"
              }`,
            }}
          >
            <p className="text-[13px] font-semibold text-[var(--color-ink-900)]">
              {alert.title}
            </p>

            <p className="mt-0.5 mb-2.5 text-[11px] text-[var(--color-ink-500)]">
              {alert.subject} ·{" "}
              {alert.meta}
            </p>

            <button
              type="button"
              onClick={() =>
                setModalAlert(alert)
              }
              className="rounded-md px-2.5 py-1.5 text-xs font-medium text-white"
              style={{
                background:
                  alert.severity ===
                  "high"
                    ? "var(--color-red-600)"
                    : "var(--color-blue-600)",
              }}
            >
              {alert.action}
            </button>
          </div>
        ))}
      </div>

      {resolvedCount > 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[var(--color-green-600)]">
          <CheckCircle2 size={13} />
          {resolvedCount} resolved this session
        </p>
      )}

      <Modal
        open={!!modalAlert}
        onClose={() =>
          setModalAlert(null)
        }
        title={
          modalAlert?.subject ?? ""
        }
      >
        {modalAlert && (
          <div>
            <p className="mb-2 text-xs text-[var(--color-ink-500)]">
              From {modalAlert.from}
            </p>

            <p className="mb-4 rounded-md bg-[var(--color-surface)] p-3 text-[13px] text-[var(--color-ink-700)]">
              {modalAlert.preview}
            </p>

            {modalAlert.action ===
            "Add Commitment" ? (
              <div className="space-y-3">
                <Field label="Owner">
                  <input
                    value={form.owner}
                    onChange={(event) =>
                      setForm(
                        (previous) => ({
                          ...previous,
                          owner:
                            event.target
                              .value,
                        })
                      )
                    }
                    placeholder="Owner"
                    className="w-full rounded-md border border-[var(--color-line)] px-2.5 py-1.5 text-sm"
                  />
                </Field>

                <Field label="Due date">
                  <input
                    type="date"
                    value={form.due}
                    onChange={(event) =>
                      setForm(
                        (previous) => ({
                          ...previous,
                          due:
                            event.target
                              .value,
                        })
                      )
                    }
                    className="w-full rounded-md border border-[var(--color-line)] px-2.5 py-1.5 text-sm"
                  />
                </Field>

                <Field label="Next step">
                  <textarea
                    value={form.next}
                    onChange={(event) =>
                      setForm(
                        (previous) => ({
                          ...previous,
                          next:
                            event.target
                              .value,
                        })
                      )
                    }
                    rows={3}
                    placeholder="What happens next?"
                    className="w-full resize-y rounded-md border border-[var(--color-line)] px-2.5 py-1.5 text-sm"
                  />
                </Field>

                <button
                  type="button"
                  disabled={
                    !form.due
                  }
                  onClick={() =>
                    void createCommitment(
                      modalAlert
                    )
                  }
                  className="w-full rounded-md bg-[var(--color-blue-600)] py-2 text-sm font-medium text-white disabled:opacity-40"
                >
                  Save commitment
                </button>
              </div>
            ) : modalAlert.action ===
              "Respond Now" ? (
              <div className="space-y-3">
                <div className="rounded-md bg-[var(--color-amber-100)] p-3 text-xs text-[var(--color-amber-600)]">
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      size={13}
                      className="mt-0.5 shrink-0"
                    />

                    <span>
                      This communication
                      requires a response
                      in Outlook. Open the
                      message there, send
                      your response, then
                      return to SpikeOS.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (modalAlert.webLink) {
                      window.open(
                        modalAlert.webLink,
                        "_blank",
                        "noopener"
                      );
                      return;
                    }

                    pushToast(
                      "Open Outlook to send the response, then refresh SpikeOS.",
                      "success"
                    );
                  }}
                  className="w-full rounded-md bg-[var(--color-blue-600)] py-2 text-sm font-medium text-white"
                >
                  Open Outlook
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void dismissAlert(
                      modalAlert
                    )
                  }
                  className="w-full rounded-md border border-[var(--color-line)] py-2 text-sm font-medium text-[var(--color-ink-700)]"
                >
                  Dismiss alert
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() =>
                    void resolveAlert(
                      modalAlert,
                      "review completed."
                    )
                  }
                  className="w-full rounded-md bg-[var(--color-blue-600)] py-2 text-sm font-medium text-white"
                >
                  Mark as reviewed
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void dismissAlert(
                      modalAlert
                    )
                  }
                  className="w-full rounded-md border border-[var(--color-line)] py-2 text-sm font-medium text-[var(--color-ink-700)]"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-[var(--color-ink-700)]">
        {label}
      </p>

      {children}
    </div>
  );
}