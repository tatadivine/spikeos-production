import { AppShell } from "../../components/layout/AppShell";
import { SettingsTabs } from "../../components/settings/SettingsTabs";
import { DataTable, type Column } from "../../components/ui/DataTable";
import { StatusBadge } from "../../components/ui/Badge";
import { auditLog } from "../../mock/generator";
import { formatDateTime } from "../../lib/format";
import type { AuditEntry } from "../../types";

export function SettingsAudit() {
  const columns: Column<AuditEntry>[] = [
    { key: "time", header: "Timestamp", render: (r) => formatDateTime(r.timestamp), sortValue: (r) => r.timestamp },
    { key: "user", header: "User", render: (r) => r.user, sortValue: (r) => r.user },
    { key: "action", header: "Action", render: (r) => r.action },
    { key: "resource", header: "Resource", render: (r) => r.resource },
    { key: "result", header: "Result", render: (r) => <StatusBadge label={r.result} tone={r.result === "success" ? "success" : "danger"} /> },
    { key: "ip", header: "IP", render: (r) => r.ip },
  ];

  return (
    <AppShell pageTitle="Audit Log">
      <SettingsTabs />
      <DataTable columns={columns} rows={auditLog} />
    </AppShell>
  );
}
