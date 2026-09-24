import { useState } from "react";
import { AppShell } from "../../components/layout/AppShell";
import { SettingsTabs } from "../../components/settings/SettingsTabs";
import { Card, SectionHeader } from "../../components/ui/Card";
import { useSession } from "../../lib/SessionContext";

const INITIAL_RULES = [
  { id: "r1", label: "Customer response target", value: "24 hours" },
  { id: "r2", label: "Internal response target", value: "48 hours" },
  { id: "r3", label: "High priority target", value: "4 hours" },
  { id: "r4", label: "Commitment follow-up", value: "Required" },
];

export function SettingsScoring() {
  const { pushToast } = useSession();
  const [rules, setRules] = useState(INITIAL_RULES);
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <AppShell pageTitle="Scoring Rules">
      <SettingsTabs />
      <Card>
        <SectionHeader title="Scoring Rules" subtitle="Targets used to evaluate response performance" />
        <div className="divide-y divide-[var(--color-line)]">
          {rules.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-3">
              <span className="text-sm text-[var(--color-ink-900)]">{r.label}</span>
              {editing === r.id ? (
                <div className="flex items-center gap-2">
                  <input
                    defaultValue={r.value}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const val = (e.target as HTMLInputElement).value;
                        setRules((rs) => rs.map((x) => (x.id === r.id ? { ...x, value: val } : x)));
                        setEditing(null);
                        pushToast("Scoring rule updated.", "success");
                      }
                    }}
                    className="w-36 rounded-md border border-[var(--color-line)] px-2 py-1 text-sm"
                  />
                  <button onClick={() => setEditing(null)} className="text-xs text-[var(--color-ink-500)]">Cancel</button>
                </div>
              ) : (
                <button onClick={() => setEditing(r.id)} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[var(--color-ink-900)]">{r.value}</span>
                  <span className="text-xs text-[var(--color-blue-600)]">Edit</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}
