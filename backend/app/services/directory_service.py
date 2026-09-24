from datetime import datetime, timezone
from app.services.graph_service import AppGraphClient
from app.repositories import spikeos as repo

async def sync_directory():
    graph = AppGraphClient()
    users = await graph.sync_directory()
    managers = {}
    for u in users:
        try:
            managers[u["id"]] = await graph.get_manager(u["id"])
        except Exception:
            managers[u["id"]] = None
    for u in users:
        oid = u["id"]
        manager = managers.get(oid) or {}
        repo.upsert_profile({
            "id": oid,
            "email": u.get("mail") or u.get("userPrincipalName"),
            "display_name": u.get("displayName"),
            "manager_id": manager.get("id"),
            "role": "employee",
            "department": u.get("department"),
            "job_title": u.get("jobTitle"),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
    return {"synced": len(users)}
