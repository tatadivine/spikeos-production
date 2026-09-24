import { Sparkles } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-[var(--color-line)] text-[var(--color-ink-700)]",
  success: "bg-[var(--color-green-100)] text-[var(--color-green-600)]",
  warning: "bg-[var(--color-amber-100)] text-[var(--color-amber-600)]",
  danger: "bg-[var(--color-red-100)] text-[var(--color-red-600)]",
  info: "bg-[var(--color-blue-100)] text-[var(--color-blue-600)]",
};

export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
        toneClasses[tone]
      )}
    >
      {label}
    </span>
  );
}

export function statusToTone(status: string): Tone {
  const map: Record<string, Tone> = {
    completed: "success",
    active: "info",
    needs_response: "warning",
    waiting: "neutral",
    overdue: "danger",
    due_today: "warning",
    due_this_week: "info",
    escalated: "danger",
    confirmed: "success",
    dismissed: "neutral",
    pending_review: "warning",
    pending: "warning",
    needs_context: "info",
    open: "info",
    strong: "success",
    steady: "info",
    at_risk: "danger",
  };
  return map[status] ?? "neutral";
}

export function priorityTone(priority: string): Tone {
  if (priority === "critical") return "danger";
  if (priority === "high") return "warning";
  if (priority === "low") return "neutral";
  return "info";
}

/**
 * AI-ASSISTED badge. Clicking it reveals a short transparency popover
 * explaining why the item was surfaced, per the AI-transparency requirement:
 * AI findings are indicators for human review, never final verdicts.
 */
export function AIBadge({
  confidencePct,
  reasoning,
  reviewStatus,
}: {
  confidencePct?: number;
  reasoning?: string;
  reviewStatus?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-md border border-[var(--color-blue-400)] bg-[var(--color-blue-50)] px-2 py-0.5 text-xs font-medium text-[var(--color-blue-600)] hover:bg-[var(--color-blue-100)] transition-colors"
      >
        <Sparkles size={12} strokeWidth={2.25} />
        AI-assisted
      </button>
      {open && (
        <div className="absolute z-30 mt-2 w-72 rounded-lg border border-[var(--color-line)] bg-white p-3 shadow-lg text-left">
          <p className="text-xs font-semibold text-[var(--color-ink-900)]">Why am I seeing this?</p>
          <p className="mt-1 text-xs text-[var(--color-ink-700)] leading-relaxed">
            {reasoning ??
              "SpikeOS analyzed communication patterns and identified this as a potential coaching opportunity."}
          </p>
          <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--color-ink-500)]">
            <span>Confidence: {confidencePct ?? "—"}%</span>
            <span>Review: {reviewStatus ?? "pending"}</span>
          </div>
          <p className="mt-2 border-t border-[var(--color-line)] pt-2 text-[11px] text-[var(--color-ink-500)]">
            AI-assisted indicator — human review required before negative performance action.
          </p>
        </div>
      )}
    </span>
  );
}
