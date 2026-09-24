from contextlib import asynccontextmanager
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.core.config import settings
from app.workers.subscription_worker import run_subscription_renewal

@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(run_subscription_renewal()) if settings.enable_graph_webhooks else None
    yield
    if task:
        task.cancel()

app = FastAPI(title="SpikeOS Communication Intelligence API", version="2.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(router, prefix="/api/v1")

@app.get("/health")
async def health():
    return {"status":"ok","service":"spikeos-backend","mode":settings.app_mode}
