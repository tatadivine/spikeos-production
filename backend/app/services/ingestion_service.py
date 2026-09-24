from datetime import datetime, timezone
from app.repositories import spikeos as repo
from app.services.intelligence import classify_message, response_status
from app.services.graph_service import GraphService, AppGraphClient

def normalize_message(message: dict, owner_id: str):
    sender = ((message.get("from") or {}).get("emailAddress") or {})
    sender_email = sender.get("address", "")
    sender_name = sender.get("name") or sender_email
    subject = message.get("subject") or "(No subject)"
    c = classify_message(sender_email, subject)
    lifecycle, age = response_status(message.get("receivedDateTime"), message.get("sentDateTime") if message.get("sentDateTime") else None, 24 if c["category"] in ("customer","vendor") else 48, c["excluded"])
    return {
        "owner_id": owner_id, "external_message_id": message.get("id"), "thread_id": message.get("conversationId"),
        "sender_email": sender_email, "sender_name": sender_name, "organization": sender_email.split("@")[-1] if "@" in sender_email else sender_email,
        "subject": subject, "body_preview": message.get("bodyPreview") or "", "web_link": message.get("webLink"),
        "received_at": message.get("receivedDateTime"), "sent_at": message.get("sentDateTime"), "category": c["category"],
        "lifecycle": lifecycle, "sla_hours": 24 if c["category"] in ("customer","vendor") else 48, "excluded": c["excluded"], "exclusion_reason": c.get("reason"),
        "priority": "high" if any(x in subject.lower() for x in ("urgent","asap","critical")) else "normal",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

async def ingest_selected_message(message: dict, owner_id: str):
    row = normalize_message(message, owner_id)
    return repo.upsert_communication(row)

async def ingest_notification(user_id: str, message_id: str):
    profiles = repo.get_profile(user_id)
    if not profiles:
        return None
    graph = await AppGraphClient().with_app_token()
    message = await graph.get_user_message(user_id, message_id)
    if not message:
        return None
    return repo.upsert_communication(normalize_message(message, user_id))

async def ingest_sent_notification(user_id: str, message_id: str):
    profile = repo.get_profile(user_id)
    if not profile: return None
    graph = await AppGraphClient().with_app_token()
    message = await graph.get_user_message(user_id, message_id)
    if not message: return None
    if message.get("conversationId") and message.get("sentDateTime"):
        return repo.mark_communication_answered(message["conversationId"], message["sentDateTime"])
    return None
