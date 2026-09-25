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


async def _jwks(*, graph: bool = False) -> list[dict]:
    """
    Get Microsoft Entra signing keys.

    SpikeOS API tokens and Microsoft Graph tokens can use different
    token versions/issuers, so Graph validation uses the Graph-compatible
    discovery metadata.
    """
    global _jwks_cache

    cache_key = "graph" if graph else "default"

    cached = _jwks_cache.get(cache_key)

    if (
        isinstance(cached, dict)
        and cached.get("keys")
        and cached.get("expires", 0.0) > time.time()
    ):
        return cached["keys"]

    if not settings.microsoft_tenant_id:
        raise HTTPException(500, "Microsoft tenant is not configured")

    if graph:
        discovery = (
            f"https://login.microsoftonline.com/"
            f"{settings.microsoft_tenant_id}"
            f"/v2.0/.well-known/openid-configuration"
        )
    else:
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

    _jwks_cache[cache_key] = {
        "expires": time.time() + 3600,
        "keys": keys,
    }

    return keys


async def validate_token(
    token: str,
    *,
    audience: str | None = None,
    graph: bool = False,
) -> dict:
    """
    Validate a Microsoft identity token.

    For normal SpikeOS API tokens:
        audience = SpikeOS API Application ID URI

    For Microsoft Graph tokens:
        audience = https://graph.microsoft.com

    Graph tokens are validated against their actual issuer/version.
    """

    if not settings.microsoft_tenant_id:
        raise HTTPException(
            500,
            "Microsoft tenant configuration missing",
        )

    try:
        unverified_claims = jwt.get_unverified_claims(token)

        header = jwt.get_unverified_header(token)

        print(
            "[AUTH DEBUG] token issuer:",
            unverified_claims.get("iss"),
        )
        print(
            "[AUTH DEBUG] token audience:",
            unverified_claims.get("aud"),
        )
        print(
            "[AUTH DEBUG] token version:",
            unverified_claims.get("ver"),
        )

        keys = await _jwks(graph=graph)

        key = next(
            k for k in keys
            if k["kid"] == header["kid"]
        )

        actual_issuer = unverified_claims.get("iss")

        if not actual_issuer:
            raise HTTPException(
                401,
                "Microsoft identity token has no issuer",
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
            issuer=actual_issuer,
        )

        # Explicitly verify that the token belongs to our tenant.
        token_tenant = claims.get("tid")

        if token_tenant != settings.microsoft_tenant_id:
            raise HTTPException(
                401,
                "Microsoft identity token belongs to an unexpected tenant",
            )

        return claims

    except HTTPException:
        raise

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
    """

    if not authorization or not authorization.startswith("Bearer "):
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
    Validate a Microsoft Graph access token received from
    the Outlook NAA add-in and return the token so GraphService
    can forward it to Microsoft Graph.
    """

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            401,
            "Bearer Graph token required",
        )

    token = authorization.split(" ", 1)[1]

    claims = await validate_token(
        token,
        audience="https://graph.microsoft.com",
        graph=True,
    )

    oid = claims.get("oid")

    if not oid:
        raise HTTPException(
            401,
            "Graph token has no object id",
        )

    scopes = (
        claims.get("scp") or ""
    ).split()

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
        "roles": claims.get("roles", []),
        "scopes": scopes,
        "access_token": token,
    }

