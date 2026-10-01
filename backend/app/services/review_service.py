from __future__ import annotations

from app.services.dashboard_service import _hours, communication_status
from app.services.evidence_service import _fmt_hours

SLA_BREACH = "sla_breach"

DECISIONS = {"confirmed", "dismissed", "needs_context", "incorrect"}

# ai_reviews.human_review_status -> frontend Review.status
_STATUS = {
    "pending": "pending_review",
    "confirmed": "confirmed",
    "dismissed": "dismissed",
    "needs_context": "needs_context",
    "incorrect": "incorrect",
}


def sla_breach(c: dict) -> str | None:
    """Factual SLA-breach signal for a communication, or None."""
    if c.get("excluded"):
        return None
    sla = c.get("sla_hours") or 48
    if c.get("answered_at"):
        hours = _hours(c.get("received_at"), c.get("answered_at"))
        if hours > sla:
            return f"Answered after {_fmt_hours(hours)} against a {sla}h SLA."
        return None
    if communication_status(c) == "overdue":
        hours = _hours(c.get("received_at"))
        return f"No response recorded after {_fmt_hours(hours)} against a {sla}h SLA."
    return None


def build_reviews(
    communications: list[dict],
    reviews: list[dict],
    appeals: list[dict],
    profiles: dict[str, dict],
) -> list[dict]:
    """Review queue: SLA breaches (signals) merged with persisted manager
    decisions (ai_reviews) and employee context (appeals).

    A signal without an ai_reviews row is pending. A decided review stays in
    the list even if the communication is later answered, so decisions are
    never lost.
    """
    by_comm = {r.get("communication_id"): r for r in reviews if r.get("finding_type") == SLA_BREACH}
    context_by_comm: dict[str, list[dict]] = {}
    for a in appeals:
        context_by_comm.setdefault(a.get("communication_id"), []).append(
            {"text": a.get("context"), "createdAt": a.get("created_at"), "status": a.get("status")}
        )

    out = []
    for c in communications:
        detail = sla_breach(c)
        record = by_comm.get(c.get("id"))
        if not detail and not record:
            continue

        reviewer = profiles.get((record or {}).get("reviewed_by")) or {}
        out.append(
            {
                "id": c.get("id"),
                "communicationId": c.get("id"),
                "employeeId": c.get("owner_id"),
                "finding": "Response outside SLA" if c.get("answered_at") else "No response within SLA",
                "evidence": f"“{c.get('subject') or '(No subject)'}” — {detail or (record or {}).get('finding') or ''}",
                "aiConfidencePct": 100,
                "basis": "calculated",
                "status": _STATUS.get((record or {}).get("human_review_status") or "pending", "pending_review"),
                "reviewer": reviewer.get("display_name") or reviewer.get("email"),
                "reviewedAt": (record or {}).get("reviewed_at"),
                "notes": (record or {}).get("notes"),
                "date": c.get("received_at"),
                "employeeContext": context_by_comm.get(c.get("id"), []),
            }
        )
    return out
