import { useState } from "react";
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { Card } from "../ui/Card";

export interface CommitmentRow {
  category: string;
  icon: LucideIcon;
  completionPct: number;
  completed: number;
  total: number;
  overdue: number;
  trend: "up" | "down" | "flat";
  bold?: boolean;
}

export interface ExcludedMessage {
  subject: string;
  from: string;
  reason: string;
}

export function ResponseCommitmentsTable({
  rows,
  excluded,
}: {
  rows: CommitmentRow[];
  excluded?: ExcludedMessage[];
}) {
  const [showExcluded, setShowExcluded] =
    useState(false);

  return (
    <Card padded={false}>
      <div className="flex items-center gap-2 border-b border-[var(--color-line)] px-4 py-3.5">
        <Clock
          size={16}
          className="text-[var(--color-blue-600)]"
        />

        <h2 className="text-[15px] font-semibold text-[var(--color-ink-900)]">
          Response Commitments
        </h2>
      </div>

      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-[var(--color-ink-400)]">
            <th className="px-4 py-2 font-medium">
              Status
            </th>

            <th className="px-2 py-2 font-medium">
              Completion
            </th>

            <th className="px-2 py-2 font-medium">
              Overdue
            </th>

            <th className="px-4 py-2 font-medium">
              Trend
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            const Icon = row.icon;

            return (
              <tr
                key={row.category}
                className={
                  row.bold
                    ? "border-t border-[var(--color-line)] bg-[var(--color-surface)]"
                    : "border-t border-[var(--color-line)]"
                }
              >
                <td className="px-4 py-2.5">
                  <span
                    className={`flex items-center gap-2 ${
                      row.bold
                        ? "font-semibold"
                        : "font-medium"
                    } text-[var(--color-ink-900)]`}
                  >
                    <Icon
                      size={15}
                      className="text-[var(--color-blue-600)]"
                    />

                    {row.category}
                  </span>
                </td>

                <td className="px-2 py-2.5">
                  <span className="font-semibold text-[var(--color-ink-900)]">
                    {row.completionPct}%
                  </span>

                  <span className="ml-1 text-[11px] text-[var(--color-ink-400)]">
                    {row.completed} /{" "}
                    {row.total}
                  </span>
                </td>

                <td
                  className={`px-2 py-2.5 font-semibold ${
                    row.overdue > 0
                      ? "text-[var(--color-red-600)]"
                      : "text-[var(--color-ink-500)]"
                  }`}
                >
                  {row.overdue}
                </td>

                <td className="px-4 py-2.5">
                  {row.trend === "up" && (
                    <TrendingUp
                      size={15}
                      className="text-[var(--color-green-600)]"
                    />
                  )}

                  {row.trend === "down" && (
                    <TrendingDown
                      size={15}
                      className="text-[var(--color-red-600)]"
                    />
                  )}

                  {row.trend === "flat" && (
                    <Minus
                      size={15}
                      className="text-[var(--color-ink-400)]"
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {excluded &&
        excluded.length > 0 && (
          <div className="border-t border-[var(--color-line)] px-4 py-2.5">
            <button
              type="button"
              onClick={() =>
                setShowExcluded((value) => !value)
              }
              className="flex items-center gap-1 text-xs font-medium text-[var(--color-blue-600)]"
            >
              {showExcluded
                ? "Hide"
                : "Show"}{" "}
              excluded messages (not counted)

              <ChevronRight
                size={13}
                className={
                  showExcluded
                    ? "rotate-90 transition-transform"
                    : "transition-transform"
                }
              />
            </button>

            {showExcluded && (
              <div className="mt-2 space-y-2 rounded-md bg-[var(--color-surface)] p-2.5">
                {excluded.map(
                  (item, index) => (
                    <div
                      key={`${item.subject}-${index}`}
                      className="text-xs"
                    >
                      <p className="font-medium text-[var(--color-ink-900)]">
                        {item.subject}
                      </p>

                      <p className="text-[var(--color-ink-500)]">
                        {item.from} —{" "}
                        {item.reason}
                      </p>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}
    </Card>
  );
}