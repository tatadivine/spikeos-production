from __future__ import annotations
from datetime import datetime, timezone
from statistics import median
from app.services.intelligence import response_status

def _hours(received, answered=None):
    if not received: return 0.0
    a = datetime.fromisoformat((answered or datetime.now(timezone.utc).isoformat()).replace("Z", "+00:00"))
    r = datetime.fromisoformat(received.replace("Z", "+00:00"))
    return max(0.0, (a-r).total_seconds()/3600)

def compute_employee(profile: dict, communications: list[dict], commitments: list[dict], alerts: list[dict]):
    relevant = [c for c in communications if not c.get("excluded")]
    completed = [c for c in relevant if c.get("answered_at")]
    response_hours = [_hours(c.get("received_at"), c.get("answered_at")) for c in completed]
    sla_ok = [c for c in completed if _hours(c.get("received_at"), c.get("answered_at")) <= (c.get("sla_hours") or 48)]
    score = round((len(sla_ok)/len(completed))*100) if completed else 0
    overdue = [c for c in relevant if not c.get("answered_at") and _hours(c.get("received_at")) > (c.get("sla_hours") or 48)]
    open_commitments = [c for c in commitments if c.get("status") != "completed"]
    return {
        "id": profile["id"], "name": profile.get("display_name") or profile.get("email"), "title": profile.get("job_title") or "Employee",
        "department": profile.get("department") or "Operations", "managerId": profile.get("manager_id"), "email": profile.get("email"),
        "avatarColor": "#2F6BFF", "responseScore": score, "medianResponseMinutes": round(median(response_hours)*60) if response_hours else 0,
        "answeredWithin24hPct": round((len([h for h in response_hours if h <= 24])/len(response_hours))*100) if response_hours else 0,
        "positiveCommunicationPct": round(sum((c.get("quality_score") or 0) for c in completed)/len(completed)) if completed else 0,
        "overdueFollowUps": len(overdue), "openCommitments": len(open_commitments), "slaCompliancePct": score,
    }

def map_communication(c: dict, profile_map: dict):
    owner = profile_map.get(c.get("owner_id"), {})
    sender = c.get("sender_email") or "Unknown"
    return {
      "id": c.get("id"), "contact": c.get("sender_name") or sender, "organization": c.get("organization") or sender.split("@")[-1],
      "category": c.get("category", "internal"), "subject": c.get("subject") or "(No subject)", "bodyPreview": c.get("body_preview") or "",
      "receivedAt": c.get("received_at"), "respondedAt": c.get("answered_at"), "responseTimeMinutes": c.get("response_time_minutes"),
      "status": c.get("lifecycle") if c.get("lifecycle") in {"needs_response","waiting","completed","overdue"} else ("completed" if c.get("answered_at") else "needs_response"),
      "priority": c.get("priority", "normal"), "ownerId": c.get("owner_id"), "nextStep": c.get("next_step") or "Review and respond",
      "qualityScore": c.get("quality_score") or 0, "aiFinding": None, "timeline": [], "excluded": c.get("excluded", False), "exclusionReason": c.get("exclusion_reason")
    }

def map_commitment(c: dict):
    due = c.get("due_date")
    status = c.get("status", "open")
    if status == "completed": ui = "completed"
    elif due:
        dt = datetime.fromisoformat(due.replace("Z", "+00:00")); now=datetime.now(timezone.utc); days=(dt-now).total_seconds()/86400
        ui = "overdue" if days < 0 else "due_today" if days < 1 else "due_this_week" if days < 7 else "active"
    else: ui="active"
    return {"id":c.get("id"),"title":c.get("title"),"source":c.get("source") or "Outlook","ownerId":c.get("owner_id"),"createdAt":c.get("created_at"),"dueDate":due or "","status":ui,"daysOverdue":max(0,int(-((datetime.fromisoformat(due.replace("Z","+00:00"))-datetime.now(timezone.utc)).total_seconds()/86400))) if due and ui=="overdue" else 0,"nextAction":c.get("next_step") or "Close the loop"}
