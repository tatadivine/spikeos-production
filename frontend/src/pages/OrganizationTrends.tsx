import { useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { Card, SectionHeader } from "../components/ui/Card";
import { Select } from "../components/ui/FilterBar";
import { TrendChart, buildTrend } from "../components/ui/TrendChart";
import { orgAggregate } from "../mock/generator";

export function OrganizationTrends() {
  const [range, setRange] = useState("90");
  const days = Math.min(Number(range), 60);

  const charts = [
    { title: "Response Performance", seed: 51, base: orgAggregate.responseScore, spread: 5 },
    { title: "SLA Compliance", seed: 57, base: orgAggregate.slaCompliance, spread: 3 },
    { title: "Follow-through", seed: 63, base: 87, spread: 6 },
    { title: "Commitments Completed", seed: 69, base: 83, spread: 7 },
    { title: "Communication Quality", seed: 75, base: orgAggregate.positiveCommunication, spread: 5 },
    { title: "Positive Indicators", seed: 81, base: 78, spread: 6 },
  ];

  return (
    <AppShell pageTitle="Organization Trends">
      <div className="mb-5 flex justify-end">
        <Select
          label="Range"
          value={range}
          onChange={setRange}
          options={[
            { value: "30", label: "30 days" },
            { value: "90", label: "90 days" },
            { value: "180", label: "6 months" },
            { value: "365", label: "12 months" },
          ]}
        />
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {charts.map((c) => (
          <Card key={c.title}>
            <SectionHeader title={c.title} />
            <TrendChart data={buildTrend(c.seed, days, c.base, c.spread)} />
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
