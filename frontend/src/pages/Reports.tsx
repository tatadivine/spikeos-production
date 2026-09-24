import { Card } from "../components/ui/Card";
import { AppShell } from "../components/layout/AppShell";
import { FileText } from "lucide-react";
import { useSession } from "../lib/SessionContext";

const REPORTS = [
  { title: "Weekly Communication Report", desc: "A rolling summary of response performance and outstanding work." },
  { title: "Monthly Executive Report", desc: "Organization-wide performance for leadership review." },
  { title: "Team Performance Report", desc: "Manager-facing summary of team response and quality metrics." },
  { title: "Response SLA Report", desc: "SLA compliance by department and priority tier." },
  { title: "Commitment Report", desc: "Open, completed, and overdue commitments across the organization." },
  { title: "AI Coaching Report", desc: "A summary of AI-assisted coaching insights and their review status." },
];

export function Reports() {
  const { pushToast } = useSession();
  return (
    <AppShell pageTitle="Reports">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((r) => (
          <Card key={r.title}>
            <FileText size={18} className="mb-2 text-[var(--color-blue-600)]" />
            <p className="text-sm font-semibold text-[var(--color-ink-900)]">{r.title}</p>
            <p className="mt-1 text-xs text-[var(--color-ink-500)]">{r.desc}</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => pushToast(`Viewing ${r.title}...`)} className="rounded-md border border-[var(--color-line)] px-2.5 py-1 text-xs text-[var(--color-ink-700)] hover:bg-[var(--color-surface)]">View</button>
              <button onClick={() => pushToast(`${r.title} generated.`, "success")} className="rounded-md border border-[var(--color-line)] px-2.5 py-1 text-xs text-[var(--color-ink-700)] hover:bg-[var(--color-surface)]">Generate</button>
              <button onClick={() => pushToast(`${r.title} exported.`, "success")} className="rounded-md bg-[var(--color-blue-600)] px-2.5 py-1 text-xs text-white hover:bg-[var(--color-blue-500)]">Export</button>
            </div>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
