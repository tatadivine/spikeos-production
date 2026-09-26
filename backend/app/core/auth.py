from __future__ import annotations

import time
import httpx
from fastapi import Header, HTTPException
from jose import jwt
from app.core.config import settings


_jwks_cache: dict = {
    "expires": 0.0,
    "keys": [],
}


async def _jwks() -> list[dict]:
    """
    Get Microsoft Entra signing keys for normal SpikeOS API-token validation.

    The Outlook Graph-token path does not use this function because the
    Microsoft Graph access token is forwarded directly to Microsoft Graph.
    """
    global _jwks_cache

    if (
        _jwks_cache["keys"]
        and _jwks_cache["expires"] > time.time()
    ):
        return _jwks_cache["keys"]

    if not settings.microsoft_tenant_id:
        raise HTTPException(
            500,
            "Microsoft tenant is not configured",
        )

    discovery = (
        f"{settings.microsoft_authority}/"
        f"{settings.microsoft_tenant_id}"
        f"/v2.0/.well-known/openid-configuration"
    )

    async with httpx.AsyncClient(timeout=15) as client:
        cfg = (
            await client.get(discovery)
        ).raise_for_status().json()

        keys = (
            await client.get(cfg["jwks_uri"])
        ).raise_for_status().json()["keys"]

    _jwks_cache = {
        "expires": time.time() + 3600,
        "keys": keys,
    }

    return keys


async def validate_token(
    token: str,
    *,
    audience: str | None = None,
) -> dict:
    """
    Validate a normal Microsoft Entra access token issued for SpikeOS.

    This is used by the normal SpikeOS web application authentication
    flow, such as /me and /bootstrap.
    """

    if (
        not settings.microsoft_tenant_id
        or not settings.microsoft_client_id
    ):
        raise HTTPException(
            500,
            "Microsoft identity configuration missing",
        )

    try:
        header = jwt.get_unverified_header(token)

        key = next(
            k
            for k in await _jwks()
            if k["kid"] == header["kid"]
        )

        issuer = (
            f"https://sts.windows.net/"
            f"{settings.microsoft_tenant_id}/"
        )

        aud = (
            audience
            or settings.microsoft_app_id_uri
            or f"api://{settings.microsoft_client_id}"
        )

        claims = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience=aud,
            issuer=issuer,
        )

        return claims

    except StopIteration as exc:
        raise HTTPException(
            401,
            "Microsoft identity token signing key was not found",
        ) from exc

    except Exception as exc:
        raise HTTPException(
            401,
            f"Invalid Microsoft identity token: {exc}",
        ) from exc


async def get_current_user(
    authorization: str | None = Header(default=None),
):
    """
    Validate a normal SpikeOS API access token.

    Used by the main SpikeOS web application.
    """

    if (
        not authorization
        or not authorization.startswith("Bearer ")
    ):
        raise HTTPException(
            401,
            "Bearer token required",
        )

    token = authorization.split(" ", 1)[1]

    claims = await validate_token(token)

    roles = claims.get("roles", [])

    scopes = (
        claims.get("scp") or ""
    ).split()

    oid = claims.get("oid")

    if not oid:
        raise HTTPException(
            401,
            "Token has no object id",
        )

    return {
        "id": oid,
        "name": (
            claims.get("name")
            or claims.get("preferred_username")
            or "Microsoft user"
        ),
        "email": (
            claims.get("preferred_username")
            or claims.get("upn")
            or claims.get("email")
        ),
        "roles": roles,
        "scopes": scopes,
        "claims": claims,
    }


async def get_graph_user(
    authorization: str | None = Header(default=None),
):
    """
    Receive a Microsoft Graph access token from the Outlook NAA add-in.

    The token is issued for Microsoft Graph, so it is intentionally NOT
    validated as a SpikeOS API token.

    Instead, Microsoft Graph is queried using the token to determine
    the signed-in Microsoft 365 user's identity. The Graph user ID is
    then used as the SpikeOS owner/profile ID.
    """

    if (
        not authorization
        or not authorization.startswith("Bearer ")
    ):
        raise HTTPException(
            status_code=401,
            detail="Bearer Graph token required",
        )

    token = authorization.split(" ", 1)[1].strip()

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Graph access token is empty",
        )

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(
                "https://graph.microsoft.com/v1.0/me",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/json",
                },
                params={
                    "$select": "id,displayName,mail,userPrincipalName",
                },
            )

    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail="Unable to contact Microsoft Graph",
        ) from exc

    if response.status_code >= 400:
        try:
            graph_error = response.json().get("error", {})
            graph_code = graph_error.get("code")
            graph_message = graph_error.get("message")
        except Exception:
            graph_code = None
            graph_message = None

        detail = (
            "Microsoft Graph /me request failed "
            f"with status {response.status_code}"
        )

        if graph_code:
            detail += f" ({graph_code})"

        if graph_message:
            detail += f": {graph_message}"

        raise HTTPException(
            status_code=502,
            detail=detail,
        )

    try:
        graph_user = response.json()
    except ValueError as exc:
        raise HTTPException(
            status_code=502,
            detail="Microsoft Graph returned an invalid response",
        ) from exc

    graph_id = graph_user.get("id")

    if not graph_id:
        raise HTTPException(
            status_code=502,
            detail="Microsoft Graph did not return a user ID",
        )

    return {
        "id": graph_id,
        "name": graph_user.get("displayName"),
        "email": (
            graph_user.get("mail")
            or graph_user.get("userPrincipalName")
        ),
        "roles": [],
        "scopes": [],
        "access_token": token,
    }