import { AppShell } from "../components/layout/AppShell";
import { Card, SectionHeader } from "../components/ui/Card";
import { MetricCard } from "../components/ui/MetricCard";
import { TrendChart, buildTrend } from "../components/ui/TrendChart";
import { orgAggregate, departmentAggregate } from "../mock/generator";
import { DEPARTMENTS } from "../mock/pools";

export function Organization() {
  const deptData = DEPARTMENTS.map((d) => departmentAggregate(d));

  return (
    <AppShell pageTitle="Organization — Leadership Dashboard">
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Employees" value={orgAggregate.headcount} source="Directory sync — Microsoft 365" />
        <MetricCard label="Response Score" value={orgAggregate.responseScore} suffix="%" trend="up" trendLabel="+2 pts this quarter" />
        <MetricCard label="SLA Compliance" value={orgAggregate.slaCompliance} suffix="%" />
        <MetricCard label="Open Commitments" value={orgAggregate.openCommitments} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <SectionHeader title="Organization Response Trend" />
          <TrendChart data={buildTrend(41, 30, orgAggregate.responseScore, 4)} />
        </Card>
        <Card>
          <SectionHeader title="Communication Quality" />
          <TrendChart data={buildTrend(47, 30, orgAggregate.positiveCommunication, 5)} colors={["#7C5CFF"]} />
        </Card>
      </div>

      <SectionHeader title="Department Comparison" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {deptData.map((d) => (
          <Card key={d.department}>
            <p className="text-sm font-semibold text-[var(--color-ink-900)]">{d.department}</p>
            <p className="text-xs text-[var(--color-ink-500)]">{d.headcount} employees</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div><p className="text-[var(--color-ink-400)]">Response score</p><p className="font-medium text-[var(--color-ink-900)]">{d.responseScore}</p></div>
              <div><p className="text-[var(--color-ink-400)]">SLA</p><p className="font-medium text-[var(--color-ink-900)]">{d.slaCompliance}%</p></div>
              <div><p className="text-[var(--color-ink-400)]">Overdue</p><p className="font-medium text-[var(--color-ink-900)]">{d.overdue}</p></div>
              <div><p className="text-[var(--color-ink-400)]">Commitments</p><p className="font-medium text-[var(--color-ink-900)]">{d.openCommitments}</p></div>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
