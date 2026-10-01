from __future__ import annotations

from datetime import datetime, timezone

from app.repositories import spikeos as repo
from app.services.dashboard_service import _hours, communication_status

OVERDUE_KIND = "overdue_response"

ALERT_CATEGORIES = {
    "needs_response",
    "overdue",
    "commitment",
    "follow_up",
    "ai_coaching",
    "positive_indicator",
}


def overdue_severity(c: dict) -> str:
    hours = _hours(c.get("received_at"))
    if c.get("priority") == "critical" or hours >= 72:
        return "high"
    if c.get("priority") == "high" or hours >= 48:
        return "medium"
    return "low"


def sync_overdue_alerts(owner_ids: list[str], communications: list[dict]) -> None:
    """Keep one persisted alert per overdue communication.

    - Creates an alert the first time a communication is past its SLA.
    - Never re-creates an alert that a user reviewed, dismissed or converted.
    - Resolves the open alert once the communication is answered or excluded.
    """
    existing = {
        a.get("communication_id"): a
        for a in repo.list_alerts_by_kind(owner_ids, OVERDUE_KIND)
    }
    now = datetime.now(timezone.utc).isoformat()

    for c in communications:
        alert = existing.get(c.get("id"))
        overdue = not c.get("excluded") and communication_status(c) == "overdue"

        if overdue:
            severity = overdue_severity(c)
            if not alert:
                try:
                    repo.upsert_alert(
                        {
                            "owner_id": c.get("owner_id"),
                            "communication_id": c.get("id"),
                            "title": "Response overdue",
                            "severity": severity,
                            "status": "open",
                            "details": {
                                "kind": OVERDUE_KIND,
                                "category": "overdue",
                                "source": f"Outlook — {c.get('sender_name') or c.get('sender_email') or 'Unknown sender'}",
                                "subject": c.get("subject"),
                                "action": "Respond to this communication in Outlook",
                                "communication_id": c.get("id"),
                            },
                        }
                    )
                except Exception:
                    # A concurrent request may have created it (unique index).
                    pass
            elif alert.get("status") == "open" and alert.get("severity") != severity:
                repo.update_alert(alert["id"], {"severity": severity})
        elif alert and alert.get("status") == "open":
            repo.update_alert(alert["id"], {"status": "resolved", "resolved_at": now})


def map_alert(a: dict) -> dict:
    details = a.get("details") or {}
    category = details.get("category")
    if category not in ALERT_CATEGORIES:
        category = "overdue" if a.get("severity") == "high" else "needs_response"
    return {
        "id": a.get("id"),
        "category": category,
        "severity": a.get("severity") if a.get("severity") in {"low", "medium", "high"} else "medium",
        "time": a.get("created_at"),
        "source": details.get("source") or ("Escalation" if details.get("reason") else "Outlook"),
        "reason": a.get("title") or "Alert",
        "recommendedAction": details.get("action", "Review communication"),
        "ownerId": a.get("owner_id"),
        "communicationId": a.get("communication_id") or details.get("communication_id"),
    }
