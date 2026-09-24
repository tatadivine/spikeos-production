from __future__ import annotations

import time
import httpx
from fastapi import Header, HTTPException
from jose import jwt
from app.core.config import settings

_jwks_cache: dict = {"expires": 0.0, "keys": []}

async def _jwks() -> list[dict]:
    global _jwks_cache
    if _jwks_cache["keys"] and _jwks_cache["expires"] > time.time():
        return _jwks_cache["keys"]
    if not settings.microsoft_tenant_id:
        raise HTTPException(500, "Microsoft tenant is not configured")
    discovery = f"{settings.microsoft_authority}/{settings.microsoft_tenant_id}/v2.0/.well-known/openid-configuration"
    async with httpx.AsyncClient(timeout=15) as client:
        cfg = (await client.get(discovery)).raise_for_status().json()
        keys = (await client.get(cfg["jwks_uri"])).raise_for_status().json()["keys"]
    _jwks_cache = {"expires": time.time() + 3600, "keys": keys}
    return keys

async def validate_token(token: str, *, audience: str | None = None) -> dict:
    if not settings.microsoft_tenant_id or not settings.microsoft_client_id:
        raise HTTPException(500, "Microsoft identity configuration missing")
    try:
        header = jwt.get_unverified_header(token)
        

        key = next(k for k in await _jwks() if k["kid"] == header["kid"])
        issuer = f"https://sts.windows.net/{settings.microsoft_tenant_id}/"
        aud = audience or settings.microsoft_app_id_uri or f"api://{settings.microsoft_client_id}"

        claims = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience=aud,
            issuer=issuer,
        )
        return claims

    except Exception as exc:
        raise HTTPException(
            401,
            f"Invalid Microsoft identity token: {exc}"
        ) from exc

async def get_current_user(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Bearer token required")
    claims = await validate_token(authorization.split(" ", 1)[1])
    roles = claims.get("roles", [])
    scopes = (claims.get("scp") or "").split()
    oid = claims.get("oid")
    if not oid:
        raise HTTPException(401, "Token has no object id")
    return {
        "id": oid,
        "name": claims.get("name") or claims.get("preferred_username") or "Microsoft user",
        "email": claims.get("preferred_username") or claims.get("upn") or claims.get("email"),
        "roles": roles,
        "scopes": scopes,
        "claims": claims,
    }

async def get_graph_user(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Bearer Graph token required")
    claims = await validate_token(authorization.split(" ", 1)[1], audience="https://graph.microsoft.com")
    oid = claims.get("oid")
    if not oid:
        raise HTTPException(401, "Graph token has no object id")
    return {
        "id": oid,
        "name": claims.get("name") or claims.get("preferred_username") or "Microsoft user",
        "email": claims.get("preferred_username") or claims.get("upn") or claims.get("email"),
        "roles": claims.get("roles", []),
        "scopes": (claims.get("scp") or "").split(),
        "access_token": authorization.split(" ", 1)[1],
    }
