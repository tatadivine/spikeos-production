import { AppShell } from "../components/layout/AppShell";
import { OutlookCoachPanel } from "../components/outlook/OutlookCoachPanel";

export function OutlookCoachPage() {
  return (
    <AppShell pageTitle="Outlook Communication Coach">
      <p className="mb-5 text-sm text-[var(--color-ink-500)]">
        This is a prototype of the SpikeOS side panel as it will appear inside Microsoft Outlook.
      </p>
      <div className="flex justify-center">
        <div className="w-full max-w-sm overflow-hidden rounded-xl border border-[var(--color-line)] shadow-lg" style={{ height: 640 }}>
          <div className="flex h-7 items-center gap-1.5 bg-[var(--color-navy-950)] px-3">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="h-2 w-2 rounded-full bg-green-400" />
            <span className="ml-2 text-[10px] text-white/40">Outlook — Add-in panel</span>
          </div>
          <div style={{ height: "calc(100% - 28px)" }}>
            <OutlookCoachPanel />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
