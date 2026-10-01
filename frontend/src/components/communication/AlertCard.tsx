import { useState } from "react";
import type { AlertItem } from "../../types";
import { StatusBadge } from "../ui/Badge";
import { Card } from "../ui/Card";
import { useSession } from "../../lib/SessionContext";
import { api } from "../../lib/api";

const severityTone = {
  low: "neutral",
  medium: "warning",
  high: "danger",
} as const;

type AlertCardProps = {
  alert: AlertItem;
  ownerName?: string;
  onRespond?: () => void;
  onReview?: () => void;
  onDismiss?: () => void;
  onAddCommitment?: () => void;
};

export function AlertCard({
  alert,
  ownerName,
  onRespond,
  onReview,
  onDismiss,
  onAddCommitment,
}: AlertCardProps) {
  const { pushToast } = useSession();
  const [busy, setBusy] = useState(false);

  async function reviewAlert() {
    setBusy(true);

    try {
      await api(`/alerts/${alert.id}/review`, {
        method: "POST",
      });

      pushToast("Alert marked as reviewed.", "success");
      onReview?.();
    } catch (err) {
      pushToast(
        err instanceof Error
          ? err.message
          : "Unable to review alert.",
        "error",
      );
    } finally {
      setBusy(false);
    }
  }

  async function dismissAlert() {
    setBusy(true);

    try {
      await api(`/alerts/${alert.id}/dismiss`, {
        method: "POST",
      });

      pushToast("Alert dismissed.", "success");
      onDismiss?.();
    } catch (err) {
      pushToast(
        err instanceof Error
          ? err.message
          : "Unable to dismiss alert.",
        "error",
      );
    } finally {
      setBusy(false);
    }
  }

  async function addCommitment() {
    setBusy(true);

    try {
      await api(`/alerts/${alert.id}/commitment`, {
        method: "POST",
      });

      pushToast("Commitment added.", "success");
      onAddCommitment?.();
    } catch (err) {
      pushToast(
        err instanceof Error
          ? err.message
          : "Unable to add commitment.",
        "error",
      );
    } finally {
      setBusy(false);
    }
  }

  function respondNow() {
    if (!alert.communicationId) {
      pushToast(
        "This alert is not linked to a communication.",
        "error",
      );
      return;
    }

    onRespond?.();
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <StatusBadge
              label={alert.severity}
              tone={severityTone[alert.severity]}
            />

            <span className="text-xs text-[var(--color-ink-400)]">
              {new Date(alert.time).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>

          <p className="mt-1.5 text-sm font-medium text-[var(--color-ink-900)]">
            {alert.reason}
          </p>

          <p className="mt-0.5 text-xs text-[var(--color-ink-500)]">
            {alert.source}
            {ownerName ? ` · ${ownerName}` : ""}
          </p>
        </div>
      </div>

      <p className="mt-2 text-xs text-[var(--color-ink-700)]">
        {alert.recommendedAction}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={respondNow}
          className="rounded-md bg-[var(--color-blue-600)] px-2.5 py-1 text-xs font-medium text-white hover:bg-[var(--color-blue-500)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Respond now
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => void reviewAlert()}
          className="rounded-md border border-[var(--color-line)] px-2.5 py-1 text-xs text-[var(--color-ink-700)] hover:bg-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Working..." : "Review"}
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => void addCommitment()}
          className="rounded-md border border-[var(--color-line)] px-2.5 py-1 text-xs text-[var(--color-ink-700)] hover:bg-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add commitment
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => void dismissAlert()}
          className="rounded-md px-2.5 py-1 text-xs text-[var(--color-ink-400)] hover:text-[var(--color-ink-700)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Dismiss
        </button>
      </div>
    </Card>
  );
}