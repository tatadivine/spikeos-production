import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export interface TrendPoint {
  label: string;
  value: number;
  [key: string]: string | number;
}

export function TrendChart({
  data,
  dataKeys = ["value"],
  colors = ["#2F6BFF", "#7C5CFF", "#0EA5A5"],
  height = 220,
  variant = "area",
}: {
  data: TrendPoint[];
  dataKeys?: string[];
  colors?: string[];
  height?: number;
  variant?: "area" | "line";
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      {variant === "area" ? (
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
          <defs>
            {dataKeys.map((k, i) => (
              <linearGradient id={`grad-${k}`} key={k} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors[i % colors.length]} stopOpacity={0.25} />
                <stop offset="100%" stopColor={colors[i % colors.length]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e3e7ee" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#8892a0" }}
            axisLine={{ stroke: "#e3e7ee" }}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 11, fill: "#8892a0" }} axisLine={false} tickLine={false} width={32} />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e3e7ee",
              fontSize: 12,
              boxShadow: "0 4px 12px rgba(15,21,34,0.08)",
            }}
          />
          {dataKeys.map((k, i) => (
            <Area
              key={k}
              type="monotone"
              dataKey={k}
              stroke={colors[i % colors.length]}
              strokeWidth={2}
              fill={`url(#grad-${k})`}
            />
          ))}
        </AreaChart>
      ) : (
        <LineChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e3e7ee" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#8892a0" }}
            axisLine={{ stroke: "#e3e7ee" }}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 11, fill: "#8892a0" }} axisLine={false} tickLine={false} width={32} />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e3e7ee",
              fontSize: 12,
            }}
          />
          {dataKeys.map((k, i) => (
            <Line
              key={k}
              type="monotone"
              dataKey={k}
              stroke={colors[i % colors.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      )}
    </ResponsiveContainer>
  );
}

// Deterministic trend series generator (no dependence on Math.random)
export function buildTrend(seedBase: number, days: number, base: number, spread: number): TrendPoint[] {
  const points: TrendPoint[] = [];
  let val = base;
  for (let i = 0; i < days; i++) {
    const wobble = Math.sin((seedBase + i) * 1.7) * spread;
    val = base + wobble + (i / days) * spread * 0.6;
    const d = new Date();
    d.setDate(d.getDate() - (days - i));
    points.push({
      label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      value: Math.round(val),
    });
  }
  return points;
}
