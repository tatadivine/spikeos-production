from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_mode: str = "production"
    cors_origins: list[str] = ["http://localhost:5173"]
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    openai_api_key: str = ""
    openai_model: str = "gpt-5.6-mini"
    microsoft_tenant_id: str = ""
    microsoft_client_id: str = ""
    microsoft_client_secret: str = ""
    microsoft_authority: str = "https://login.microsoftonline.com"
    microsoft_app_id_uri: str = ""
    microsoft_api_scope: str = "access_as_user"
    frontend_url: str = "http://localhost:5173"
    outlook_addin_url: str = "https://localhost:5174"
    graph_webhook_url: str = ""
    graph_client_state: str = ""
    enable_graph_webhooks: bool = True
    enable_directory_sync: bool = True
    subscription_minutes: int = 60
    powerbi_tenant_id: str = ""
    powerbi_client_id: str = ""
    powerbi_client_secret: str = ""
    powerbi_workspace_id: str = ""
    powerbi_report_id: str = ""
    powerbi_dataset_id: str = ""
    powerbi_authority: str = "https://login.microsoftonline.com"
    powerbi_api_base_url: str = "https://api.powerbi.com/v1.0/myorg"
    powerbi_embed_token_minutes: int = 60
    powerbi_rls_enabled: bool = False
    powerbi_rls_role: str = ""
    powerbi_require_admin: bool = True
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
