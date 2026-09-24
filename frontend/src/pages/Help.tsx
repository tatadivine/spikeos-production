import { AppShell } from "../components/layout/AppShell";
import { Card, SectionHeader } from "../components/ui/Card";

const SECTIONS = [
  { q: "How communication scoring works", a: "SpikeOS combines response timeliness, SLA compliance, and follow-through into a single response score, weighted by communication priority." },
  { q: "How response time is calculated", a: "Response time is measured from when a message is received to when a substantive reply is sent, excluding time covered by approved exclusions." },
  { q: "How exclusions work", a: "Automated messages, newsletters, FYI notes, approved PTO, and delegated coverage are excluded from scoring so metrics reflect a fair picture of communication effort." },
  { q: "How AI-assisted indicators work", a: "AI analyzes communication patterns to surface findings such as commitment detection or quality scoring. These are indicators, not verdicts, and are always labeled AI-assisted." },
  { q: "How employees can challenge findings", a: "Any finding can be opened to view its supporting evidence. Employees can submit context — PTO, delegation, a system issue, or another explanation — for manager review." },
  { q: "How managers review findings", a: "Managers see AI findings awaiting review in the Review Center and can confirm, dismiss, request more context, or mark a finding incorrect. Nothing is finalized automatically." },
  { q: "Privacy and security", a: "Access follows the organizational hierarchy: employees see their own data, managers see direct reports, leadership sees their authorized scope, and administrators manage configuration and audit records." },
];

export function Help() {
  return (
    <AppShell pageTitle="Help & Documentation">
      <div className="space-y-4">
        {SECTIONS.map((s) => (
          <Card key={s.q}>
            <SectionHeader title={s.q} />
            <p className="text-sm text-[var(--color-ink-700)]">{s.a}</p>
          </Card>
        ))}
        <Card>
          <SectionHeader title="FAQ" />
          <p className="text-sm text-[var(--color-ink-700)]">
            For questions not covered here, contact your SpikeOS administrator or use "Start Product Tour" from any page for a guided walkthrough.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
