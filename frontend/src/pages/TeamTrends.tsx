import { useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { Card, SectionHeader } from "../components/ui/Card";
import { Select } from "../components/ui/FilterBar";
import { TrendChart, buildTrend } from "../components/ui/TrendChart";
import { directReports, avg } from "../mock/generator";
import { HERO_MANAGER_ID } from "../services";

export function TeamTrends() {
  const [range, setRange] = useState("30");
  const team = directReports(HERO_MANAGER_ID);
  const days = Number(range);
  const base = avg(team.map((t) => t.responseScore));

  const charts = [
    { title: "Response Performance Over Time", seed: 2, base, spread: 6 },
    { title: "Median Response", seed: 9, base: 70, spread: 15 },
    { title: "SLA Compliance", seed: 15, base: 92, spread: 4 },
    { title: "Overdue Communications", seed: 21, base: 6, spread: 3 },
    { title: "Commitments Completed", seed: 27, base: 85, spread: 8 },
    { title: "Communication Quality", seed: 33, base: 88, spread: 5 },
  ];

  return (
    <AppShell pageTitle="Team Trends">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-[var(--color-ink-500)]">Operations team — {team.length} members</p>
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
        {charts.map((c) => (
          <Card key={c.title}>
            <SectionHeader title={c.title} />
            <TrendChart data={buildTrend(c.seed, Math.min(days, 60), c.base, c.spread)} />
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
