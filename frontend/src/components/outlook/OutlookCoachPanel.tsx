import { Zap, Clock, ArrowRight } from "lucide-react";
import { alertsForOwner } from "../../mock/generator";
import { ALEX_ID } from "../../services";
import { useSession } from "../../lib/SessionContext";

export function OutlookCoachPanel() {
  const { pushToast } = useSession();
  const alertItems = alertsForOwner(ALEX_ID).slice(0, 4);

  return (
    <div className="flex h-full w-full flex-col bg-white text-[13px]">
      <div className="flex items-center gap-2 border-b border-[var(--color-line)] bg-[var(--color-navy-900)] px-4 py-3">
        <Zap size={16} className="text-[var(--color-blue-400)]" fill="currentColor" />
        <span className="font-semibold text-white">SpikeOS Communication Coach</span>
      </div>

      <div className="border-b border-[var(--color-line)] px-4 py-4">
        <p className="text-xs text-[var(--color-ink-500)]">Response Score</p>
        <div className="mt-1 flex items-end gap-2">
          <span className="text-3xl font-semibold text-[var(--color-ink-900)]">92</span>
          <span className="mb-1 text-xs text-[var(--color-green-600)]">+4 this week</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-400)]">
          Needs your attention
        </p>
        <div className="space-y-2">
          {alertItems.map((a) => (
            <div key={a.id} className="rounded-md border border-[var(--color-line)] p-2.5">
              <p className="flex items-center gap-1 text-[11px] text-[var(--color-ink-400)]">
                <Clock size={11} /> {new Date(a.time).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </p>
              <p className="mt-1 text-xs font-medium text-[var(--color-ink-900)]">{a.reason}</p>
              <div className="mt-2 flex gap-1.5">
                <button
                  onClick={() => pushToast("Opened in Outlook.")}
                  className="rounded bg-[var(--color-blue-600)] px-2 py-1 text-[11px] font-medium text-white"
                >
                  Respond now
                </button>
                <button
                  onClick={() => pushToast("Commitment added.", "success")}
                  className="rounded border border-[var(--color-line)] px-2 py-1 text-[11px] text-[var(--color-ink-700)]"
                >
                  Add commitment
                </button>
              </div>
            </div>
          ))}
        </div>

        <p className="mb-2 mt-4 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-400)]">
          Positive follow-through
        </p>
        <div className="rounded-md border border-[var(--color-green-100)] bg-[var(--color-green-100)]/50 p-2.5">
          <p className="text-xs text-[var(--color-ink-900)]">
            Customer commitment completed on time.
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--color-ink-500)]">
            Apex Manufacturing — quotation sent 2 days ahead of due date.
          </p>
        </div>
      </div>

      <div className="border-t border-[var(--color-line)] p-3">
        <button
          onClick={() => pushToast("Opening SpikeOS...")}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-[var(--color-line)] py-2 text-xs font-medium text-[var(--color-blue-600)] hover:bg-[var(--color-blue-50)]"
        >
          Open SpikeOS <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
