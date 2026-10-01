import { useEffect, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { SectionHeader } from "../components/ui/Card";
import { AIInsightCard } from "../components/performance/AIInsightCard";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";
import { api } from "../lib/api";
import { useSession } from "../lib/SessionContext";
import { employeeService } from "../services";
import type { AIInsight } from "../types";

const SECTIONS: { key: string; title: string; subtitle: string }[] = [
  { key: "strength", title: "Communication Strengths", subtitle: "What's working well" },
  { key: "improve", title: "Areas to Improve", subtitle: "Opportunities worth a look" },
  { key: "follow_through", title: "Follow-through Opportunities", subtitle: "Conversations that may need another touch" },
  { key: "response", title: "Response Opportunities", subtitle: "Patterns in how you respond" },
  { key: "positive", title: "Positive Communication", subtitle: "Recognized by customers and peers" },
];

export function Coaching() {
  const { employeeId } = useSession();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>(employeeId ?? "");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api<AIInsight[]>("/coaching");
      setInsights(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load coaching.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!selected && employeeId) setSelected(employeeId);
  }, [employeeId, selected]);

  const people = Array.from(new Set(insights.map((i) => i.employeeId)));
  const mine = insights.filter((i) => i.employeeId === selected);
  const nameOf = (id: string) => employeeService.get(id)?.name ?? "Unknown employee";

  return (
    <AppShell pageTitle="AI Coaching">
      <div className="mb-6 rounded-lg border border-[var(--color-blue-100)] bg-[var(--color-blue-50)] p-4 text-sm text-[var(--color-blue-600)]">
        This is a coaching assistant, not a performance verdict. Each insight is calculated from
        tracked communications, uses the same figures as your dashboard, and can be given context
        or dismissed.
      </div>

      {people.length > 1 && (
        <label className="mb-5 flex flex-wrap items-center gap-2 text-sm text-[var(--color-ink-700)]">
          Showing coaching for
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="rounded-md border border-[var(--color-line)] bg-white px-2.5 py-1.5 text-sm"
          >
            {[...people]
              .sort((a, b) => (a === employeeId ? -1 : b === employeeId ? 1 : nameOf(a).localeCompare(nameOf(b))))
              .map((id) => (
                <option key={id} value={id}>
                  {id === employeeId ? `${nameOf(id)} (you)` : nameOf(id)}
                </option>
              ))}
          </select>
        </label>
      )}

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : mine.length === 0 ? (
        <EmptyState
          title="No coaching signals yet"
          description="Coaching appears once there are tracked communications with a response outcome, or overdue items."
        />
      ) : (
        SECTIONS.map((s) => {
          const items = mine.filter((i) => i.kind === s.key);
          if (items.length === 0) return null;
          return (
            <div key={s.key} className="mb-6">
              <SectionHeader title={s.title} subtitle={s.subtitle} />
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {items.map((i) => (
                  <AIInsightCard key={`${i.id}-${i.signature ?? ""}`} insight={i} />
                ))}
              </div>
            </div>
          );
        })
      )}
    </AppShell>
  );
}
