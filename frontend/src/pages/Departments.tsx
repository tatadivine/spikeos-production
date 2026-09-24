import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { DataTable, type Column } from "../components/ui/DataTable";
import { departmentAggregate } from "../mock/generator";
import { DEPARTMENTS } from "../mock/pools";

interface Row { department: string; headcount: number; responseScore: number; slaCompliance: number; overdue: number; openCommitments: number; positiveCommunication: number; }

export function Departments() {
  const navigate = useNavigate();
  const rows: Row[] = DEPARTMENTS.map((d) => departmentAggregate(d));

  const columns: Column<Row>[] = [
    { key: "dept", header: "Department", render: (r) => r.department, sortValue: (r) => r.department },
    { key: "headcount", header: "Employees", render: (r) => r.headcount, sortValue: (r) => r.headcount },
    { key: "score", header: "Response Score", render: (r) => r.responseScore, sortValue: (r) => r.responseScore },
    { key: "sla", header: "SLA Compliance", render: (r) => `${r.slaCompliance}%`, sortValue: (r) => r.slaCompliance },
    { key: "overdue", header: "Overdue", render: (r) => r.overdue, sortValue: (r) => r.overdue },
    { key: "commit", header: "Open Commitments", render: (r) => r.openCommitments, sortValue: (r) => r.openCommitments },
    { key: "positive", header: "Positive Communication", render: (r) => `${r.positiveCommunication}%`, sortValue: (r) => r.positiveCommunication },
  ];

  return (
    <AppShell pageTitle="Department Performance">
      <DataTable
        columns={columns}
        rows={rows}
        onRowClick={(r) => navigate(`/organization/departments?dept=${encodeURIComponent(r.department)}`)}
      />
    </AppShell>
  );
}
