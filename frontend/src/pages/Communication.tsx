import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Tabs, FilterBar, Select, SearchInput } from "../components/ui/FilterBar";
import { DataTable, type Column } from "../components/ui/DataTable";
import { StatusBadge, priorityTone, statusToTone } from "../components/ui/Badge";
import { communicationsForOwner } from "../mock/generator";
import { ALEX_ID } from "../services";
import type { Communication } from "../types";
import { formatDate, formatMinutes } from "../lib/format";

const STATUS_LABEL: Record<string, string> = {
  needs_response: "Needs response",
  waiting: "Waiting",
  completed: "Completed",
  overdue: "Overdue",
};

export function CommunicationPage() {
  const navigate = useNavigate();
  const all = communicationsForOwner(ALEX_ID);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("all");

  const tabbed = useMemo(() => {
    switch (tab) {
      case "needs_response":
        return all.filter((c) => c.status === "needs_response");
      case "waiting":
        return all.filter((c) => c.status === "waiting");
      case "completed":
        return all.filter((c) => c.status === "completed");
      case "overdue":
        return all.filter((c) => c.status === "overdue");
      case "commitments":
        return all.filter((c) => c.aiFinding?.commitmentDetected);
      default:
        return all;
    }
  }, [tab, all]);

  const filtered = tabbed.filter((c) => {
    const matchesSearch =
      !search ||
      c.contact.toLowerCase().includes(search.toLowerCase()) ||
      c.subject.toLowerCase().includes(search.toLowerCase()) ||
      c.organization.toLowerCase().includes(search.toLowerCase());
    const matchesPriority = priority === "all" || c.priority === priority;
    return matchesSearch && matchesPriority;
  });

  const columns: Column<Communication>[] = [
    { key: "contact", header: "Contact", render: (r) => r.contact, sortValue: (r) => r.contact },
    { key: "org", header: "Organization", render: (r) => r.organization, sortValue: (r) => r.organization },
    { key: "subject", header: "Subject", render: (r) => <span className="line-clamp-1 max-w-xs">{r.subject}</span> },
    { key: "received", header: "Received", render: (r) => formatDate(r.receivedAt), sortValue: (r) => r.receivedAt },
    {
      key: "status",
      header: "Response Status",
      render: (r) => <StatusBadge label={STATUS_LABEL[r.status]} tone={statusToTone(r.status)} />,
      sortValue: (r) => r.status,
    },
    { key: "responseTime", header: "Response Time", render: (r) => formatMinutes(r.responseTimeMinutes) },
    {
      key: "priority",
      header: "Priority",
      render: (r) => <StatusBadge label={r.priority} tone={priorityTone(r.priority)} />,
      sortValue: (r) => r.priority,
    },
    { key: "owner", header: "Owner", render: () => "Alex Johnson" },
    { key: "next", header: "Next Step", render: (r) => <span className="line-clamp-1 max-w-[10rem]">{r.nextStep}</span> },
  ];

  return (
    <AppShell pageTitle="My Communication">
      <Tabs
        tabs={[
          { key: "all", label: "All", count: all.length },
          { key: "needs_response", label: "Needs Response", count: all.filter((c) => c.status === "needs_response").length },
          { key: "waiting", label: "Waiting", count: all.filter((c) => c.status === "waiting").length },
          { key: "completed", label: "Completed", count: all.filter((c) => c.status === "completed").length },
          { key: "overdue", label: "Overdue", count: all.filter((c) => c.status === "overdue").length },
          { key: "commitments", label: "Commitments", count: all.filter((c) => c.aiFinding?.commitmentDetected).length },
        ]}
        active={tab}
        onChange={setTab}
      />
      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search contact, subject, organization" />
        <Select
          label="Priority"
          value={priority}
          onChange={setPriority}
          options={[
            { value: "all", label: "All" },
            { value: "critical", label: "Critical" },
            { value: "high", label: "High" },
            { value: "normal", label: "Normal" },
            { value: "low", label: "Low" },
          ]}
        />
      </FilterBar>
      <DataTable columns={columns} rows={filtered} onRowClick={(r) => navigate(`/communication/${r.id}`)} />
    </AppShell>
  );
}
