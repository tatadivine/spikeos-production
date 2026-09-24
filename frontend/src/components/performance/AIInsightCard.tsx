import { useState } from "react";
import type { AIInsight } from "../../types";
import { Card } from "../ui/Card";
import { AIBadge } from "../ui/Badge";
import { useSession } from "../../lib/SessionContext";

const kindLabel: Record<AIInsight["kind"], string> = {
  strength: "Communication strength",
  improve: "Area to improve",
  follow_through: "Follow-through opportunity",
  response: "Response opportunity",
  positive: "Positive communication",
};

export function AIInsightCard({ insight }: { insight: AIInsight }) {
  const { pushToast } = useSession();
  const [contextOpen, setContextOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-blue-600)]">
            {kindLabel[insight.kind]}
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--color-ink-900)]">{insight.headline}</p>
        </div>
        <AIBadge confidencePct={insight.confidencePct} reasoning={insight.why} reviewStatus={insight.reviewStatus} />
      </div>
      <p className="mt-2 text-xs text-[var(--color-ink-500)]">{insight.evidence}</p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => pushToast("Evidence opened.")}
          className="rounded-md border border-[var(--color-line)] px-2.5 py-1 text-xs font-medium text-[var(--color-ink-700)] hover:bg-[var(--color-surface)]"
        >
          View evidence
        </button>
        <button
          onClick={() => setContextOpen(true)}
          className="rounded-md border border-[var(--color-line)] px-2.5 py-1 text-xs font-medium text-[var(--color-ink-700)] hover:bg-[var(--color-surface)]"
        >
          Add context
        </button>
        <button
          onClick={() => {
            setDismissed(true);
            pushToast("Insight dismissed.");
          }}
          className="rounded-md px-2.5 py-1 text-xs font-medium text-[var(--color-ink-400)] hover:text-[var(--color-ink-700)]"
        >
          Dismiss
        </button>
      </div>
      {contextOpen && (
        <ContextInlineForm
          onCancel={() => setContextOpen(false)}
          onSubmit={() => {
            setContextOpen(false);
            pushToast("Context submitted for review.", "success");
          }}
        />
      )}
    </Card>
  );
}

function ContextInlineForm({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: () => void }) {
  return (
    <div className="mt-3 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-3">
      <p className="text-xs font-medium text-[var(--color-ink-900)]">
        Something about this finding may not reflect the full context?
      </p>
      <textarea
        placeholder="Describe the missing context..."
        className="mt-2 w-full rounded-md border border-[var(--color-line)] bg-white p-2 text-xs"
        rows={2}
      />
      <div className="mt-2 flex gap-2">
        <button
          onClick={onSubmit}
          className="rounded-md bg-[var(--color-blue-600)] px-2.5 py-1 text-xs font-medium text-white hover:bg-[var(--color-blue-500)]"
        >
          Submit context
        </button>
        <button onClick={onCancel} className="rounded-md px-2.5 py-1 text-xs text-[var(--color-ink-500)]">
          Cancel
        </button>
      </div>
    </div>
  );
}
