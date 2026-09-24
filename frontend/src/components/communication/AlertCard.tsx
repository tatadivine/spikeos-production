import type { AlertItem } from "../../types";
import { StatusBadge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { useSession } from "../../lib/SessionContext";

const severityTone = { low: "neutral", medium: "warning", high: "danger" } as const;

export function AlertCard({ alert }: { alert: AlertItem }) {
  const { pushToast } = useSession();
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <StatusBadge label={alert.severity} tone={severityTone[alert.severity]} />
            <span className="text-xs text-[var(--color-ink-400)]">
              {new Date(alert.time).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </span>
          </div>
          <p className="mt-1.5 text-sm font-medium text-[var(--color-ink-900)]">{alert.reason}</p>
          <p className="mt-0.5 text-xs text-[var(--color-ink-500)]">{alert.source}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-[var(--color-ink-700)]">{alert.recommendedAction}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => pushToast("Opened communication for response.")}
          className="rounded-md bg-[var(--color-blue-600)] px-2.5 py-1 text-xs font-medium text-white hover:bg-[var(--color-blue-500)]"
        >
          Respond now
        </button>
        <button onClick={() => pushToast("Marked as reviewed.")} className="rounded-md border border-[var(--color-line)] px-2.5 py-1 text-xs text-[var(--color-ink-700)] hover:bg-[var(--color-surface)]">
          Review
        </button>
        <button onClick={() => pushToast("Commitment added.", "success")} className="rounded-md border border-[var(--color-line)] px-2.5 py-1 text-xs text-[var(--color-ink-700)] hover:bg-[var(--color-surface)]">
          Add commitment
        </button>
        <button onClick={() => pushToast("Alert dismissed.")} className="rounded-md px-2.5 py-1 text-xs text-[var(--color-ink-400)] hover:text-[var(--color-ink-700)]">
          Dismiss
        </button>
      </div>
    </Card>
  );
}
