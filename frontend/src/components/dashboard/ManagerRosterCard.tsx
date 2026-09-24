import { Users, TrendingUp, TrendingDown, Minus, ChevronRight } from "lucide-react";
import { Card } from "../ui/Card";
import type { Employee } from "../../types";

export function ManagerRosterCard({
  employees,
  subtitle,
  onSelect,
  emptyLabel,
}: {
  employees: Employee[];
  subtitle: string;
  onSelect: (employeeId: string) => void;
  emptyLabel?: string;
}) {
  return (
    <Card>
      <div className="mb-1 flex items-center gap-2">
        <Users size={16} className="text-[var(--color-blue-600)]" />
        <h2 className="text-[15px] font-semibold text-[var(--color-ink-900)]">Your Team</h2>
      </div>
      <p className="mb-4 text-xs text-[var(--color-ink-500)]">{subtitle}</p>

      {employees.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--color-line)] py-8 text-center text-sm text-[var(--color-ink-500)]">
          {emptyLabel ?? "No direct reports are configured for this person yet."}
        </div>
      ) : (
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-[var(--color-ink-400)]">
              <th className="pb-2 font-medium">Name</th>
              <th className="pb-2 font-medium">Score</th>
              <th className="pb-2 font-medium">Overdue</th>
              <th className="pb-2 font-medium">Trend</th>
              <th className="pb-2" />
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => {
              const trend = e.responseScore >= 85 ? "up" : e.responseScore < 70 ? "down" : "flat";
              return (
                <tr
                  key={e.id}
                  onClick={() => onSelect(e.id)}
                  className="cursor-pointer border-t border-[var(--color-line)] hover:bg-[var(--color-surface)]"
                >
                  <td className="py-3">
                    <span className="flex items-center gap-2.5 font-medium text-[var(--color-ink-900)]">
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                        style={{ background: e.avatarColor }}
                      >
                        {e.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                      {e.name}
                    </span>
                  </td>
                  <td
                    className="py-3 font-semibold"
                    style={{
                      color: e.responseScore >= 85 ? "var(--color-green-600)" : e.responseScore >= 75 ? "var(--color-amber-600)" : "var(--color-red-600)",
                    }}
                  >
                    {e.responseScore}
                  </td>
                  <td className="py-3" style={{ color: e.overdueFollowUps > 8 ? "var(--color-red-600)" : "var(--color-ink-900)" }}>
                    {e.overdueFollowUps}
                  </td>
                  <td className="py-3">
                    {trend === "up" && <TrendingUp size={14} className="text-[var(--color-green-600)]" />}
                    {trend === "down" && <TrendingDown size={14} className="text-[var(--color-red-600)]" />}
                    {trend === "flat" && <Minus size={14} className="text-[var(--color-ink-400)]" />}
                  </td>
                  <td className="py-3 text-right">
                    <ChevronRight size={15} className="text-[var(--color-ink-400)]" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <p className="mt-3 text-[11px] text-[var(--color-ink-400)]">
        Click a name to open their full scorecard — the same view they see for themselves.
      </p>
    </Card>
  );
}
