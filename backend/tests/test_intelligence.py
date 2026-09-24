from app.services.intelligence import classify_message, response_status

def test_automated_sender_is_excluded():
    result = classify_message("noreply@example.com", "Weekly newsletter")
    assert result["excluded"] is True

def test_customer_sla_is_overdue():
    status, age = response_status("2026-09-20T08:00:00Z", None, 24, False)
    assert status in {"needs_response", "overdue"}
    assert age >= 0
