import { Info, TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { Card } from "../ui/Card";
import clsx from "clsx";

type Tone = "blue" | "purple" | "green" | "teal" | "amber" | "red";

const TONE_BG: Record<Tone, string> = {
  blue: "bg-[var(--color-blue-600)]",
  purple: "bg-[var(--color-purple-600)]",
  green: "bg-[var(--color-green-600)]",
  teal: "bg-[var(--color-teal-600)]",
  amber: "bg-[var(--color-amber-600)]",
  red: "bg-[var(--color-orange-600)]",
};

export function MetricStatCard({
  icon: Icon,
  tone,
  label,
  value,
  suffix,
  trend,
  trendLabel,
  progressPct,
  source,
}: {
  icon: LucideIcon;
  tone: Tone;
  label: string;
  value: string | number;
  suffix?: string;
  trend: "up" | "down" | "flat";
  trendLabel: string;
  progressPct: number;
  source?: string;
}) {
  const [open, setOpen] = useState(false);
  const trendColor =
    trend === "up" ? "text-[var(--color-green-600)]" : trend === "down" ? "text-[var(--color-red-600)]" : "text-[var(--color-ink-500)]";

  return (
    <Card className="relative">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className={clsx("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white", TONE_BG[tone])}>
            <Icon size={16} />
          </span>
          <span className="text-[13px] font-medium text-[var(--color-ink-700)]">{label}</span>
        </div>
        {source && (
          <button
            aria-label={`About ${label}`}
            onClick={() => setOpen((v) => !v)}
            className="mt-0.5 text-[var(--color-ink-400)] hover:text-[var(--color-blue-600)]"
          >
            <Info size={13} />
          </button>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-[26px] font-bold leading-none tracking-tight text-[var(--color-ink-900)]">{value}</span>
        {suffix && <span className="text-sm font-medium text-[var(--color-ink-500)]">{suffix}</span>}
      </div>

      <div className={clsx("mt-1.5 flex items-center gap-1 text-[12px] font-medium", trendColor)}>
        {trend === "up" && <TrendingUp size={12} />}
        {trend === "down" && <TrendingDown size={12} />}
        {trend === "flat" && <Minus size={12} />}
        <span>{trendLabel}</span>
        <span className="font-normal text-[var(--color-ink-400)]">vs. previous 30 days</span>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-line)]">
        <div
          className={clsx("h-full rounded-full", TONE_BG[tone])}
          style={{ width: `${Math.max(4, Math.min(100, progressPct))}%` }}
        />
      </div>

      {open && source && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-lg border border-[var(--color-line)] bg-white p-3 text-left shadow-lg">
          <p className="text-[11px] text-[var(--color-ink-400)]">Source</p>
          <p className="text-xs text-[var(--color-ink-700)]">{source}</p>
        </div>
      )}
    </Card>
  );
}
