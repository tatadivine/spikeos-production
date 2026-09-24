import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from "recharts";
import { CheckCircle2 } from "lucide-react";
import { Card, SectionHeader } from "../ui/Card";

export interface TrendWeek {
  label: string;
  employee: number;
  team: number;
}

export function ResponseTrendCard({
  data,
  goal = 90,
  employeeLabel = "Employee",
  teamLabel = "Team Average",
  weeksAboveGoal,
}: {
  data: TrendWeek[];
  goal?: number;
  employeeLabel?: string;
  teamLabel?: string;
  weeksAboveGoal?: string;
}) {
  const latest = data[data.length - 1];
  const prior = data[data.length - 2];
  const delta = prior ? latest.employee - prior.employee : 0;

  return (
    <Card>
      <div className="mb-3 flex items-start justify-between gap-4">
        <SectionHeader title="Response Performance Trend" />
        <div className="flex shrink-0 items-center gap-3 pt-0.5 text-[11px] font-medium text-[var(--color-ink-500)]">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--color-blue-600)]" /> {employeeLabel}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--color-teal-600)]" /> {teamLabel}
          </span>
          <span className="flex items-center gap-1.5 text-[var(--color-ink-400)]">
            <span className="h-0 w-3 border-t-2 border-dashed border-[var(--color-ink-400)]" /> Goal ({goal}%)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_180px]">
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e3e7ee" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#8892a0" }} axisLine={{ stroke: "#e3e7ee" }} tickLine={false} />
              <YAxis
                domain={[60, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11, fill: "#8892a0" }}
                axisLine={false}
                tickLine={false}
                width={38}
              />
              <ReferenceLine y={goal} stroke="#8892a0" strokeDasharray="4 4" />
              <Tooltip
                formatter={(v) => [`${v}%`]}
                contentStyle={{ borderRadius: 8, border: "1px solid #e3e7ee", fontSize: 12 }}
              />
              <Line type="monotone" dataKey="employee" stroke="#2f6bff" strokeWidth={2.5} dot={{ r: 4, fill: "#2f6bff" }} />
              <Line type="monotone" dataKey="team" stroke="#0f8a8a" strokeWidth={2.5} dot={{ r: 4, fill: "#0f8a8a" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-4 rounded-lg bg-[var(--color-blue-50)] p-3.5">
          <div>
            <p className="text-[11px] text-[var(--color-ink-500)]">Latest Week</p>
            <p className="text-2xl font-bold text-[var(--color-ink-900)]">{latest.employee}%</p>
            <p className={`mt-0.5 text-[11px] font-medium ${delta >= 0 ? "text-[var(--color-green-600)]" : "text-[var(--color-red-600)]"}`}>
              {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)} pts vs prior week
            </p>
          </div>
          <div className="border-t border-[var(--color-blue-100)] pt-3">
            <p className="text-[11px] text-[var(--color-ink-500)]">Above Goal</p>
            <p className="mt-1 flex items-center gap-1.5 text-[13px] font-semibold text-[var(--color-ink-900)]">
              <CheckCircle2 size={15} className="text-[var(--color-green-600)]" />
              {weeksAboveGoal ?? `${data.filter((d) => d.employee >= goal).length} of ${data.length} weeks`}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
