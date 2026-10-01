from __future__ import annotations

import hashlib

from app.services.dashboard_service import communication_status


def _minutes(m: int) -> str:
    if m < 60:
        return f"{m}m"
    h, r = divmod(m, 60)
    return f"{h}h {r}m" if r else f"{h}h"


def _signature(ids: list[str]) -> str:
    return hashlib.sha1(",".join(sorted(ids)).encode()).hexdigest()[:16]


def _subjects(comms: list[dict], n: int = 3) -> str:
    names = [f"“{c.get('subject') or '(No subject)'}”" for c in comms[:n]]
    more = len(comms) - n
    return ", ".join(names) + (f" and {more} more" if more > 0 else "")


def build_insights(
    employee: dict,
    communications: list[dict],
    followups: list[dict],
    commitments: list[dict],
) -> list[dict]:
    """Rule-based coaching signals for one employee.

    `employee` is the compute_employee() result, so every number here is the
    same number the Dashboard shows. Each insight lists the communication ids
    it is derived from; nothing is produced without underlying records.
    """
    eid = employee["id"]
    relevant = [c for c in communications if not c.get("excluded")]
    answered = [c for c in relevant if c.get("answered_at")]
    overdue = [c for c in relevant if communication_status(c) == "overdue"]
    late_followups = [f for f in followups if f.get("status") == "overdue"]
    late_commitments = [c for c in commitments if c.get("status") == "overdue"]

    out: list[dict] = []

    def add(kind, headline, why, evidence, ids):
        out.append(
            {
                "id": f"{kind}-{eid}",
                "employeeId": eid,
                "kind": kind,
                "headline": headline,
                "why": why,
                "evidence": evidence,
                "evidenceIds": ids,
                "signature": _signature(ids),
                "confidencePct": 100,
                "reviewStatus": "reviewed",
                "basis": "calculated",
            }
        )

    if answered:
        add(
            "response",
            f"{employee['answeredWithin24hPct']}% answered within 24 hours",
            "Calculated from response times of answered Microsoft 365 communications.",
            f"Median response {_minutes(employee['medianResponseMinutes'])} · "
            f"response score {employee['responseScore']}/100 across {len(answered)} answered communication"
            f"{'s' if len(answered) != 1 else ''}.",
            [c["id"] for c in answered],
        )

    if len(answered) >= 3 and employee["responseScore"] >= 90:
        add(
            "strength",
            "Consistently responding within SLA",
            "At least 90% of answered communications met their response target.",
            f"{employee['responseScore']}% of {len(answered)} answered communications were within SLA.",
            [c["id"] for c in answered],
        )

    if overdue:
        add(
            "improve",
            f"{len(overdue)} communication{'s' if len(overdue) != 1 else ''} waiting past SLA",
            "These communications have no recorded response and are past their response target.",
            f"Oldest first: {_subjects(sorted(overdue, key=lambda c: c.get('received_at') or ''))}.",
            [c["id"] for c in overdue],
        )

    if late_followups or late_commitments:
        parts = []
        if late_followups:
            parts.append(f"{len(late_followups)} follow-up{'s' if len(late_followups) != 1 else ''}")
        if late_commitments:
            parts.append(f"{len(late_commitments)} commitment{'s' if len(late_commitments) != 1 else ''}")
        ids = [f.get("communicationId") or f["id"] for f in late_followups] + [
            c.get("communicationId") or c["id"] for c in late_commitments
        ]
        add(
            "follow_through",
            f"{' and '.join(parts)} past due",
            "Open follow-ups and commitments whose due date has passed.",
            "Past due: " + ", ".join(
                [f"“{f.get('subject')}”" for f in late_followups[:3]]
                + [f"“{c.get('title')}”" for c in late_commitments[:3]]
            ) + ".",
            [i for i in ids if i],
        )

    return out


COACHING_KINDS = {"strength", "improve", "follow_through", "response", "positive"}


def apply_coaching_feedback(insights: list[dict], feedback: list[dict]) -> list[dict]:
    """Hide insights dismissed for the same underlying records and attach
    persisted context notes. A dismissal only applies while the signature
    (the set of records the insight is based on) is unchanged."""
    dismissed = {
        (f.get("insight_key"), f.get("signature"))
        for f in feedback
        if f.get("action") == "dismissed"
    }
    notes: dict[str, list[dict]] = {}
    for f in feedback:
        if f.get("action") == "context" and f.get("context"):
            notes.setdefault(f.get("insight_key"), []).append(
                {"text": f["context"], "createdAt": f.get("created_at"), "createdBy": f.get("created_by")}
            )

    out = []
    for i in insights:
        if (i["id"], i["signature"]) in dismissed:
            continue
        out.append({**i, "contextNotes": notes.get(i["id"], [])})
    return out
