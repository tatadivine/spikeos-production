import { useParams, useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Card, SectionHeader } from "../components/ui/Card";
import { MetricCard } from "../components/ui/MetricCard";
import { StatusBadge, statusToTone } from "../components/ui/Badge";
import { customers, communications } from "../mock/generator";
import { ErrorState } from "../components/ui/States";
import { formatDate } from "../lib/format";

const healthLabel: Record<string, string> = { strong: "Strong", steady: "Steady", at_risk: "At risk" };

export function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const customer = customers.find((c) => c.id === id);
  const relatedComms = communications.filter((c) => c.organization === customer?.name).slice(0, 6);

  if (!customer) {
    return (
      <AppShell pageTitle="Customer">
        <ErrorState message="Customer not found." onRetry={() => navigate("/customers")} />
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle={customer.name}>
      <button onClick={() => navigate("/customers")} className="mb-4 text-xs font-medium text-[var(--color-blue-600)]">
        ← Back to Customers
      </button>

      <Card className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-ink-900)]">{customer.name}</h2>
            <p className="mt-0.5 text-xs text-[var(--color-ink-500)]">{customer.industry}</p>
          </div>
          <StatusBadge label={healthLabel[customer.health]} tone={statusToTone(customer.health)} />
        </div>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Open Communications" value={customer.openCommunications} />
        <MetricCard label="Avg Response" value={`${Math.round(customer.avgResponseMinutes / 60)}h`} />
        <MetricCard label="Outstanding Commitments" value={customer.outstandingCommitments} />
        <MetricCard label="Follow-ups" value={customer.followUps} />
      </div>

      <SectionHeader title="Recent Interactions" />
      <div className="space-y-2">
        {relatedComms.length === 0 && (
          <p className="text-sm text-[var(--color-ink-500)]">No recent tracked communications for this account.</p>
        )}
        {relatedComms.map((c) => (
          <Card key={c.id} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--color-ink-900)]">{c.subject}</p>
              <p className="text-xs text-[var(--color-ink-500)]">{formatDate(c.receivedAt)} · {c.contact}</p>
            </div>
            <StatusBadge label={c.status.replace("_", " ")} tone={statusToTone(c.status)} />
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
