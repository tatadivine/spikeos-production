import { useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { SettingsTabs } from "../../components/settings/SettingsTabs";
import { Card, SectionHeader } from "../../components/ui/Card";
import { useSession } from "../../lib/SessionContext";

const INITIAL = [
  { id: "e1", label: "Automated messages", desc: "System-generated notifications with no expected reply.", rule: "Sender domain matches known automation systems.", on: true },
  { id: "e2", label: "Newsletters", desc: "Bulk marketing or informational sends.", rule: "Message contains unsubscribe/list-header metadata.", on: true },
  { id: "e3", label: "Distribution lists", desc: "Messages sent to broad internal groups.", rule: "Recipient is a distribution list, not an individual.", on: true },
  { id: "e4", label: "FYI messages", desc: "Messages explicitly marked informational only.", rule: "Subject or body indicates no response is required.", on: true },
  { id: "e5", label: "Approved PTO", desc: "Time when the employee was on approved leave.", rule: "Message received during an approved PTO window.", on: true },
  { id: "e6", label: "Delegated coverage", desc: "Time when another employee covered communications.", rule: "Delegate acknowledged on the employee's behalf.", on: true },
  { id: "e7", label: "System-generated messages", desc: "Messages originating from internal tooling.", rule: "Sender is a recognized system account.", on: true },
  { id: "e8", label: "Messages not reasonably requiring response", desc: "Content that does not require action.", rule: "AI classification confidence exceeds threshold, subject to review.", on: false },
];

export function SettingsExclusions() {
  const { pushToast } = useSession();
  const [items, setItems] = useState(INITIAL);

  return (
    <AppShell pageTitle="Exclusions">
      <SettingsTabs />
      <div className="mb-5 rounded-lg border border-[var(--color-green-100)] bg-[var(--color-green-100)]/50 p-4 text-sm text-[var(--color-green-600)]">
        Excluded communications do not negatively affect employee communication metrics.
      </div>
      <div className="space-y-3">
        {items.map((it) => (
          <Card key={it.id} className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink-900)]">{it.label}</p>
              <p className="mt-0.5 text-xs text-[var(--color-ink-500)]">{it.desc}</p>
              <p className="mt-1 text-[11px] text-[var(--color-ink-400)]">Rule: {it.rule}</p>
            </div>
            <label className="flex shrink-0 items-center gap-2">
              <span className="text-xs text-[var(--color-ink-500)]">{it.on ? "Enabled" : "Disabled"}</span>
              <input
                type="checkbox"
                checked={it.on}
                onChange={() => {
                  setItems((s) => s.map((x) => (x.id === it.id ? { ...x, on: !x.on } : x)));
                  pushToast("Exclusion rule updated.", "success");
                }}
                className="h-4 w-4 accent-[var(--color-blue-600)]"
              />
            </label>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
