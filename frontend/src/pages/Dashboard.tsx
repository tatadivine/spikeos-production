import {
  Send,
  Clock3,
  CalendarCheck2,
  MessageCircleHeart,
  AlertTriangle,
} from "lucide-react";

import { AppShell } from "../components/layout/AppShell";
import { MetricStatCard } from "../components/dashboard/MetricStatCard";
import {
  ResponseTrendCard,
  type TrendWeek,
} from "../components/dashboard/ResponseTrendCard";
import {
  PerformanceReviewCard,
  type ReviewPoint,
} from "../components/dashboard/PerformanceReviewCard";
import {
  ResponseCommitmentsTable,
  type CommitmentRow,
  type ExcludedMessage,
} from "../components/dashboard/ResponseCommitmentsTable";
import { CommunicationQualityCard } from "../components/dashboard/CommunicationQualityCard";
import {
  EvidenceCoachingCard,
  type EvidenceItem,
} from "../components/dashboard/EvidenceCoachingCard";
import {
  AlertsCard,
  type AlertRow,
} from "../components/dashboard/AlertsCard";

import {
  useSession,
  type DateRange,
} from "../lib/SessionContext";

import {
  communications,
  commitments,
  alerts,
  getEmployee,
} from "../mock/generator";

import type {
  Employee,
  Communication,
} from "../types";

const DEFAULT_SLA_HOURS = 48;

interface PersonMetrics {
  responseScore: number;
  medianResponseMinutes: number;
  answeredWithin24hPct: number;
  positiveCommunicationPct: number;
  overdueFollowUps: number;
  openCommitments: number;
  slaCompliancePct: number;
}

interface PersonView {
  metrics: PersonMetrics;
  trend: TrendWeek[];
  review: ReviewPoint[];
  commitmentRows: CommitmentRow[];
  excluded: ExcludedMessage[];
  qualityMeters: {
  label: string;
  sub: string;
  pct: number;
  color: string;
}[];
  evidence: EvidenceItem[];
  alerts: AlertRow[];
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--color-ink-500)]">
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-[var(--color-blue-600)]" />
        Within SLA
      </span>

      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-[var(--color-orange-500)]" />
        Outside SLA
      </span>
    </div>
  );
}

function median(values: number[]): number {
  if (!values.length) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

function rangeLabel(range: DateRange): string {
  switch (range) {
    case "Last 7 Days":
      return "7 days";

    case "Last Quarter":
      return "quarter";

    case "Year to Date":
      return "year to date";

    case "Last 30 Days":
    default:
      return "30 days";
  }
}

function getRangeStart(range: DateRange, now = new Date()): Date {
  const start = new Date(now);

  switch (range) {
    case "Last 7 Days":
      start.setDate(start.getDate() - 7);
      break;

    case "Last Quarter":
      start.setMonth(start.getMonth() - 3);
      break;

    case "Year to Date":
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      break;

    case "Last 30 Days":
    default:
      start.setDate(start.getDate() - 30);
      break;
  }

  return start;
}

function getRangeEnd(_range: DateRange, now = new Date()): Date {
  return new Date(now);
}

function filterCommunications(
  employeeId: string,
  range: DateRange
): Communication[] {
  const start = getRangeStart(range);
  const end = getRangeEnd(range);

  return communications.filter((communication) => {
    if (communication.ownerId !== employeeId) {
      return false;
    }

    const received = new Date(communication.receivedAt);

    return received >= start && received <= end;
  });
}

function responseHours(
  communication: Communication,
  now = new Date()
): number {
  const received = new Date(communication.receivedAt);

  const end = communication.respondedAt
    ? new Date(communication.respondedAt)
    : now;

  return Math.max(
    0,
    (end.getTime() - received.getTime()) / 3_600_000
  );
}

function slaHours(
  communication: Communication
): number {
  return communication.aiFinding?.priority === "critical"
    ? 24
    : DEFAULT_SLA_HOURS;
}

function isWithinSla(
  communication: Communication
): boolean {
  if (!communication.respondedAt) {
    return false;
  }

  return (
    responseHours(communication) <=
    slaHours(communication)
  );
}

function calculateMetrics(
  employee: Employee,
  records: Communication[]
): PersonMetrics {
  const relevant = records.filter(
    (communication) => !communication.excluded
  );

  const completed = relevant.filter(
    (communication) =>
      Boolean(communication.respondedAt)
  );

  const responseTimes = completed.map(
    (communication) =>
      communication.responseTimeMinutes != null
        ? communication.responseTimeMinutes / 60
        : responseHours(communication)
  );

  const withinSla = completed.filter(
    (communication) =>
      isWithinSla(communication)
  );

  const overdue = relevant.filter(
    (communication) =>
      !communication.respondedAt &&
      responseHours(communication) >
        slaHours(communication)
  );

  const responseScore =
    completed.length > 0
      ? Math.round(
          (withinSla.length /
            completed.length) *
            100
        )
      : 0;

  const answeredWithin24hPct =
    completed.length > 0
      ? Math.round(
          (completed.filter(
            (communication) =>
              responseHours(communication) <=
              24
          ).length /
            completed.length) *
            100
        )
      : 0;

  const positiveCommunicationPct =
    completed.length > 0
      ? Math.round(
          completed.reduce(
            (sum, communication) =>
              sum +
              (communication.qualityScore || 0),
            0
          ) / completed.length
        )
      : 0;

  const openCommitments =
    commitments.filter(
      (commitment) =>
        commitment.ownerId === employee.id &&
        commitment.status !== "completed"
    ).length;

  return {
    responseScore,
    medianResponseMinutes:
      responseTimes.length > 0
        ? Math.round(
            median(responseTimes) * 60
          )
        : 0,
    answeredWithin24hPct,
    positiveCommunicationPct,
    overdueFollowUps: overdue.length,
    openCommitments,
    slaCompliancePct: responseScore,
  };
}

function buildTrendData(
  records: Communication[],
  range: DateRange
): TrendWeek[] {
  const now = new Date();
  const start = getRangeStart(range, now);

  const relevant = records.filter(
    (communication) =>
      !communication.excluded
  );

  const bucketCount =
    range === "Last 7 Days"
      ? 7
      : range === "Last 30 Days"
        ? 5
        : range === "Last Quarter"
          ? 13
          : Math.max(
              1,
              Math.ceil(
                (now.getTime() -
                  start.getTime()) /
                  (30 * 86_400_000)
              )
            );

  const duration =
    now.getTime() - start.getTime();

  return Array.from(
    { length: bucketCount },
    (_, index) => {
      const bucketStart = new Date(
        start.getTime() +
          (duration * index) /
            bucketCount
      );

      const bucketEnd = new Date(
        start.getTime() +
          (duration * (index + 1)) /
            bucketCount
      );

      const bucketRecords =
        relevant.filter(
          (communication) => {
            const received = new Date(
              communication.receivedAt
            );

            return (
              received >= bucketStart &&
              received <= bucketEnd
            );
          }
        );

      const completed =
        bucketRecords.filter(
          (communication) =>
            Boolean(
              communication.respondedAt
            )
        );

      const withinSla =
        completed.filter(
          (communication) =>
            isWithinSla(communication)
        );

      const employeeScore =
        completed.length > 0
          ? Math.round(
              (withinSla.length /
                completed.length) *
                100
            )
          : 0;

      const teamScore =
        bucketRecords.length > 0
          ? Math.round(
              (completed.length /
                bucketRecords.length) *
                100
            )
          : 0;

      let label: string;

      if (range === "Last 7 Days") {
        label =
          bucketStart.toLocaleDateString(
            "en-US",
            { weekday: "short" }
          );
      } else if (
        range === "Year to Date"
      ) {
        label =
          bucketStart.toLocaleDateString(
            "en-US",
            { month: "short" }
          );
      } else {
        label = `Week ${index + 1}`;
      }

      return {
        label,
        employee: employeeScore,
        team: teamScore,
      };
    }
  );
}

function buildReviewSummary(
  metrics: PersonMetrics
): ReviewPoint[] {
  return [
    {
      title: "Response performance",
      desc: `${metrics.responseScore}% of completed responses were within SLA.`,
    },
    {
      title: "24-hour responsiveness",
      desc: `${metrics.answeredWithin24hPct}% of completed responses were answered within 24 hours.`,
    },
    {
      title: "Communication quality",
      desc: `${metrics.positiveCommunicationPct}% positive communication quality based on available records.`,
    },
    {
      title: "Follow-up attention",
      desc: `${metrics.overdueFollowUps} overdue follow-up${metrics.overdueFollowUps === 1 ? "" : "s"} require attention.`,
    },
  ];
}

function buildCommitmentRows(
  employeeId: string,
  records: Communication[]
): CommitmentRow[] {
  const relevant = records.filter(
    (communication) =>
      !communication.excluded
  );

  const completed = relevant.filter(
    (communication) =>
      Boolean(communication.respondedAt)
  );

  const withinSla = completed.filter(
    (communication) =>
      isWithinSla(communication)
  );

  const overdue = relevant.filter(
    (communication) =>
      !communication.respondedAt &&
      responseHours(communication) >
        slaHours(communication)
  );

  const total = relevant.length;

  const completionPct =
    total > 0
      ? Math.round(
          (completed.length / total) * 100
        )
      : 0;

  const commitmentItems =
    commitments.filter(
      (commitment) =>
        commitment.ownerId === employeeId
    );

  const completedCommitments =
    commitmentItems.filter(
      (commitment) =>
        commitment.status === "completed"
    );

  const overdueCommitments =
    commitmentItems.filter(
      (commitment) =>
        commitment.status === "overdue"
    );

  const commitmentCompletionPct =
    commitmentItems.length > 0
      ? Math.round(
          (completedCommitments.length /
            commitmentItems.length) *
            100
        )
      : 0;

  return [
    {
      category: "All Responses",
      icon: Send,
      completionPct,
      completed: completed.length,
      total,
      overdue: overdue.length,
      trend: "flat",
      bold: true,
    },
    {
      category: "Within SLA",
      icon: Clock3,
      completionPct:
        completed.length > 0
          ? Math.round(
              (withinSla.length /
                completed.length) *
                100
            )
          : 0,
      completed: withinSla.length,
      total: completed.length,
      overdue: 0,
      trend: "flat",
    },
    {
      category: "Commitments",
      icon: CalendarCheck2,
      completionPct:
        commitmentCompletionPct,
      completed:
        completedCommitments.length,
      total: commitmentItems.length,
      overdue:
        overdueCommitments.length,
      trend: "flat",
    },
    {
      category: "Follow-ups",
      icon: MessageCircleHeart,
      completionPct:
        overdue.length === 0 ? 100 : 0,
      completed: 0,
      total: overdue.length,
      overdue: overdue.length,
      trend: "flat",
    },
  ];
}


function buildQualityMeters(
  records: Communication[]
) {
  const completed = records.filter(
    (communication) =>
      !communication.excluded &&
      Boolean(communication.respondedAt)
  );

  const quality =
    completed.length > 0
      ? Math.round(
          completed.reduce(
            (sum, communication) =>
              sum +
              (communication.qualityScore || 0),
            0
          ) / completed.length
        )
      : 0;

  const ownership =
    completed.length > 0
      ? Math.round(
          (completed.filter(
            (communication) =>
              Boolean(communication.nextStep)
          ).length /
            completed.length) *
            100
        )
      : 0;

  return [
    {
      label: "Clarity",
      sub: "Easy to understand",
      pct: quality,
      color: "#2F6BFF",
    },
    {
      label: "Respect",
      sub: "Professional tone",
      pct: quality,
      color: "#157A4A",
    },
    {
      label: "Ownership",
      sub: "Takes responsibility",
      pct: ownership,
      color: "#E8720C",
    },
    {
      label: "Actionable Next Steps",
      sub: "Includes next steps",
      pct: ownership,
      color: "#F6821F",
    },
  ];
}

function buildEvidenceItems(
  records: Communication[]
): EvidenceItem[] {
  return records
    .filter(
      (communication) =>
        !communication.excluded
    )
    .slice()
    .sort(
      (a, b) =>
        new Date(b.receivedAt).getTime() -
        new Date(a.receivedAt).getTime()
    )
    .slice(0, 6)
    .map((communication) => {
      const withinSla =
        Boolean(communication.respondedAt) &&
        isWithinSla(communication);

      return {
        id: communication.id,
        title: communication.respondedAt
          ? withinSla
            ? "Timely response"
            : "Delayed response"
          : "Response still outstanding",
        date: new Date(
          communication.receivedAt
        ).toLocaleDateString(),
        quote:
          communication.bodyPreview ||
          communication.subject,
        tag: communication.category,
        positive: withinSla,
        aiNote: communication.respondedAt
          ? `Response time: ${Math.round(
              responseHours(communication)
            )} hours.`
          : `No response recorded after ${Math.round(
              responseHours(communication)
            )} hours.`,
      };
    });
}

function buildAlerts(
  records: Communication[]
): AlertRow[] {
  return records
    .filter(
      (communication) =>
        !communication.excluded &&
        !communication.respondedAt
    )
    .filter(
      (communication) =>
        responseHours(communication) >
        slaHours(communication)
    )
    .sort(
      (a, b) =>
        responseHours(b) -
        responseHours(a)
    )
    .slice(0, 5)
    .map((communication) => {
      const hours = Math.round(
        responseHours(communication)
      );

      return {
        id: communication.id,
        severity:
          communication.priority === "critical" ||
          hours >= 72
            ? "high"
            : communication.priority === "high" ||
                hours >= 48
              ? "medium"
              : "low",
        title: "Response overdue",
        subject: communication.subject,
        from: communication.contact,
        preview:
          communication.bodyPreview ||
          communication.subject,
        meta:
          hours >= 24
            ? `${hours} hours overdue`
            : "Overdue",
        action: "Respond Now",
      };
    });
}

function buildExcluded(
  records: Communication[]
): ExcludedMessage[] {
  return records
    .filter(
      (communication) =>
        communication.excluded
    )
    .map((communication) => ({
      subject: communication.subject,
      from: communication.contact,
      reason:
        communication.exclusionReason ||
        "Excluded from response metrics",
    }));
}

function buildPersonView(
  employee: Employee | undefined,
  range: DateRange
): PersonView {
  if (!employee) {
    return {
      metrics: {
        responseScore: 0,
        medianResponseMinutes: 0,
        answeredWithin24hPct: 0,
        positiveCommunicationPct: 0,
        overdueFollowUps: 0,
        openCommitments: 0,
        slaCompliancePct: 0,
      },
      trend: [],
      review: [],
      commitmentRows: [],
      excluded: [],
      qualityMeters: [],
      evidence: [],
      alerts: [],
    };
  }

  const records = filterCommunications(
    employee.id,
    range
  );

  const metrics = calculateMetrics(
    employee,
    records
  );

  return {
    metrics,

    trend: buildTrendData(
      records,
      range
    ),

    review: buildReviewSummary(
      metrics
    ),

    commitmentRows:
      buildCommitmentRows(
        employee.id,
        records
      ),

    excluded:
      buildExcluded(records),

    qualityMeters:
      buildQualityMeters(records),

    evidence:
      buildEvidenceItems(records),

    alerts:
      buildAlerts(records),
  };
}

export function Dashboard() {
  const {
    employeeId,
    displayName,
    dateRange,
  } = useSession();

  const viewingEmployee =
    employeeId
      ? getEmployee(employeeId)
      : undefined;

  const data = buildPersonView(
    viewingEmployee,
    dateRange
  );

  const firstName =
    displayName?.split(" ")[0] ||
    "there";

  return (
    <AppShell pageTitle="Communication Effectiveness">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">
          Good morning, {firstName}.
        </h2>

        <p className="mt-0.5 text-sm text-[var(--color-ink-500)]">
          Your communication effectiveness
          overview · {rangeLabel(dateRange)}
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MetricStatCard
          icon={Send}
          tone="blue"
          label="Response Score"
          value={data.metrics.responseScore}
          suffix="/ 100"
          trend="flat"
          trendLabel="Live"
          progressPct={
            data.metrics.responseScore
          }
          source="Microsoft 365 communication records"
        />

        <MetricStatCard
          icon={Clock3}
          tone="purple"
          label="Median Response"
          value={(
            data.metrics
              .medianResponseMinutes / 60
          ).toFixed(1)}
          suffix="hrs"
          trend="flat"
          trendLabel="Live"
          progressPct={Math.max(
            0,
            100 -
              data.metrics
                .medianResponseMinutes /
                60 *
                10
          )}
          source="Outlook response timestamps"
        />

        <MetricStatCard
          icon={CalendarCheck2}
          tone="green"
          label="Answered Within 24h"
          value={
            data.metrics
              .answeredWithin24hPct
          }
          suffix="%"
          trend="flat"
          trendLabel="Live"
          progressPct={
            data.metrics
              .answeredWithin24hPct
          }
          source="Response SLA rule engine"
        />

        <MetricStatCard
          icon={MessageCircleHeart}
          tone="teal"
          label="Positive Communication"
          value={
            data.metrics
              .positiveCommunicationPct
          }
          suffix="%"
          trend="flat"
          trendLabel="Live"
          progressPct={
            data.metrics
              .positiveCommunicationPct
          }
          source="Communication quality model"
        />

        <MetricStatCard
          icon={AlertTriangle}
          tone="red"
          label="Overdue Follow-ups"
          value={
            data.metrics
              .overdueFollowUps
          }
          trend="flat"
          trendLabel="Live"
          progressPct={Math.min(
            100,
            data.metrics
              .overdueFollowUps * 10
          )}
          source="Response tracking engine"
        />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_380px]">
        <ResponseTrendCard
          data={data.trend}
          weeksAboveGoal={`${
            data.trend.filter(
              (item) =>
                item.employee >= 90
            ).length
          } of ${data.trend.length} periods`}
        />

        <PerformanceReviewCard
          overallLabel={
            data.metrics.responseScore >= 90
              ? "Strong"
              : data.metrics.responseScore >= 70
                ? "Solid"
                : "Needs Attention"
          }
          deltaPoints={0}
          filledDots={Math.max(
            0,
            Math.min(
              7,
              Math.round(
                data.metrics.responseScore /
                  100 *
                  7
              )
            )
          )}
          strengths={data.review.slice(
            0,
            2
          )}
          coaching={data.review.slice(
            2,
            4
          )}
        />
      </div>

      <div className="mb-5">
        <AlertsCard
          alerts={data.alerts}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ResponseCommitmentsTable
          rows={data.commitmentRows}
          excluded={data.excluded}
        />

        <CommunicationQualityCard
          meters={data.qualityMeters}
        />

        <EvidenceCoachingCard
          items={data.evidence}
        />
      </div>

      <div className="mt-5 flex flex-col gap-2 rounded-lg border border-[var(--color-line)] bg-white px-4 py-3 text-[11px] text-[var(--color-ink-500)] sm:flex-row sm:items-center sm:justify-between">
        <p>
          Visible to employee and authorized
          management. Review decisions require
          human validation.
        </p>

        <Legend />
      </div>
    </AppShell>
  );
}