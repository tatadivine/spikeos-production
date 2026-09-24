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
        _client = create_client(settings.supabase_url, settings.supabase_service_role_key)
    return _client

def upsert_profile(row: dict[str, Any]):
    return client().table("profiles").upsert(row, on_conflict="id").execute().data

def list_profiles():
    return client().table("profiles").select("*").order("display_name").execute().data or []

def get_profile(profile_id: str):
    rows = client().table("profiles").select("*").eq("id", profile_id).limit(1).execute().data or []
    return rows[0] if rows else None

def upsert_communication(row: dict[str, Any]):
    return (client().table("communications").upsert(row, on_conflict="external_message_id").execute().data or [None])[0]

def list_communications(owner_ids: list[str], limit: int = 2000):
    if not owner_ids:
        return []
    return client().table("communications").select("*").in_("owner_id", owner_ids).order("received_at", desc=True).limit(limit).execute().data or []

def get_communication(cid: str):
    rows = client().table("communications").select("*").eq("id", cid).limit(1).execute().data or []
    return rows[0] if rows else None

def upsert_alert(row: dict[str, Any]):
    return (client().table("alerts").insert(row).execute().data or [None])[0]

def list_alerts(owner_ids: list[str], limit: int = 500):
    if not owner_ids:
        return []
    return client().table("alerts").select("*").in_("owner_id", owner_ids).eq("status", "open").order("created_at", desc=True).limit(limit).execute().data or []

def insert_commitment(row: dict[str, Any]):
    return (client().table("commitments").insert(row).execute().data or [None])[0]

def list_commitments(owner_ids: list[str], limit: int = 500):
    if not owner_ids:
        return []
    return client().table("commitments").select("*").in_("owner_id", owner_ids).order("due_date").limit(limit).execute().data or []

def list_reviews(owner_ids: list[str], limit: int = 500):
    return client().table("ai_reviews").select("*").limit(limit).execute().data or []

def list_audit(limit: int = 500):
    return client().table("audit_logs").select("*").order("created_at", desc=True).limit(limit).execute().data or []

def insert_audit(actor_id: str, action: str, target_type: str | None = None, target_id: str | None = None, metadata: dict | None = None):
    return client().table("audit_logs").insert({"actor_id": actor_id, "action": action, "target_type": target_type, "target_id": target_id, "metadata": metadata or {}}).execute().data

def upsert_subscription(row: dict[str, Any]):
    return client().table("graph_subscriptions").upsert(row, on_conflict="subscription_id").execute().data

def list_subscriptions():
    return client().table("graph_subscriptions").select("*").execute().data or []

def get_subscription(subscription_id: str):
    rows = client().table("graph_subscriptions").select("*").eq("subscription_id", subscription_id).limit(1).execute().data or []
    return rows[0] if rows else None

def mark_communication_answered(conversation_id: str, answered_at: str):
    rows = client().table("communications").select("id,received_at,sla_hours").eq("thread_id", conversation_id).order("received_at", desc=True).limit(1).execute().data or []
    if not rows: return None
    row=rows[0]
    from datetime import datetime, timezone
    received=datetime.fromisoformat(row["received_at"].replace("Z","+00:00"))
    answered=datetime.fromisoformat(answered_at.replace("Z","+00:00"))
    minutes=max(0,int((answered-received).total_seconds()/60))
    return client().table("communications").update({"answered_at":answered_at,"response_time_minutes":minutes,"lifecycle":"completed" if minutes <= int(row.get("sla_hours") or 48)*60 else "overdue","updated_at":datetime.now(timezone.utc).isoformat()}).eq("id",row["id"]).execute().data
