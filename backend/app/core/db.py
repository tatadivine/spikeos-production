from supabase import create_client, Client
from app.core.config import settings

_client: Client|None=None

def db():
    global _client
    if not settings.supabase_url or not settings.supabase_service_role_key: return None
    if _client is None: _client=create_client(settings.supabase_url, settings.supabase_service_role_key)
    return _client
