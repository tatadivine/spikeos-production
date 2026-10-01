from __future__ import annotations

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent))

from test_sync_and_alerts import USER_ID, _seed_comm, api, fake, iso  # noqa: E402,F401

EMP = "22222222-2222-2222-2222-222222222222"


@pytest.fixture()
def manager(api, fake):
    fake.db["profiles"][0]["role"] = "manager"
    fake.db["profiles"].append({"id": EMP, "email": "emp@spike.test", "display_name": "Emp", "role": "employee", "manager_id": USER_ID})
    return api


def seed(fake, cid, owner=EMP, **kw):
    _seed_comm(fake, cid, **kw)
    fake.db["communications"][-1]["owner_id"] = owner


def queue(client):
    return {r["id"]: r for r in client.get("/api/v1/reviews").json()}


def test_employee_cannot_access_reviews(api, fake):
    client, _ = api
    assert client.get("/api/v1/reviews").status_code == 403


def test_queue_contains_only_sla_breaches_pending_by_default(manager, fake):
    client, _ = manager
    seed(fake, "late", hours_ago=100)
    seed(fake, "late_answered", hours_ago=100, answered=iso(50))
    seed(fake, "on_time", hours_ago=30, answered=iso(29))
    seed(fake, "fresh", hours_ago=2)
    seed(fake, "excluded", hours_ago=100, excluded=True)
    seed(fake, "mine", owner=USER_ID, hours_ago=100)

    q = queue(client)
    assert set(q) == {"late", "late_answered"}
    assert q["late"]["status"] == "pending_review"
    assert q["late"]["employeeId"] == EMP
    assert q["late_answered"]["finding"] == "Response outside SLA"
    assert fake.db.get("ai_reviews", []) == []  # nothing fabricated


def test_decision_persists_with_reviewer_and_notes(manager, fake):
    client, _ = manager
    seed(fake, "late", hours_ago=100)

    r = client.post("/api/v1/reviews/late/decision", json={"decision": "needs_context", "notes": "Ask about PTO"})
    assert r.status_code == 200

    row = fake.db["ai_reviews"][0]
    assert row["human_review_status"] == "needs_context"
    assert row["reviewed_by"] == USER_ID
    assert row["employee_id"] == EMP
    assert row["notes"] == "Ask about PTO"
    assert row["performance_record_write_allowed"] is False

    q = queue(client)["late"]
    assert q["status"] == "needs_context"
    assert q["reviewer"] == "Me"
    assert q["notes"] == "Ask about PTO"

    client.post("/api/v1/reviews/late/decision", json={"decision": "confirmed"})
    assert len(fake.db["ai_reviews"]) == 1  # updated, not duplicated
    assert queue(client)["late"]["status"] == "confirmed"


def test_decided_review_survives_communication_completion(manager, fake):
    client, _ = manager
    seed(fake, "late", hours_ago=100)
    client.post("/api/v1/reviews/late/decision", json={"decision": "dismissed"})
    client.post("/api/v1/communications/late/complete")
    assert queue(client)["late"]["status"] == "dismissed"


def test_employee_context_shows_on_review(manager, fake):
    client, _ = manager
    seed(fake, "late", hours_ago=100)
    r = client.post("/api/v1/communications/late/context", json={"category": "PTO", "description": "Out of office"})
    assert r.status_code == 200
    assert fake.db["appeals"][0]["manager_id"] == USER_ID
    ctx = queue(client)["late"]["employeeContext"]
    assert ctx[0]["text"] == "[PTO] Out of office"


def test_invalid_and_forbidden_decisions(manager, fake):
    client, _ = manager
    seed(fake, "late", hours_ago=100)
    seed(fake, "mine", owner=USER_ID, hours_ago=100)
    seed(fake, "on_time", hours_ago=30, answered=iso(29))
    assert client.post("/api/v1/reviews/late/decision", json={"decision": "approve"}).status_code == 422
    assert client.post("/api/v1/reviews/mine/decision", json={"decision": "confirmed"}).status_code == 403
    assert client.post("/api/v1/reviews/on_time/decision", json={"decision": "confirmed"}).status_code == 409
    assert client.post("/api/v1/reviews/nope/decision", json={"decision": "confirmed"}).status_code == 404
