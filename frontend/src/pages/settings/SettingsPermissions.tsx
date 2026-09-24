import { AppShell } from "../../components/layout/AppShell";
import { SettingsTabs } from "../../components/settings/SettingsTabs";
import { Card, SectionHeader } from "../../components/ui/Card";
import { useSession } from "../../lib/SessionContext";
import { directReports, getEmployee, employees } from "../../mock/generator";
import { ShieldCheck } from "lucide-react";

export function SettingsPermissions(){
  const { role, employeeId } = useSession();
  const visible = role === "administrator" ? employees : employeeId ? [getEmployee(employeeId), ...directReports(employeeId)].filter(Boolean) : [];
  return <AppShell pageTitle="Permissions & Hierarchy"><SettingsTabs/><Card className="mb-5"><SectionHeader title="Permissions & Hierarchy" subtitle="Access is enforced server-side from Microsoft Entra identity and the SpikeOS reporting hierarchy."/><div className="mb-4 flex items-start gap-2 rounded-md border border-[var(--color-blue-600)]/30 bg-[var(--color-blue-50)] px-3 py-2.5 text-xs text-[var(--color-blue-600)]"><ShieldCheck size={14} className="mt-0.5 shrink-0"/>Client-side controls cannot grant access to another employee. Changes to organizational hierarchy or privileged roles must be made in the approved Entra/administration workflow.</div><div className="divide-y divide-[var(--color-line)]">{visible.map((emp:any)=><div key={emp.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium text-[var(--color-ink-900)]">{emp.name}</p><p className="text-xs text-[var(--color-ink-500)]">{emp.title} · {emp.department}</p></div><span className="rounded-full bg-[var(--color-surface)] px-2.5 py-1 text-[10px] font-medium text-[var(--color-ink-600)]">{emp.managerId===employeeId?"Direct report":"Your account"}</span></div>)}</div></Card><p className="text-[11px] text-[var(--color-ink-400)]">The API remains the authorization boundary. A user cannot elevate themselves by changing browser state.</p></AppShell>
}
