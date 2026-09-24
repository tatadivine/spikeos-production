import { AppShell } from "../components/layout/AppShell";
import { SectionHeader } from "../components/ui/Card";
import { AIInsightCard } from "../components/performance/AIInsightCard";
import { insights } from "../mock/generator";
import { ALEX_ID } from "../services";

const SECTIONS: { key: string; title: string; subtitle: string }[] = [
  { key: "strength", title: "Communication Strengths", subtitle: "What's working well" },
  { key: "improve", title: "Areas to Improve", subtitle: "Opportunities worth a look" },
  { key: "follow_through", title: "Follow-through Opportunities", subtitle: "Conversations that may need another touch" },
  { key: "response", title: "Response Opportunities", subtitle: "Patterns in how you respond" },
  { key: "positive", title: "Positive Communication", subtitle: "Recognized by customers and peers" },
];

export function Coaching() {
  const mine = insights.filter((i) => i.employeeId === ALEX_ID);

  return (
    <AppShell pageTitle="AI Coaching">
      <div className="mb-6 rounded-lg border border-[var(--color-blue-100)] bg-[var(--color-blue-50)] p-4 text-sm text-[var(--color-blue-600)]">
        This is a coaching assistant, not a performance verdict. Every insight is AI-assisted and
        can be reviewed, given context, or dismissed.
      </div>
      {SECTIONS.map((s) => {
        const items = mine.filter((i) => i.kind === s.key);
        if (items.length === 0) return null;
        return (
          <div key={s.key} className="mb-6">
            <SectionHeader title={s.title} subtitle={s.subtitle} />
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {items.map((i) => (
                <AIInsightCard key={i.id} insight={i} />
              ))}
            </div>
          </div>
        );
      })}
    </AppShell>
  );
}
