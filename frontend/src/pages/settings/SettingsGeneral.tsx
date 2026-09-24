import { AppShell } from "../../components/layout/AppShell";
import { SettingsTabs } from "../../components/settings/SettingsTabs";
import { Card, SectionHeader } from "../../components/ui/Card";
import { useSession } from "../../lib/SessionContext";

export function SettingsGeneral() {
  const { pushToast } = useSession();
  return (
    <AppShell pageTitle="Settings">
      <SettingsTabs />
      <Card className="mb-5">
        <SectionHeader title="Organization" subtitle="Basic details about this SpikeOS environment" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Organization name" value="Spike Electric" />
          <Field label="Environment" value="Production Integration" />
          <Field label="Time zone" value="Tenant configured" />
          <Field label="Fiscal year start" value="January" />
        </div>
      </Card>
      <Card className="mb-5">
        <SectionHeader title="Notifications" subtitle="How SpikeOS notifies employees and managers" />
        <div className="space-y-3">
          <Toggle label="Email digests" defaultOn onToggle={() => pushToast("Preference updated.", "success")} />
          <Toggle label="Outlook Coach alerts" defaultOn onToggle={() => pushToast("Preference updated.", "success")} />
          <Toggle label="Weekly manager summary" defaultOn onToggle={() => pushToast("Preference updated.", "success")} />
        </div>
      </Card>
    </AppShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-[var(--color-ink-500)]">{label}</label>
      <input defaultValue={value} className="w-full rounded-md border border-[var(--color-line)] px-3 py-2 text-sm" />
    </div>
  );
}

function Toggle({ label, defaultOn, onToggle }: { label: string; defaultOn?: boolean; onToggle: () => void }) {
  return (
    <label className="flex items-center justify-between rounded-md border border-[var(--color-line)] px-3 py-2.5">
      <span className="text-sm text-[var(--color-ink-900)]">{label}</span>
      <input type="checkbox" defaultChecked={defaultOn} onChange={onToggle} className="h-4 w-4 accent-[var(--color-blue-600)]" />
    </label>
  );
}
