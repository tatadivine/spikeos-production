from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from test_sync_and_alerts import USER_ID, api, fake, graph_message  # noqa: E402,F401


def flagged(msg, status="flagged", due="2026-10-05T00:00:00.0000000"):
    msg["flag"] = {"flagStatus": status, "dueDateTime": {"dateTime": due, "timeZone": "UTC"}} if due else {"flagStatus": status}
    return msg


def inbox(client):
    return client.post("/api/v1/outlook/inbox-summary", json={"top": 25}).json()


def test_unflagged_message_creates_no_followup(api, fake):
    client, messages = api
    messages.append(graph_message("m1", 5))
    inbox(client)
    assert fake.db.get("followups", []) == []


def test_flagged_message_creates_one_followup(api, fake):
    client, messages = api
    messages.append(flagged(graph_message("m1", 5)))
    inbox(client)
    inbox(client)  # re-ingest must not duplicate

    rows = fake.db["followups"]
    assert len(rows) == 1
    row = rows[0]
    assert row["source"] == "auto"
    assert row["employee_id"] == USER_ID
    assert row["communication_id"] == fake.db["communications"][0]["id"]
    assert row["due_date"] == "2026-10-05T00:00:00+00:00"
    assert row["contact"] == "Pat Buyer"

    listed = client.get("/api/v1/followups").json()
    assert len(listed) == 1
    assert listed[0]["source"] == "auto"
    assert listed[0]["communicationId"] == row["communication_id"]


def test_spikeos_completion_survives_reingest_of_flagged_message(api, fake):
    client, messages = api
    messages.append(flagged(graph_message("m1", 5)))
    inbox(client)
    fid = fake.db["followups"][0]["id"]

    assert client.post(f"/api/v1/followups/{fid}/complete").status_code == 200
    inbox(client)  # still flagged in Outlook

    assert len(fake.db["followups"]) == 1
    assert fake.db["followups"][0]["status"] == "completed"
    assert fake.db["followups"][0]["completed_at"]
    assert client.get("/api/v1/followups").json()[0]["status"] == "completed"


def test_outlook_flag_complete_completes_followup(api, fake):
    client, messages = api
    msg = flagged(graph_message("m1", 5))
    messages.append(msg)
    inbox(client)
    flagged(msg, status="complete", due=None)
    inbox(client)
    assert fake.db["followups"][0]["status"] == "completed"


def test_manual_followup_from_communication_is_deduplicated(api, fake):
    client, messages = api
    messages.append(graph_message("m1", 5))
    inbox(client)
    cid = fake.db["communications"][0]["id"]

    r1 = client.post("/api/v1/followups", json={"communication_id": cid, "due_date": "2026-10-09", "next_action": "Call Pat"})
    assert r1.status_code == 200 and r1.json()["status"] == "created"
    fu = r1.json()["followUp"]
    assert fu["subject"] == "Customer request: quote"
    assert fu["contact"] == "Pat Buyer"
    assert fu["nextAction"] == "Call Pat"
    assert fu["ownerId"] == USER_ID

    r2 = client.post("/api/v1/followups", json={"communication_id": cid})
    assert r2.json()["status"] == "exists"
    assert len(fake.db["followups"]) == 1


def test_manual_followup_without_communication_requires_subject(api, fake):
    client, _ = api
    assert client.post("/api/v1/followups", json={"due_date": "2026-10-09"}).status_code == 422
    ok = client.post("/api/v1/followups", json={"subject": "Check renewal", "contact": "Acme"})
    assert ok.status_code == 200
    assert fake.db["followups"][0]["source"] == "manual"
    assert fake.db["followups"][0]["created_by"] == USER_ID


def test_cannot_create_followup_for_other_employee(api, fake):
    client, _ = api
    r = client.post("/api/v1/followups", json={"subject": "x", "employee_id": "someone-else"})
    assert r.status_code == 403


def test_followup_status_derivation(api, fake):
    client, _ = api
    client.post("/api/v1/followups", json={"subject": "past", "due_date": "2020-01-01"})
    client.post("/api/v1/followups", json={"subject": "future", "due_date": "2099-01-01"})
    client.post("/api/v1/followups", json={"subject": "none"})
    by_subject = {f["subject"]: f["status"] for f in client.get("/api/v1/followups").json()}
    assert by_subject == {"past": "overdue", "future": "open", "none": "open"}


def test_reschedule_and_assign_persist(api, fake):
    client, _ = api
    fid = client.post("/api/v1/followups", json={"subject": "x", "due_date": "2020-01-01"}).json()["followUp"]["id"]
    r = client.post(f"/api/v1/followups/{fid}/reschedule", json={"due_date": "2099-02-02"})
    assert r.status_code == 200 and r.json()["followUp"]["status"] == "open"
    assert client.post(f"/api/v1/followups/{fid}/assign", json={"employee_id": "someone-else"}).status_code == 403
    assert client.post(f"/api/v1/followups/{fid}/assign", json={"employee_id": USER_ID}).status_code == 200
