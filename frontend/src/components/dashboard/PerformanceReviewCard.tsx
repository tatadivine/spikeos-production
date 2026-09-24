import { CheckCircle2, AlertTriangle, Award } from "lucide-react";
import { Card } from "../ui/Card";
import clsx from "clsx";

export interface ReviewPoint {
  title: string;
  desc: string;
}

export function PerformanceReviewCard({
  overallLabel,
  deltaPoints,
  filledDots,
  totalDots = 7,
  strengths,
  coaching,
}: {
  overallLabel: string;
  deltaPoints: number;
  filledDots: number;
  totalDots?: number;
  strengths: ReviewPoint[];
  coaching: ReviewPoint[];
}) {
  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        <Award size={16} className="text-[var(--color-blue-600)]" />
        <h2 className="text-[15px] font-semibold text-[var(--color-ink-900)]">Performance Review Summary</h2>
      </div>

      <div className="mb-4 flex items-center justify-between rounded-lg bg-[var(--color-green-100)] px-3.5 py-3">
        <div>
          <p className="text-[11px] font-medium text-[var(--color-ink-500)]">Overall:</p>
          <p className="text-xl font-bold text-[var(--color-ink-900)]">{overallLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-[var(--color-green-600)]">
            {deltaPoints >= 0 ? "▲" : "▼"} {Math.abs(deltaPoints)} points
          </p>
          <p className="text-[11px] text-[var(--color-ink-500)]">vs previous 30 days</p>
          <div className="mt-1.5 flex justify-end gap-1">
            {Array.from({ length: totalDots }).map((_, i) => (
              <span
                key={i}
                className={clsx(
                  "h-2.5 w-2.5 rounded-full",
                  i < filledDots ? "bg-[var(--color-green-600)]" : "bg-[var(--color-line)]"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-[var(--color-green-100)]/60 p-3.5">
          <p className="mb-2.5 flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-green-600)]">
            <Award size={14} /> Recognized Strengths
          </p>
          <ul className="space-y-2.5">
            {strengths.map((s) => (
              <li key={s.title} className="flex items-start gap-2">
                <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[var(--color-green-600)]" />
                <div>
                  <p className="text-[13px] font-medium text-[var(--color-ink-900)]">{s.title}</p>
                  <p className="text-[12px] text-[var(--color-ink-500)]">{s.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg bg-[var(--color-amber-100)]/70 p-3.5">
          <p className="mb-2.5 flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-amber-600)]">
            <AlertTriangle size={14} /> Coaching Opportunities
          </p>
          <ul className="space-y-2.5">
            {coaching.map((c) => (
              <li key={c.title} className="flex items-start gap-2">
                <AlertTriangle size={15} className="mt-0.5 shrink-0 text-[var(--color-amber-600)]" />
                <div>
                  <p className="text-[13px] font-medium text-[var(--color-ink-900)]">{c.title}</p>
                  <p className="text-[12px] text-[var(--color-ink-500)]">{c.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
