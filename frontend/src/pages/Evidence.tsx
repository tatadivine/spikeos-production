import { useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { Tabs } from "../components/ui/FilterBar";
import { EvidenceCard } from "../components/performance/EvidenceCard";
import { evidenceEntries } from "../mock/generator";

export function Evidence() {
  const [tab, setTab] = useState("all");
  const filtered = tab === "all" ? evidenceEntries : evidenceEntries.filter((e) => e.result === tab);

  return (
    <AppShell pageTitle="Evidence Center">
      <div className="mb-6 rounded-lg border border-[var(--color-blue-100)] bg-[var(--color-blue-50)] p-4 text-sm text-[var(--color-blue-600)]">
        Every metric, alert, score, or finding in SpikeOS is traceable to a supporting
        communication record. This page demonstrates that traceability directly.
      </div>
      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { key: "all", label: "All", count: evidenceEntries.length },
          { key: "confirmed", label: "Confirmed", count: evidenceEntries.filter((e) => e.result === "confirmed").length },
          { key: "excluded", label: "Excluded", count: evidenceEntries.filter((e) => e.result === "excluded").length },
          { key: "under_review", label: "Under Review", count: evidenceEntries.filter((e) => e.result === "under_review").length },
        ]}
      />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {filtered.map((e) => (
          <EvidenceCard key={e.id} evidence={e} />
        ))}
      </div>
    </AppShell>
  );
}
