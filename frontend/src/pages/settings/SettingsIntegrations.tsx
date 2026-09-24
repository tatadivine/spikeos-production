import { AppShell } from "../../components/layout/AppShell";
import { SettingsTabs } from "../../components/settings/SettingsTabs";
import { Card } from "../../components/ui/Card";
import { StatusBadge } from "../../components/ui/Badge";

const INTEGRATIONS = [
  { name: "Microsoft 365", status: "Connected", tone: "success" as const, desc: "Source of communication and calendar records." },
  { name: "Microsoft Graph", status: "Ready for configuration", tone: "info" as const, desc: "Secure, permissioned access to Microsoft 365 data." },
  { name: "Outlook", status: "Ready", tone: "info" as const, desc: "Hosts the SpikeOS Communication Coach add-in." },
  { name: "Power BI", status: "Ready", tone: "info" as const, desc: "Powers embedded analytics inside SpikeOS." },
  { name: "Microsoft Entra ID", status: "Authentication provider", tone: "neutral" as const, desc: "Will provide production sign-in and identity." },
  { name: "Microsoft Purview", status: "Future integration", tone: "neutral" as const, desc: "Planned for compliance and data governance." },
];

export function SettingsIntegrations() {
  return (
    <AppShell pageTitle="Integrations">
      <SettingsTabs />
      <div className="mb-5 rounded-lg border border-[var(--color-blue-100)] bg-[var(--color-blue-50)] p-4 text-sm text-[var(--color-blue-600)]">
        DEMO MODE — no real connections are active. This page previews the intended Microsoft-first integration architecture.
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {INTEGRATIONS.map((i) => (
          <Card key={i.name}>
            <div className="flex items-start justify-between">
              <p className="text-sm font-semibold text-[var(--color-ink-900)]">{i.name}</p>
              <StatusBadge label={i.status} tone={i.tone} />
            </div>
            <p className="mt-2 text-xs text-[var(--color-ink-500)]">{i.desc}</p>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
