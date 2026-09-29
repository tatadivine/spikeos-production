import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AppShell } from "../components/layout/AppShell";
import { Tabs } from "../components/ui/FilterBar";
import { AlertCard } from "../components/communication/AlertCard";
import { EmptyState, ErrorState } from "../components/ui/States";
import { api } from "../lib/api";
import type { AlertCategory, AlertItem } from "../types";

const CATEGORY_LABEL: Record<AlertCategory, string> = {
  needs_response: "Needs Response",
  overdue: "Overdue",
  commitment: "Commitment",
  follow_up: "Follow-up",
  ai_coaching: "AI Coaching",
  positive_indicator: "Positive Indicator",
};

export function Alerts() {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState("all");

  async function loadAlerts() {
    setLoading(true);
    setError(null);

    try {
      const data = await api<AlertItem[]>("/alerts");
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load alerts.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAlerts();
  }, []);

  const filtered =
    tab === "all"
      ? alerts
      : alerts.filter((alert) => alert.category === tab);

  return (
    <AppShell pageTitle="Alert Center">
      {!loading && !error && (
        <Tabs
          active={tab}
          onChange={setTab}
          tabs={[
            {
              key: "all",
              label: "All",
              count: alerts.length,
            },
            ...Object.entries(CATEGORY_LABEL).map(
              ([key, label]) => ({
                key,
                label,
                count: alerts.filter(
                  (alert) => alert.category === key,
                ).length,
              }),
            ),
          ]}
        />
      )}

      {loading ? (
        <div className="mt-6">
          <div className="rounded-xl border border-[var(--color-line)] bg-white p-6">
            <p className="text-sm text-[var(--color-ink-500)]">
              Loading alerts...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="mt-6">
          <ErrorState
            message={error}
            onRetry={() => void loadAlerts()}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No alerts in this category"
            description="You're all caught up."
          />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onRespond={() => {
                if (alert.communicationId) {
                  navigate(
                    `/communication/${alert.communicationId}`,
                  );
                }
              }}
              onReview={() => {
                void loadAlerts();
              }}
              onDismiss={() => {
                void loadAlerts();
              }}
              onAddCommitment={() => {
                void loadAlerts();
              }}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}