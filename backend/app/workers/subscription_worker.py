from __future__ import annotations
import asyncio
from datetime import datetime, timezone
from app.core.config import settings
from app.repositories import spikeos as repo
from app.services.graph_service import AppGraphClient

async def run_subscription_renewal():
    while True:
        try:
            if settings.enable_graph_webhooks and settings.graph_webhook_url and settings.graph_client_state:
                graph=AppGraphClient()
                for sub in repo.list_subscriptions():
                    try:
                        renewed=await graph.renew_subscription(sub["subscription_id"])
                        repo.upsert_subscription({"mailbox_user_id":sub["mailbox_user_id"],"subscription_id":renewed["id"],"resource":renewed["resource"],"expires_at":renewed["expirationDateTime"],"last_renewed_at":datetime.now(timezone.utc).isoformat()})
                    except Exception:
                        continue
        except Exception:
            pass
        await asyncio.sleep(15 * 60)
