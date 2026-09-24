import { useState } from "react";
import type { Review } from "../../types";
import { StatusBadge, statusToTone } from "../ui/Badge";
import { Card } from "../ui/Card";
import { getEmployee } from "../../mock/generator";
import { useSession } from "../../lib/SessionContext";

export function ReviewCard({ review }: { review: Review }) {
  const employee = getEmployee(review.employeeId);
  const { pushToast } = useSession();
  const [status, setStatus] = useState(review.status);

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-[var(--color-ink-500)]">{employee?.name ?? "Unknown employee"}</p>
          <p className="mt-0.5 text-sm font-semibold text-[var(--color-ink-900)]">{review.finding}</p>
          <p className="mt-0.5 text-xs text-[var(--color-ink-500)]">{review.evidence}</p>
        </div>
        <StatusBadge label={status.replace("_", " ")} tone={statusToTone(status)} />
      </div>
      <p className="mt-2 text-xs text-[var(--color-ink-500)]">AI confidence: {review.aiConfidencePct}%</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => { setStatus("confirmed"); pushToast("Finding confirmed.", "success"); }}
          className="rounded-md bg-[var(--color-blue-600)] px-2.5 py-1 text-xs font-medium text-white hover:bg-[var(--color-blue-500)]"
        >
          Confirm
        </button>
        <button
          onClick={() => { setStatus("dismissed"); pushToast("Finding dismissed."); }}
          className="rounded-md border border-[var(--color-line)] px-2.5 py-1 text-xs text-[var(--color-ink-700)] hover:bg-[var(--color-surface)]"
        >
          Dismiss
        </button>
        <button
          onClick={() => { setStatus("needs_context"); pushToast("Context requested from employee."); }}
          className="rounded-md border border-[var(--color-line)] px-2.5 py-1 text-xs text-[var(--color-ink-700)] hover:bg-[var(--color-surface)]"
        >
          Request context
        </button>
        <button
          onClick={() => pushToast("Marked incorrect — excluded from scoring.", "success")}
          className="rounded-md px-2.5 py-1 text-xs text-[var(--color-ink-400)] hover:text-[var(--color-ink-700)]"
        >
          Mark incorrect
        </button>
      </div>
    </Card>
  );
}
