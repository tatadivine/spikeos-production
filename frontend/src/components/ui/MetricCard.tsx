import { useState } from "react";
import { Info, TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "./Card";

export function MetricCard({
  label,
  value,
  suffix,
  trend,
  trendLabel,
  source,
  calculation,
  lastUpdated = "Today, 09:42",
}: {
  label: string;
  value: string | number;
  suffix?: string;
  trend?: "up" | "down" | "flat";
  trendLabel?: string;
  source?: string;
  calculation?: string;
  lastUpdated?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="relative">
      <div className="flex items-start justify-between">
        <span className="text-sm text-[var(--color-ink-500)]">{label}</span>
        {source && (
          <button
            aria-label={`About ${label}`}
            onClick={() => setOpen((v) => !v)}
            className="text-[var(--color-ink-400)] hover:text-[var(--color-blue-600)] transition-colors"
          >
            <Info size={14} />
          </button>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-semibold tracking-tight text-[var(--color-ink-900)]">
          {value}
        </span>
        {suffix && <span className="text-sm text-[var(--color-ink-500)]">{suffix}</span>}
      </div>
      {trend && trendLabel && (
        <div
          className={`mt-1.5 flex items-center gap-1 text-xs ${
            trend === "up"
              ? "text-[var(--color-green-600)]"
              : trend === "down"
              ? "text-[var(--color-red-600)]"
              : "text-[var(--color-ink-500)]"
          }`}
        >
          {trend === "up" && <TrendingUp size={13} />}
          {trend === "down" && <TrendingDown size={13} />}
          <span>{trendLabel}</span>
        </div>
      )}
      {open && source && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border border-[var(--color-line)] bg-white p-3 shadow-lg mx-5">
          <dl className="space-y-1.5 text-xs">
            <div>
              <dt className="text-[var(--color-ink-400)]">Source</dt>
              <dd className="text-[var(--color-ink-700)]">{source}</dd>
            </div>
            {calculation && (
              <div>
                <dt className="text-[var(--color-ink-400)]">Calculation</dt>
                <dd className="text-[var(--color-ink-700)]">{calculation}</dd>
              </div>
            )}
            <div>
              <dt className="text-[var(--color-ink-400)]">Last updated</dt>
              <dd className="text-[var(--color-ink-700)]">{lastUpdated}</dd>
            </div>
          </dl>
        </div>
      )}
    </Card>
  );
}
