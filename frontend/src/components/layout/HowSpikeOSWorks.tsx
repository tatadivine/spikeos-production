import { ArrowDown, ArrowRight } from "lucide-react";

function Node({ title, subtitle, accent }: { title: string; subtitle?: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-lg border px-4 py-2.5 text-center text-xs font-medium ${
        accent
          ? "border-[var(--color-blue-500)] bg-[var(--color-blue-50)] text-[var(--color-blue-600)]"
          : "border-[var(--color-line)] bg-white text-[var(--color-ink-900)]"
      }`}
    >
      {title}
      {subtitle && <p className="mt-0.5 font-normal text-[var(--color-ink-500)]">{subtitle}</p>}
    </div>
  );
}

export function HowSpikeOSWorks() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--color-ink-500)]">
        SpikeOS reads communication records from Microsoft 365, applies scoring and fairness
        rules, and delivers results to the people who need them — inside SpikeOS, inside Outlook,
        and inside Power BI.
      </p>
      <div className="flex flex-col items-center gap-2">
        <Node title="Microsoft 365" subtitle="Outlook, Teams, calendar records" />
        <ArrowDown size={16} className="text-[var(--color-ink-400)]" />
        <Node title="Microsoft Graph" subtitle="Secure, permissioned data access" />
        <ArrowDown size={16} className="text-[var(--color-ink-400)]" />
        <Node title="SpikeOS Intelligence" accent />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Node title="Response Analysis" />
          <Node title="Commitment Detection" />
          <Node title="Follow-up Analysis" />
          <Node title="Communication Quality" />
          <Node title="Exclusions & Fairness" />
        </div>
        <ArrowDown size={16} className="text-[var(--color-ink-400)]" />
        <Node title="SpikeOS Performance Engine" accent />
        <div className="grid grid-cols-3 gap-2">
          <Node title="Employee Metrics" />
          <Node title="Manager Metrics" />
          <Node title="Leadership Analytics" />
        </div>
        <div className="flex items-center gap-2 text-[var(--color-ink-400)]">
          <ArrowRight size={14} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Node title="Power BI" subtitle="Embedded analytics" />
          <Node title="Outlook Coach" subtitle="In-inbox guidance" />
        </div>
      </div>
      <p className="rounded-md bg-[var(--color-surface)] p-3 text-xs text-[var(--color-ink-500)]">
        This is a demo visualization of the intended production architecture. No live Microsoft
        Graph or Power BI connection is active in this prototype.
      </p>
    </div>
  );
}
