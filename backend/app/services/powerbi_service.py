from __future__ import annotations

from datetime import datetime, timezone
import httpx
from fastapi import HTTPException

from app.core.config import settings


def _configured() -> bool:
    return all(
        [
            settings.powerbi_tenant_id,
            settings.powerbi_client_id,
            settings.powerbi_client_secret,
            settings.powerbi_workspace_id,
            settings.powerbi_report_id,
        ]
    )


async def _get_powerbi_access_token() -> str:
    if not _configured():
        raise HTTPException(503, "Power BI integration is not configured")

    token_url = (
        f"{settings.powerbi_authority.rstrip('/')}/"
        f"{settings.powerbi_tenant_id}/oauth2/v2.0/token"
    )
    data = {
        "client_id": settings.powerbi_client_id,
        "client_secret": settings.powerbi_client_secret,
        "grant_type": "client_credentials",
        "scope": "https://analysis.windows.net/powerbi/api/.default",
    }
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(token_url, data=data)
    if response.is_error:
        raise HTTPException(502, f"Power BI authentication failed: {response.text[:500]}")
    payload = response.json()
    token = payload.get("access_token")
    if not token:
        raise HTTPException(502, "Power BI authentication returned no access token")
    return token


async def get_powerbi_embed_config(*, user: dict, role: str) -> dict:
    access_token = await _get_powerbi_access_token()
    base = settings.powerbi_api_base_url.rstrip("/")
    report_url = (
        f"{base}/groups/{settings.powerbi_workspace_id}/"
        f"reports/{settings.powerbi_report_id}"
    )

    headers = {"Authorization": f"Bearer {access_token}"}
    async with httpx.AsyncClient(timeout=20) as client:
        report_response = await client.get(report_url, headers=headers)
        if report_response.is_error:
            raise HTTPException(502, f"Power BI report lookup failed: {report_response.text[:500]}")

        token_body: dict = {
            "accessLevel": "View",
            "lifetimeInMinutes": max(1, min(settings.powerbi_embed_token_minutes, 60)),
        }
        if settings.powerbi_rls_enabled:
            if not settings.powerbi_dataset_id:
                raise HTTPException(503, "POWERBI_DATASET_ID is required when Power BI RLS is enabled")
            identity: dict = {
                "username": user.get("email") or user.get("id"),
                "datasets": [settings.powerbi_dataset_id],
            }
            if settings.powerbi_rls_role:
                identity["roles"] = [settings.powerbi_rls_role]
            token_body["identities"] = [identity]

        token_response = await client.post(
            f"{report_url}/GenerateToken",
            headers={**headers, "Content-Type": "application/json"},
            json=token_body,
        )

    if token_response.is_error:
        raise HTTPException(502, f"Power BI embed token generation failed: {token_response.text[:500]}")

    report = report_response.json()
    embed = token_response.json()
    expiration = embed.get("expiration")
    return {
        "type": "report",
        "reportId": report.get("id") or settings.powerbi_report_id,
        "embedUrl": report.get("embedUrl"),
        "embedToken": embed.get("token"),
        "expiration": expiration,
        "role": role,
        "issuedAt": datetime.now(timezone.utc).isoformat(),
        "rlsEnabled": settings.powerbi_rls_enabled,
    }
