import { useState } from "react";
import { Clock, TrendingUp, TrendingDown, Minus, ChevronRight, type LucideIcon } from "lucide-react";
import { Card } from "../ui/Card";

export interface CommitmentRow {
  category: string;
  icon: LucideIcon;
  withinSlaPct: number;
  withinSlaNumerator: number;
  withinSlaDenominator: number;
  overdue: number;
  trend: "up" | "down" | "flat";
  bold?: boolean;
}

export interface ExcludedMessage {
  subject: string;
  from: string;
  reason: string;
}

export function ResponseCommitmentsTable({ rows, excluded }: { rows: CommitmentRow[]; excluded?: ExcludedMessage[] }) {
  const [showExcluded, setShowExcluded] = useState(false);
  return (
    <Card padded={false}>
      <div className="flex items-center gap-2 border-b border-[var(--color-line)] px-4 py-3.5">
        <Clock size={16} className="text-[var(--color-blue-600)]" />
        <h2 className="text-[15px] font-semibold text-[var(--color-ink-900)]">Response Commitments</h2>
      </div>
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-[var(--color-ink-400)]">
            <th className="px-4 py-2 font-medium">Category</th>
            <th className="px-2 py-2 font-medium">Within SLA</th>
            <th className="px-2 py-2 font-medium">Overdue</th>
            <th className="px-4 py-2 font-medium">Trend</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const Icon = r.icon;
            return (
              <tr key={r.category} className={r.bold ? "border-t border-[var(--color-line)] bg-[var(--color-surface)]" : "border-t border-[var(--color-line)]"}>
                <td className="px-4 py-2.5">
                  <span className={`flex items-center gap-2 ${r.bold ? "font-semibold" : "font-medium"} text-[var(--color-ink-900)]`}>
                    <Icon size={15} className="text-[var(--color-blue-600)]" />
                    {r.category}
                  </span>
                </td>
                <td className="px-2 py-2.5">
                  <span className="font-semibold text-[var(--color-ink-900)]">{r.withinSlaPct}%</span>
                  <span className="ml-1 text-[11px] text-[var(--color-ink-400)]">
                    {r.withinSlaNumerator} / {r.withinSlaDenominator}
                  </span>
                </td>
                <td className={`px-2 py-2.5 font-semibold ${r.overdue > 0 ? "text-[var(--color-red-600)]" : "text-[var(--color-ink-500)]"}`}>
                  {r.overdue}
                </td>
                <td className="px-4 py-2.5">
                  {r.trend === "up" && <TrendingUp size={15} className="text-[var(--color-green-600)]" />}
                  {r.trend === "down" && <TrendingDown size={15} className="text-[var(--color-red-600)]" />}
                  {r.trend === "flat" && <Minus size={15} className="text-[var(--color-ink-400)]" />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {excluded && excluded.length > 0 && (
        <div className="border-t border-[var(--color-line)] px-4 py-2.5">
          <button
            onClick={() => setShowExcluded((v) => !v)}
            className="flex items-center gap-1 text-xs font-medium text-[var(--color-blue-600)]"
          >
            {showExcluded ? "Hide" : "Show"} excluded messages (not counted)
            <ChevronRight size={13} className={showExcluded ? "rotate-90 transition-transform" : "transition-transform"} />
          </button>
          {showExcluded && (
            <div className="mt-2 space-y-2 rounded-md bg-[var(--color-surface)] p-2.5">
              {excluded.map((e, i) => (
                <div key={i} className="text-xs">
                  <p className="font-medium text-[var(--color-ink-900)]">{e.subject}</p>
                  <p className="text-[var(--color-ink-500)]">
                    {e.from} — {e.reason}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
