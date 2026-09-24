import { AppShell } from "../components/layout/AppShell";
import { Card, SectionHeader } from "../components/ui/Card";
import { MetricCard } from "../components/ui/MetricCard";
import { TrendChart, buildTrend } from "../components/ui/TrendChart";
import { AIInsightCard } from "../components/performance/AIInsightCard";
import { EvidenceCard } from "../components/performance/EvidenceCard";
import { getEmployee } from "../mock/generator";
import { ALEX_ID } from "../services";
import { insights, evidenceEntries } from "../mock/generator";

export function MyPerformance() {
  const me = getEmployee(ALEX_ID)!;
  const mine = insights.filter((i) => i.employeeId === ALEX_ID).slice(0, 3);
  const evidence = evidenceEntries.slice(0, 2);

  return (
    <AppShell pageTitle="My Performance">
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Response Score" value={me.responseScore} source="Measured — Microsoft 365 records" />
        <MetricCard label="Median Response" value={`${Math.floor(me.medianResponseMinutes / 60)}h ${me.medianResponseMinutes % 60}m`} source="Measured — Outlook timestamps" />
        <MetricCard label="SLA Compliance" value={me.slaCompliancePct} suffix="%" source="Measured — rule engine" />
        <MetricCard label="Positive Communication" value={me.positiveCommunicationPct} suffix="%" source="AI-assisted — quality model" />
      </div>

      <Card className="mb-6">
        <SectionHeader title="Response Score Trend" subtitle="Last 30 days — measured metric" />
        <TrendChart data={buildTrend(5, 30, me.responseScore, 6)} />
      </Card>

      <div className="mb-2 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-[var(--color-blue-600)]" />
        <p className="text-xs text-[var(--color-ink-500)]">
          Metrics above are measured directly from communication records. Insights below are
          AI-assisted indicators and require human review before any negative action.
        </p>
      </div>

      <SectionHeader title="Coaching Opportunities" />
      <div className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {mine.map((i) => (
          <AIInsightCard key={i.id} insight={i} />
        ))}
      </div>

      <SectionHeader title="Recent Evidence" />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {evidence.map((e) => (
          <EvidenceCard key={e.id} evidence={e} />
        ))}
      </div>
    </AppShell>
  );
}
