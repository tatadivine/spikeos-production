import type { Evidence } from "../../types";
import { StatusBadge, statusToTone } from "../ui/Badge";
import { Card } from "../ui/Card";

const resultLabel: Record<Evidence["result"], string> = {
  confirmed: "Confirmed",
  excluded: "Excluded",
  under_review: "Under review",
};

export function EvidenceCard({ evidence }: { evidence: Evidence }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--color-ink-900)]">{evidence.finding}</p>
          <p className="mt-0.5 text-xs text-[var(--color-ink-500)]">{evidence.source}</p>
        </div>
        <StatusBadge
          label={resultLabel[evidence.result]}
          tone={evidence.result === "excluded" ? "info" : statusToTone(evidence.result)}
        />
      </div>
      <dl className="mt-3 space-y-2 text-xs">
        <div>
          <dt className="text-[var(--color-ink-400)]">Applicable rule</dt>
          <dd className="text-[var(--color-ink-700)]">{evidence.rule}</dd>
        </div>
        <div>
          <dt className="text-[var(--color-ink-400)]">Evidence</dt>
          <dd className="text-[var(--color-ink-700)]">{evidence.evidenceText}</dd>
        </div>
        {evidence.context && (
          <div>
            <dt className="text-[var(--color-ink-400)]">Context</dt>
            <dd className="text-[var(--color-ink-700)]">{evidence.context}</dd>
          </div>
        )}
      </dl>
    </Card>
  );
}
