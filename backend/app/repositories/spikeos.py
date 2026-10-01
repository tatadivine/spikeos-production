from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from supabase import create_client

from app.core.config import settings


_client = None


def client():
    global _client

    if _client is None:
        if not settings.supabase_url or not settings.supabase_service_role_key:
            raise RuntimeError("Supabase is not configured")

        _client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key,
        )

    return _client


def upsert_profile(row: dict[str, Any]):
    return (
        client()
        .table("profiles")
        .upsert(row, on_conflict="id")
        .execute()
        .data
    )


def list_profiles():
    return (
        client()
        .table("profiles")
        .select("*")
        .order("display_name")
        .execute()
        .data
        or []
    )


def get_profile(profile_id: str):
    rows = (
        client()
        .table("profiles")
        .select("*")
        .eq("id", profile_id)
        .limit(1)
        .execute()
        .data
        or []
    )

    return rows[0] if rows else None


def upsert_communication(row: dict[str, Any]):
    existing_rows = (
        client()
        .table("communications")
        .select(
            "id,answered_at,response_time_minutes,lifecycle"
        )
        .eq(
            "external_message_id",
            row.get("external_message_id"),
        )
        .limit(1)
        .execute()
        .data
        or []
    )

    if existing_rows:
        existing = existing_rows[0]

        # Supabase is the source of truth for a communication
        # that has already been completed from the Dashboard.
        # An answered communication is always completed; this also
        # repairs rows whose lifecycle an earlier re-ingest overwrote.
        if existing.get("answered_at"):
            row["answered_at"] = existing["answered_at"]
            row["response_time_minutes"] = existing.get(
                "response_time_minutes"
            )
            row["lifecycle"] = "completed"

    return (
        client()
        .table("communications")
        .upsert(
            row,
            on_conflict="external_message_id",
        )
        .execute()
        .data
        or [None]
    )[0]


def list_communications(owner_ids: list[str], limit: int = 2000):
    if not owner_ids:
        return []

    return (
        client()
        .table("communications")
        .select("*")
        .in_("owner_id", owner_ids)
        .order("received_at", desc=True)
        .limit(limit)
        .execute()
        .data
        or []
    )


def get_communication(cid: str):
    rows = (
        client()
        .table("communications")
        .select("*")
        .eq("id", cid)
        .limit(1)
        .execute()
        .data
        or []
    )

    return rows[0] if rows else None


# ---------------------------------------------------------------------------
# Alerts
# ---------------------------------------------------------------------------

def upsert_alert(row: dict[str, Any]):
    return (
        client()
        .table("alerts")
        .insert(row)
        .execute()
        .data
        or [None]
    )[0]


def update_alert(
    alert_id: str,
    updates: dict[str, Any],
):
    return (
        client()
        .table("alerts")
        .update(updates)
        .eq("id", alert_id)
        .execute()
        .data
        or []
    )


def get_alert(alert_id: str):
    rows = (
        client()
        .table("alerts")
        .select("*")
        .eq("id", alert_id)
        .limit(1)
        .execute()
        .data
        or []
    )

    return rows[0] if rows else None


def list_alerts(owner_ids: list[str], limit: int = 500):
    if not owner_ids:
        return []

    return (
        client()
        .table("alerts")
        .select("*")
        .in_("owner_id", owner_ids)
        .eq("status", "open")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
        .data
        or []
    )


def list_alerts_by_kind(owner_ids: list[str], kind: str):
    """All alerts of a given details.kind, in any status (used for de-duplication)."""
    if not owner_ids:
        return []

    return (
        client()
        .table("alerts")
        .select("id,communication_id,status,severity")
        .in_("owner_id", owner_ids)
        .eq("details->>kind", kind)
        .execute()
        .data
        or []
    )


# ---------------------------------------------------------------------------
# Commitments
# ---------------------------------------------------------------------------

def insert_commitment(row: dict[str, Any]):
    return (
        client()
        .table("commitments")
        .insert(row)
        .execute()
        .data
        or [None]
    )[0]


def list_commitments(owner_ids: list[str], limit: int = 500):
    if not owner_ids:
        return []

    return (
        client()
        .table("commitments")
        .select("*")
        .in_("owner_id", owner_ids)
        .order("due_date")
        .limit(limit)
        .execute()
        .data
        or []
    )


# ---------------------------------------------------------------------------
# Follow-ups
# ---------------------------------------------------------------------------

def list_followups(employee_ids: list[str], limit: int = 500):
    if not employee_ids:
        return []

    return (
        client()
        .table("followups")
        .select("*")
        .in_("employee_id", employee_ids)
        .order("due_date")
        .limit(limit)
        .execute()
        .data
        or []
    )


def get_followup(followup_id: str):
    rows = (
        client()
        .table("followups")
        .select("*")
        .eq("id", followup_id)
        .limit(1)
        .execute()
        .data
        or []
    )

    return rows[0] if rows else None


def get_auto_followup(communication_id: str):
    rows = (
        client()
        .table("followups")
        .select("*")
        .eq("communication_id", communication_id)
        .eq("source", "auto")
        .limit(1)
        .execute()
        .data
        or []
    )

    return rows[0] if rows else None


def get_open_followup_for_communication(communication_id: str):
    rows = (
        client()
        .table("followups")
        .select("*")
        .eq("communication_id", communication_id)
        .neq("status", "completed")
        .limit(1)
        .execute()
        .data
        or []
    )

    return rows[0] if rows else None


def insert_followup(row: dict[str, Any]):
    return (
        client()
        .table("followups")
        .insert(row)
        .execute()
        .data
        or [None]
    )[0]


def update_followup(
    followup_id: str,
    updates: dict[str, Any],
):
    return (
        client()
        .table("followups")
        .update(updates)
        .eq("id", followup_id)
        .execute()
        .data
        or []
    )


# ---------------------------------------------------------------------------
# Coaching feedback
# ---------------------------------------------------------------------------

def list_coaching_feedback(employee_ids: list[str]):
    if not employee_ids:
        return []

    try:
        return (
            client()
            .table("coaching_feedback")
            .select("*")
            .in_("employee_id", employee_ids)
            .order("created_at")
            .execute()
            .data
            or []
        )
    except Exception:
        # Table not migrated yet (005_coaching_reviews.sql); coaching still renders.
        return []


def insert_coaching_feedback(row: dict[str, Any]):
    return (
        client()
        .table("coaching_feedback")
        .insert(row)
        .execute()
        .data
        or [None]
    )[0]


# ---------------------------------------------------------------------------
# Reviews
# ---------------------------------------------------------------------------

def list_reviews(communication_ids: list[str]):
    """ai_reviews rows for the given (already scope-checked) communications."""
    rows: list[dict] = []
    ids = list(communication_ids)
    for i in range(0, len(ids), 100):
        rows += (
            client()
            .table("ai_reviews")
            .select("*")
            .in_("communication_id", ids[i : i + 100])
            .execute()
            .data
            or []
        )
    return rows


def get_review(communication_id: str, finding_type: str):
    rows = (
        client()
        .table("ai_reviews")
        .select("*")
        .eq("communication_id", communication_id)
        .eq("finding_type", finding_type)
        .limit(1)
        .execute()
        .data
        or []
    )

    return rows[0] if rows else None


def save_review(row: dict[str, Any]):
    existing = get_review(row["communication_id"], row["finding_type"])

    if existing:
        return (
            client()
            .table("ai_reviews")
            .update(row)
            .eq("id", existing["id"])
            .execute()
            .data
            or [None]
        )[0]

    return (
        client()
        .table("ai_reviews")
        .insert(row)
        .execute()
        .data
        or [None]
    )[0]


def list_appeals(communication_ids: list[str]):
    rows: list[dict] = []
    ids = list(communication_ids)
    for i in range(0, len(ids), 100):
        rows += (
            client()
            .table("appeals")
            .select("*")
            .in_("communication_id", ids[i : i + 100])
            .order("created_at")
            .execute()
            .data
            or []
        )
    return rows


def insert_appeal(row: dict[str, Any]):
    return (
        client()
        .table("appeals")
        .insert(row)
        .execute()
        .data
        or [None]
    )[0]


# ---------------------------------------------------------------------------
# Audit
# ---------------------------------------------------------------------------

def list_audit(limit: int = 500):
    return (
        client()
        .table("audit_logs")
        .select("*")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
        .data
        or []
    )


def insert_audit(
    actor_id: str,
    action: str,
    target_type: str | None = None,
    target_id: str | None = None,
    metadata: dict | None = None,
):
    return client().table("audit_logs").insert(
        {
            "actor_id": actor_id,
            "action": action,
            "target_type": target_type,
            "target_id": target_id,
            "metadata": metadata or {},
        }
    ).execute().data


# ---------------------------------------------------------------------------
# Graph subscriptions
# ---------------------------------------------------------------------------

def upsert_subscription(row: dict[str, Any]):
    return (
        client()
        .table("graph_subscriptions")
        .upsert(row, on_conflict="subscription_id")
        .execute()
        .data
    )


def list_subscriptions():
    return (
        client()
        .table("graph_subscriptions")
        .select("*")
        .execute()
        .data
        or []
    )


def get_subscription(subscription_id: str):
    rows = (
        client()
        .table("graph_subscriptions")
        .select("*")
        .eq("subscription_id", subscription_id)
        .limit(1)
        .execute()
        .data
        or []
    )

    return rows[0] if rows else None


# ---------------------------------------------------------------------------
# Communication status updates
# ---------------------------------------------------------------------------

def mark_communication_answered(
    conversation_id: str,
    answered_at: str,
):
    rows = (
        client()
        .table("communications")
        .select("id,received_at,sla_hours")
        .eq("thread_id", conversation_id)
        .order("received_at", desc=True)
        .limit(1)
        .execute()
        .data
        or []
    )

    if not rows:
        return None

    row = rows[0]

    received = datetime.fromisoformat(
        row["received_at"].replace("Z", "+00:00")
    )

    answered = datetime.fromisoformat(
        answered_at.replace("Z", "+00:00")
    )

    minutes = max(
        0,
        int((answered - received).total_seconds() / 60),
    )

    return (
        client()
        .table("communications")
        .update(
            {
                "answered_at": answered_at,
                "response_time_minutes": minutes,
                # Answered is completed everywhere (same as the Dashboard
                # complete action); SLA performance is measured from
                # response_time_minutes, not from lifecycle.
                "lifecycle": "completed",
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        .eq("id", row["id"])
        .execute()
        .data
    )


def mark_communication_completed(
    communication_id: str,
    answered_at: str,
):
    rows = (
        client()
        .table("communications")
        .select("id,received_at,sla_hours")
        .eq("id", communication_id)
        .limit(1)
        .execute()
        .data
        or []
    )

    if not rows:
        return None

    row = rows[0]

    received_at = row.get("received_at")

    response_time_minutes = None

    if received_at:
        received = datetime.fromisoformat(
            received_at.replace("Z", "+00:00")
        )

        answered = datetime.fromisoformat(
            answered_at.replace("Z", "+00:00")
        )

        response_time_minutes = max(
            0,
            int(
                (answered - received).total_seconds() / 60
            ),
        )

    return (
        client()
        .table("communications")
        .update(
            {
                "answered_at": answered_at,
                "response_time_minutes": response_time_minutes,
                "lifecycle": "completed",
                "updated_at": datetime.now(
                    timezone.utc
                ).isoformat(),
            }
        )
        .eq("id", communication_id)
        .execute()
        .data
    )