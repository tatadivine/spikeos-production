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
import { CommitmentCard } from "../components/communication/CommitmentCard";
import { getCommunication } from "../mock/generator";
import { formatDateTime } from "../lib/format";
import { useSession } from "../lib/SessionContext";
import { api } from "../lib/api";
import { loadLiveBootstrap } from "../lib/liveBootstrap";
import { ErrorState } from "../components/ui/States";
import type { Commitment } from "../types";

interface BackendCommitment {
  id?: string;
  title?: string;
  owner_id?: string;
  created_at?: string;
  due_date?: string;
  next_step?: string;
  status?: string;
  communication_id?: string;
}

interface CreateCommitmentResponse {
  status: string;
  commitment?: BackendCommitment | null;
}

interface CommunicationActionResponse {
  status: string;
  communication?: Record<string, unknown> | null;
  alert?: Record<string, unknown> | null;
}

function toInputDate(
  value: string | null | undefined
): string {
  if (value) {
    const date = new Date(value);

    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
  }

  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 7);

  return fallback.toISOString().slice(0, 10);
}

function normalizeCommitment(
  commitment: BackendCommitment,
  communicationSubject: string
): Commitment {
  const dueDate =
    commitment.due_date ||
    new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    )
      .toISOString()
      .slice(0, 10);

  return {
    id:
      commitment.id ||
      `commitment-${Date.now()}`,
    title:
      commitment.title ||
      communicationSubject,
    source: "Communication",
    ownerId:
      commitment.owner_id || "",
    createdAt:
      commitment.created_at ||
      new Date().toISOString(),
    dueDate,
    status: "active",
    daysOverdue: 0,
    nextAction:
      commitment.next_step ||
      "Follow up on this commitment.",
  };
}

export function CommunicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    displayName,
    pushToast,
  } = useSession();

  const [contextOpen, setContextOpen] =
    useState(false);

  const [
    commitmentFormOpen,
    setCommitmentFormOpen,
  ] = useState(false);

  const [
    commitmentTitle,
    setCommitmentTitle,
  ] = useState("");

  const [
    commitmentDueDate,
    setCommitmentDueDate,
  ] = useState("");

  const [
    commitmentNextAction,
    setCommitmentNextAction,
  ] = useState("");

  const [
    commitmentSubmitting,
    setCommitmentSubmitting,
  ] = useState(false);

  const [
    createdCommitment,
    setCreatedCommitment,
  ] = useState<Commitment | null>(null);

  const [
    actionSubmitting,
    setActionSubmitting,
  ] = useState<
    "complete" | "escalate" | null
  >(null);

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

  function openCommitmentForm() {
    setCommitmentTitle(comm.subject);

    setCommitmentDueDate(
      toInputDate(
        comm.aiFinding?.dueDate
      )
    );

    setCommitmentNextAction(
      comm.aiFinding?.nextAction ||
        comm.nextStep ||
        "Follow up on this communication."
    );

    setCommitmentFormOpen(true);
  }

  function closeCommitmentForm() {
    if (commitmentSubmitting) {
      return;
    }

    setCommitmentFormOpen(false);
  }

  async function handleCreateCommitment() {
    const title =
      commitmentTitle.trim();

    const nextAction =
      commitmentNextAction.trim();

    if (!title) {
      pushToast(
        "Please enter a commitment title.",
        "error"
      );
      return;
    }

    if (!commitmentDueDate) {
      pushToast(
        "Please select a due date.",
        "error"
      );
      return;
    }

    if (!nextAction) {
      pushToast(
        "Please enter the next action.",
        "error"
      );
      return;
    }

    setCommitmentSubmitting(true);

    try {
      const response =
        await api<CreateCommitmentResponse>(
          "/commitments",
          {
            method: "POST",
            body: JSON.stringify({
              communication_id:
                comm.id,
              title,
              due_date:
                commitmentDueDate,
              next_step:
                nextAction,
            }),
          }
        );

      if (!response.commitment) {
        throw new Error(
          "The server did not return the created commitment."
        );
      }

      const normalized =
        normalizeCommitment(
          response.commitment,
          comm.subject
        );

      setCreatedCommitment(
        normalized
      );

      setCommitmentFormOpen(
        false
      );

      pushToast(
        "Commitment created successfully.",
        "success"
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to create the commitment.";

      pushToast(
        `Commitment could not be created: ${message}`,
        "error"
      );
    } finally {
      setCommitmentSubmitting(
        false
      );
    }
  }  async function refreshCommunication() {
    try {
      await loadLiveBootstrap();

      const refreshed = getCommunication(
        comm.id
      );

      if (refreshed) {
        Object.assign(
          comm,
          refreshed
        );
      }
    } catch {
      // The action itself has already succeeded.
      // A refresh failure should not turn it into
      // a failed action.
    }
  }

  async function handleMarkComplete() {
    if (
      actionSubmitting ||
      comm.status === "completed"
    ) {
      return;
    }

    setActionSubmitting("complete");

    try {
      await api<CommunicationActionResponse>(
        `/communications/${comm.id}/complete`,
        {
          method: "POST",
        }
      );

      await refreshCommunication();

      pushToast(
        "Communication marked complete.",
        "success"
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to complete communication.";

      pushToast(
        `Communication could not be completed: ${message}`,
        "error"
      );
    } finally {
      setActionSubmitting(null);
    }
  }

  async function handleEscalate() {
    if (actionSubmitting) {
      return;
    }

    setActionSubmitting("escalate");

    try {
      await api<CommunicationActionResponse>(
        `/communications/${comm.id}/escalate`,
        {
          method: "POST",
          body: JSON.stringify({}),
        }
      );

      await refreshCommunication();

      pushToast(
        "Communication escalated successfully.",
        "success"
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to escalate communication.";

      pushToast(
        `Communication could not be escalated: ${message}`,
        "error"
      );
    } finally {
      setActionSubmitting(null);
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
                  {comm.subject}
                </h2>

                <p className="mt-1 text-xs text-[var(--color-ink-500)]">
                  {comm.contact} ·{" "}
                  {comm.organization} ·{" "}
                  {comm.category}
                </p>
              </div>

              <div className="flex shrink-0 flex-row flex-wrap items-center gap-1.5 sm:flex-col sm:items-end">
                <StatusBadge
                  label={comm.status.replace(
                    "_",
                    " "
                  )}
                  tone={statusToTone(
                    comm.status
                  )}
                />

                <StatusBadge
                  label={comm.priority}
                  tone={priorityTone(
                    comm.priority
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
                    comm.receivedAt
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-[var(--color-ink-400)]">
                  Responded
                </dt>

                <dd className="text-[var(--color-ink-900)]">
                  {comm.respondedAt
                    ? formatDateTime(
                        comm.respondedAt
                      )
                    : "—"}
                </dd>
              </div>

              <div>
                <dt className="text-[var(--color-ink-400)]">
                  Owner
                </dt>

                <dd className="text-[var(--color-ink-900)]">
                  {displayName ||
                    "Current user"}
                </dd>
              </div>

              <div>
                <dt className="text-[var(--color-ink-400)]">
                  Classification
                </dt>

                <dd className="capitalize text-[var(--color-ink-900)]">
                  {comm.category}
                </dd>
              </div>
            </dl>

            <div className="mt-4 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-ink-700)]">
              {comm.bodyPreview}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  pushToast(
                    "Evidence action is not connected yet."
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
                onClick={
                  openCommitmentForm
                }
                className="rounded-md border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-700)] hover:bg-[var(--color-surface)]"
              >
                Create Commitment
              </button>

              <button
                type="button"
                onClick={
                  handleMarkComplete
                }
                disabled={
                  actionSubmitting !==
                    null ||
                  comm.status ===
                    "completed"
                }
                className="rounded-md bg-[var(--color-blue-600)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--color-blue-500)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {comm.status ===
                "completed"
                  ? "Completed"
                  : actionSubmitting ===
                    "complete"
                  ? "Completing..."
                  : "Mark Complete"}
              </button>

              <button
                type="button"
                onClick={
                  handleEscalate
                }
                disabled={
                  actionSubmitting !==
                  null
                }
                className="rounded-md px-3 py-1.5 text-xs font-medium text-[var(--color-red-600)] hover:bg-[var(--color-red-100)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionSubmitting ===
                "escalate"
                  ? "Escalating..."
                  : "Escalate"}
              </button>
            </div>
          </Card>

          {commitmentFormOpen && (
            <Card>
              <SectionHeader title="Create Commitment" />

              <div className="mt-4 space-y-4">
                <div>
                  <label
                    htmlFor="commitment-title"
                    className="mb-1.5 block text-xs font-medium text-[var(--color-ink-700)]"
                  >
                    Commitment title
                  </label>

                  <input
                    id="commitment-title"
                    type="text"
                    value={
                      commitmentTitle
                    }
                    onChange={(event) =>
                      setCommitmentTitle(
                        event.target.value
                      )
                    }
                    disabled={
                      commitmentSubmitting
                    }
                    className="w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm text-[var(--color-ink-900)] outline-none focus:border-[var(--color-blue-600)] focus:ring-2 focus:ring-[var(--color-blue-600)]/10 disabled:opacity-60"
                    placeholder="What are you committing to do?"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="commitment-due-date"
                      className="mb-1.5 block text-xs font-medium text-[var(--color-ink-700)]"
                    >
                      Due date
                    </label>

                    <input
                      id="commitment-due-date"
                      type="date"
                      value={
                        commitmentDueDate
                      }
                      onChange={(event) =>
                        setCommitmentDueDate(
                          event.target.value
                        )
                      }
                      disabled={
                        commitmentSubmitting
                      }
                      className="w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm text-[var(--color-ink-900)] outline-none focus:border-[var(--color-blue-600)] focus:ring-2 focus:ring-[var(--color-blue-600)]/10 disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="commitment-next-action"
                      className="mb-1.5 block text-xs font-medium text-[var(--color-ink-700)]"
                    >
                      Next action
                    </label>

                    <input
                      id="commitment-next-action"
                      type="text"
                      value={
                        commitmentNextAction
                      }
                      onChange={(event) =>
                        setCommitmentNextAction(
                          event.target.value
                        )
                      }
                      disabled={
                        commitmentSubmitting
                      }
                      className="w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm text-[var(--color-ink-900)] outline-none focus:border-[var(--color-blue-600)] focus:ring-2 focus:ring-[var(--color-blue-600)]/10 disabled:opacity-60"
                      placeholder="What is the next action?"
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={
                      closeCommitmentForm
                    }
                    disabled={
                      commitmentSubmitting
                    }
                    className="rounded-md border border-[var(--color-line)] px-3 py-2 text-sm font-medium text-[var(--color-ink-700)] hover:bg-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleCreateCommitment
                    }
                    disabled={
                      commitmentSubmitting
                    }
                    className="rounded-md bg-[var(--color-blue-600)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--color-blue-500)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {commitmentSubmitting
                      ? "Creating..."
                      : "Create commitment"}
                  </button>
                </div>
              </div>
            </Card>
          )}          {createdCommitment && (
            <Card>
              <SectionHeader title="Created Commitment" />

              <div className="mt-3">
                <CommitmentCard
                  commitment={
                    createdCommitment
                  }
                />
              </div>
            </Card>
          )}

          <Card>
            <SectionHeader title="Communication Timeline" />

            <Timeline
              events={comm.timeline}
            />
          </Card>
        </div>

        <div className="space-y-5">
          {comm.aiFinding && (
            <Card>
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <SectionHeader title="AI Analysis" />

                <AIBadge
                  confidencePct={
                    comm.aiFinding
                      .confidencePct
                  }
                  reasoning={
                    comm.aiFinding
                      .reasoning
                  }
                  reviewStatus={
                    comm.aiFinding
                      .reviewStatus
                  }
                />
              </div>

              <dl className="space-y-2.5 text-xs">
                <Row
                  label="Response Required"
                  value={
                    comm.aiFinding
                      .responseRequired
                      ? "Yes"
                      : "No"
                  }
                />

                <Row
                  label="Priority"
                  value={
                    comm.aiFinding
                      .priority
                  }
                />

                <Row
                  label="Ownership"
                  value={
                    comm.aiFinding
                      .ownership
                  }
                />

                <Row
                  label="Commitment Detected"
                  value={
                    comm.aiFinding
                      .commitmentDetected
                      ? "Yes"
                      : "No"
                  }
                />

                {comm.aiFinding
                  .dueDate && (
                  <Row
                    label="Due Date"
                    value={new Date(
                      comm.aiFinding
                        .dueDate
                    ).toLocaleDateString()}
                  />
                )}

                <Row
                  label="Next Action"
                  value={
                    comm.aiFinding
                      .nextAction
                  }
                />

                <Row
                  label="Communication Quality"
                  value={`${comm.aiFinding.qualityScore}/100`}
                />
              </dl>

              <p className="mt-3 rounded-md bg-[var(--color-blue-50)] p-2.5 text-[11px] text-[var(--color-blue-600)]">
                AI-assisted analysis —
                human review required
                before negative
                performance action.
              </p>
            </Card>
          )}

          {comm.excluded && (
            <Card>
              <SectionHeader title="Exclusion Applied" />

              <p className="text-xs text-[var(--color-ink-700)]">
                {comm.exclusionReason}
              </p>

              <p className="mt-2 text-[11px] text-[var(--color-ink-500)]">
                Excluded communications
                do not negatively affect
                employee communication
                metrics.
              </p>
            </Card>
          )}
        </div>
      </div>

      <ContextDrawer
        open={contextOpen}
        onClose={() =>
          setContextOpen(false)
        }
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