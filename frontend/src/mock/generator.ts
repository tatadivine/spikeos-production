import { randInt, pick, pickWeighted, chance } from "./seed";
import {
  FIRST_NAMES,
  LAST_NAMES,
  DEPARTMENTS,
  CUSTOMER_COMPANIES,
  VENDOR_COMPANIES,
  EMAIL_SUBJECTS_CUSTOMER,
  EMAIL_SUBJECTS_VENDOR,
  EMAIL_SUBJECTS_INTERNAL,
  CONTACT_NAMES,
} from "./pools";
import type {
  Employee,
  Department,
  Communication,
  Commitment,
  FollowUp,
  AlertItem,
  Customer,
  Review,
  Evidence,
  AuditEntry,
  AIInsight,
  AIFinding,
  TimelineEvent,
  Priority,
} from "../types";

const AVATAR_COLORS = [
  "#2F6BFF", "#7C5CFF", "#0EA5A5", "#B5650A", "#C53434", "#157A4A", "#5B6B8C",
];

function fullName(usedNames: Set<string>): string {
  let name = "";
  let guard = 0;
  do {
    name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    guard++;
  } while (usedNames.has(name) && guard < 50);
  usedNames.add(name);
  return name;
}

function iso(daysAgo: number, hour = 9, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function isoFuture(daysAhead: number, hour = 17): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// EMPLOYEES (~600, across 7 departments, one manager per department)
// ---------------------------------------------------------------------------

const usedNames = new Set<string>();
export const employees: Employee[] = [];

const TITLES_BY_DEPT: Record<Department, string[]> = {
  Sales: ["Account Executive", "Sales Development Rep", "Regional Sales Manager"],
  Operations: ["Operations Coordinator", "Field Service Lead", "Operations Analyst"],
  Finance: ["Financial Analyst", "AP/AR Specialist", "Controller"],
  Engineering: ["Systems Engineer", "Electrical Engineer", "Project Engineer"],
  "Customer Success": ["Customer Success Manager", "Support Specialist", "Onboarding Lead"],
  Marketing: ["Marketing Specialist", "Brand Manager", "Content Strategist"],
  HR: ["HR Business Partner", "Recruiter", "People Operations Analyst"],
};

function makeEmployee(
  id: string,
  name: string,
  title: string,
  department: Department,
  managerId: string | null
): Employee {
  const responseScore = randInt(68, 98);
  return {
    id,
    name,
    title,
    department,
    managerId,
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@spikeelectric.com`,
    avatarColor: pick(AVATAR_COLORS),
    responseScore,
    medianResponseMinutes: randInt(35, 620),
    answeredWithin24hPct: randInt(78, 99),
    positiveCommunicationPct: randInt(70, 97),
    overdueFollowUps: pickWeighted([[0, 5], [1, 3], [2, 2], [3, 1], [4, 1]]),
    openCommitments: randInt(0, 9),
    slaCompliancePct: randInt(80, 99),
  };
}

// Department managers
const departmentManagerIds: Record<Department, string> = {} as Record<Department, string>;
DEPARTMENTS.forEach((dept, i) => {
  const id = `mgr-${dept.toLowerCase().replace(/\s+/g, "-")}`;
  departmentManagerIds[dept] = id;
});

// Seed the named "hero" team used throughout the demo narrative (Operations, under Sarah Williams)
export let HERO_MANAGER_ID = departmentManagerIds["Operations"];
employees.push(
  makeEmployee(HERO_MANAGER_ID, "Sarah Williams", "Operations Manager", "Operations", null)
);
usedNames.add("Sarah Williams");

export let ALEX_ID = "emp-alex-johnson";
usedNames.add("Alex Johnson");
employees.push(
  makeEmployee(ALEX_ID, "Alex Johnson", "Operations Coordinator", "Operations", HERO_MANAGER_ID)
);

const heroReports = [
  { id: "emp-michael-brown", name: "Michael Brown", title: "Field Service Lead" },
  { id: "emp-daniel-carter", name: "Daniel Carter", title: "Operations Analyst" },
  { id: "emp-emily-davis", name: "Emily Davis", title: "Operations Coordinator" },
];
heroReports.forEach((h) => {
  usedNames.add(h.name);
  employees.push(makeEmployee(h.id, h.name, h.title, "Operations", HERO_MANAGER_ID));
});

// Managers for remaining departments
DEPARTMENTS.forEach((dept) => {
  if (dept === "Operations") return;
  const name = fullName(usedNames);
  employees.push(
    makeEmployee(departmentManagerIds[dept], name, `${dept} Manager`, dept, null)
  );
});

// Fill remaining employees to reach ~600 total
const TARGET_TOTAL = 600;
let counter = 1;
while (employees.length < TARGET_TOTAL) {
  const dept = pick([...DEPARTMENTS]);
  const managerId = departmentManagerIds[dept];
  const name = fullName(usedNames);
  const title = pick(TITLES_BY_DEPT[dept]);
  employees.push(makeEmployee(`emp-gen-${counter}`, name, title, dept, managerId));
  counter++;
}

export function getEmployee(id: string): Employee | undefined {
  return employees.find((e) => e.id === id);
}
export function directReports(managerId: string): Employee[] {
  return employees.filter((e) => e.managerId === managerId);
}
export function departmentEmployees(dept: Department): Employee[] {
  return employees.filter((e) => e.department === dept);
}

// ---------------------------------------------------------------------------
// COMMUNICATIONS (generated per-owner)
// ---------------------------------------------------------------------------

function buildTimeline(
  receivedAt: string,
  respondedAt: string | null,
  hasCommitment: boolean
): TimelineEvent[] {
  const events: TimelineEvent[] = [
    { id: "t1", label: "Message received", timestamp: receivedAt, actor: "System" },
  ];
  if (respondedAt) {
    events.push({
      id: "t2",
      label: "Employee acknowledged",
      timestamp: receivedAt,
      actor: "Employee",
    });
    if (hasCommitment) {
      events.push({
        id: "t3",
        label: "Commitment created",
        timestamp: respondedAt,
        actor: "SpikeOS",
      });
      events.push({
        id: "t4",
        label: "Follow-up reminder scheduled",
        timestamp: respondedAt,
        actor: "SpikeOS",
      });
    }
    events.push({
      id: "t5",
      label: "Response sent",
      timestamp: respondedAt,
      actor: "Employee",
    });
    events.push({
      id: "t6",
      label: "Closed",
      timestamp: respondedAt,
      actor: "System",
    });
  }
  return events;
}

let commCounter = 1;
function buildCommunication(ownerId: string, forceOverdueExclusion = false): Communication {
  const category = pickWeighted<Communication["category"]>([
    ["customer", 5],
    ["vendor", 2],
    ["internal", 3],
  ]);
  const org =
    category === "customer"
      ? pick(CUSTOMER_COMPANIES)
      : category === "vendor"
      ? pick(VENDOR_COMPANIES)
      : "Spike Electric — Internal";
  const subject =
    category === "customer"
      ? pick(EMAIL_SUBJECTS_CUSTOMER)
      : category === "vendor"
      ? pick(EMAIL_SUBJECTS_VENDOR)
      : pick(EMAIL_SUBJECTS_INTERNAL);
  const contact = category === "internal" ? "Internal Team" : pick(CONTACT_NAMES);

  const daysAgo = randInt(0, 12);
  const receivedAt = iso(daysAgo, randInt(7, 17), pick([0, 15, 30, 45]));
  const priority = pickWeighted<Priority>([
    ["low", 2],
    ["normal", 5],
    ["high", 3],
    ["critical", 1],
  ]);

  let status: Communication["status"];
  let respondedAt: string | null = null;
  let responseTimeMinutes: number | null = null;

  const target = category === "customer" ? 24 * 60 : 48 * 60;

  if (forceOverdueExclusion) {
    status = "completed";
    respondedAt = iso(daysAgo - 1, 14, 18);
    responseTimeMinutes = 28 * 60 + 36;
  } else {
    const outcome = pickWeighted<"open" | "responded_fast" | "responded_slow">([
      ["open", 3],
      ["responded_fast", 5],
      ["responded_slow", 2],
    ]);
    if (outcome === "open") {
      status = daysAgo > 1 ? (chance(0.5) ? "overdue" : "waiting") : "needs_response";
      if (status === "overdue") responseTimeMinutes = null;
    } else {
      const respMinutes =
        outcome === "responded_fast"
          ? randInt(20, Math.max(60, target - 60))
          : randInt(target + 30, target + 24 * 60);
      const respDate = new Date(receivedAt);
      respDate.setMinutes(respDate.getMinutes() + respMinutes);
      respondedAt = respDate.toISOString();
      responseTimeMinutes = respMinutes;
      status = "completed";
    }
  }

  const hasCommitment = chance(0.35) && status === "completed";
  const qualityScore = randInt(72, 98);

  let aiFinding: AIFinding | null = null;
  if (chance(0.6) || forceOverdueExclusion) {
    const overSla = responseTimeMinutes !== null && responseTimeMinutes > target;
    aiFinding = {
      id: `aif-${commCounter}`,
      responseRequired: category !== "internal" || chance(0.7),
      priority,
      ownership: "Employee",
      commitmentDetected: hasCommitment,
      dueDate: hasCommitment ? isoFuture(randInt(2, 10)) : null,
      nextAction: hasCommitment
        ? "Send follow-up confirmation to contact"
        : "No further action required",
      qualityScore,
      confidencePct: randInt(78, 97),
      reviewStatus: forceOverdueExclusion
        ? "needs_context"
        : overSla
        ? pickWeighted([["pending", 3], ["confirmed", 1], ["dismissed", 1]])
        : "confirmed",
      reasoning:
        overSla
          ? "Response time exceeded the applicable SLA target for this communication category."
          : "Communication pattern matches a standard, timely response with no risk indicators.",
    };
  }

  const excluded = forceOverdueExclusion;

  const comm: Communication = {
    id: `comm-${commCounter++}`,
    contact,
    organization: org,
    category,
    subject,
    bodyPreview:
      category === "customer"
        ? `${contact} at ${org} is requesting an update regarding "${subject.toLowerCase()}". Please review and respond with next steps.`
        : category === "vendor"
        ? `${org} has sent a note regarding "${subject.toLowerCase()}". A response may be required to keep the order on schedule.`
        : `Internal note from ${contact} regarding "${subject.toLowerCase()}".`,
    receivedAt,
    respondedAt,
    responseTimeMinutes,
    status,
    priority,
    ownerId: ownerId,
    nextStep: hasCommitment
      ? "Send customer quotation"
      : status === "completed"
      ? "None — resolved"
      : "Review and respond",
    qualityScore,
    aiFinding,
    timeline: buildTimeline(receivedAt, respondedAt, hasCommitment),
    excluded,
    exclusionReason: excluded
      ? "Employee was marked as unavailable (approved PTO) for part of the response window."
      : undefined,
  };
  return comm;
}

export const communications: Communication[] = [];
[ALEX_ID, "emp-michael-brown", "emp-daniel-carter", "emp-emily-davis", HERO_MANAGER_ID].forEach(
  (ownerId, idx) => {
    const count = ownerId === ALEX_ID ? 42 : 16;
    for (let i = 0; i < count; i++) {
      communications.push(buildCommunication(ownerId, idx === 0 && i === 3));
    }
  }
);

export function communicationsForOwner(ownerId: string): Communication[] {
  return communications.filter((c) => c.ownerId === ownerId);
}
export function getCommunication(id: string): Communication | undefined {
  return communications.find((c) => c.id === id);
}

// ---------------------------------------------------------------------------
// COMMITMENTS
// ---------------------------------------------------------------------------

export const commitments: Commitment[] = [];
let commitCounter = 1;
function buildCommitmentsFor(ownerId: string, n: number) {
  for (let i = 0; i < n; i++) {
    const statusRoll = pickWeighted<Commitment["status"]>([
      ["active", 4],
      ["due_today", 1],
      ["due_this_week", 3],
      ["overdue", 2],
      ["completed", 4],
    ]);
    const daysOverdue = statusRoll === "overdue" ? randInt(1, 9) : 0;
    commitments.push({
      id: `commit-${commitCounter++}`,
      title: pick([
        "Send updated quotation to customer",
        "Provide compliance certificate",
        "Confirm install crew schedule",
        "Deliver revised project timeline",
        "Send warranty claim resolution",
        "Share updated pricing sheet",
        "Follow up on outage root cause report",
      ]),
      source: `${pick(CUSTOMER_COMPANIES)}`,
      ownerId,
      createdAt: iso(randInt(3, 20)),
      dueDate:
        statusRoll === "overdue"
          ? iso(daysOverdue)
          : statusRoll === "due_today"
          ? iso(0)
          : isoFuture(randInt(1, 7)),
      status: statusRoll,
      daysOverdue,
      nextAction:
        statusRoll === "completed" ? "Closed" : "Send update to contact and close loop",
    });
  }
}
buildCommitmentsFor(ALEX_ID, 14);
["emp-michael-brown", "emp-daniel-carter", "emp-emily-davis"].forEach((id) =>
  buildCommitmentsFor(id, 10)
);

export function commitmentsForOwner(ownerId: string): Commitment[] {
  return commitments.filter((c) => c.ownerId === ownerId);
}

// ---------------------------------------------------------------------------
// FOLLOW-UPS
// ---------------------------------------------------------------------------

export const followUps: FollowUp[] = [];
let fuCounter = 1;
function buildFollowUpsFor(ownerId: string, n: number) {
  for (let i = 0; i < n; i++) {
    const status = pickWeighted<FollowUp["status"]>([
      ["open", 4],
      ["overdue", 2],
      ["due_today", 1],
      ["completed", 4],
      ["escalated", 1],
    ]);
    followUps.push({
      id: `fu-${fuCounter++}`,
      contact: pick(CONTACT_NAMES),
      subject: pick(EMAIL_SUBJECTS_CUSTOMER),
      ownerId,
      dueDate: status === "overdue" ? iso(randInt(1, 6)) : isoFuture(randInt(0, 6)),
      status,
      lastActivity: iso(randInt(0, 4)),
      nextAction:
        status === "completed" ? "Closed" : "Send follow-up message to confirm status",
    });
  }
}
buildFollowUpsFor(ALEX_ID, 11);
["emp-michael-brown", "emp-daniel-carter", "emp-emily-davis"].forEach((id) =>
  buildFollowUpsFor(id, 8)
);

export function followUpsForOwner(ownerId: string): FollowUp[] {
  return followUps.filter((f) => f.ownerId === ownerId);
}

// ---------------------------------------------------------------------------
// ALERTS
// ---------------------------------------------------------------------------

export const alerts: AlertItem[] = [];
let alertCounter = 1;
function buildAlertsFor(ownerId: string, n: number) {
  const templates: [AlertItem["category"], string, string][] = [
    ["overdue", "Customer response overdue by 2 days.", "Respond immediately to protect SLA compliance."],
    ["needs_response", "Vendor waiting for requested information.", "Reply with the requested documentation."],
    ["needs_response", "Internal request has not been acknowledged.", "Acknowledge and confirm ownership."],
    ["commitment", "Commitment due tomorrow.", "Confirm delivery or reschedule the commitment."],
    ["positive_indicator", "Positive follow-through detected.", "No action needed — recognized in coaching summary."],
    ["follow_up", "Scheduled follow-up has not been sent.", "Send the follow-up message to the contact."],
    ["ai_coaching", "Response pattern flagged for review.", "Review the AI-assisted finding and add context if needed."],
  ];
  for (let i = 0; i < n; i++) {
    const [category, reason, action] = pick(templates);
    alerts.push({
      id: `alert-${alertCounter++}`,
      category,
      severity: pickWeighted([["low", 3], ["medium", 4], ["high", 2]]),
      time: iso(randInt(0, 5), randInt(7, 18)),
      source: pick([...CUSTOMER_COMPANIES, ...VENDOR_COMPANIES, "Internal"]),
      reason,
      recommendedAction: action,
      ownerId,
    });
  }
}
buildAlertsFor(ALEX_ID, 9);
["emp-michael-brown", "emp-daniel-carter", "emp-emily-davis"].forEach((id) =>
  buildAlertsFor(id, 5)
);

export function alertsForOwner(ownerId: string): AlertItem[] {
  return alerts.filter((a) => a.ownerId === ownerId);
}

// ---------------------------------------------------------------------------
// CUSTOMERS
// ---------------------------------------------------------------------------

export const customers: Customer[] = CUSTOMER_COMPANIES.map((name, i) => ({
  id: `cust-${i + 1}`,
  name,
  industry: pick([
    "Industrial Manufacturing",
    "Utilities & Grid Infrastructure",
    "Logistics & Distribution",
    "Rail & Transit",
    "Materials & Fabrication",
    "Energy Production",
  ]),
  openCommunications: randInt(1, 14),
  avgResponseMinutes: randInt(90, 900),
  outstandingCommitments: randInt(0, 6),
  followUps: randInt(0, 5),
  health: pickWeighted([["strong", 5], ["steady", 3], ["at_risk", 2]]),
}));

// ---------------------------------------------------------------------------
// AI COACHING INSIGHTS (for Alex, used as the demo "employee" persona)
// ---------------------------------------------------------------------------

export const insights: AIInsight[] = [
  {
    id: "ins-1",
    employeeId: ALEX_ID,
    kind: "strength",
    headline: "Your response time improved 18% this month.",
    why: "SpikeOS compared your rolling 30-day median response time against the prior period.",
    evidence: "Median response fell from 4h 32m to 3h 42m across 38 tracked communications.",
    confidencePct: 94,
    reviewStatus: "unreviewed",
  },
  {
    id: "ins-2",
    employeeId: ALEX_ID,
    kind: "follow_through",
    headline: "You consistently close customer commitments on time.",
    why: "11 of your last 12 commitments were completed before their due date.",
    evidence: "Commitment log for Apex Manufacturing, Vertex Energy, and Meridian Systems.",
    confidencePct: 91,
    reviewStatus: "unreviewed",
  },
  {
    id: "ins-3",
    employeeId: ALEX_ID,
    kind: "follow_through",
    headline: "Three conversations may benefit from a follow-up.",
    why: "SpikeOS detected open questions with no follow-up scheduled in the last 5 business days.",
    evidence: "Threads with Northstar Logistics, Cobalt Wire & Cable, and an internal request from Finance.",
    confidencePct: 82,
    reviewStatus: "unreviewed",
  },
  {
    id: "ins-4",
    employeeId: ALEX_ID,
    kind: "response",
    headline: "High-priority messages get your fastest responses.",
    why: "Median response time on 'high' and 'critical' priority items is 46 minutes, well inside target.",
    evidence: "Analysis of 9 high-priority communications over the last 30 days.",
    confidencePct: 88,
    reviewStatus: "unreviewed",
  },
  {
    id: "ins-5",
    employeeId: ALEX_ID,
    kind: "improve",
    headline: "Internal requests take longer to acknowledge than customer requests.",
    why: "Median acknowledgement time for internal messages is 2.4x longer than customer messages.",
    evidence: "Comparison of 14 internal vs. 22 customer communications this month.",
    confidencePct: 76,
    reviewStatus: "unreviewed",
  },
  {
    id: "ins-6",
    employeeId: ALEX_ID,
    kind: "positive",
    headline: "Customers describe your updates as clear and proactive.",
    why: "Communication quality scoring on outbound customer replies averaged 92/100.",
    evidence: "Quality analysis across 19 customer-facing replies in the last 30 days.",
    confidencePct: 85,
    reviewStatus: "unreviewed",
  },
];

// ---------------------------------------------------------------------------
// MANAGER REVIEW CENTER (AI findings awaiting human review)
// ---------------------------------------------------------------------------

export const reviews: Review[] = communications
  .filter((c) => c.aiFinding && (c.aiFinding.reviewStatus === "pending" || c.aiFinding.reviewStatus === "needs_context"))
  .slice(0, 14)
  .map((c, i) => ({
    id: `rev-${i + 1}`,
    employeeId: c.ownerId,
    finding:
      c.aiFinding!.reviewStatus === "needs_context"
        ? "Response exceeded 24-hour target."
        : `Communication quality flagged at ${c.aiFinding!.qualityScore}/100.`,
    evidence: `${c.subject} — received ${new Date(c.receivedAt).toLocaleString()}`,
    aiConfidencePct: c.aiFinding!.confidencePct,
    status: c.aiFinding!.reviewStatus === "needs_context" ? "needs_context" : "pending_review",
    reviewer: null,
    date: c.receivedAt,
    communicationId: c.id,
  }));

// ---------------------------------------------------------------------------
// EVIDENCE CENTER
// ---------------------------------------------------------------------------

export const evidenceEntries: Evidence[] = [
  {
    id: "ev-1",
    finding: "Response exceeded 24-hour target.",
    source: "Microsoft 365 — Outlook",
    date: iso(4),
    rule: "Customer response target = 24 hours",
    evidenceText: "Customer email received Monday 09:42. Response sent Tuesday 14:18.",
    context: "Employee was marked as unavailable (approved PTO).",
    result: "excluded",
  },
  ...communications.slice(0, 9).map((c, i) => ({
    id: `ev-gen-${i + 1}`,
    finding: c.aiFinding
      ? `Communication quality scored ${c.aiFinding.qualityScore}/100`
      : "Response completed within target.",
    source: "Microsoft 365 — Outlook",
    date: c.receivedAt,
    rule:
      c.category === "customer"
        ? "Customer response target = 24 hours"
        : "Internal response target = 48 hours",
    evidenceText: `${c.subject} — received ${new Date(c.receivedAt).toLocaleDateString()}, status: ${c.status.replace("_", " ")}.`,
    context: c.excluded ? "Employee was marked as unavailable (approved PTO)." : null,
    result: c.excluded ? ("excluded" as const) : chance(0.7) ? ("confirmed" as const) : ("under_review" as const),
  })),
];

// ---------------------------------------------------------------------------
// AUDIT LOG
// ---------------------------------------------------------------------------

export const auditLog: AuditEntry[] = [
  { id: "a1", timestamp: iso(0, 9, 12), user: "Sarah Williams", action: "Reviewed AI finding", resource: "Communication comm-7", result: "success", ip: "10.20.4.18" },
  { id: "a2", timestamp: iso(0, 8, 3), user: "System Administrator", action: "Changed scoring rule", resource: "Settings / Scoring — Customer response target", result: "success", ip: "10.20.1.2" },
  { id: "a3", timestamp: iso(1, 16, 40), user: "Alex Johnson", action: "Submitted context", resource: "Evidence ev-1", result: "success", ip: "10.20.6.44" },
  { id: "a4", timestamp: iso(1, 11, 5), user: "Nelson Bonekeh", action: "Generated report", resource: "Monthly Executive Report", result: "success", ip: "10.20.1.9" },
  { id: "a5", timestamp: iso(2, 14, 22), user: "Sarah Williams", action: "Confirmed AI finding", resource: "Communication comm-3", result: "success", ip: "10.20.4.18" },
  { id: "a6", timestamp: iso(2, 9, 47), user: "Michael Brown", action: "Marked follow-up complete", resource: "Follow-up fu-2", result: "success", ip: "10.20.6.51" },
  { id: "a7", timestamp: iso(3, 13, 15), user: "System Administrator", action: "Updated exclusion rule", resource: "Settings / Exclusions — Approved PTO", result: "success", ip: "10.20.1.2" },
  { id: "a8", timestamp: iso(4, 10, 2), user: "Unknown", action: "Attempted access to Organization Analytics", resource: "/analytics", result: "denied", ip: "10.20.9.201" },
];

// ---------------------------------------------------------------------------
// AGGREGATES
// ---------------------------------------------------------------------------

export function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export function departmentAggregate(dept: Department) {
  const emps = departmentEmployees(dept);
  return {
    department: dept,
    headcount: emps.length,
    responseScore: avg(emps.map((e) => e.responseScore)),
    medianResponse: avg(emps.map((e) => e.medianResponseMinutes)),
    slaCompliance: avg(emps.map((e) => e.slaCompliancePct)),
    overdue: emps.reduce((s, e) => s + e.overdueFollowUps, 0),
    openCommitments: emps.reduce((s, e) => s + e.openCommitments, 0),
    positiveCommunication: avg(emps.map((e) => e.positiveCommunicationPct)),
  };
}

export const orgAggregate = {
  headcount: employees.length,
  responseScore: avg(employees.map((e) => e.responseScore)),
  medianResponse: avg(employees.map((e) => e.medianResponseMinutes)),
  slaCompliance: avg(employees.map((e) => e.slaCompliancePct)),
  overdue: employees.reduce((s, e) => s + e.overdueFollowUps, 0),
  openCommitments: employees.reduce((s, e) => s + e.openCommitments, 0),
  positiveCommunication: avg(employees.map((e) => e.positiveCommunicationPct)),
};
