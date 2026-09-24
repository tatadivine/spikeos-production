from __future__ import annotations
import hashlib
import httpx
from app.core.config import settings

GRAPH = "https://graph.microsoft.com/v1.0"

class GraphService:
    def __init__(self, access_token: str | None = None):
        self.access_token = access_token

    @property
    def headers(self):
        return {"Authorization": f"Bearer {self.access_token}", "Accept": "application/json"} if self.access_token else {}

    async def _get(self, url: str, params: dict | None = None):
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.get(url, headers=self.headers, params=params)
            r.raise_for_status()
            return r.json()

    async def get_message(self, message_id: str):
        if not self.access_token or not message_id:
            return None
        return await self._get(f"{GRAPH}/me/messages/{message_id}", {"$select": "id,subject,from,toRecipients,receivedDateTime,sentDateTime,bodyPreview,body,webLink,conversationId,isRead"})

    async def get_user_message(self, user_id: str, message_id: str):
        if not self.access_token or not message_id:
            return None
        return await self._get(f"{GRAPH}/users/{user_id}/messages/{message_id}", {"$select": "id,subject,from,toRecipients,receivedDateTime,sentDateTime,bodyPreview,body,webLink,conversationId,isRead"})

    async def get_inbox_messages(self, top: int = 25):
        return (await self._get(f"{GRAPH}/me/mailFolders/inbox/messages", {"$top": min(max(top, 1), 100), "$orderby": "receivedDateTime desc", "$select": "id,subject,from,receivedDateTime,bodyPreview,webLink,conversationId,isRead"})).get("value", [])

    async def get_users(self):
        data = await self._get(f"{GRAPH}/users", {"$top": 999, "$select": "id,displayName,mail,userPrincipalName,jobTitle,department,accountEnabled"})
        return data.get("value", [])

    async def get_manager(self, user_id: str):
        try:
            return await self._get(f"{GRAPH}/users/{user_id}/manager", {"$select": "id,displayName,mail,userPrincipalName"})
        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 404:
                return None
            raise

class AppGraphClient(GraphService):
    _token: str | None = None

    async def app_token(self) -> str:
        if self._token:
            return self._token
        if not settings.microsoft_client_secret:
            raise RuntimeError("MICROSOFT_CLIENT_SECRET is required for application Graph operations")
        url = f"{settings.microsoft_authority}/{settings.microsoft_tenant_id}/oauth2/v2.0/token"
        data = {"client_id": settings.microsoft_client_id, "client_secret": settings.microsoft_client_secret, "grant_type": "client_credentials", "scope": "https://graph.microsoft.com/.default"}
        async with httpx.AsyncClient(timeout=20) as client:
            r = await client.post(url, data=data)
            r.raise_for_status()
            self._token = r.json()["access_token"]
            return self._token

    async def with_app_token(self):
        self.access_token = await self.app_token()
        return self

    async def create_subscription(self, user_id: str, folder: str = "inbox"):
        await self.with_app_token()
        minutes = min(max(settings.subscription_minutes, 5), 4230)
        from datetime import datetime, timedelta, timezone
        expiration = (datetime.now(timezone.utc) + timedelta(minutes=minutes)).isoformat().replace("+00:00", "Z")
        payload = {
            "changeType": "created,updated",
            "notificationUrl": settings.graph_webhook_url,
            "resource": f"/users/{user_id}/mailFolders('{folder}')/messages",
            "expirationDateTime": expiration,
            "clientState": settings.graph_client_state,
        }
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(f"{GRAPH}/subscriptions", headers=self.headers, json=payload)
            r.raise_for_status()
            return r.json()

    async def renew_subscription(self, subscription_id: str):
        await self.with_app_token()
        from datetime import datetime, timedelta, timezone
        minutes = min(max(settings.subscription_minutes, 5), 4230)
        expiration = (datetime.now(timezone.utc) + timedelta(minutes=minutes)).isoformat().replace("+00:00", "Z")
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.patch(f"{GRAPH}/subscriptions/{subscription_id}", headers=self.headers, json={"expirationDateTime": expiration})
            r.raise_for_status()
            return r.json()

    async def delete_subscription(self, subscription_id: str):
        await self.with_app_token()
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.delete(f"{GRAPH}/subscriptions/{subscription_id}", headers=self.headers)
            if r.status_code not in (204, 404):
                r.raise_for_status()

    async def sync_directory(self):
        await self.with_app_token()
        users = await self.get_users()
        return users
