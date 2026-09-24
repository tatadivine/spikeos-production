from app.repositories import spikeos as repo

def is_admin(user: dict) -> bool:
    return any(str(r).lower() in {"spikeos.admin", "administrator", "admin"} for r in user.get("roles", []))

def effective_role(user: dict, profile: dict | None) -> str:
    roles = {str(r).lower() for r in user.get("roles", [])}
    if is_admin(user): return "administrator"
    if roles & {"spikeos.hr", "hr"}: return "hr"
    if roles & {"spikeos.manager", "manager"}: return "manager"
    if roles & {"spikeos.teamlead", "team_lead", "teamlead"}: return "team_lead"
    role = (profile or {}).get("role") or "employee"
    if role == "employee":
        profiles = repo.list_profiles()
        if any(p.get("manager_id") == user.get("id") for p in profiles):
            return "manager"
    return role if role in {"employee","team_lead","manager","hr","administrator"} else "employee"

def allowed_owner_ids(user_id: str, user: dict) -> list[str]:
    profiles = repo.list_profiles()
    if is_admin(user): return [p["id"] for p in profiles]
    children = {}
    for p in profiles: children.setdefault(p.get("manager_id"), []).append(p["id"])
    allowed = {user_id}
    queue=[user_id]
    while queue:
        current=queue.pop(0)
        for child in children.get(current, []):
            if child not in allowed:
                allowed.add(child); queue.append(child)
    return list(allowed)
