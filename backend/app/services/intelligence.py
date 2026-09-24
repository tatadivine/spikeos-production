from __future__ import annotations
from datetime import datetime, timezone
from typing import Any

EXCLUDED_SENDERS = ("noreply", "no-reply", "donotreply", "newsletter", "mailer-daemon")
EXCLUDED_SUBJECTS = ("unsubscribe", "out of office", "automatic reply", "auto-reply")

def classify_message(sender: str, subject: str, *, is_distribution_list: bool = False) -> dict[str, Any]:
    s, subj = (sender or "").lower(), (subject or "").lower()
    excluded = is_distribution_list or any(x in s for x in EXCLUDED_SENDERS) or any(x in subj for x in EXCLUDED_SUBJECTS)
    category = "internal"
    if any(x in subj for x in ("invoice", "purchase", "order", "vendor", "supplier", "rfq")): category = "vendor"
    if any(x in subj for x in ("customer", "client", "support", "request", "quote", "delivery")): category = "customer"
    return {"category": category, "excluded": excluded, "reason": "automated/distribution-list signal" if excluded else None}

def communication_context(subject: str, sender: str) -> dict[str, Any]:
    c = classify_message(sender, subject)
    sla = 24 if c["category"] in ("customer", "vendor") else 48
    return {"status":"received", "category":c["category"], "excluded":c["excluded"], "sla_hours":sla, "sender":sender, "subject":subject, "generated_at":datetime.now(timezone.utc).isoformat()}

def response_status(received_at: str | None, answered_at: str | None, sla_hours: int, excluded: bool) -> tuple[str, float]:
    if not received_at: return ("received", 0.0)
    received = datetime.fromisoformat(received_at.replace("Z", "+00:00"))
    answered = datetime.fromisoformat(answered_at.replace("Z", "+00:00")) if answered_at else datetime.now(timezone.utc)
    age = max(0.0, (answered - received).total_seconds() / 3600)
    if excluded: return ("excluded", age)
    if answered_at: return ("completed" if age <= sla_hours else "overdue", age)
    return ("overdue" if age > sla_hours else "needs_response", age)
