import { useState } from "react";
import { Link } from "react-router-dom";
import type { Review } from "../../types";
import { StatusBadge, statusToTone } from "../ui/Badge";
import { Card } from "../ui/Card";
import { employeeService } from "../../services";
import { useSession } from "../../lib/SessionContext";
import { api } from "../../lib/api";
import { formatDate, formatDateTime } from "../../lib/format";

type Decision = "confirmed" | "dismissed" | "needs_context" | "incorrect";

const STATUS_LABEL: Record<Review["status"], string> = {
  pending_review: "Pending review",
  confirmed: "Confirmed",
  dismissed: "Dismissed",
  needs_context: "Needs context",
  incorrect: "Marked incorrect",
};

const DECISION_TOAST: Record<Decision, string> = {
  confirmed: "Finding confirmed.",
  dismissed: "Finding dismissed.",
  needs_context: "Context requested from employee.",
  incorrect: "Finding marked incorrect.",
};

export function ReviewCard({
  review,
  onDecided,
}: {
  review: Review;
  onDecided?: () => void;
}) {
  const employee = employeeService.get(review.employeeId);
  const { pushToast } = useSession();
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState(review.notes ?? "");

  async function decide(decision: Decision) {
    setBusy(true);
    try {
      await api(`/reviews/${review.communicationId}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision, notes: notes.trim() || null }),
      });
      pushToast(DECISION_TOAST[decision], decision === "dismissed" ? "default" : "success");
      onDecided?.();
    } catch (err) {
      pushToast(err instanceof Error ? err.message : "Unable to save review decision.", "error");
    } finally {
      setBusy(false);
    }
  }

  const button = "rounded-md px-2.5 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-[var(--color-ink-500)]">
            {employee?.name ?? "Unknown employee"} · {formatDate(review.date)}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-[var(--color-ink-900)]">{review.finding}</p>
          <p className="mt-0.5 break-words text-xs text-[var(--color-ink-500)]">{review.evidence}</p>
        </div>
        <StatusBadge label={STATUS_LABEL[review.status] ?? review.status} tone={statusToTone(review.status)} />
      </div>

      <p className="mt-2 text-xs text-[var(--color-ink-500)]">
        {review.basis === "calculated"
          ? "Calculated from response times and SLA rules."
          : `AI confidence: ${review.aiConfidencePct}%`}
        {review.reviewer && review.reviewedAt
          ? ` · Reviewed by ${review.reviewer}, ${formatDateTime(review.reviewedAt)}`
          : ""}
      </p>

      {review.employeeContext && review.employeeContext.length > 0 && (
        <div className="mt-2 space-y-1 rounded-md bg-[var(--color-surface)] p-2">
          {review.employeeContext.map((c, i) => (
            <p key={i} className="text-xs text-[var(--color-ink-700)]">
              <span className="text-[var(--color-ink-400)]">
                Employee context{c.createdAt ? ` · ${formatDate(c.createdAt)}` : ""}:
              </span>{" "}
              {c.text}
            </p>
          ))}
        </div>
      )}

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Manager notes (optional)"
        className="mt-3 w-full rounded-md border border-[var(--color-line)] p-2 text-xs"
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void decide("confirmed")}
          className={`${button} bg-[var(--color-blue-600)] font-medium text-white hover:bg-[var(--color-blue-500)]`}
        >
          Confirm
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void decide("dismissed")}
          className={`${button} border border-[var(--color-line)] text-[var(--color-ink-700)] hover:bg-[var(--color-surface)]`}
        >
          Dismiss
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void decide("needs_context")}
          className={`${button} border border-[var(--color-line)] text-[var(--color-ink-700)] hover:bg-[var(--color-surface)]`}
        >
          Request context
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void decide("incorrect")}
          className={`${button} text-[var(--color-ink-400)] hover:text-[var(--color-ink-700)]`}
        >
          Mark incorrect
        </button>
        <Link
          to={`/communication/${review.communicationId}`}
          className="ml-auto text-xs font-medium text-[var(--color-blue-600)] hover:underline"
        >
          View communication →
        </Link>
      </div>
    </Card>
  );
}
