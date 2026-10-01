from __future__ import annotations

import logging
from datetime import datetime, timezone

from app.repositories import spikeos as repo

log = logging.getLogger(__name__)


def _flag_due(flag: dict) -> str | None:
    """Graph flag.dueDateTime -> ISO timestamp (Graph returns UTC unless asked otherwise)."""
    due = (flag or {}).get("dueDateTime") or {}
    value = due.get("dateTime")
    if not value:
        return None
    value = value.split(".")[0]
    if (due.get("timeZone") or "UTC").upper() == "UTC":
        return f"{value}+00:00"
    return value[:10]


def sync_flag_followup(message: dict, communication: dict | None) -> None:
    """Create/complete the automatic follow-up for a message flagged in Outlook.

    Outlook's follow-up flag is the explicit follow-up signal:
    - flagged  -> one follow-up per communication (created once, never duplicated)
    - complete -> the open follow-up is completed
    SpikeOS state wins afterwards: a follow-up completed in SpikeOS is not
    reopened by a re-ingest, and an unflag does not delete it.
    """
    if not communication or not communication.get("id"):
        return

    flag = message.get("flag") or {}
    status = flag.get("flagStatus")
    if status not in {"flagged", "complete"}:
        return

    try:
        existing = repo.get_auto_followup(communication["id"])
        now = datetime.now(timezone.utc).isoformat()

        if status == "flagged" and not existing:
            repo.insert_followup(
                {
                    "employee_id": communication.get("owner_id"),
                    "communication_id": communication["id"],
                    "contact": communication.get("sender_name") or communication.get("sender_email"),
                    "subject": communication.get("subject"),
                    "due_date": _flag_due(flag),
                    "status": "open",
                    "source": "auto",
                    "next_action": "Follow up (flagged in Outlook)",
                    "last_activity_at": now,
                }
            )
        elif status == "complete" and existing and existing.get("status") != "completed":
            repo.update_followup(
                existing["id"],
                {"status": "completed", "completed_at": now, "last_activity_at": now},
            )
    except Exception:
        # Follow-up sync must never break message ingestion.
        log.exception("Follow-up sync failed for communication %s", communication.get("id"))
