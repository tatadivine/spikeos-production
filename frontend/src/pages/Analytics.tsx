import { AppShell } from "../components/layout/AppShell";
import { PowerBIFrame } from "../components/analytics/PowerBIFrame";
import { PowerBIReport } from "../components/analytics/PowerBIReport";

export function Analytics() {
  return (
    <AppShell pageTitle="SpikeOS Analytics">
      <div className="mb-5">
        <p className="text-sm text-[var(--color-ink-500)]">Power BI Embedded</p>
      </div>
      <PowerBIFrame title="Organization Communication Performance">
        <PowerBIReport />
      </PowerBIFrame>
    </AppShell>
  );
}
