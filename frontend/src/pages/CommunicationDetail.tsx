import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Card, SectionHeader } from "../components/ui/Card";
import { StatusBadge, priorityTone, statusToTone, AIBadge } from "../components/ui/Badge";
import { Timeline } from "../components/ui/Timeline";
import { ContextDrawer } from "../components/performance/ContextDrawer";
import { getCommunication } from "../mock/generator";
import { formatDateTime } from "../lib/format";
import { useSession } from "../lib/SessionContext";
import { ErrorState } from "../components/ui/States";

export function CommunicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { pushToast } = useSession();
  const [contextOpen, setContextOpen] = useState(false);
  const comm = id ? getCommunication(id) : undefined;

  if (!comm) {
    return (
      <AppShell pageTitle="Communication">
        <ErrorState message="This communication record could not be found." onRetry={() => navigate("/communication")} />
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="Communication Detail">
      <button onClick={() => navigate("/communication")} className="mb-4 text-xs font-medium text-[var(--color-blue-600)]">
        ← Back to My Communication
      </button>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-[var(--color-ink-900)]">{comm.subject}</h2>
                <p className="mt-1 text-xs text-[var(--color-ink-500)]">
                  {comm.contact} · {comm.organization} · {comm.category}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <StatusBadge label={comm.status.replace("_", " ")} tone={statusToTone(comm.status)} />
                <StatusBadge label={comm.priority} tone={priorityTone(comm.priority)} />
              </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--color-line)] pt-4 text-xs sm:grid-cols-4">
              <div><dt className="text-[var(--color-ink-400)]">Received</dt><dd className="text-[var(--color-ink-900)]">{formatDateTime(comm.receivedAt)}</dd></div>
              <div><dt className="text-[var(--color-ink-400)]">Responded</dt><dd className="text-[var(--color-ink-900)]">{comm.respondedAt ? formatDateTime(comm.respondedAt) : "—"}</dd></div>
              <div><dt className="text-[var(--color-ink-400)]">Owner</dt><dd className="text-[var(--color-ink-900)]">Alex Johnson</dd></div>
              <div><dt className="text-[var(--color-ink-400)]">Classification</dt><dd className="text-[var(--color-ink-900)] capitalize">{comm.category}</dd></div>
            </dl>
            <div className="mt-4 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-ink-700)]">
              {comm.bodyPreview}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => pushToast("Evidence opened.")} className="rounded-md border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-700)] hover:bg-[var(--color-surface)]">View Evidence</button>
              <button onClick={() => setContextOpen(true)} className="rounded-md border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-700)] hover:bg-[var(--color-surface)]">Add Context</button>
              <button onClick={() => pushToast("Commitment created.", "success")} className="rounded-md border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-700)] hover:bg-[var(--color-surface)]">Create Commitment</button>
              <button onClick={() => pushToast("Marked complete.", "success")} className="rounded-md bg-[var(--color-blue-600)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--color-blue-500)]">Mark Complete</button>
              <button onClick={() => pushToast("Escalated to manager.")} className="rounded-md px-3 py-1.5 text-xs font-medium text-[var(--color-red-600)] hover:bg-[var(--color-red-100)]">Escalate</button>
            </div>
          </Card>

          <Card>
            <SectionHeader title="Communication Timeline" />
            <Timeline events={comm.timeline} />
          </Card>
        </div>

        <div className="space-y-5">
          {comm.aiFinding && (
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <SectionHeader title="AI Analysis" />
                <AIBadge
                  confidencePct={comm.aiFinding.confidencePct}
                  reasoning={comm.aiFinding.reasoning}
                  reviewStatus={comm.aiFinding.reviewStatus}
                />
              </div>
              <dl className="space-y-2.5 text-xs">
                <Row label="Response Required" value={comm.aiFinding.responseRequired ? "Yes" : "No"} />
                <Row label="Priority" value={comm.aiFinding.priority} />
                <Row label="Ownership" value={comm.aiFinding.ownership} />
                <Row label="Commitment Detected" value={comm.aiFinding.commitmentDetected ? "Yes" : "No"} />
                {comm.aiFinding.dueDate && <Row label="Due Date" value={new Date(comm.aiFinding.dueDate).toLocaleDateString()} />}
                <Row label="Next Action" value={comm.aiFinding.nextAction} />
                <Row label="Communication Quality" value={`${comm.aiFinding.qualityScore}/100`} />
              </dl>
              <p className="mt-3 rounded-md bg-[var(--color-blue-50)] p-2.5 text-[11px] text-[var(--color-blue-600)]">
                AI-assisted analysis — human review required before negative performance action.
              </p>
            </Card>
          )}

          {comm.excluded && (
            <Card>
              <SectionHeader title="Exclusion Applied" />
              <p className="text-xs text-[var(--color-ink-700)]">{comm.exclusionReason}</p>
              <p className="mt-2 text-[11px] text-[var(--color-ink-500)]">
                Excluded communications do not negatively affect employee communication metrics.
              </p>
            </Card>
          )}
        </div>
      </div>

      <ContextDrawer open={contextOpen} onClose={() => setContextOpen(false)} />
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--color-line)] pb-2 last:border-0">
      <dt className="text-[var(--color-ink-400)]">{label}</dt>
      <dd className="font-medium text-[var(--color-ink-900)]">{value}</dd>
    </div>
  );
}
