from __future__ import annotations
from datetime import datetime, timezone
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from fastapi.responses import PlainTextResponse
from app.core.auth import get_current_user, get_graph_user
from app.core.config import settings
from app.repositories import spikeos as repo
from app.services.access_service import allowed_owner_ids, effective_role, is_admin
from app.services.directory_service import sync_directory
from app.services.graph_service import GraphService, AppGraphClient
from app.services.ingestion_service import ingest_selected_message, ingest_notification, ingest_sent_notification
from app.services.intelligence import communication_context
from app.services.dashboard_service import compute_employee, map_communication, map_commitment
from app.services.openai_service import analyze_message
from app.services.powerbi_service import get_powerbi_embed_config

router = APIRouter()

class Commitment(BaseModel):
    communication_id: str | None = None
    title: str
    due_date: str | None = None
    next_step: str | None = None

class ContextRequest(BaseModel):
    message_id: str | None = None
    subject: str = ""
    sender: str = ""
    body_preview: str = ""

class InboxRequest(BaseModel):
    top: int = Field(default=25, ge=1, le=100)

class AnalyzeRequest(BaseModel):
    subject: str = ""
    body: str = ""

async def _bootstrap(user: dict):
    profiles = repo.list_profiles()
    if not any(p["id"] == user["id"] for p in profiles):
        repo.upsert_profile({"id": user["id"], "email": user.get("email"), "display_name": user.get("name"), "role": "employee"})
        profiles = repo.list_profiles()
    profile_map = {p["id"]: p for p in profiles}
    me = profile_map.get(user["id"]) or {"id": user["id"], "email": user.get("email"), "display_name": user.get("name"), "role": "employee"}
    owners = allowed_owner_ids(user["id"], user)
    comms = repo.list_communications(owners)
    commitments = repo.list_commitments(owners)
    alerts = repo.list_alerts(owners)
    employees = [compute_employee(p, [c for c in comms if c.get("owner_id")==p["id"]], [c for c in commitments if c.get("owner_id")==p["id"]], [a for a in alerts if a.get("owner_id")==p["id"]]) for p in profiles if p["id"] in owners]
    profile_map2 = {e["id"]: e for e in employees}
    mapped_comms = [map_communication(c, profile_map2) for c in comms]
    mapped_commitments = [map_commitment(c) for c in commitments]
    mapped_alerts = [{"id":a.get("id"),"category": "overdue" if a.get("severity")=="high" else "needs_response","severity": a.get("severity","medium"),"time":a.get("created_at"),"source":a.get("title","Outlook"),"reason":a.get("title","Alert"),"recommendedAction":(a.get("details") or {}).get("action","Review communication"),"ownerId":a.get("owner_id")} for a in alerts]
    followups = [{"id":c["id"],"contact":c["contact"],"subject":c["subject"],"ownerId":c["ownerId"],"dueDate":c["dueDate"],"status":"overdue" if c["status"]=="overdue" else "open" if c["status"]!="completed" else "completed","lastActivity":c["createdAt"],"nextAction":c["nextAction"]} for c in mapped_commitments]
    customer_map = {}
    for c in mapped_comms:
        if c["category"] != "customer": continue
        key=c["organization"]; item=customer_map.setdefault(key,{"id":f"customer-{len(customer_map)+1}","name":key,"industry":"Customer","openCommunications":0,"avgResponseMinutes":0,"outstandingCommitments":0,"followUps":0,"health":"steady"})
        item["openCommunications"] += 0 if c["status"]=="completed" else 1
        item["avgResponseMinutes"] += c["responseTimeMinutes"] or 0
    for item in customer_map.values():
        item["health"]="at_risk" if item["openCommunications"]>5 else "strong" if item["openCommunications"]<=1 else "steady"
    insights=[{"id":f"ins-{e['id']}","employeeId":e["id"],"kind":"response","headline":f"{e['answeredWithin24hPct']}% answered within 24 hours","why":"Calculated from tracked Microsoft 365 communications.","evidence":f"Response score {e['responseScore']}/100.","confidencePct":100,"reviewStatus":"reviewed"} for e in employees]
    evidence=[{"id":c["id"],"finding":"Communication response and lifecycle evidence","source":"Microsoft 365 — Outlook","date":c["receivedAt"],"rule":f"{c['category']} response target","evidenceText":f"{c['subject']} — {c['status']}","context":c.get("exclusionReason"),"result":"excluded" if c["excluded"] else "confirmed"} for c in mapped_comms]
    return {"user": {"id": user["id"], "displayName": me.get("display_name") or user.get("name"), "email": me.get("email") or user.get("email"), "title": me.get("job_title") or "Employee", "role": effective_role(user, me), "managerId": me.get("manager_id")}, "employees": employees, "communications": mapped_comms, "commitments": mapped_commitments, "followUps": followups, "alerts": mapped_alerts, "customers": list(customer_map.values()), "insights": insights, "reviews": [], "evidence": evidence, "audit": repo.list_audit() if is_admin(user) else [], "ownerIds": owners}

@router.get("/me")
async def me(user=Depends(get_current_user)):
    profiles = repo.list_profiles()
    p = next((x for x in profiles if x["id"] == user["id"]), None)
    return {"id":user["id"],"displayName":(p or {}).get("display_name") or user.get("name"),"email":(p or {}).get("email") or user.get("email"),"title":(p or {}).get("job_title") or "Employee","role":effective_role(user,p),"managerId":(p or {}).get("manager_id")}

@router.get("/bootstrap")
async def bootstrap(user=Depends(get_current_user)):
    return await _bootstrap(user)

@router.post("/outlook/context")
async def outlook_context(payload: ContextRequest, user=Depends(get_graph_user)):
    data = communication_context(payload.subject, payload.sender)
    data.update({"message_id": payload.message_id, "user": {"id": user["id"], "email": user["email"]}})
    if payload.message_id:
        msg = await GraphService(user["access_token"]).get_message(payload.message_id)
        if msg:
            await ingest_selected_message(msg, user["id"])
    return data

@router.post("/outlook/inbox-summary")
async def outlook_inbox_summary(payload: InboxRequest, user=Depends(get_graph_user)):
    graph = GraphService(user["access_token"])
    messages = await graph.get_inbox_messages(payload.top)
    items=[]
    for m in messages:
        row = await ingest_selected_message(m, user["id"])
        sender=((m.get("from") or {}).get("emailAddress") or {})
        ctx=communication_context(m.get("subject") or "", sender.get("address", ""))
        received=m.get("receivedDateTime")
        age=0
        if received:
            age=max(0,(datetime.now(timezone.utc)-datetime.fromisoformat(received.replace("Z","+00:00"))).total_seconds()/3600)
        status="excluded" if ctx["excluded"] else "overdue" if age>ctx["sla_hours"] else "needs_response"
        items.append({"id":m.get("id"),"conversation_id":m.get("conversationId"),"subject":m.get("subject") or "(No subject)","sender":sender.get("name") or sender.get("address"),"sender_email":sender.get("address"),"received_at":received,"age_hours":round(age,1),"preview":m.get("bodyPreview") or "","web_link":m.get("webLink"),"is_read":m.get("isRead",True),"category":ctx["category"],"excluded":ctx["excluded"],"exclusion_reason":ctx.get("reason"),"sla_hours":ctx["sla_hours"],"status":status,"status_label":"Excluded" if status=="excluded" else "Overdue" if status=="overdue" else "Response needed"})
    return {"mode":"live","summary":{"total":len(items),"relevant":len([i for i in items if not i["excluded"]]),"needs_response":len([i for i in items if i["status"]=="needs_response"]),"overdue":len([i for i in items if i["status"]=="overdue"]),"excluded":len([i for i in items if i["excluded"]]),"response_score": round(100 - min(100, (len([i for i in items if i["status"]=="overdue"])*10))),"open_commitments":len([c for c in repo.list_commitments([user["id"]]) if c.get("status") != "completed"]),"coaching_signals":len([i for i in items if i["status"]=="overdue"])},"messages":items}

@router.post("/outlook/graph-message")
async def graph_message(payload: dict, user=Depends(get_graph_user)):
    msg = await GraphService(user["access_token"]).get_message(payload.get("message_id", ""))
    if not msg: raise HTTPException(404,"Message not found")
    await ingest_selected_message(msg, user["id"])
    return msg

@router.get("/analytics/powerbi/embed")
async def powerbi_embed(user=Depends(get_current_user)):
    profile = repo.get_profile(user["id"])
    role = effective_role(user, profile)
    if settings.powerbi_require_admin and role != "administrator":
        raise HTTPException(403, "Power BI analytics access requires administrator authorization")
    return await get_powerbi_embed_config(user=user, role=role)

@router.get("/dashboard/summary")
async def dashboard_summary(user=Depends(get_current_user)):
    data = await _bootstrap(user)
    mine = next((e for e in data["employees"] if e["id"]==user["id"]), None)
    return {"response_score":(mine or {}).get("responseScore",0),"open_alerts":len([a for a in data["alerts"] if a["ownerId"]==user["id"]]),"within_24h":(mine or {}).get("answeredWithin24hPct",0),"commitments_open":len([c for c in data["commitments"] if c["ownerId"]==user["id"] and c["status"]!="completed"]),"mode":"live"}

@router.post("/commitments")
async def create_commitment(payload: Commitment, user=Depends(get_current_user)):
    row=repo.insert_commitment({"communication_id":payload.communication_id,"owner_id":user["id"],"title":payload.title,"due_date":payload.due_date,"next_step":payload.next_step,"status":"open"})
    repo.insert_audit(user["id"],"Created commitment","commitment",(row or {}).get("id"),{"communication_id":payload.communication_id})
    return {"status":"created","commitment":row}

@router.get("/alerts")
async def alerts(user=Depends(get_current_user)):
    data=await _bootstrap(user)
    return data["alerts"]

@router.get("/communications")
async def communications(user=Depends(get_current_user)):
    return (await _bootstrap(user))["communications"]

@router.get("/communications/{communication_id}")
async def communication(communication_id: str, user=Depends(get_current_user)):
    data=await _bootstrap(user)
    row=next((c for c in data["communications"] if c["id"]==communication_id),None)
    if not row: raise HTTPException(404,"Communication not found")
    return row

@router.get("/commitments")
async def commitments(user=Depends(get_current_user)):
    return (await _bootstrap(user))["commitments"]

@router.get("/employees")
async def employees(user=Depends(get_current_user)):
    return (await _bootstrap(user))["employees"]

@router.get("/employees/{employee_id}")
async def employee(employee_id: str, user=Depends(get_current_user)):
    data=await _bootstrap(user)
    row=next((e for e in data["employees"] if e["id"]==employee_id),None)
    if not row: raise HTTPException(403,"Employee is outside your authorized hierarchy")
    return row

@router.get("/evidence")
async def evidence(user=Depends(get_current_user)):
    data=await _bootstrap(user)
    return [{"id":c["id"],"finding":"Response and lifecycle evidence","source":"Microsoft 365 — Outlook","date":c["receivedAt"],"rule":f"{c['category']} response target","evidenceText":f"{c['subject']} — status {c['status']}","context":c.get("exclusionReason"),"result":"excluded" if c["excluded"] else "confirmed"} for c in data["communications"][:100]]

@router.get("/coaching")
async def coaching(user=Depends(get_current_user)):
    data=await _bootstrap(user)
    out=[]
    for e in data["employees"]:
        if e["id"]!=user["id"] and user["id"] not in data["ownerIds"]: continue
        out.append({"id":f"ins-{e['id']}","employeeId":e["id"],"kind":"response","headline":f"Response score: {e['responseScore']}/100","why":"Calculated from tracked Microsoft 365 response times and SLA rules.","evidence":f"{e['answeredWithin24hPct']}% answered within 24 hours.","confidencePct":100,"reviewStatus":"reviewed"})
    return out

@router.get("/reviews")
async def reviews(user=Depends(get_current_user)):
    if effective_role(user, repo.get_profile(user["id"])) not in {"manager","team_lead","administrator","hr"}:
        raise HTTPException(403,"Manager or authorized reviewer role required")
    owners=allowed_owner_ids(user["id"],user)
    allowed_comms={c["id"] for c in repo.list_communications(owners)}
    return [r for r in repo.list_reviews(owners) if r.get("communication_id") in allowed_comms]

@router.get("/audit")
async def audit(user=Depends(get_current_user)):
    if not is_admin(user): raise HTTPException(403,"Administrator access required")
    return repo.list_audit()

@router.post("/ai/analyze")
async def ai_analyze(payload: AnalyzeRequest, user=Depends(get_current_user)):
    return analyze_message(payload.subject,payload.body)

@router.post("/admin/sync-directory")
async def admin_sync(user=Depends(get_current_user)):
    if not is_admin(user): raise HTTPException(403,"Administrator access required")
    result=await sync_directory()
    repo.insert_audit(user["id"],"Synchronized Microsoft Entra directory","directory",None,result)
    return result

@router.post("/admin/subscriptions")
async def admin_subscriptions(user=Depends(get_current_user)):
    if not is_admin(user): raise HTTPException(403,"Administrator access required")
    profiles=repo.list_profiles(); graph=AppGraphClient(); created=[]
    for p in profiles:
        if not p.get("email"): continue
        try:
            for folder in ("inbox", "sentitems"):
                sub=await graph.create_subscription(p["id"], folder)
                repo.upsert_subscription({"mailbox_user_id":p["id"],"subscription_id":sub["id"],"resource":sub["resource"],"expires_at":sub["expirationDateTime"],"last_renewed_at":datetime.now(timezone.utc).isoformat()})
                created.append(sub["id"])
        except Exception as exc:
            created.append({"user":p.get("email"),"error":str(exc)})
    return {"subscriptions":created}

@router.post("/webhooks/graph", response_class=PlainTextResponse)
async def graph_webhook(request: Request, background_tasks: BackgroundTasks):
    validation=request.query_params.get("validationToken")
    if validation: return validation
    body=await request.json()
    accepted=0
    for n in body.get("value",[]):
        if settings.graph_client_state and n.get("clientState") != settings.graph_client_state:
            continue
        resource=n.get("resource","")
        parts=[p for p in resource.split("/") if p]
        if len(parts)>=4 and parts[0].lower()=="users":
            user_id=parts[1]; message_id=parts[-1]
            try:
                sub=repo.get_subscription(n.get("subscriptionId",""))
                if sub and "sentitems" in sub.get("resource","").lower():
                    background_tasks.add_task(ingest_sent_notification, user_id, message_id)
                else:
                    background_tasks.add_task(ingest_notification, user_id, message_id)
                accepted+=1
            except Exception:
                pass
    return str(accepted)
