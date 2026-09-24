import type { ReactNode } from "react";
import { BarChart3 } from "lucide-react";

export function PowerBIFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-line)] bg-white">
      <div className="flex items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-navy-900)] px-5 py-3">
        <div className="flex items-center gap-2 text-white">
          <BarChart3 size={16} className="text-[var(--color-blue-400)]" />
          <span className="text-sm font-medium">{title}</span>
        </div>
        <span className="rounded-md bg-white/10 px-2 py-1 text-[11px] text-white/80">
          Embedded Power BI Analytics — Live
        </span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
