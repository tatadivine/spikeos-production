import type { Commitment } from "../../types";
import { StatusBadge, statusToTone } from "../ui/Badge";
import { Card } from "../ui/Card";

const statusLabel: Record<Commitment["status"], string> = {
  active: "Active",
  due_today: "Due today",
  due_this_week: "Due this week",
  overdue: "Overdue",
  completed: "Completed",
};

export function CommitmentCard({ commitment }: { commitment: Commitment }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--color-ink-900)]">{commitment.title}</p>
          <p className="mt-0.5 text-xs text-[var(--color-ink-500)]">{commitment.source}</p>
        </div>
        <StatusBadge label={statusLabel[commitment.status]} tone={statusToTone(commitment.status)} />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-[var(--color-ink-500)]">
        <span>Due {new Date(commitment.dueDate).toLocaleDateString()}</span>
        {commitment.daysOverdue > 0 && (
          <span className="text-[var(--color-red-600)]">{commitment.daysOverdue}d overdue</span>
        )}
      </div>
      <p className="mt-2 text-xs text-[var(--color-ink-700)]">{commitment.nextAction}</p>
    </Card>
  );
}
