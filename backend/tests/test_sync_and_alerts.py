from __future__ import annotations

import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).parent))

from fake_supabase import FakeClient  # noqa: E402

from app.api import routes  # noqa: E402
from app.core.auth import get_current_user, get_graph_user  # noqa: E402
from app.repositories import spikeos as repo  # noqa: E402
from app.services.alert_service import sync_overdue_alerts  # noqa: E402
from app.services.dashboard_service import communication_status  # noqa: E402

USER_ID = "11111111-1111-1111-1111-111111111111"


def iso(hours_ago: float) -> str:
    return (datetime.now(timezone.utc) - timedelta(hours=hours_ago)).isoformat().replace("+00:00", "Z")


def graph_message(msg_id: str, hours_ago: float, subject="Customer request: quote"):
    return {
        "id": msg_id,
        "conversationId": f"conv-{msg_id}",
        "subject": subject,
        "from": {"emailAddress": {"name": "Pat Buyer", "address": "pat@customer.com"}},
        "receivedDateTime": iso(hours_ago),
        "sentDateTime": iso(hours_ago),
        "bodyPreview": "Can you send a quote?",
        "webLink": "https://outlook.office.com/mail/x",
        "isRead": False,
    }


@pytest.fixture()
def fake(monkeypatch):
    client = FakeClient()
    client.db["profiles"] = [
        {"id": USER_ID, "email": "me@spike.test", "display_name": "Me", "role": "employee", "manager_id": None}
    ]
    monkeypatch.setattr(repo, "client", lambda: client)
    return client


@pytest.fixture()
def api(fake, monkeypatch):
    messages: list[dict] = []

    class FakeGraph:
        def __init__(self, _token):
            pass

        async def get_inbox_messages(self, top):
            return messages[:top]

        async def get_message(self, mid):
            return next((m for m in messages if m["id"] == mid), None)

    monkeypatch.setattr(routes, "GraphService", FakeGraph)
    app = FastAPI()
    app.include_router(routes.router, prefix="/api/v1")
    user = {"id": USER_ID, "email": "me@spike.test", "name": "Me", "roles": [], "access_token": "x"}
    app.dependency_overrides[get_current_user] = lambda: user
    app.dependency_overrides[get_graph_user] = lambda: user
    return TestClient(app), messages


# ---------------------------------------------------------------------------
# Shared status definition
# ---------------------------------------------------------------------------

def test_answered_old_message_is_completed():
    assert communication_status({"received_at": iso(500), "answered_at": iso(1), "sla_hours": 24}) == "completed"


def test_unanswered_past_sla_is_overdue_even_if_stored_lifecycle_is_stale():
    c = {"received_at": iso(30), "lifecycle": "needs_response", "sla_hours": 24}
    assert communication_status(c) == "overdue"


def test_unanswered_within_sla_needs_response():
    assert communication_status({"received_at": iso(2), "sla_hours": 24}) == "needs_response"


# ---------------------------------------------------------------------------
# Dashboard complete -> Outlook refresh keeps completed state
# ---------------------------------------------------------------------------

def test_dashboard_complete_survives_outlook_reingest(api, fake):
    client, messages = api
    messages.append(graph_message("m1", hours_ago=100))

    first = client.post("/api/v1/outlook/inbox-summary", json={"top": 25}).json()
    assert first["messages"][0]["status"] == "overdue"
    comm_id = first["messages"][0]["communication_id"]

    done = client.post(f"/api/v1/communications/{comm_id}/complete")
    assert done.status_code == 200

    second = client.post("/api/v1/outlook/inbox-summary", json={"top": 25}).json()
    msg = second["messages"][0]
    assert msg["status"] == "completed"
    assert msg["status_label"] == "Completed"
    assert second["summary"]["overdue"] == 0
    assert second["summary"]["completed"] == 1

    row = fake.db["communications"][0]
    assert row["answered_at"] and row["lifecycle"] == "completed"

    comms = client.get("/api/v1/communications").json()
    assert comms[0]["status"] == "completed"


def test_outlook_and_dashboard_agree_on_status(api):
    client, messages = api
    messages.extend([graph_message("old", 100), graph_message("new", 1)])
    outlook = {m["communication_id"]: m["status"] for m in client.post("/api/v1/outlook/inbox-summary", json={"top": 25}).json()["messages"]}
    dashboard = {c["id"]: c["status"] for c in client.get("/api/v1/communications").json()}
    assert outlook == dashboard


def test_outlook_summary_has_no_hardcoded_metrics(api):
    client, messages = api
    messages.append(graph_message("m1", 100))
    summary = client.post("/api/v1/outlook/inbox-summary", json={"top": 25}).json()["summary"]
    assert summary["response_score"] == 0
    assert summary["within_24h"] == 0


# ---------------------------------------------------------------------------
# Alerts
# ---------------------------------------------------------------------------

def _seed_comm(fake, cid="c1", hours_ago=100, answered=None, excluded=False):
    fake.db.setdefault("communications", []).append(
        {
            "id": cid, "owner_id": USER_ID, "external_message_id": f"ext-{cid}", "subject": "Quote",
            "sender_email": "pat@customer.com", "received_at": iso(hours_ago), "answered_at": answered,
            "sla_hours": 24, "excluded": excluded, "lifecycle": "overdue", "priority": "normal",
        }
    )


def test_overdue_alert_created_once(fake):
    _seed_comm(fake)
    comms = repo.list_communications([USER_ID])
    sync_overdue_alerts([USER_ID], comms)
    sync_overdue_alerts([USER_ID], comms)
    alerts = fake.db["alerts"]
    assert len(alerts) == 1
    assert alerts[0]["communication_id"] == "c1"
    assert alerts[0]["severity"] == "high"


def test_dismissed_alert_is_not_recreated(api, fake):
    client, _ = api
    _seed_comm(fake)
    alerts = client.get("/api/v1/alerts").json()
    assert len(alerts) == 1 and alerts[0]["category"] == "overdue"
    assert client.post(f"/api/v1/alerts/{alerts[0]['id']}/dismiss").status_code == 200
    assert client.get("/api/v1/alerts").json() == []
    assert len(fake.db["alerts"]) == 1
    assert fake.db["alerts"][0]["status"] == "dismissed"


def test_alert_resolves_when_communication_completed(api, fake):
    client, _ = api
    _seed_comm(fake)
    assert len(client.get("/api/v1/alerts").json()) == 1
    assert client.post("/api/v1/communications/c1/complete").status_code == 200
    assert client.get("/api/v1/alerts").json() == []
    assert fake.db["alerts"][0]["status"] == "resolved"


def test_excluded_communication_gets_no_alert(fake):
    _seed_comm(fake, excluded=True)
    sync_overdue_alerts([USER_ID], repo.list_communications([USER_ID]))
    assert fake.db.get("alerts", []) == []


def test_alert_commitment_is_idempotent_and_uses_payload(api, fake):
    client, _ = api
    _seed_comm(fake)
    alert_id = client.get("/api/v1/alerts").json()[0]["id"]

    r1 = client.post(f"/api/v1/alerts/{alert_id}/commitment", json={"due_date": "2026-10-10", "next_step": "Send quote"})
    assert r1.status_code == 200
    r2 = client.post(f"/api/v1/alerts/{alert_id}/commitment")
    assert r2.status_code == 200 and r2.json()["status"] == "exists"

    commitments = fake.db["commitments"]
    assert len(commitments) == 1
    assert commitments[0]["due_date"] == "2026-10-10"
    assert commitments[0]["next_step"] == "Send quote"
    assert commitments[0]["status"] == "open"
    assert commitments[0]["communication_id"] == "c1"
    assert client.get("/api/v1/alerts").json() == []


def test_alert_commitment_without_body(api, fake):
    client, _ = api
    _seed_comm(fake)
    alert_id = client.get("/api/v1/alerts").json()[0]["id"]
    assert client.post(f"/api/v1/alerts/{alert_id}/commitment").status_code == 200


def test_other_users_alert_is_forbidden(api, fake):
    client, _ = api
    fake.db["alerts"] = [{"id": "a-other", "owner_id": "someone-else", "status": "open", "severity": "high", "title": "x", "details": {}}]
    assert client.post("/api/v1/alerts/a-other/dismiss").status_code == 403


def test_reingest_repairs_answered_row_with_stale_lifecycle(api, fake):
    client, messages = api
    messages.append(graph_message("m1", hours_ago=100))
    client.post("/api/v1/outlook/inbox-summary", json={"top": 25})
    row = fake.db["communications"][0]
    # State observed in production: answered but lifecycle overwritten to overdue.
    row.update({"answered_at": iso(50), "response_time_minutes": 3000, "lifecycle": "overdue"})

    out = client.post("/api/v1/outlook/inbox-summary", json={"top": 25}).json()
    assert out["messages"][0]["status"] == "completed"
    assert row["lifecycle"] == "completed"
    assert row["response_time_minutes"] == 3000
