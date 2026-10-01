from __future__ import annotations

from app.services.dashboard_service import _hours, communication_status


def _fmt_hours(hours: float) -> str:
    if hours < 1:
        return f"{max(1, round(hours * 60))}m"
    if hours < 48:
        return f"{round(hours, 1):g}h"
    return f"{hours / 24:.1f} days"


def build_evidence(communications: list[dict], profiles: dict[str, dict]) -> list[dict]:
    """One evidence record per tracked communication, derived from the stored
    Supabase row (the same row the Dashboard metrics are computed from)."""
    out = []
    for c in communications:
        sla = c.get("sla_hours") or 48
        status = communication_status(c)
        owner = profiles.get(c.get("owner_id")) or {}

        if c.get("excluded"):
            finding = "Excluded from response metrics"
            result = "excluded"
            detail = c.get("exclusion_reason") or "Excluded by classification rules"
        elif c.get("answered_at"):
            hours = _hours(c.get("received_at"), c.get("answered_at"))
            within = hours <= sla
            finding = "Responded within SLA" if within else "Response outside SLA"
            result = "confirmed"
            detail = f"Answered after {_fmt_hours(hours)} against a {sla}h SLA."
        elif status == "overdue":
            hours = _hours(c.get("received_at"))
            finding = "Awaiting response — past SLA"
            result = "confirmed"
            detail = f"No response recorded after {_fmt_hours(hours)} ({_fmt_hours(hours - sla)} past the {sla}h SLA)."
        else:
            hours = _hours(c.get("received_at"))
            finding = "Awaiting response — within SLA"
            result = "under_review"
            detail = f"Open for {_fmt_hours(hours)} of a {sla}h SLA; outcome not yet determined."

        out.append(
            {
                "id": c.get("id"),
                "communicationId": c.get("id"),
                "employeeId": c.get("owner_id"),
                "employeeName": owner.get("display_name") or owner.get("email"),
                "finding": finding,
                "source": f"Microsoft 365 — Outlook · {c.get('sender_name') or c.get('sender_email') or 'Unknown sender'}",
                "date": c.get("received_at"),
                "rule": f"{(c.get('category') or 'internal').capitalize()} response target: {sla}h",
                "evidenceText": f"“{c.get('subject') or '(No subject)'}” — {detail}",
                "context": c.get("exclusion_reason") if c.get("excluded") else None,
                "result": result,
            }
        )
    return out
