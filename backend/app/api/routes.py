from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from fastapi.responses import PlainTextResponse

from app.core.auth import get_current_user, get_graph_user
from app.core.config import settings
from app.repositories import spikeos as repo
from app.services.access_service import (
    allowed_owner_ids,
    effective_role,
    is_admin,
)
from app.services.directory_service import sync_directory
from app.services.graph_service import GraphService, AppGraphClient
from app.services.ingestion_service import (
    ingest_selected_message,
    ingest_notification,
    ingest_sent_notification,
)
from app.services.intelligence import communication_context
from app.services.dashboard_service import (
    communication_status,
    compute_employee,
    map_communication,
    map_commitment,
)
from app.services.openai_service import analyze_message
from app.services.alert_service import map_alert, sync_overdue_alerts
from app.services.evidence_service import build_evidence
from app.services.review_service import DECISIONS as REVIEW_DECISIONS, SLA_BREACH, build_reviews, sla_breach
from app.services.coaching_service import COACHING_KINDS, apply_coaching_feedback, build_insights
from app.services.powerbi_service import get_powerbi_embed_config


router = APIRouter()


class Commitment(BaseModel):
    communication_id: str | None = None
    title: str
    due_date: str | None = None
    next_step: str | None = None


class AlertCommitment(BaseModel):
    due_date: str | None = None
    next_step: str | None = None


class FollowUpReschedule(BaseModel):
    due_date: str


class FollowUpAssign(BaseModel):
    employee_id: str


class ReviewDecision(BaseModel):
    decision: str
    notes: str | None = None


class CommunicationContext(BaseModel):
    category: str | None = None
    description: str


class CoachingFeedback(BaseModel):
    signature: str | None = None
    context: str | None = None


class FollowUpCreate(BaseModel):
    communication_id: str | None = None
    employee_id: str | None = None
    contact: str | None = None
    subject: str | None = None
    due_date: str | None = None
    next_action: str | None = None


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


class EscalateCommunicationRequest(BaseModel):
    reason: str | None = None


def map_followup(followup: dict):
    """
    Convert the Supabase followups row into the frontend
    FollowUp shape.

    The database stores:
      employee_id
      contact
      subject
      due_date
      status
      last_activity_at

    The frontend expects:
      ownerId
      dueDate
      lastActivity
    """

    due_date = followup.get("due_date")
    status = followup.get("status") or "open"

    # Preserve completed/escalated statuses.
    # For active follow-ups, derive the display status
    # from the due date when possible.
    if status not in {"completed", "escalated"} and due_date:
        try:
            due = datetime.fromisoformat(due_date)
            today = datetime.now(timezone.utc).date()

            if due.date() < today:
                status = "overdue"
            elif due.date() == today:
                status = "due_today"
            else:
                status = "open"
        except (ValueError, TypeError):
            pass

    return {
        "id": followup.get("id"),
        "contact": followup.get("contact") or "Unknown",
        "subject": followup.get("subject") or "(No subject)",
        "ownerId": followup.get("employee_id"),
        "dueDate": due_date or "",
        "status": status,
        "lastActivity": (
            followup.get("last_activity_at")
            or followup.get("created_at")
        ),
        "nextAction": (
            followup.get("next_action")
            or (
                "Complete"
                if status in {"open", "overdue", "due_today"}
                else "Completed"
            )
        ),
        "communicationId": followup.get("communication_id"),
        "source": followup.get("source") or "manual",
        "completedAt": followup.get("completed_at"),
    }


async def _bootstrap(user: dict):
    profiles = repo.list_profiles()

    if not any(p["id"] == user["id"] for p in profiles):
        repo.upsert_profile(
            {
                "id": user["id"],
                "email": user.get("email"),
                "display_name": user.get("name"),
                "role": "employee",
            }
        )
        profiles = repo.list_profiles()

    profile_map = {p["id"]: p for p in profiles}

    me = profile_map.get(user["id"]) or {
        "id": user["id"],
        "email": user.get("email"),
        "display_name": user.get("name"),
        "role": "employee",
    }

    owners = allowed_owner_ids(user["id"], user)

    comms = repo.list_communications(owners)
    sync_overdue_alerts(owners, comms)
    commitments = repo.list_commitments(owners)
    followup_rows = repo.list_followups(owners)
    alerts = repo.list_alerts(owners)

    employees = [
        compute_employee(
            p,
            [
                c
                for c in comms
                if c.get("owner_id") == p["id"]
            ],
            [
                c
                for c in commitments
                if c.get("owner_id") == p["id"]
            ],
            [
                a
                for a in alerts
                if a.get("owner_id") == p["id"]
            ],
        )
        for p in profiles
        if p["id"] in owners
    ]

    profile_map2 = {
        e["id"]: e
        for e in employees
    }

    mapped_comms = [
        map_communication(c, profile_map2)
        for c in comms
    ]

    mapped_commitments = [
        map_commitment(c)
        for c in commitments
    ]

    mapped_followups = [
        map_followup(f)
        for f in followup_rows
    ]

    mapped_alerts = [
        map_alert(a)
        for a in alerts
    ]

    customer_map = {}

    for c in mapped_comms:
        if c["category"] != "customer":
            continue

        key = c["organization"]

        item = customer_map.setdefault(
            key,
            {
                "id": (
                    f"customer-"
                    f"{len(customer_map) + 1}"
                ),
                "name": key,
                "industry": "Customer",
                "openCommunications": 0,
                "avgResponseMinutes": 0,
                "outstandingCommitments": 0,
                "followUps": 0,
                "health": "steady",
            },
        )

        item["openCommunications"] += (
            0
            if c["status"] == "completed"
            else 1
        )

        item["avgResponseMinutes"] += (
            c["responseTimeMinutes"] or 0
        )

    for item in customer_map.values():
        item["health"] = (
            "at_risk"
            if item["openCommunications"] > 5
            else (
                "strong"
                if item["openCommunications"] <= 1
                else "steady"
            )
        )

    insights = apply_coaching_feedback(
        [
            insight
            for e in employees
            for insight in build_insights(
                e,
                [c for c in comms if c.get("owner_id") == e["id"]],
                [f for f in mapped_followups if f.get("ownerId") == e["id"]],
                [c for c in mapped_commitments if c.get("ownerId") == e["id"]],
            )
        ],
        repo.list_coaching_feedback(owners),
    )

    evidence = build_evidence(comms, profile_map)

    return {
        "user": {
            "id": user["id"],
            "displayName": (
                me.get("display_name")
                or user.get("name")
            ),
            "email": (
                me.get("email")
                or user.get("email")
            ),
            "title": (
                me.get("job_title")
                or "Employee"
            ),
            "role": effective_role(
                user,
                me,
            ),
            "managerId": me.get(
                "manager_id"
            ),
        },
        "employees": employees,
        "communications": mapped_comms,
        "commitments": mapped_commitments,
        "followUps": mapped_followups,
        "alerts": mapped_alerts,
        "customers": list(
            customer_map.values()
        ),
        "insights": insights,
        "reviews": [],
        "evidence": evidence,
        "audit": (
            repo.list_audit()
            if is_admin(user)
            else []
        ),
        "ownerIds": owners,
    }


@router.get("/me")
async def me(
    user=Depends(get_current_user),
):
    profiles = repo.list_profiles()

    p = next(
        (
            x
            for x in profiles
            if x["id"] == user["id"]
        ),
        None,
    )

    return {
        "id": user["id"],
        "displayName": (
            (p or {}).get(
                "display_name"
            )
            or user.get("name")
        ),
        "email": (
            (p or {}).get("email")
            or user.get("email")
        ),
        "title": (
            (p or {}).get("job_title")
            or "Employee"
        ),
        "role": effective_role(
            user,
            p,
        ),
        "managerId": (
            (p or {}).get("manager_id")
        ),
    }


@router.get("/bootstrap")
async def bootstrap(
    user=Depends(get_current_user),
):
    return await _bootstrap(user)


@router.post("/outlook/context")
async def outlook_context(
    payload: ContextRequest,
    user=Depends(get_graph_user),
):
    data = communication_context(
        payload.subject,
        payload.sender,
    )

    data.update(
        {
            "message_id": payload.message_id,
            "user": {
                "id": user["id"],
                "email": user["email"],
            },
        }
    )

    if payload.message_id:
        msg = await GraphService(
            user["access_token"]
        ).get_message(
            payload.message_id
        )

        if msg:
            await ingest_selected_message(
                msg,
                user["id"],
            )

    return data








@router.post("/outlook/inbox-summary")
async def outlook_inbox_summary(
    payload: InboxRequest,
    user=Depends(get_graph_user),
):
    graph = GraphService(
        user["access_token"]
    )

    messages = await graph.get_inbox_messages(
        payload.top
    )

    items = []

    for m in messages:
        stored = await ingest_selected_message(
            m,
            user["id"],
        )

        sender = (
            (m.get("from") or {})
            .get("emailAddress")
            or {}
        )

        ctx = communication_context(
            m.get("subject") or "",
            sender.get("address", ""),
        )

        received = m.get(
            "receivedDateTime"
        )

        age = 0

        if received:
            age = max(
                0,
                (
                    datetime.now(timezone.utc)
                    - datetime.fromisoformat(
                        received.replace(
                            "Z",
                            "+00:00",
                        )
                    )
                ).total_seconds()
                / 3600,
            )

        # Supabase is the source of truth for SpikeOS state: a message
        # completed from the Dashboard stays completed here, using the same
        # status rules as the Dashboard (communication_status).
        if ctx["excluded"]:
            status = "excluded"
        elif stored:
            status = communication_status(stored)
        else:
            status = (
                "overdue"
                if age > ctx["sla_hours"]
                else "needs_response"
            )

        items.append(
            {
                "id": m.get("id"),
                "communication_id": (stored or {}).get("id"),
                "conversation_id": m.get(
                    "conversationId"
                ),
                "subject": (
                    m.get("subject")
                    or "(No subject)"
                ),
                "sender": (
                    sender.get("name")
                    or sender.get("address")
                ),
                "sender_email": sender.get(
                    "address"
                ),
                "received_at": received,
                "age_hours": round(age, 1),
                "preview": (
                    m.get("bodyPreview")
                    or ""
                ),
                "web_link": m.get("webLink"),
                "is_read": m.get(
                    "isRead",
                    True,
                ),
                "category": ctx["category"],
                "excluded": ctx["excluded"],
                "exclusion_reason": ctx.get(
                    "reason"
                ),
                "sla_hours": ctx["sla_hours"],
                "status": status,
                "status_label": {
                    "excluded": "Excluded",
                    "overdue": "Overdue",
                    "completed": "Completed",
                    "waiting": "Waiting",
                }.get(status, "Response needed"),
            }
        )

    owners = allowed_owner_ids(
        user["id"],
        user,
    )

    profiles = repo.list_profiles()
    profile = next(
        (
            p
            for p in profiles
            if p.get("id") == user["id"]
        ),
        {
            "id": user["id"],
            "email": user.get("email"),
            "display_name": user.get("name"),
            "role": "employee",
        },
    )

    communications = repo.list_communications(
        owners
    )
    commitments = repo.list_commitments(
        owners
    )
    alerts = repo.list_alerts(
        owners
    )

    employee_metrics = compute_employee(
        profile,
        [
            c
            for c in communications
            if c.get("owner_id") == user["id"]
        ],
        [
            c
            for c in commitments
            if c.get("owner_id") == user["id"]
        ],
        [
            a
            for a in alerts
            if a.get("owner_id") == user["id"]
        ],
    )

    return {
        "mode": "live",
        "summary": {
            "total": len(items),
            "relevant": len(
                [
                    i
                    for i in items
                    if not i["excluded"]
                ]
            ),
            "needs_response": len(
                [
                    i
                    for i in items
                    if i["status"]
                    == "needs_response"
                ]
            ),
            "overdue": len(
                [
                    i
                    for i in items
                    if i["status"]
                    == "overdue"
                ]
            ),
            "excluded": len(
                [
                    i
                    for i in items
                    if i["status"]
                    == "excluded"
                ]
            ),
            "completed": len(
                [
                    i
                    for i in items
                    if i["status"]
                    == "completed"
                ]
            ),
            "response_score": employee_metrics[
                "responseScore"
            ],
            "within_24h": employee_metrics[
                "answeredWithin24hPct"
            ],
            "open_commitments": len(
                [
                    c
                    for c in commitments
                    if c.get("owner_id")
                    == user["id"]
                    and c.get("status")
                    != "completed"
                ]
            ),
            "coaching_signals": len(
                [
                    i
                    for i in items
                    if i["status"]
                    == "overdue"
                ]
            ),
        },
        "messages": items,
    }







@router.post("/outlook/graph-message")
async def graph_message(
    payload: dict,
    user=Depends(get_graph_user),
):
    msg = await GraphService(
        user["access_token"]
    ).get_message(
        payload.get(
            "message_id",
            "",
        )
    )

    if not msg:
        raise HTTPException(
            404,
            "Message not found",
        )

    await ingest_selected_message(
        msg,
        user["id"],
    )

    return msg


@router.get("/analytics/powerbi/embed")
async def powerbi_embed(
    user=Depends(get_current_user),
):
    profile = repo.get_profile(
        user["id"]
    )

    role = effective_role(
        user,
        profile,
    )

    if (
        settings.powerbi_require_admin
        and role != "administrator"
    ):
        raise HTTPException(
            403,
            "Power BI analytics access requires administrator authorization",
        )

    return await get_powerbi_embed_config(
        user=user,
        role=role,
    )


@router.get("/dashboard/summary")
async def dashboard_summary(
    user=Depends(get_current_user),
):
    data = await _bootstrap(user)

    mine = next(
        (
            e
            for e in data["employees"]
            if e["id"] == user["id"]
        ),
        None,
    )

    return {
        "response_score": (
            (mine or {}).get(
                "responseScore",
                0,
            )
        ),
        "open_alerts": len(
            [
                a
                for a in data["alerts"]
                if a["ownerId"]
                == user["id"]
            ]
        ),
        "within_24h": (
            (mine or {}).get(
                "answeredWithin24hPct",
                0,
            )
        ),
        "commitments_open": len(
            [
                c
                for c in data["commitments"]
                if c["ownerId"]
                == user["id"]
                and c["status"]
                != "completed"
            ]
        ),
        "mode": "live",
    }


@router.post("/commitments")
async def create_commitment(
    payload: Commitment,
    user=Depends(get_current_user),
):
    row = repo.insert_commitment(
        {
            "communication_id": (
                payload.communication_id
            ),
            "owner_id": user["id"],
            "title": payload.title,
            "due_date": payload.due_date,
            "next_step": payload.next_step,
            "status": "open",
        }
    )

    repo.insert_audit(
        user["id"],
        "Created commitment",
        "commitment",
        (row or {}).get("id"),
        {
            "communication_id": (
                payload.communication_id
            )
        },
    )

    return {
        "status": "created",
        "commitment": row,
    }





@router.get("/alerts")
async def alerts(
    user=Depends(get_current_user),
):
    data = await _bootstrap(user)
    return data["alerts"]


@router.post("/alerts/{alert_id}/review")
async def review_alert(
    alert_id: str,
    user=Depends(get_current_user),
):
    alert = repo.get_alert(alert_id)

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found",
        )

    owners = allowed_owner_ids(user["id"], user)

    if alert.get("owner_id") not in owners:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to review this alert",
        )

    updated = repo.update_alert(
        alert_id,
        {
            "status": "reviewed",
            "resolved_at": datetime.now(timezone.utc).isoformat(),
        },
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Alert not found",
        )

    repo.insert_audit(
        actor_id=user["id"],
        action="review_alert",
        target_type="alert",
        target_id=alert_id,
    )

    return updated[0]


@router.post("/alerts/{alert_id}/dismiss")
async def dismiss_alert(
    alert_id: str,
    user=Depends(get_current_user),
):
    alert = repo.get_alert(alert_id)

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found",
        )

    owners = allowed_owner_ids(user["id"], user)

    if alert.get("owner_id") not in owners:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to dismiss this alert",
        )

    updated = repo.update_alert(
        alert_id,
        {
            "status": "dismissed",
            "resolved_at": datetime.now(timezone.utc).isoformat(),
        },
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Alert not found",
        )

    repo.insert_audit(
        actor_id=user["id"],
        action="dismiss_alert",
        target_type="alert",
        target_id=alert_id,
    )

    return updated[0]


@router.post("/alerts/{alert_id}/commitment")
async def create_alert_commitment(
    alert_id: str,
    payload: AlertCommitment | None = None,
    user=Depends(get_current_user),
):
    alert = repo.get_alert(alert_id)

    if not alert:
        raise HTTPException(
            status_code=404,
            detail="Alert not found",
        )

    owners = allowed_owner_ids(user["id"], user)

    if alert.get("owner_id") not in owners:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to create a commitment from this alert",
        )

    details = alert.get("details") or {}

    # Idempotent: an alert converts into at most one commitment.
    if details.get("commitment_id"):
        return {
            "id": details["commitment_id"],
            "status": "exists",
        }

    communication_id = (
        alert.get("communication_id")
        or details.get("communication_id")
    )

    subject = (
        details.get("subject")
        or alert.get("title")
        or "Follow up on alert"
    )

    payload = payload or AlertCommitment()

    commitment = repo.insert_commitment(
        {
            "owner_id": alert.get("owner_id") or user["id"],
            "communication_id": communication_id,
            "title": subject,
            "due_date": (
                payload.due_date
                or datetime.now(timezone.utc).date().isoformat()
            ),
            "status": "open",
            "next_step": (
                payload.next_step
                or details.get(
                    "action",
                    "Review and follow up on this alert",
                )
            ),
        }
    )

    repo.update_alert(
        alert_id,
        {
            "status": "converted",
            "resolved_at": datetime.now(timezone.utc).isoformat(),
            "details": {
                **details,
                "commitment_id": (commitment or {}).get("id"),
            },
        },
    )

    repo.insert_audit(
        actor_id=user["id"],
        action="create_commitment_from_alert",
        target_type="alert",
        target_id=alert_id,
        metadata={"commitment_id": (commitment or {}).get("id")},
    )

    return commitment



@router.get("/communications")
async def communications(
    user=Depends(get_current_user),
):
    return (
        await _bootstrap(user)
    )["communications"]


# ============================================================
# COMMUNICATION ACTIONS
# ============================================================

@router.post(
    "/communications/{communication_id}/complete"
)
async def complete_communication(
    communication_id: str,
    user=Depends(get_current_user),
):
    communication = repo.get_communication(
        communication_id
    )

    if not communication:
        raise HTTPException(
            status_code=404,
            detail="Communication not found",
        )

    # Managers, HR, administrators and authorized
    # team leads may act on communications within
    # their permitted owner hierarchy.
    allowed_ids = allowed_owner_ids(
        user["id"],
        user,
    )

    if communication.get("owner_id") not in allowed_ids:
        raise HTTPException(
            status_code=403,
            detail=(
                "You are not authorized to complete "
                "this communication"
            ),
        )

    answered_at = datetime.now(
        timezone.utc
    ).isoformat()

    updated = repo.mark_communication_completed(
        communication_id,
        answered_at,
    )

    if not updated:
        raise HTTPException(
            status_code=500,
            detail="Unable to complete communication",
        )

    updated_row = (
        updated[0]
        if isinstance(updated, list)
        else updated
    )

    repo.insert_audit(
        user["id"],
        "Completed communication",
        "communication",
        communication_id,
        {
            "answered_at": answered_at,
        },
    )

    return {
        "status": "completed",
        "communication": updated_row,
    }


@router.post(
    "/communications/{communication_id}/escalate"
)
async def escalate_communication(
    communication_id: str,
    payload: EscalateCommunicationRequest,
    user=Depends(get_current_user),
):
    communication = repo.get_communication(
        communication_id
    )

    if not communication:
        raise HTTPException(
            status_code=404,
            detail="Communication not found",
        )

    allowed_ids = allowed_owner_ids(
        user["id"],
        user,
    )

    if communication.get("owner_id") not in allowed_ids:
        raise HTTPException(
            status_code=403,
            detail=(
                "You are not authorized to "
                "escalate this communication"
            ),
        )

    subject = (
        communication.get("subject")
        or "Communication"
    )

    reason = (
        payload.reason.strip()
        if payload.reason
        else "Communication escalated for manager review."
    )

    alert = repo.upsert_alert(
        {
            "owner_id": communication.get(
                "owner_id"
            ),
            "title": f"Escalated: {subject}",
            "severity": "high",
            "status": "open",
            "details": {
                "action": (
                    "Review escalated communication"
                ),
                "communication_id": communication_id,
                "reason": reason,
                "subject": subject,
            },
        }
    )

    alert_id = (
        alert.get("id")
        if isinstance(alert, dict)
        else None
    )

    repo.insert_audit(
        user["id"],
        "Escalated communication",
        "communication",
        communication_id,
        {
            "reason": reason,
            "alert_id": alert_id,
        },
    )

    return {
        "status": "escalated",
        "alert": alert,
    }


@router.get(
    "/communications/{communication_id}"
)
async def communication(
    communication_id: str,
    user=Depends(get_current_user),
):
    data = await _bootstrap(user)

    row = next(
        (
            c
            for c in data["communications"]
            if c["id"] == communication_id
        ),
        None,
    )

    if not row:
        raise HTTPException(
            404,
            "Communication not found",
        )

    return row


@router.get("/commitments")
async def commitments(
    user=Depends(get_current_user),
):
    return (
        await _bootstrap(user)
    )["commitments"]


# ============================================================
# FOLLOW-UP ACTIONS
# ============================================================

@router.get("/followups")
async def followups(
    user=Depends(get_current_user),
):
    allowed_ids = allowed_owner_ids(
        user["id"],
        user,
    )

    rows = repo.list_followups(
        allowed_ids
    )

    return [
        map_followup(row)
        for row in rows
    ]


@router.post("/followups")
async def create_followup(
    payload: FollowUpCreate,
    user=Depends(get_current_user),
):
    allowed_ids = allowed_owner_ids(
        user["id"],
        user,
    )

    communication = None

    if payload.communication_id:
        communication = repo.get_communication(
            payload.communication_id
        )

        if not communication:
            raise HTTPException(
                status_code=404,
                detail="Communication not found",
            )

        if communication.get("owner_id") not in allowed_ids:
            raise HTTPException(
                status_code=403,
                detail=(
                    "You are not authorized to create a "
                    "follow-up for this communication"
                ),
            )

        # One open follow-up per communication.
        existing = repo.get_open_followup_for_communication(
            payload.communication_id
        )

        if existing:
            return {
                "status": "exists",
                "followUp": map_followup(existing),
            }

    employee_id = (
        payload.employee_id
        or (communication or {}).get("owner_id")
        or user["id"]
    )

    if employee_id not in allowed_ids:
        raise HTTPException(
            status_code=403,
            detail=(
                "You cannot assign this follow-up "
                "to that employee"
            ),
        )

    subject = (
        (payload.subject or "").strip()
        or (communication or {}).get("subject")
    )

    if not subject:
        raise HTTPException(
            status_code=422,
            detail="A subject is required",
        )

    now = datetime.now(timezone.utc).isoformat()

    row = repo.insert_followup(
        {
            "employee_id": employee_id,
            "communication_id": payload.communication_id,
            "contact": (
                (payload.contact or "").strip()
                or (communication or {}).get("sender_name")
                or (communication or {}).get("sender_email")
                or "Unknown"
            ),
            "subject": subject,
            "due_date": payload.due_date or None,
            "status": "open",
            "source": "manual",
            "next_action": (
                (payload.next_action or "").strip()
                or None
            ),
            "created_by": user["id"],
            "last_activity_at": now,
        }
    )

    repo.insert_audit(
        user["id"],
        "Created follow-up",
        "followup",
        (row or {}).get("id"),
        {
            "communication_id": payload.communication_id,
            "employee_id": employee_id,
        },
    )

    return {
        "status": "created",
        "followUp": map_followup(row or {}),
    }


@router.post(
    "/followups/{followup_id}/complete"
)
async def complete_followup(
    followup_id: str,
    user=Depends(get_current_user),
):
    allowed_ids = allowed_owner_ids(
        user["id"],
        user,
    )

    followup = repo.get_followup(
        followup_id
    )

    if not followup:
        raise HTTPException(
            status_code=404,
            detail="Follow-up not found",
        )

    if followup.get("employee_id") not in allowed_ids:
        raise HTTPException(
            status_code=403,
            detail=(
                "You are not authorized to "
                "complete this follow-up"
            ),
        )

    updated = repo.update_followup(
        followup_id,
        {
            "status": "completed",
            "completed_at": (
                datetime.now(
                    timezone.utc
                ).isoformat()
            ),
            "last_activity_at": (
                datetime.now(
                    timezone.utc
                ).isoformat()
            ),
        },
    )

    if not updated:
        raise HTTPException(
            status_code=500,
            detail="Unable to complete follow-up",
        )

    updated_row = (
        updated[0]
        if isinstance(updated, list)
        else updated
    )

    repo.insert_audit(
        user["id"],
        "Completed follow-up",
        "followup",
        followup_id,
        {
            "employee_id": followup.get(
                "employee_id"
            ),
        },
    )

    return {
        "status": "completed",
        "followUp": map_followup(
            updated_row
        ),
    }


@router.post(
    "/followups/{followup_id}/reschedule"
)
async def reschedule_followup(
    followup_id: str,
    payload: FollowUpReschedule,
    user=Depends(get_current_user),
):
    allowed_ids = allowed_owner_ids(
        user["id"],
        user,
    )

    followup = repo.get_followup(
        followup_id
    )

    if not followup:
        raise HTTPException(
            status_code=404,
            detail="Follow-up not found",
        )

    if followup.get("employee_id") not in allowed_ids:
        raise HTTPException(
            status_code=403,
            detail=(
                "You are not authorized to "
                "reschedule this follow-up"
            ),
        )

    updated = repo.update_followup(
        followup_id,
        {
            "due_date": payload.due_date,
            "last_activity_at": (
                datetime.now(
                    timezone.utc
                ).isoformat()
            ),
        },
    )

    if not updated:
        raise HTTPException(
            status_code=500,
            detail="Unable to reschedule follow-up",
        )

    updated_row = (
        updated[0]
        if isinstance(updated, list)
        else updated
    )

    repo.insert_audit(
        user["id"],
        "Rescheduled follow-up",
        "followup",
        followup_id,
        {
            "old_due_date": followup.get(
                "due_date"
            ),
            "new_due_date": payload.due_date,
        },
    )

    return {
        "status": "rescheduled",
        "followUp": map_followup(
            updated_row
        ),
    }


@router.post(
    "/followups/{followup_id}/assign"
)
async def assign_followup(
    followup_id: str,
    payload: FollowUpAssign,
    user=Depends(get_current_user),
):
    allowed_ids = allowed_owner_ids(
        user["id"],
        user,
    )

    followup = repo.get_followup(
        followup_id
    )

    if not followup:
        raise HTTPException(
            status_code=404,
            detail="Follow-up not found",
        )

    if followup.get("employee_id") not in allowed_ids:
        raise HTTPException(
            status_code=403,
            detail=(
                "You are not authorized to "
                "assign this follow-up"
            ),
        )

    if payload.employee_id not in allowed_ids:
        raise HTTPException(
            status_code=403,
            detail=(
                "You cannot assign this follow-up "
                "to that employee"
            ),
        )

    updated = repo.update_followup(
        followup_id,
        {
            "employee_id": payload.employee_id,
            "last_activity_at": (
                datetime.now(
                    timezone.utc
                ).isoformat()
            ),
        },
    )

    if not updated:
        raise HTTPException(
            status_code=500,
            detail="Unable to assign follow-up",
        )

    updated_row = (
        updated[0]
        if isinstance(updated, list)
        else updated
    )

    repo.insert_audit(
        user["id"],
        "Assigned follow-up",
        "followup",
        followup_id,
        {
            "old_employee_id": followup.get(
                "employee_id"
            ),
            "new_employee_id": payload.employee_id,
        },
    )

    return {
        "status": "assigned",
        "followUp": map_followup(
            updated_row
        ),
    }


@router.get("/employees")
async def employees(
    user=Depends(get_current_user),
):
    return (
        await _bootstrap(user)
    )["employees"]


@router.get(
    "/employees/{employee_id}"
)
async def employee(
    employee_id: str,
    user=Depends(get_current_user),
):
    data = await _bootstrap(user)

    row = next(
        (
            e
            for e in data["employees"]
            if e["id"] == employee_id
        ),
        None,
    )

    if not row:
        raise HTTPException(
            403,
            "Employee is outside your authorized hierarchy",
        )

    return row


@router.get("/evidence")
async def evidence(
    user=Depends(get_current_user),
):
    return (
        await _bootstrap(user)
    )["evidence"]


@router.get("/coaching")
async def coaching(
    user=Depends(get_current_user),
):
    return (
        await _bootstrap(user)
    )["insights"]


def _insight_employee(insight_id: str, user: dict) -> str:
    kind, _, employee_id = insight_id.partition("-")

    if kind not in COACHING_KINDS or not employee_id:
        raise HTTPException(
            status_code=404,
            detail="Coaching insight not found",
        )

    if employee_id not in allowed_owner_ids(user["id"], user):
        raise HTTPException(
            status_code=403,
            detail="Not authorized for this employee's coaching",
        )

    return employee_id


@router.post("/coaching/{insight_id}/dismiss")
async def dismiss_coaching(
    insight_id: str,
    payload: CoachingFeedback,
    user=Depends(get_current_user),
):
    employee_id = _insight_employee(insight_id, user)

    row = repo.insert_coaching_feedback(
        {
            "insight_key": insight_id,
            "employee_id": employee_id,
            "action": "dismissed",
            "signature": payload.signature,
            "created_by": user["id"],
        }
    )

    repo.insert_audit(
        user["id"],
        "Dismissed coaching insight",
        "coaching",
        insight_id,
        {"signature": payload.signature},
    )

    return {"status": "dismissed", "feedback": row}


@router.post("/coaching/{insight_id}/context")
async def coaching_context(
    insight_id: str,
    payload: CoachingFeedback,
    user=Depends(get_current_user),
):
    employee_id = _insight_employee(insight_id, user)
    text = (payload.context or "").strip()

    if not text:
        raise HTTPException(
            status_code=422,
            detail="Context text is required",
        )

    row = repo.insert_coaching_feedback(
        {
            "insight_key": insight_id,
            "employee_id": employee_id,
            "action": "context",
            "signature": payload.signature,
            "context": text,
            "created_by": user["id"],
        }
    )

    repo.insert_audit(
        user["id"],
        "Added coaching context",
        "coaching",
        insight_id,
        {},
    )

    return {"status": "saved", "feedback": row}


REVIEWER_ROLES = {
    "manager",
    "team_lead",
    "administrator",
    "hr",
}


def _require_reviewer(user: dict):
    if effective_role(
        user,
        repo.get_profile(user["id"]),
    ) not in REVIEWER_ROLES:
        raise HTTPException(
            403,
            "Manager or authorized reviewer role required",
        )


@router.get("/reviews")
async def reviews(
    user=Depends(get_current_user),
):
    _require_reviewer(user)

    owners = [
        o
        for o in allowed_owner_ids(user["id"], user)
        if o != user["id"]  # no self-review
    ]

    comms = repo.list_communications(owners)
    ids = [c["id"] for c in comms]

    return build_reviews(
        comms,
        repo.list_reviews(ids),
        repo.list_appeals(ids),
        {p["id"]: p for p in repo.list_profiles()},
    )


@router.post("/reviews/{communication_id}/decision")
async def review_decision(
    communication_id: str,
    payload: ReviewDecision,
    user=Depends(get_current_user),
):
    _require_reviewer(user)

    if payload.decision not in REVIEW_DECISIONS:
        raise HTTPException(
            422,
            "Unknown review decision",
        )

    communication = repo.get_communication(communication_id)

    if not communication:
        raise HTTPException(
            404,
            "Communication not found",
        )

    owner_id = communication.get("owner_id")

    if owner_id == user["id"]:
        raise HTTPException(
            403,
            "You cannot review your own communication",
        )

    if owner_id not in allowed_owner_ids(user["id"], user):
        raise HTTPException(
            403,
            "Employee is outside your authorized hierarchy",
        )

    detail = sla_breach(communication)
    existing = repo.get_review(communication_id, SLA_BREACH)

    if not detail and not existing:
        raise HTTPException(
            409,
            "There is no review signal for this communication",
        )

    now = datetime.now(timezone.utc).isoformat()

    row = repo.save_review(
        {
            "communication_id": communication_id,
            "finding_type": SLA_BREACH,
            "employee_id": owner_id,
            "finding": detail or (existing or {}).get("finding"),
            "confidence": 1,
            "evidence": [
                {
                    "communication_id": communication_id,
                    "received_at": communication.get("received_at"),
                    "answered_at": communication.get("answered_at"),
                    "sla_hours": communication.get("sla_hours"),
                }
            ],
            "requires_human_review": True,
            "performance_record_write_allowed": False,
            "human_review_status": payload.decision,
            "notes": (payload.notes or "").strip() or None,
            "reviewed_by": user["id"],
            "reviewed_at": now,
            "updated_at": now,
        }
    )

    repo.insert_audit(
        user["id"],
        "Review decision",
        "communication",
        communication_id,
        {
            "decision": payload.decision,
            "previous": (existing or {}).get("human_review_status"),
        },
    )

    return {
        "status": payload.decision,
        "review": row,
    }


@router.post("/communications/{communication_id}/context")
async def communication_context_note(
    communication_id: str,
    payload: CommunicationContext,
    user=Depends(get_current_user),
):
    communication = repo.get_communication(communication_id)

    if not communication:
        raise HTTPException(
            404,
            "Communication not found",
        )

    if communication.get("owner_id") not in allowed_owner_ids(user["id"], user):
        raise HTTPException(
            403,
            "Not authorized for this communication",
        )

    text = (payload.description or "").strip()

    if not text:
        raise HTTPException(
            422,
            "A description is required",
        )

    owner = repo.get_profile(communication.get("owner_id")) or {}

    row = repo.insert_appeal(
        {
            "communication_id": communication_id,
            "employee_id": communication.get("owner_id"),
            "context": (
                f"[{payload.category}] {text}"
                if payload.category
                else text
            ),
            "status": "pending",
            "manager_id": owner.get("manager_id"),
        }
    )

    repo.insert_audit(
        user["id"],
        "Submitted communication context",
        "communication",
        communication_id,
        {"category": payload.category},
    )

    return {
        "status": "submitted",
        "appeal": row,
    }


@router.get("/audit")
async def audit(
    user=Depends(get_current_user),
):
    if not is_admin(user):
        raise HTTPException(
            403,
            "Administrator access required",
        )

    return repo.list_audit()


@router.post("/ai/analyze")
async def ai_analyze(
    payload: AnalyzeRequest,
    user=Depends(get_current_user),
):
    return analyze_message(
        payload.subject,
        payload.body,
    )


@router.post("/admin/sync-directory")
async def admin_sync(
    user=Depends(get_current_user),
):
    if not is_admin(user):
        raise HTTPException(
            403,
            "Administrator access required",
        )

    result = await sync_directory()

    repo.insert_audit(
        user["id"],
        "Synchronized Microsoft Entra directory",
        "directory",
        None,
        result,
    )

    return result


@router.post("/admin/subscriptions")
async def admin_subscriptions(
    user=Depends(get_current_user),
):
    if not is_admin(user):
        raise HTTPException(
            403,
            "Administrator access required",
        )

    profiles = repo.list_profiles()
    graph = AppGraphClient()
    created = []

    for p in profiles:
        if not p.get("email"):
            continue

        try:
            for folder in (
                "inbox",
                "sentitems",
            ):
                sub = await graph.create_subscription(
                    p["id"],
                    folder,
                )

                repo.upsert_subscription(
                    {
                        "mailbox_user_id": p["id"],
                        "subscription_id": sub["id"],
                        "resource": sub["resource"],
                        "expires_at": sub[
                            "expirationDateTime"
                        ],
                        "last_renewed_at": (
                            datetime.now(
                                timezone.utc
                            ).isoformat()
                        ),
                    }
                )

                created.append(
                    sub["id"]
                )

        except Exception as exc:
            created.append(
                {
                    "user": p.get("email"),
                    "error": str(exc),
                }
            )

    return {
        "subscriptions": created
    }


@router.post(
    "/webhooks/graph",
    response_class=PlainTextResponse,
)
async def graph_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
):
    validation = request.query_params.get(
        "validationToken"
    )

    if validation:
        return validation

    body = await request.json()

    accepted = 0

    for n in body.get("value", []):
        if (
            settings.graph_client_state
            and n.get("clientState")
            != settings.graph_client_state
        ):
            continue

        resource = n.get(
            "resource",
            "",
        )

        parts = [
            p
            for p in resource.split("/")
            if p
        ]

        if (
            len(parts) >= 4
            and parts[0].lower()
            == "users"
        ):
            user_id = parts[1]
            message_id = parts[-1]

            try:
                sub = repo.get_subscription(
                    n.get(
                        "subscriptionId",
                        "",
                    )
                )

                if (
                    sub
                    and "sentitems"
                    in sub.get(
                        "resource",
                        "",
                    ).lower()
                ):
                    background_tasks.add_task(
                        ingest_sent_notification,
                        user_id,
                        message_id,
                    )
                else:
                    background_tasks.add_task(
                        ingest_notification,
                        user_id,
                        message_id,
                    )

                accepted += 1

            except Exception:
                pass

    return str(accepted)