from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from test_sync_and_alerts import USER_ID, _seed_comm, api, fake, iso  # noqa: E402,F401


def kinds(client):
    return {i["kind"]: i for i in client.get("/api/v1/coaching").json()}


def test_no_records_no_insights(api, fake):
    client, _ = api
    assert client.get("/api/v1/coaching").json() == []


def test_insights_match_dashboard_metrics(api, fake):
    client, _ = api
    for n in range(3):
        _seed_comm(fake, f"ok{n}", hours_ago=30, answered=iso(29))
    _seed_comm(fake, "late", hours_ago=100)

    insights = kinds(client)
    me = next(e for e in client.get("/api/v1/employees").json() if e["id"] == USER_ID)

    assert insights["response"]["headline"] == f"{me['answeredWithin24hPct']}% answered within 24 hours"
    assert f"response score {me['responseScore']}/100" in insights["response"]["evidence"]
    assert sorted(insights["strength"]["evidenceIds"]) == ["ok0", "ok1", "ok2"]
    assert insights["improve"]["headline"] == "1 communication waiting past SLA"
    assert insights["improve"]["evidenceIds"] == ["late"]
    assert all(i["basis"] == "calculated" for i in insights.values())


def test_dismiss_persists_until_facts_change(api, fake):
    client, _ = api
    _seed_comm(fake, "late", hours_ago=100)
    improve = kinds(client)["improve"]

    r = client.post(f"/api/v1/coaching/{improve['id']}/dismiss", json={"signature": improve["signature"]})
    assert r.status_code == 200
    assert "improve" not in kinds(client)  # survives refresh

    _seed_comm(fake, "late2", hours_ago=90)  # new evidence -> signal returns
    assert kinds(client)["improve"]["headline"] == "2 communications waiting past SLA"


def test_context_note_persists(api, fake):
    client, _ = api
    _seed_comm(fake, "late", hours_ago=100)
    iid = kinds(client)["improve"]["id"]
    assert client.post(f"/api/v1/coaching/{iid}/context", json={"context": ""}).status_code == 422
    assert client.post(f"/api/v1/coaching/{iid}/context", json={"context": "Customer on holiday"}).status_code == 200
    notes = kinds(client)["improve"]["contextNotes"]
    assert [n["text"] for n in notes] == ["Customer on holiday"]


def test_cannot_act_on_other_employee_insight(api, fake):
    client, _ = api
    assert client.post("/api/v1/coaching/improve-someone-else/dismiss", json={}).status_code == 403
    assert client.post("/api/v1/coaching/bogus-" + USER_ID + "/dismiss", json={}).status_code == 404


def test_overdue_followup_creates_follow_through_signal(api, fake):
    client, _ = api
    client.post("/api/v1/followups", json={"subject": "Renewal call", "due_date": "2020-01-01"})
    ft = kinds(client)["follow_through"]
    assert ft["headline"] == "1 follow-up past due"
    assert "Renewal call" in ft["evidence"]
