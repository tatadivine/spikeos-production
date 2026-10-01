from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from test_sync_and_alerts import USER_ID, _seed_comm, api, fake, iso  # noqa: E402,F401


def test_evidence_is_derived_from_stored_communications(api, fake):
    client, _ = api
    _seed_comm(fake, "late", hours_ago=100)
    _seed_comm(fake, "ok", hours_ago=30, answered=iso(28))
    _seed_comm(fake, "fresh", hours_ago=2)
    _seed_comm(fake, "news", hours_ago=5, excluded=True)
    fake.db["communications"][-1]["exclusion_reason"] = "automated/distribution-list signal"

    rows = {e["id"]: e for e in client.get("/api/v1/evidence").json()}
    assert rows["late"]["result"] == "confirmed" and rows["late"]["finding"] == "Awaiting response — past SLA"
    assert rows["ok"]["finding"] == "Responded within SLA"
    assert rows["fresh"]["result"] == "under_review"
    assert rows["news"]["result"] == "excluded"
    assert rows["news"]["context"] == "automated/distribution-list signal"
    for e in rows.values():
        assert e["communicationId"] == e["id"]
        assert e["employeeId"] == USER_ID
        assert e["employeeName"] == "Me"
        assert e["rule"].endswith("24h")


def test_bootstrap_and_evidence_endpoint_agree(api, fake):
    client, _ = api
    _seed_comm(fake, "late", hours_ago=100)
    assert client.get("/api/v1/bootstrap").json()["evidence"] == client.get("/api/v1/evidence").json()


def test_evidence_after_completion_reflects_new_state(api, fake):
    client, _ = api
    _seed_comm(fake, "late", hours_ago=100)
    client.post("/api/v1/communications/late/complete")
    e = client.get("/api/v1/evidence").json()[0]
    assert e["finding"] == "Response outside SLA"
