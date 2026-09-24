import { MessageSquare, Sparkles } from "lucide-react";
import { Card } from "../ui/Card";

export interface QualityMeter {
  label: string;
  sub: string;
  pct: number;
  color: string;
}

export function CommunicationQualityCard({ meters }: { meters: QualityMeter[] }) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-[var(--color-blue-600)]" />
          <h2 className="text-[15px] font-semibold text-[var(--color-ink-900)]">Communication Quality</h2>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-[var(--color-purple-100)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-purple-600)]">
          <Sparkles size={11} /> AI-assisted indicators
        </span>
      </div>

      <div className="space-y-4">
        {meters.map((m) => (
          <div key={m.label}>
            <div className="mb-1 flex items-baseline justify-between">
              <div>
                <p className="text-[13px] font-medium text-[var(--color-ink-900)]">{m.label}</p>
                <p className="text-[11px] text-[var(--color-ink-500)]">{m.sub}</p>
              </div>
              <span className="text-[13px] font-semibold text-[var(--color-ink-900)]">{m.pct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-line)]">
              <div className="h-full rounded-full" style={{ width: `${m.pct}%`, background: m.color }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
