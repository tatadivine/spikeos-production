import { api } from "./api";
import {
  employees, communications, commitments, followUps, alerts, customers, insights, reviews, evidenceEntries, auditLog,
  orgAggregate,
} from "../mock/generator";
import { setLiveIds } from "../services";
import type { Department } from "../types";

export type BootstrapPayload = {
  user: { id: string; displayName: string; email: string; title: string; role: string; managerId: string | null };
  employees: typeof employees;
  communications: typeof communications;
  commitments: typeof commitments;
  followUps: typeof followUps;
  alerts: typeof alerts;
  customers: typeof customers;
  insights: typeof insights;
  reviews: typeof reviews;
  evidence: typeof evidenceEntries;
  audit: typeof auditLog;
};

export async function loadLiveBootstrap(): Promise<BootstrapPayload> {
  const data = await api<BootstrapPayload>("/bootstrap");
  employees.splice(0, employees.length, ...(data.employees || []));
  communications.splice(0, communications.length, ...(data.communications || []));
  commitments.splice(0, commitments.length, ...(data.commitments || []));
  followUps.splice(0, followUps.length, ...(data.followUps || []));
  alerts.splice(0, alerts.length, ...(data.alerts || []));
  customers.splice(0, customers.length, ...(data.customers || []));
  insights.splice(0, insights.length, ...(data.insights || []));
  reviews.splice(0, reviews.length, ...(data.reviews || []));
  evidenceEntries.splice(0, evidenceEntries.length, ...(data.evidence || []));
  auditLog.splice(0, auditLog.length, ...(data.audit || []));

  setLiveIds(data.user.id, data.user.managerId);
  if (employees.some((e) => e.id === data.user.id)) {
    // no-op: generator helper functions read the live employee array.
  }

  const scores = employees.map((e) => e.responseScore).filter((x) => Number.isFinite(x));
  const medians = employees.map((e) => e.medianResponseMinutes).filter((x) => Number.isFinite(x));
  orgAggregate.headcount = employees.length;
  orgAggregate.responseScore = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : 0;
  orgAggregate.medianResponse = medians.length ? Math.round(medians.reduce((a,b)=>a+b,0)/medians.length) : 0;
  orgAggregate.slaCompliance = employees.length ? Math.round(employees.reduce((a,e)=>a+e.slaCompliancePct,0)/employees.length) : 0;
  orgAggregate.overdue = employees.reduce((a,e)=>a+e.overdueFollowUps,0);
  orgAggregate.openCommitments = employees.reduce((a,e)=>a+e.openCommitments,0);
  orgAggregate.positiveCommunication = employees.length ? Math.round(employees.reduce((a,e)=>a+e.positiveCommunicationPct,0)/employees.length) : 0;

  return data;
}
