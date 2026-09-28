import { useParams, useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Card, SectionHeader } from "../components/ui/Card";
import { MetricCard } from "../components/ui/MetricCard";
import {
  TrendChart,
  buildTrend,
} from "../components/ui/TrendChart";
import { AIInsightCard } from "../components/performance/AIInsightCard";
import { EvidenceCard } from "../components/performance/EvidenceCard";
import { AlertCard } from "../components/communication/AlertCard";
import { CommitmentCard } from "../components/communication/CommitmentCard";
import {
  getEmployee,
  insights,
  evidenceEntries,
  communications,
  alertsForOwner,
  commitmentsForOwner,
} from "../mock/generator";
import { ErrorState } from "../components/ui/States";

export function EmployeeDetail() {
  const { employeeId } = useParams();
  const navigate = useNavigate();

  const employee = employeeId
    ? getEmployee(employeeId)
    : undefined;

  if (!employee) {
    return (
      <AppShell pageTitle="Employee">
        <ErrorState
          message="Employee not found."
          onRetry={() => navigate("/team")}
        />
      </AppShell>
    );
  }

  const mine = insights.filter(
    (insight) => insight.employeeId === employee.id
  );

  const myAlerts = alertsForOwner(employee.id).slice(0, 2);

  const myCommitments = commitmentsForOwner(employee.id)
    .filter(
      (commitment) =>
        commitment.status !== "completed"
    )
    .slice(0, 2);

  /*
   * Evidence does not directly contain an employeeId.
   *
   * There are two evidence formats in this application:
   *
   * 1. Generated/mock evidence:
   *    ev-gen-1, ev-gen-2, etc.
   *    These correspond to communications.slice(0, 9).
   *
   * 2. Live backend evidence:
   *    The evidence id is the communication id itself.
   *
   * This logic supports both formats.
   */
  const employeeEvidence = evidenceEntries
    .filter((evidence) => {
      // Live evidence uses the communication ID directly.
      const directCommunication = communications.find(
        (communication) =>
          communication.id === evidence.id
      );

      if (directCommunication) {
        return (
          directCommunication.ownerId === employee.id
        );
      }

      // Generated evidence uses ev-gen-N.
      const generatedMatch = evidence.id.match(
        /^ev-gen-(\d+)$/
      );

      if (generatedMatch) {
        const index =
          Number(generatedMatch[1]) - 1;

        const generatedCommunication =
          communications[index];

        return (
          generatedCommunication?.ownerId ===
          employee.id
        );
      }

      // Evidence without an associated communication
      // cannot be safely attributed to this employee.
      return false;
    })
    .slice(0, 3);

  return (
    <AppShell pageTitle={employee.name}>
      <button
        type="button"
        onClick={() => navigate("/team")}
        className="mb-4 text-xs font-medium text-[var(--color-blue-600)] hover:underline"
      >
        ← Back to Team
      </button>

      <Card className="mb-6 flex items-center gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{
            background: employee.avatarColor,
          }}
        >
          {employee.name
            .split(" ")
            .map((name) => name[0])
            .join("")}
        </span>

        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-[var(--color-ink-900)]">
            {employee.name}
          </h2>

          <p className="text-xs text-[var(--color-ink-500)]">
            {employee.title} · {employee.department}
          </p>
        </div>
      </Card>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Response Score"
          value={employee.responseScore}
          source="Measured — Microsoft 365 records"
        />

        <MetricCard
          label="Median Response"
          value={`${Math.floor(
            employee.medianResponseMinutes / 60
          )}h ${
            employee.medianResponseMinutes % 60
          }m`}
          source="Measured"
        />

        <MetricCard
          label="SLA Compliance"
          value={employee.slaCompliancePct}
          suffix="%"
          source="Measured"
        />

        <MetricCard
          label="Open Commitments"
          value={employee.openCommitments}
          source="Measured"
        />
      </div>

      <Card className="mb-6">
        <SectionHeader
          title="Response Score Trend"
          subtitle="Last 30 days — measured metric"
        />

        <TrendChart
          data={buildTrend(
            employee.name.length,
            30,
            employee.responseScore,
            6
          )}
        />
      </Card>

      <div className="mb-4 flex items-start gap-2 text-xs text-[var(--color-ink-500)]">
        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--color-blue-600)]" />

        <span>
          Measured metrics above are distinct from
          the AI-assisted indicators below, which
          require human review before any negative
          performance action.
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <SectionHeader
            title="Strengths & Coaching Opportunities"
          />

          <div className="space-y-3">
            {mine.length ? (
              mine.map((insight) => (
                <AIInsightCard
                  key={insight.id}
                  insight={insight}
                />
              ))
            ) : (
              <p className="text-sm text-[var(--color-ink-500)]">
                No AI-assisted insights recorded for
                this employee yet.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <SectionHeader title="Open Commitments" />

            <div className="space-y-3">
              {myCommitments.length ? (
                myCommitments.map((commitment) => (
                  <CommitmentCard
                    key={commitment.id}
                    commitment={commitment}
                  />
                ))
              ) : (
                <p className="text-sm text-[var(--color-ink-500)]">
                  No open commitments.
                </p>
              )}
            </div>
          </div>

          <div>
            <SectionHeader title="Recent Alerts" />

            <div className="space-y-3">
              {myAlerts.length ? (
                myAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                  />
                ))
              ) : (
                <p className="text-sm text-[var(--color-ink-500)]">
                  No recent alerts.
                </p>
              )}
            </div>
          </div>

          <div>
            <SectionHeader title="Recent Evidence" />

            <div className="space-y-3">
              {employeeEvidence.length ? (
                employeeEvidence.map((evidence) => (
                  <EvidenceCard
                    key={evidence.id}
                    evidence={evidence}
                  />
                ))
              ) : (
                <p className="text-sm text-[var(--color-ink-500)]">
                  No evidence recorded for this
                  employee yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}