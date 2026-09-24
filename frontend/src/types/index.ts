// Two real login identities (this is what Microsoft Entra ID will authenticate).
export type AccountType = "employee" | "administrator";

// Access an administrator can grant to a specific employee in Settings > Permissions.
// "standard" = the employee sees only their own dashboard.
export type PrivilegeLevel = "standard" | "team_lead" | "manager";

// Effective permission level used to gate navigation & views throughout the app.
// Derived from AccountType + PrivilegeLevel — never set directly by a login screen.
export type Role = "employee" | "team_lead" | "manager" | "administrator";

export type Department =
  | "Sales"
  | "Operations"
  | "Finance"
  | "Engineering"
  | "Customer Success"
  | "Marketing"
  | "HR";

export interface Employee {
  id: string;
  name: string;
  title: string;
  department: Department;
  managerId: string | null;
  email: string;
  avatarColor: string;
  responseScore: number;
  medianResponseMinutes: number;
  answeredWithin24hPct: number;
  positiveCommunicationPct: number;
  overdueFollowUps: number;
  openCommitments: number;
  slaCompliancePct: number;
}

export type CommClassification = "customer" | "vendor" | "internal";
export type ResponseStatus =
  | "needs_response"
  | "waiting"
  | "completed"
  | "overdue";
export type Priority = "low" | "normal" | "high" | "critical";

export interface Communication {
  id: string;
  contact: string;
  organization: string;
  category: CommClassification;
  subject: string;
  bodyPreview: string;
  receivedAt: string;
  respondedAt: string | null;
  responseTimeMinutes: number | null;
  status: ResponseStatus;
  priority: Priority;
  ownerId: string;
  nextStep: string;
  qualityScore: number;
  aiFinding: AIFinding | null;
  timeline: TimelineEvent[];
  excluded: boolean;
  exclusionReason?: string;
}

export interface TimelineEvent {
  id: string;
  label: string;
  timestamp: string;
  actor: string;
}

export interface AIFinding {
  id: string;
  responseRequired: boolean;
  priority: Priority;
  ownership: string;
  commitmentDetected: boolean;
  dueDate: string | null;
  nextAction: string;
  qualityScore: number;
  confidencePct: number;
  reviewStatus: "pending" | "confirmed" | "dismissed" | "needs_context";
  reasoning: string;
}

export interface Commitment {
  id: string;
  title: string;
  source: string;
  ownerId: string;
  createdAt: string;
  dueDate: string;
  status: "active" | "due_today" | "due_this_week" | "overdue" | "completed";
  daysOverdue: number;
  nextAction: string;
}

export interface FollowUp {
  id: string;
  contact: string;
  subject: string;
  ownerId: string;
  dueDate: string;
  status: "open" | "overdue" | "due_today" | "completed" | "escalated";
  lastActivity: string;
  nextAction: string;
}

export type AlertCategory =
  | "needs_response"
  | "overdue"
  | "commitment"
  | "follow_up"
  | "ai_coaching"
  | "positive_indicator";

export interface AlertItem {
  id: string;
  category: AlertCategory;
  severity: "low" | "medium" | "high";
  time: string;
  source: string;
  reason: string;
  recommendedAction: string;
  ownerId: string;
}

export interface Customer {
  id: string;
  name: string;
  industry: string;
  openCommunications: number;
  avgResponseMinutes: number;
  outstandingCommitments: number;
  followUps: number;
  health: "strong" | "steady" | "at_risk";
}

export interface Review {
  id: string;
  employeeId: string;
  finding: string;
  evidence: string;
  aiConfidencePct: number;
  status: "pending_review" | "confirmed" | "dismissed" | "needs_context";
  reviewer: string | null;
  date: string;
  communicationId: string;
}

export interface Evidence {
  id: string;
  finding: string;
  source: string;
  date: string;
  rule: string;
  evidenceText: string;
  context: string | null;
  result: "confirmed" | "excluded" | "under_review";
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  result: "success" | "denied";
  ip: string;
}

export interface AIInsight {
  id: string;
  employeeId: string;
  kind: "strength" | "improve" | "follow_through" | "response" | "positive";
  headline: string;
  why: string;
  evidence: string;
  confidencePct: number;
  reviewStatus: "unreviewed" | "reviewed";
}
