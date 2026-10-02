import { useState } from "react";
import { FileText, Download, Eye, Play } from "lucide-react";
import { Card } from "../components/ui/Card";
import { AppShell } from "../components/layout/AppShell";
import { useSession } from "../lib/SessionContext";
import {
  communications,
  commitments,
  followUps,
  employees,
} from "../mock/generator";

const REPORTS = [
  {
    id: "weekly-communication",
    title: "Weekly Communication Report",
    desc: "A rolling summary of response performance and outstanding work.",
  },
  {
    id: "monthly-executive",
    title: "Monthly Executive Report",
    desc: "Organization-wide performance for leadership review.",
  },
  {
    id: "team-performance",
    title: "Team Performance Report",
    desc: "Manager-facing summary of team response and quality metrics.",
  },
  {
    id: "response-sla",
    title: "Response SLA Report",
    desc: "SLA compliance by department and priority tier.",
  },
  {
    id: "commitment",
    title: "Commitment Report",
    desc: "Open, completed, and overdue commitments across the organization.",
  },
  {
    id: "ai-coaching",
    title: "AI Coaching Report",
    desc: "A summary of AI-assisted coaching insights and their review status.",
  },
];

function buildReport(reportId: string, title: string) {
  const completed = communications.filter(
    (c) => c.status === "completed",
  ).length;

  const outstanding = communications.filter(
    (c) => c.status !== "completed",
  ).length;

  const overdue = communications.filter(
    (c) => c.status === "overdue",
  ).length;

  const openCommitments = commitments.filter(
    (c) => c.status !== "completed",
  ).length;

  const completedCommitments = commitments.filter(
    (c) => c.status === "completed",
  ).length;

  const openFollowUps = followUps.filter(
    (f) => f.status !== "completed",
  ).length;

  const lines = [
    "SpikeOS Report",
    "==============================",
    `Report: ${title}`,
    `Generated: ${new Date().toLocaleString()}`,
    "",
    `Employees: ${employees.length}`,
    `Communications: ${communications.length}`,
    `Completed communications: ${completed}`,
    `Outstanding communications: ${outstanding}`,
    `Overdue communications: ${overdue}`,
    "",
    `Open commitments: ${openCommitments}`,
    `Completed commitments: ${completedCommitments}`,
    `Open follow-ups: ${openFollowUps}`,
    "",
  ];

  switch (reportId) {
    case "weekly-communication":
      lines.push(
        "Communication Summary",
        "------------------------------",
        `Total communications: ${communications.length}`,
        `Completed: ${completed}`,
        `Outstanding: ${outstanding}`,
        `Overdue: ${overdue}`,
      );
      break;

    case "monthly-executive":
      lines.push(
        "Executive Summary",
        "------------------------------",
        `Employees: ${employees.length}`,
        `Communications tracked: ${communications.length}`,
        `Open commitments: ${openCommitments}`,
        `Open follow-ups: ${openFollowUps}`,
      );
      break;

    case "team-performance":
      lines.push(
        "Team Performance",
        "------------------------------",
        `Employees tracked: ${employees.length}`,
      );

      employees.forEach((employee) => {
        lines.push(
          `${employee.name}: response score ${employee.responseScore}%, SLA ${employee.slaCompliancePct}%`,
        );
      });
      break;

    case "response-sla":
      lines.push(
        "Response SLA",
        "------------------------------",
      );

      employees.forEach((employee) => {
        lines.push(
          `${employee.name}: ${employee.slaCompliancePct}% SLA compliance`,
        );
      });
      break;

    case "commitment":
      lines.push(
        "Commitment Summary",
        "------------------------------",
        `Open commitments: ${openCommitments}`,
        `Completed commitments: ${completedCommitments}`,
      );
      break;

    case "ai-coaching":
      lines.push(
        "AI Coaching Summary",
        "------------------------------",
        "AI coaching insights are available through the Coaching section of SpikeOS.",
      );
      break;
  }

  return lines.join("\n");
}

export function Reports() {
  const { pushToast } = useSession();
  const [selectedReport, setSelectedReport] = useState<{
    title: string;
    content: string;
  } | null>(null);

  const handleView = (id: string, title: string) => {
    const content = buildReport(id, title);
    setSelectedReport({ title, content });
  };

  const handleGenerate = (id: string, title: string) => {
    const content = buildReport(id, title);
    setSelectedReport({ title, content });
    pushToast(`${title} generated successfully.`, "success");
  };

  const handleExport = (id: string, title: string) => {
    const content = buildReport(id, title);

    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, "-")}.txt`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    pushToast(`${title} exported successfully.`, "success");
  };

  return (
    <AppShell pageTitle="Reports">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((report) => (
          <Card key={report.id}>
            <FileText
              size={18}
              className="mb-2 text-[var(--color-blue-600)]"
            />

            <p className="text-sm font-semibold text-[var(--color-ink-900)]">
              {report.title}
            </p>

            <p className="mt-1 text-xs text-[var(--color-ink-500)]">
              {report.desc}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleView(report.id, report.title)}
                className="inline-flex items-center gap-1 rounded-md border border-[var(--color-line)] px-2.5 py-1 text-xs text-[var(--color-ink-700)] hover:bg-[var(--color-surface)]"
              >
                <Eye size={13} />
                View
              </button>

              <button
                type="button"
                onClick={() => handleGenerate(report.id, report.title)}
                className="inline-flex items-center gap-1 rounded-md border border-[var(--color-line)] px-2.5 py-1 text-xs text-[var(--color-ink-700)] hover:bg-[var(--color-surface)]"
              >
                <Play size={13} />
                Generate
              </button>

              <button
                type="button"
                onClick={() => handleExport(report.id, report.title)}
                className="inline-flex items-center gap-1 rounded-md bg-[var(--color-blue-600)] px-2.5 py-1 text-xs text-white hover:bg-[var(--color-blue-500)]"
              >
                <Download size={13} />
                Export
              </button>
            </div>
          </Card>
        ))}
      </div>

      {selectedReport && (
        <Card className="mt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink-900)]">
                {selectedReport.title}
              </p>
              <p className="mt-1 text-xs text-[var(--color-ink-500)]">
                Report preview
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedReport(null)}
              className="text-xs text-[var(--color-ink-500)] hover:text-[var(--color-ink-900)]"
            >
              Close
            </button>
          </div>

          <pre className="mt-4 max-h-[500px] overflow-auto rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-xs leading-5 text-[var(--color-ink-700)] whitespace-pre-wrap">
            {selectedReport.content}
          </pre>
        </Card>
      )}
    </AppShell>
  );
}

