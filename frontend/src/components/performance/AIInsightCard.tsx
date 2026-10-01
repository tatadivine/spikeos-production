import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calculator } from "lucide-react";
import type { AIInsight } from "../../types";
import { Card } from "../ui/Card";
import { AIBadge } from "../ui/Badge";
import { useSession } from "../../lib/SessionContext";
import { api } from "../../lib/api";
import { loadLiveBootstrap } from "../../lib/liveBootstrap";
import { formatDate } from "../../lib/format";

const kindLabel: Record<AIInsight["kind"], string> = {
  strength: "Communication strength",
  improve: "Area to improve",
  follow_through: "Follow-through opportunity",
  response: "Response opportunity",
  positive: "Positive communication",
};

export function AIInsightCard({
  insight,
  onChanged,
}: {
  insight: AIInsight;
  onChanged?: () => void;
}) {
  const { pushToast } = useSession();
  const navigate = useNavigate();
  const [contextOpen, setContextOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState(insight.contextNotes ?? []);

  if (dismissed) return null;

  const calculated = insight.basis === "calculated";

  async function dismiss() {
    setBusy(true);
    try {
      await api(`/coaching/${insight.id}/dismiss`, {
        method: "POST",
        body: JSON.stringify({ signature: insight.signature ?? null }),
      });
      setDismissed(true);
      pushToast("Insight dismissed.");
      void loadLiveBootstrap().catch(() => undefined);
      onChanged?.();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Unable to dismiss insight.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function submitContext(text: string) {
    setBusy(true);
    try {
      await api(`/coaching/${insight.id}/context`, {
        method: "POST",
        body: JSON.stringify({ context: text, signature: insight.signature ?? null }),
      });
      setNotes((n) => [...n, { text, createdAt: new Date().toISOString() }]);
      setContextOpen(false);
      pushToast("Context saved.", "success");
      void loadLiveBootstrap().catch(() => undefined);
      onChanged?.();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Unable to save context.", "error");
    } finally {
      setBusy(false);
    }
  }

  function viewEvidence() {
    const first = insight.evidenceIds?.[0];
    if (insight.evidenceIds?.length === 1 && first) {
      navigate(`/communication/${first}`);
    } else {
      navigate("/evidence");
    }
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-blue-600)]">
            {kindLabel[insight.kind]}
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--color-ink-900)]">{insight.headline}</p>
        </div>
        {calculated ? (
          <span
            title={insight.why}
            className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-2 py-0.5 text-xs font-medium text-[var(--color-ink-700)]"
          >
            <Calculator size={12} />
            Calculated
          </span>
        ) : (
          <AIBadge confidencePct={insight.confidencePct} reasoning={insight.why} reviewStatus={insight.reviewStatus} />
        )}
      </div>
      <p className="mt-2 text-xs text-[var(--color-ink-500)]">{insight.evidence}</p>
      {notes.length > 0 && (
        <div className="mt-2 space-y-1 rounded-md bg-[var(--color-surface)] p-2">
          {notes.map((n, idx) => (
            <p key={idx} className="text-xs text-[var(--color-ink-700)]">
              <span className="text-[var(--color-ink-400)]">
                Context{n.createdAt ? ` · ${formatDate(n.createdAt)}` : ""}:
              </span>{" "}
              {n.text}
            </p>
          ))}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={viewEvidence}
          className="rounded-md border border-[var(--color-line)] px-2.5 py-1 text-xs font-medium text-[var(--color-ink-700)] hover:bg-[var(--color-surface)]"
        >
          View evidence
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => setContextOpen(true)}
          className="rounded-md border border-[var(--color-line)] px-2.5 py-1 text-xs font-medium text-[var(--color-ink-700)] hover:bg-[var(--color-surface)] disabled:opacity-50"
        >
          Add context
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void dismiss()}
          className="rounded-md px-2.5 py-1 text-xs font-medium text-[var(--color-ink-400)] hover:text-[var(--color-ink-700)] disabled:opacity-50"
        >
          Dismiss
        </button>
      </div>
      {contextOpen && (
        <ContextInlineForm
          busy={busy}
          onCancel={() => setContextOpen(false)}
          onSubmit={(text) => void submitContext(text)}
        />
      )}
    </Card>
  );
}

function ContextInlineForm({
  busy,
  onCancel,
  onSubmit,
}: {
  busy: boolean;
  onCancel: () => void;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState("");
  return (
    <div className="mt-3 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-3">
      <p className="text-xs font-medium text-[var(--color-ink-900)]">
        Something about this finding may not reflect the full context?
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Describe the missing context..."
        className="mt-2 w-full rounded-md border border-[var(--color-line)] bg-white p-2 text-xs"
        rows={2}
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={busy || !text.trim()}
          onClick={() => onSubmit(text.trim())}
          className="rounded-md bg-[var(--color-blue-600)] px-2.5 py-1 text-xs font-medium text-white hover:bg-[var(--color-blue-500)] disabled:opacity-50"
        >
          Submit context
        </button>
        <button type="button" onClick={onCancel} className="rounded-md px-2.5 py-1 text-xs text-[var(--color-ink-500)]">
          Cancel
        </button>
      </div>
    </div>
  );
}
