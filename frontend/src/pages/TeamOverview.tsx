import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Card, SectionHeader } from "../components/ui/Card";
import { MetricCard } from "../components/ui/MetricCard";
import { TrendChart, buildTrend } from "../components/ui/TrendChart";
import { EmployeeCard } from "../components/team/EmployeeCard";
import { AIInsightCard } from "../components/performance/AIInsightCard";
import { employees, avg, insights } from "../mock/generator";

export function TeamOverview() {
  const navigate = useNavigate();

  // The employees array is populated by loadLiveBootstrap()
  // with the employees returned by the authenticated backend.
  const team = employees;

  const responseScore = avg(
    team.map((employee) => employee.responseScore)
  );

  const medianResponse = avg(
    team.map((employee) => employee.medianResponseMinutes)
  );

  const answered24h = avg(
    team.map((employee) => employee.answeredWithin24hPct)
  );

  const openCommitments = team.reduce(
    (sum, employee) =>
      sum + employee.openCommitments,
    0
  );

  const overdue = team.reduce(
    (sum, employee) =>
      sum + employee.overdueFollowUps,
    0
  );

  return (
    <AppShell pageTitle="Team Communication Effectiveness">
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MetricCard
          label="Team Response Score"
          value={responseScore}
          suffix="%"
          source="Aggregated employee scores"
        />

        <MetricCard
          label="Median Response"
          value={`${Math.floor(
            medianResponse / 60
          )}h ${medianResponse % 60}m`}
          source="Aggregated Outlook timestamps"
        />

        <MetricCard
          label="Answered Within 24h"
          value={answered24h}
          suffix="%"
        />

        <MetricCard
          label="Open Commitments"
          value={openCommitments}
        />

        <MetricCard
          label="Overdue"
          value={overdue}
        />
      </div>

      <Card className="mb-6">
        <SectionHeader
          title="Team Trends"
          subtitle="Response performance across the organization"
        />

        <TrendChart
          data={buildTrend(
            7,
            14,
            responseScore,
            5
          )}
        />
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <SectionHeader
            title="All Employees"
            subtitle={`${team.length} employees`}
          />

          <div className="space-y-3">
            {team.map((employee) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                onClick={() =>
                  navigate(
                    `/team/${employee.id}`
                  )
                }
              />
            ))}
          </div>
        </div>

        <div>
          <SectionHeader
            title="Coaching Opportunities"
            subtitle="Across the organization"
          />

          <div className="space-y-3">
            {insights
              .slice(0, 2)
              .map((insight) => (
                <AIInsightCard
                  key={insight.id}
                  insight={insight}
                />
              ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}