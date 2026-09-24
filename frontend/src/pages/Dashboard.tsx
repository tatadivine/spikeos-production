import { useState } from "react";
import { Send, Clock3, CalendarCheck2, MessageCircleHeart, AlertTriangle, Users, Building2, Crown, ClipboardList, ArrowLeft } from "lucide-react";
import { AppShell } from "../components/layout/AppShell";
import { MetricStatCard } from "../components/dashboard/MetricStatCard";
import { ResponseTrendCard, type TrendWeek } from "../components/dashboard/ResponseTrendCard";
import { PerformanceReviewCard, type ReviewPoint } from "../components/dashboard/PerformanceReviewCard";
import { ResponseCommitmentsTable, type CommitmentRow, type ExcludedMessage } from "../components/dashboard/ResponseCommitmentsTable";
import { CommunicationQualityCard } from "../components/dashboard/CommunicationQualityCard";
import { EvidenceCoachingCard, type EvidenceItem } from "../components/dashboard/EvidenceCoachingCard";
import { AlertsCard, type AlertRow } from "../components/dashboard/AlertsCard";
import { ManagerRosterCard } from "../components/dashboard/ManagerRosterCard";
import { useSession } from "../lib/SessionContext";
import { ALEX_ID, HERO_MANAGER_ID } from "../services";
import { getEmployee, directReports, orgAggregate, employees } from "../mock/generator";
import type { Employee } from "../types";

export function Dashboard() {
  const { employeeId, role, displayName, viewMode } = useSession();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const isManagerView = viewMode === "manager";

  // ---- Manager View: roster-first, before any person is selected ----
  if (isManagerView && !selectedId) {
    const roster =
      role === "administrator"
        ? sampleAcrossDepartments()
        : employeeId
        ? directReports(employeeId)
        : [];

    return (
      <AppShell pageTitle="Communication Effectiveness">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">Team overview for {displayName.split(" ")[0]}</h2>
          <p className="mt-0.5 text-sm text-[var(--color-ink-500)]">
            {role === "administrator"
              ? "Administrators can open any employee's dashboard."
              : "Select a direct report to open their dashboard — the same view they see for themselves."}
          </p>
        </div>
        <ManagerRosterCard
          employees={roster}
          onSelect={setSelectedId}
          subtitle={
            role === "administrator"
              ? `Sample across departments · ${employees.length} employees total — see Team or Organization for the full list.`
              : `${roster.length} direct report${roster.length === 1 ? "" : "s"}`
          }
          emptyLabel={
            role === "team_lead"
              ? "No direct reports are assigned to this Team Lead yet. An administrator can configure this in Settings → Permissions."
              : undefined
          }
        />
      </AppShell>
    );
  }

  // ---- Whose dashboard is being rendered ----
  const viewingEmployeeId = isManagerView ? selectedId : employeeId;
  const viewingEmployee = viewingEmployeeId ? getEmployee(viewingEmployeeId) : undefined;
  const isSelf = !isManagerView;

  const data = buildPersonView(viewingEmployee);

  return (
    <AppShell pageTitle="Communication Effectiveness">
      {isManagerView && viewingEmployee && (
        <>
          <button
            onClick={() => setSelectedId(null)}
            className="mb-3 flex items-center gap-1.5 text-xs font-medium text-[var(--color-blue-600)]"
          >
            <ArrowLeft size={13} /> Back to team roster
          </button>
          <div className="mb-4 rounded-md bg-[var(--color-blue-50)] px-3 py-2 text-xs text-[var(--color-blue-600)]">
            Viewing <strong>{viewingEmployee.name}</strong> — visible to you as their manager only.
          </div>
        </>
      )}

      <div className="mb-5">
        <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">
          {isSelf ? `Good morning, ${displayName.split(" ")[0]}.` : `${viewingEmployee?.name}'s Communication Effectiveness`}
        </h2>
        <p className="mt-0.5 text-sm text-[var(--color-ink-500)]">
          {isSelf ? "Your communication effectiveness overview" : `${viewingEmployee?.title} · ${viewingEmployee?.department}`}
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MetricStatCard icon={Send} tone="blue" label="Response Score" value={data.metrics.responseScore} suffix="/ 100" trend="flat" trendLabel="Live" progressPct={data.metrics.responseScore} source="Microsoft 365 communication records" />
        <MetricStatCard icon={Clock3} tone="purple" label="Median Response" value={data.metrics.medianHrs} suffix="hrs" trend="flat" trendLabel="Live" progressPct={Math.max(0, 100 - data.metrics.medianHrs * 10)} source="Outlook response timestamps" />
        <MetricStatCard icon={CalendarCheck2} tone="green" label="Answered Within 24h" value={data.metrics.answered24h} suffix="%" trend="flat" trendLabel="Live" progressPct={data.metrics.answered24h} source="Response SLA rule engine" />
        <MetricStatCard icon={MessageCircleHeart} tone="teal" label="Positive Communication" value={data.metrics.positiveComm} suffix="%" trend="flat" trendLabel="Live" progressPct={data.metrics.positiveComm} source="Communication quality model (AI-assisted)" />
        <MetricStatCard icon={AlertTriangle} tone="red" label="Overdue Follow-ups" value={data.overdueOpen} trend="flat" trendLabel="Live" progressPct={Math.min(100, data.overdueOpen * 8)} source="Follow-up tracking engine" />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_380px]">
        <ResponseTrendCard data={data.trendData} />
        <PerformanceReviewCard {...data.reviewSummary} />
      </div>

      <div className="mb-5">
        <AlertsCard alerts={data.alerts} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ResponseCommitmentsTable rows={data.commitmentRows} excluded={data.excluded} />
        <CommunicationQualityCard meters={data.qualityMeters} />
        <EvidenceCoachingCard items={data.evidenceItems} />
      </div>

      <div className="mt-5 flex flex-col gap-2 rounded-lg border border-[var(--color-line)] bg-white px-4 py-3 text-[11px] text-[var(--color-ink-500)] sm:flex-row sm:items-center sm:justify-between">
        <p>Visible to employee and authorized management. Review decisions require human validation.</p>
        <div className="flex flex-wrap items-center gap-3">
          <Legend color="var(--color-green-600)" label="Measured fact" />
          <Legend color="var(--color-purple-600)" label="AI-assisted indicator" />
          <Legend color="var(--color-amber-600)" label="Needs attention" />
          <Legend color="var(--color-red-600)" label="Overdue risk" />
        </div>
      </div>
    </AppShell>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function sampleAcrossDepartments(): Employee[] {
  const seen = new Set<string>();
  const out: Employee[] = [];
  for (const e of employees) {
    if (seen.has(e.department)) continue;
    seen.add(e.department);
    out.push(e);
    if (out.length >= 6) break;
  }
  return out;
}

interface PersonView {
  metrics: { responseScore: number; medianHrs: number; answered24h: number; positiveComm: number };
  overdueOpen: number;
  trendData: TrendWeek[];
  reviewSummary: { overallLabel: string; deltaPoints: number; filledDots: number; strengths: ReviewPoint[]; coaching: ReviewPoint[] };
  commitmentRows: CommitmentRow[];
  qualityMeters: { label: string; sub: string; pct: number; color: string }[];
  evidenceItems: EvidenceItem[];
  alerts: AlertRow[];
  excluded: ExcludedMessage[];
}

function buildPersonView(employee: Employee | undefined): PersonView {
  const isAlex = employee?.id === ALEX_ID;
  const isSarah = employee?.id === HERO_MANAGER_ID;

  const metrics = employee
    ? {
        responseScore: employee.responseScore,
        medianHrs: +(employee.medianResponseMinutes / 60).toFixed(1),
        answered24h: employee.answeredWithin24hPct,
        positiveComm: employee.positiveCommunicationPct,
      }
    : {
        responseScore: orgAggregate.responseScore,
        medianHrs: +(orgAggregate.medianResponse / 60).toFixed(1),
        answered24h: 91,
        positiveComm: orgAggregate.positiveCommunication,
      };

  const overdueOpen = employee?.overdueFollowUps ?? 7;

  const weeks = ["Oct 5–11", "Oct 12–18", "Oct 19–25", "Oct 26–Nov 1"];
  const start = Math.max(60, metrics.responseScore - 14);
  const trendData: TrendWeek[] = weeks.map((label, i) => {
    const t = i / (weeks.length - 1);
    return {
      label,
      employee: Math.round(start + (metrics.responseScore - start) * t),
      team: Math.round(start - 4 + (metrics.responseScore - 5 - (start - 4)) * t),
    };
  });

  const reviewSummary = isAlex
    ? {
        overallLabel: "Strong",
        deltaPoints: 6,
        filledDots: 6,
        strengths: [
          { title: "Clear ownership", desc: "Takes responsibility and follows through." },
          { title: "Respectful tone", desc: "Professional and constructive." },
          { title: "Timely customer replies", desc: "Keeps customers informed." },
        ],
        coaching: [
          { title: `${overdueOpen} overdue follow-ups`, desc: "Require attention." },
          { title: "3 unclear next steps", desc: "Add specific next actions." },
        ],
      }
    : isSarah
    ? {
        overallLabel: "Strong",
        deltaPoints: 4,
        filledDots: 6,
        strengths: [
          { title: "Team SLA adherence", desc: "Direct reports are meeting response commitments consistently." },
          { title: "Escalation handling", desc: "Customer escalations are acknowledged same-day." },
        ],
        coaching: [
          { title: `${overdueOpen} overdue follow-ups`, desc: "Spread across direct reports." },
          { title: "Uneven response times", desc: "Two team members trending above target median." },
        ],
      }
    : {
        overallLabel: "Solid",
        deltaPoints: 3,
        filledDots: 5,
        strengths: [
          { title: "Reliable response times", desc: "Consistently answers within SLA." },
          { title: "Professional tone", desc: "Communications read as clear and respectful." },
        ],
        coaching: [
          { title: `${overdueOpen} overdue follow-ups`, desc: "Require attention." },
          { title: "Follow-up cadence", desc: "A few threads could use a scheduled check-in." },
        ],
      };

  const commitmentRows: CommitmentRow[] = isSarah
    ? [
        { category: "Customers", icon: Users, withinSlaPct: 94, withinSlaNumerator: 186, withinSlaDenominator: 198, overdue: 6, trend: "up" },
        { category: "Internal Team", icon: Building2, withinSlaPct: 89, withinSlaNumerator: 121, withinSlaDenominator: 136, overdue: 15, trend: "up" },
        { category: "Leadership", icon: Crown, withinSlaPct: 96, withinSlaNumerator: 49, withinSlaDenominator: 51, overdue: 2, trend: "flat" },
        { category: "Direct Reports", icon: ClipboardList, withinSlaPct: 87, withinSlaNumerator: 53, withinSlaDenominator: 61, overdue: 8, trend: "up" },
        { category: "Total", icon: Users, withinSlaPct: 92, withinSlaNumerator: 409, withinSlaDenominator: 446, overdue: 31, trend: "up", bold: true },
      ]
    : [
        { category: "Customers", icon: Users, withinSlaPct: 95, withinSlaNumerator: 58, withinSlaDenominator: 61, overdue: Math.min(2, overdueOpen), trend: "up" },
        { category: "Internal Team", icon: Building2, withinSlaPct: 90, withinSlaNumerator: 27, withinSlaDenominator: 30, overdue: Math.max(0, overdueOpen - 2), trend: "flat" },
        { category: "Leadership", icon: Crown, withinSlaPct: 100, withinSlaNumerator: 9, withinSlaDenominator: 9, overdue: 0, trend: "flat" },
        { category: "Total", icon: Users, withinSlaPct: 92, withinSlaNumerator: 94, withinSlaDenominator: 100, overdue: overdueOpen, trend: "up", bold: true },
      ];

  const qualityMeters = [
    { label: "Clarity", sub: "Easy to understand", pct: 91, color: "#2f6bff" },
    { label: "Respect", sub: "Professional tone", pct: 96, color: "#157a4a" },
    { label: "Ownership", sub: "Takes responsibility", pct: isSarah ? 88 : 84, color: "#e8720c" },
    { label: "Actionable Next Steps", sub: "Includes next steps", pct: isSarah ? 82 : 78, color: "#f6821f" },
  ];

  const evidenceItems: EvidenceItem[] = isAlex
    ? [
        { id: "ev-1", title: "Clear customer update", date: "Oct 30, 2024", quote: "Provided detailed update to customer…", tag: "Customer", positive: true },
        { id: "ev-2", title: "Constructive team feedback", date: "Oct 28, 2024", quote: "Shared helpful context with team…", tag: "Internal", positive: true },
        { id: "ev-3", title: "Took ownership", date: "Oct 24, 2024", quote: "Owns issue and proposed solution…", tag: "Project", positive: true },
        { id: "ev-4", title: "Delayed follow-up", date: "Oct 22, 2024", quote: "Reply sent 4 days after commitment date…", tag: "Customer", positive: false, aiNote: "Flagged by response-time rule, not content review." },
        { id: "ev-5", title: "Unclear next step", date: "Oct 19, 2024", quote: "No specific action or owner stated…", tag: "Internal", positive: false, aiNote: "AI-assisted language read; confidence: medium." },
        { id: "ev-6", title: "Missed acknowledgement", date: "Oct 15, 2024", quote: "Vendor request had no reply logged…", tag: "Vendor", positive: false, aiNote: "Derived from committed-date vs. reply-date fields." },
      ]
    : [
        { id: "ev-1", title: "Prompt customer reply", date: "Oct 29, 2024", quote: "Responded within the hour with next steps…", tag: "Customer", positive: true },
        { id: "ev-2", title: "Helpful internal note", date: "Oct 26, 2024", quote: "Added useful context for the team…", tag: "Internal", positive: true },
        { id: "ev-3", title: "Overdue vendor thread", date: "Oct 21, 2024", quote: `No reply logged for ${Math.max(3, overdueOpen)} business days…`, tag: "Vendor", positive: false, aiNote: "Flagged by response-time rule, not content review." },
      ];

  const alerts: AlertRow[] = isAlex
    ? [
        { id: "a1", severity: "high", title: "Customer reply overdue", subject: "Delivery Schedule Confirmation", from: "operations@precision-mfg.com", preview: "Please confirm the delivery schedule outlined below for PO 77921...", meta: "26 hours", action: "Respond Now" },
        { id: "a2", severity: "high", title: "Vendor waiting for next step", subject: "RFQ Response Update", from: "supply.partner@steelworks.com", preview: "Following up on lead time adjustment for the hydraulic assembly RFQ...", meta: "Due today", action: "Add Commitment" },
        { id: "a3", severity: "low", title: "Internal request unanswered", subject: "Component Specification Review", from: "engineering.team@summit-eng.com", preview: "Can you review the updated spec sheet before Thursday's kickoff?", meta: "18 hours", action: "Review" },
      ]
    : overdueOpen > 0
    ? [
        {
          id: "gen-1",
          severity: overdueOpen > 5 ? "high" : "low",
          title: "Customer reply overdue",
          subject: "Order status follow-up",
          from: "customer.contact@example.com",
          preview: "Checking in on the update you mentioned last week — any news?",
          meta: `${overdueOpen} overdue`,
          action: "Respond Now",
        },
      ]
    : [];

  const excluded: ExcludedMessage[] = [
    { subject: "System Maintenance Notice", from: "it.support@summit-eng.com", reason: "Automated / IT notification" },
    { subject: "Benefits Enrollment Reminder", from: "hr@summit-eng.com", reason: "Distribution list / no response expected" },
    { subject: "Out of Office: PTO Oct 14–18", from: `${(employee?.name ?? "employee").split(" ")[0].toLowerCase()}@summit-eng.com`, reason: "Approved PTO — auto-reply" },
  ];

  return { metrics, overdueOpen, trendData, reviewSummary, commitmentRows, qualityMeters, evidenceItems, alerts, excluded };
}
