import {
  MessageSquare,
  BarChart3,
} from "lucide-react";
import { Card } from "../ui/Card";

export interface QualityMeter {
  label: string;
  sub: string;
  pct: number;
  color: string;
}

export function CommunicationQualityCard({
  meters,
}: {
  meters: QualityMeter[];
}) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare
            size={16}
            className="text-[var(--color-blue-600)]"
          />

          <h2 className="text-[15px] font-semibold text-[var(--color-ink-900)]">
            Communication Quality & Response
          </h2>
        </div>

        <span className="flex items-center gap-1 rounded-full bg-[var(--color-surface)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-ink-500)]">
          <BarChart3 size={11} />
          Live indicators
        </span>
      </div>

      <div className="space-y-4">
        {meters.map((meter) => (
          <div key={meter.label}>
            <div className="mb-1 flex items-baseline justify-between">
              <div>
                <p className="text-[13px] font-medium text-[var(--color-ink-900)]">
                  {meter.label}
                </p>

                <p className="text-[11px] text-[var(--color-ink-500)]">
                  {meter.sub}
                </p>
              </div>

              <span className="text-[13px] font-semibold text-[var(--color-ink-900)]">
                {meter.pct}%
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-line)]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, meter.pct)
                  )}%`,
                  background:
                    meter.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}