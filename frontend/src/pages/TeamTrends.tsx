import { useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { Card, SectionHeader } from "../components/ui/Card";
import { Select } from "../components/ui/FilterBar";
import { TrendChart, buildTrend } from "../components/ui/TrendChart";
import { employees, avg } from "../mock/generator";

export function TeamTrends() {
  const [range, setRange] = useState("30");

  // The employees array is populated by loadLiveBootstrap()
  // with employees returned by the authenticated backend.
  const team = employees;

  const days = Number(range);

  const base = avg(
    team.map((employee) => employee.responseScore)
  );

  const charts = [
    {
      title: "Response Performance Over Time",
      seed: 2,
      base,
      spread: 6,
    },
    {
      title: "Median Response",
      seed: 9,
      base: 70,
      spread: 15,
    },
    {
      title: "SLA Compliance",
      seed: 15,
      base: 92,
      spread: 4,
    },
    {
      title: "Overdue Communications",
      seed: 21,
      base: 6,
      spread: 3,
    },
    {
      title: "Commitments Completed",
      seed: 27,
      base: 85,
      spread: 8,
    },
    {
      title: "Communication Quality",
      seed: 33,
      base: 88,
      spread: 5,
    },
  ];

  return (
    <AppShell pageTitle="Team Trends">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--color-ink-500)]">
          Organization — {team.length} members
        </p>

        <Select
          label="Range"
          value={range}
          onChange={setRange}
          options={[
            { value: "7", label: "7 days" },
            { value: "30", label: "30 days" },
            { value: "90", label: "90 days" },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {charts.map((chart) => (
          <Card key={chart.title}>
            <SectionHeader title={chart.title} />

            <TrendChart
              data={buildTrend(
                chart.seed,
                Math.min(days, 60),
                chart.base,
                chart.spread
              )}
            />
          </Card>
        ))}
      </div>
    </AppShell>
  );
}