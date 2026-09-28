import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Card, SectionHeader } from "../components/ui/Card";
import {
  StatusBadge,
  priorityTone,
  statusToTone,
  AIBadge,
} from "../components/ui/Badge";
import { Timeline } from "../components/ui/Timeline";
import { ContextDrawer } from "../components/performance/ContextDrawer";
import { getCommunication } from "../mock/generator";
import { formatDateTime } from "../lib/format";
import { useSession } from "../lib/SessionContext";
import { ErrorState } from "../components/ui/States";
import { api } from "../lib/api";
import { loadLiveBootstrap } from "../lib/liveBootstrap";

type BackendCommitment = {
  id: string;
  title: string;
  source?: string;
  owner_id?: string;
  created_at?: string;
  due_date?: string | null;
  status?: string;
  next_step?: string;
};

type UICommitment = {
  id: string;
  title: string;
  source: string;
  ownerId: string;
  createdAt: string;
  dueDate: string;
  status: string;
  daysOverdue: number;
  nextAction: string;
};

function normalizeCommitment(
  commitment: BackendCommitment
): UICommitment {
  const dueDate = commitment.due_date || "";
  let status = commitment.status || "active";
  let daysOverdue = 0;

  if (status !== "completed" && dueDate) {
    const due = new Date(dueDate);
    const now = new Date();
    const diffDays =
      (due.getTime() - now.getTime()) /
      (1000 * 60 * 60 * 24);

    if (diffDays < 0) {
      status = "overdue";
      daysOverdue = Math.max(
        0,
        Math.ceil(Math.abs(diffDays))
      );
    } else if (diffDays < 1) {
      status = "due_today";
    } else if (diffDays < 7) {
      status = "due_this_week";
    } else {
      status = "active";
    }
  }

  return {
    id: commitment.id,
    title: commitment.title,
    source: commitment.source || "Outlook",
    ownerId: commitment.owner_id || "",
    createdAt: commitment.created_at || "",
    dueDate,
    status,
    daysOverdue,
    nextAction:
      commitment.next_step || "Close the loop",
  };
}

export function CommunicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    displayName,
    employeeId,
    pushToast,
  } = useSession();

  const [contextOpen, setContextOpen] =
    useState(false);

  const [commitmentFormOpen, setCommitmentFormOpen] =
    useState(false);

  const [commitmentTitle, setCommitmentTitle] =
    useState("");

  const [commitmentDueDate, setCommitmentDueDate] =
    useState("");

  const [commitmentNextStep, setCommitmentNextStep] =
    useState("");

  const [createdCommitment, setCreatedCommitment] =
    useState<UICommitment | null>(null);

  const [actionLoading, setActionLoading] =
    useState(false);

  const comm = id
    ? getCommunication(id)
    : undefined;

  if (!comm) {
    return (
      <AppShell pageTitle="Communication">
        <ErrorState
          message="This communication record could not be found."
          onRetry={() =>
            navigate("/communication")
          }
        />
      </AppShell>
    );
  }

  // Keep the successful TypeScript narrowing available
  // inside event handlers and other nested functions.
  const communication = comm;

  function openCommitmentForm() {
    setCommitmentTitle(communication.subject);
    setCommitmentDueDate("");
    setCommitmentNextStep(
      communication.nextStep || "Follow up with the contact"
    );
    setCommitmentFormOpen(true);
  }

  function closeCommitmentForm() {
    if (actionLoading) return;

    setCommitmentFormOpen(false);
    setCommitmentTitle("");
    setCommitmentDueDate("");
    setCommitmentNextStep("");
  }

  async function handleCreateCommitment() {
    if (!commitmentTitle.trim()) {
      pushToast(
        "Please enter a commitment title.",
        "error"
      );
      return;
    }

    setActionLoading(true);

    try {
      const payload = {
        title: commitmentTitle.trim(),
        source: "Outlook",
        owner_id: employeeId,
        due_date: commitmentDueDate || null,
        next_step:
          commitmentNextStep.trim() ||
          "Follow up with the contact",
        communication_id: communication.id,
      };

      const result =
        await api<BackendCommitment>(
          "/commitments",
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );

      const normalized =
        normalizeCommitment(result);

      setCreatedCommitment(normalized);
      setCommitmentFormOpen(false);

      pushToast(
        "Commitment created successfully.",
        "success"
      );

      await loadLiveBootstrap();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to create commitment.";

      pushToast(
        `Commitment could not be created: ${message}`,
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function refreshCommunication() {
    await loadLiveBootstrap();
  }

  async function handleMarkComplete() {
    if (actionLoading) return;

    setActionLoading(true);

    try {
      await api(
        `/communications/${communication.id}/complete`,
        {
          method: "POST",
        }
      );

      pushToast(
        "Communication marked as complete.",
        "success"
      );

      await refreshCommunication();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to complete communication.";

      pushToast(
        `Unable to mark communication complete: ${message}`,
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleEscalate() {
    if (actionLoading) return;

    setActionLoading(true);

    try {
      await api(
        `/communications/${communication.id}/escalate`,
        {
          method: "POST",
          body: JSON.stringify({
            reason:
              "Communication escalated for manager review.",
          }),
        }
      );

      pushToast(
        "Communication escalated successfully.",
        "success"
      );

      await refreshCommunication();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to escalate communication.";

      pushToast(
        `Unable to escalate communication: ${message}`,
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <AppShell pageTitle="Communication Detail">
      <button
        type="button"
        onClick={() =>
          navigate("/communication")
        }
        className="mb-4 text-xs font-medium text-[var(--color-blue-600)] hover:underline"
      >
        ← Back to My Communication
      </button>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-[var(--color-ink-900)]">
                  {communication.subject}
                </h2>

                <p className="mt-1 text-xs text-[var(--color-ink-500)]">
                  {communication.contact} ·{" "}
                  {communication.organization} ·{" "}
                  {communication.category}
                </p>
              </div>

              <div className="flex shrink-0 flex-row flex-wrap items-center gap-1.5 sm:flex-col sm:items-end">
                <StatusBadge
                  label={communication.status.replace(
                    "_",
                    " "
                  )}
                  tone={statusToTone(
                    communication.status
                  )}
                />

                <StatusBadge
                  label={communication.priority}
                  tone={priorityTone(
                    communication.priority
                  )}
                />
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--color-line)] pt-4 text-xs sm:grid-cols-4">
              <div>
                <dt className="text-[var(--color-ink-400)]">
                  Received
                </dt>
                <dd className="text-[var(--color-ink-900)]">
                  {formatDateTime(
                    communication.receivedAt
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-[var(--color-ink-400)]">
                  Responded
                </dt>
                <dd className="text-[var(--color-ink-900)]">
                  {communication.respondedAt
                    ? formatDateTime(
                        communication.respondedAt
                      )
                    : "—"}
                </dd>
              </div>

              <div>
                <dt className="text-[var(--color-ink-400)]">
                  Owner
                </dt>
                <dd className="text-[var(--color-ink-900)]">
                  {displayName || "Current user"}
                </dd>
              </div>

              <div>
                <dt className="text-[var(--color-ink-400)]">
                  Classification
                </dt>
                <dd className="capitalize text-[var(--color-ink-900)]">
                  {communication.category}
                </dd>
              </div>
            </dl>

            <div className="mt-4 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-ink-700)]">
              {communication.bodyPreview}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  pushToast(
                    "Evidence action is not connected yet.",
                    "error"
                  )
                }
                className="rounded-md border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-700)] hover:bg-[var(--color-surface)]"
              >
                View Evidence
              </button>

              <button
                type="button"
                onClick={() =>
                  setContextOpen(true)
                }
                className="rounded-md border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-700)] hover:bg-[var(--color-surface)]"
              >
                Add Context
              </button>

              <button
                type="button"
                onClick={openCommitmentForm}
                disabled={actionLoading}
                className="rounded-md border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-700)] hover:bg-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Create Commitment
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleMarkComplete()
                }
                disabled={actionLoading}
                className="rounded-md bg-[var(--color-blue-600)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--color-blue-500)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading
                  ? "Working..."
                  : "Mark Complete"}
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleEscalate()
                }
                disabled={actionLoading}
                className="rounded-md px-3 py-1.5 text-xs font-medium text-[var(--color-red-600)] hover:bg-[var(--color-red-100)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Escalate
              </button>
            </div>

            {commitmentFormOpen && (
              <div className="mt-5 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-[var(--color-ink-900)]">
                    Create Commitment
                  </h3>

                  <p className="mt-1 text-xs text-[var(--color-ink-500)]">
                    Record the follow-up action that
                    needs to be completed.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-[var(--color-ink-700)]">
                      Commitment
                    </label>

                    <input
                      type="text"
                      value={commitmentTitle}
                      onChange={(event) =>
                        setCommitmentTitle(
                          event.target.value
                        )
                      }
                      className="w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-blue-600)] focus:ring-2 focus:ring-[var(--color-blue-100)]"
                      placeholder="What needs to be done?"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-[var(--color-ink-700)]">
                        Due date
                      </label>

                      <input
                        type="date"
                        value={commitmentDueDate}
                        onChange={(event) =>
                          setCommitmentDueDate(
                            event.target.value
                          )
                        }
                        className="w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-blue-600)] focus:ring-2 focus:ring-[var(--color-blue-100)]"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-[var(--color-ink-700)]">
                        Next step
                      </label>

                      <input
                        type="text"
                        value={commitmentNextStep}
                        onChange={(event) =>
                          setCommitmentNextStep(
                            event.target.value
                          )
                        }
                        className="w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-blue-600)] focus:ring-2 focus:ring-[var(--color-blue-100)]"
                        placeholder="What happens next?"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={closeCommitmentForm}
                      disabled={actionLoading}
                      className="rounded-md border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-700)] hover:bg-white disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void handleCreateCommitment()
                      }
                      disabled={actionLoading}
                      className="rounded-md bg-[var(--color-blue-600)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--color-blue-500)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionLoading
                        ? "Creating..."
                        : "Save Commitment"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {createdCommitment && (
              <div className="mt-4 rounded-md border border-[var(--color-line)] bg-[var(--color-blue-50)] p-3">
                <p className="text-xs font-semibold text-[var(--color-blue-600)]">
                  Commitment created
                </p>

                <p className="mt-1 text-sm font-medium text-[var(--color-ink-900)]">
                  {createdCommitment.title}
                </p>

                <p className="mt-1 text-xs text-[var(--color-ink-500)]">
                  {createdCommitment.dueDate
                    ? `Due ${createdCommitment.dueDate}`
                    : "No due date set"}
                  {" · "}
                  {createdCommitment.nextAction}
                </p>
              </div>
            )}
          </Card>

          <Card>
            <SectionHeader title="Communication Timeline" />
            <Timeline
              events={communication.timeline}
            />
          </Card>
        </div>

        <div className="space-y-5">
          {communication.aiFinding && (
            <Card>
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <SectionHeader title="AI Analysis" />

                <AIBadge
                  confidencePct={
                    communication.aiFinding
                      .confidencePct
                  }
                  reasoning={
                    communication.aiFinding.reasoning
                  }
                  reviewStatus={
                    communication.aiFinding
                      .reviewStatus
                  }
                />
              </div>

              <dl className="space-y-2.5 text-xs">
                <Row
                  label="Response Required"
                  value={
                    communication.aiFinding
                      .responseRequired
                      ? "Yes"
                      : "No"
                  }
                />

                <Row
                  label="Priority"
                  value={
                    communication.aiFinding.priority
                  }
                />

                <Row
                  label="Ownership"
                  value={
                    communication.aiFinding.ownership
                  }
                />

                <Row
                  label="Commitment Detected"
                  value={
                    communication.aiFinding
                      .commitmentDetected
                      ? "Yes"
                      : "No"
                  }
                />

                {communication.aiFinding.dueDate && (
                  <Row
                    label="Due Date"
                    value={new Date(
                      communication.aiFinding.dueDate
                    ).toLocaleDateString()}
                  />
                )}

                <Row
                  label="Next Action"
                  value={
                    communication.aiFinding.nextAction
                  }
                />

                <Row
                  label="Communication Quality"
                  value={`${communication.aiFinding.qualityScore}/100`}
                />
              </dl>

              <p className="mt-3 rounded-md bg-[var(--color-blue-50)] p-2.5 text-[11px] text-[var(--color-blue-600)]">
                AI-assisted analysis — human review
                required before negative performance
                action.
              </p>
            </Card>
          )}

          {communication.excluded && (
            <Card>
              <SectionHeader title="Exclusion Applied" />

              <p className="text-xs text-[var(--color-ink-700)]">
                {communication.exclusionReason}
              </p>

              <p className="mt-2 text-[11px] text-[var(--color-ink-500)]">
                Excluded communications do not
                negatively affect employee communication
                metrics.
              </p>
            </Card>
          )}
        </div>
      </div>

      <ContextDrawer
        open={contextOpen}
        onClose={() => setContextOpen(false)}
      />
    </AppShell>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--color-line)] pb-2 last:border-0">
      <dt className="text-[var(--color-ink-400)]">
        {label}
      </dt>

      <dd className="text-right font-medium text-[var(--color-ink-900)]">
        {value}
      </dd>
    </div>
  );
}