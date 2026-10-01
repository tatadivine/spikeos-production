import { useEffect, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { Tabs } from "../components/ui/FilterBar";
import { EvidenceCard } from "../components/performance/EvidenceCard";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { api } from "../lib/api";
import { useSession } from "../lib/SessionContext";
import type { Evidence as EvidenceRecord } from "../types";

export function Evidence() {
  const { employeeId } = useSession();
  const [tab, setTab] = useState("all");
  const [entries, setEntries] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api<EvidenceRecord[]>("/evidence");
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load evidence.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = tab === "all" ? entries : entries.filter((e) => e.result === tab);
  const multipleEmployees = new Set(entries.map((e) => e.employeeId)).size > 1;

  return (
    <AppShell pageTitle="Evidence Center">
      <div className="mb-6 rounded-lg border border-[var(--color-blue-100)] bg-[var(--color-blue-50)] p-4 text-sm text-[var(--color-blue-600)]">
        Every metric, alert, score, or finding in SpikeOS is traceable to a supporting
        communication record. Each item below is derived from a tracked Microsoft 365 communication.
      </div>
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : (
        <>
          <Tabs
            active={tab}
            onChange={setTab}
            tabs={[
              { key: "all", label: "All", count: entries.length },
              { key: "confirmed", label: "Confirmed", count: entries.filter((e) => e.result === "confirmed").length },
              { key: "excluded", label: "Excluded", count: entries.filter((e) => e.result === "excluded").length },
              { key: "under_review", label: "Under Review", count: entries.filter((e) => e.result === "under_review").length },
            ]}
          />
          {filtered.length === 0 ? (
            <EmptyState
              title="No evidence in this category"
              description={entries.length === 0 ? "Evidence appears once communications are tracked from Outlook." : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {filtered.map((e) => (
                <EvidenceCard
                  key={e.id}
                  evidence={e}
                  showEmployee={multipleEmployees && e.employeeId !== employeeId}
                />
              ))}
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}
