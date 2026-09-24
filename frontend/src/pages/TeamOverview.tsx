import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Card, SectionHeader } from "../components/ui/Card";
import { MetricCard } from "../components/ui/MetricCard";
import { TrendChart, buildTrend } from "../components/ui/TrendChart";
import { EmployeeCard } from "../components/team/EmployeeCard";
import { AIInsightCard } from "../components/performance/AIInsightCard";
import { directReports, avg, insights } from "../mock/generator";
import { HERO_MANAGER_ID } from "../services";

export function TeamOverview() {
  const navigate = useNavigate();
  const team = directReports(HERO_MANAGER_ID);

  const responseScore = avg(team.map((t) => t.responseScore));
  const medianResponse = avg(team.map((t) => t.medianResponseMinutes));
  const answered24h = avg(team.map((t) => t.answeredWithin24hPct));
  const openCommitments = team.reduce((s, t) => s + t.openCommitments, 0);
  const overdue = team.reduce((s, t) => s + t.overdueFollowUps, 0);

  return (
    <AppShell pageTitle="Team Communication Effectiveness">
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MetricCard label="Team Response Score" value={responseScore} suffix="%" source="Aggregated employee scores" />
        <MetricCard label="Median Response" value={`${Math.floor(medianResponse / 60)}h ${medianResponse % 60}m`} source="Aggregated Outlook timestamps" />
        <MetricCard label="Answered Within 24h" value={answered24h} suffix="%" />
        <MetricCard label="Open Commitments" value={openCommitments} />
        <MetricCard label="Overdue" value={overdue} />
      </div>

      <Card className="mb-6">
        <SectionHeader title="Team Trends" subtitle="Response performance, last 14 days" />
        <TrendChart data={buildTrend(7, 14, responseScore, 5)} />
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <SectionHeader title="Team Members" />
          <div className="space-y-3">
            {team.map((e) => (
              <EmployeeCard key={e.id} employee={e} onClick={() => navigate(`/team/${e.id}`)} />
            ))}
          </div>
        </div>
        <div>
          <SectionHeader title="Coaching Opportunities" subtitle="Across the team" />
          <div className="space-y-3">
            {insights.slice(0, 2).map((i) => (
              <AIInsightCard key={i.id} insight={i} />
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
