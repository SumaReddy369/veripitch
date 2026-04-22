"""
Supabase async client — initialized once at startup, injected via FastAPI DI.
The service-role key bypasses RLS — never expose it to the frontend.
"""

from __future__ import annotations

import structlog
from fastapi import Request
from supabase import AsyncClient, acreate_client

from app.config import Settings

log = structlog.get_logger(__name__)


async def init_supabase(settings: Settings) -> AsyncClient:
    """Create the Supabase async client. Called once in the lifespan handler."""
    client: AsyncClient = await acreate_client(
        settings.supabase_url,
        settings.supabase_service_role_key,
    )
    log.info("supabase.connected", url=settings.supabase_url)
    return client


async def get_supabase(request: Request) -> AsyncClient:
    """FastAPI dependency — lazy-loads the Supabase client on first use."""
    from app.main import get_supabase as _get_supabase
    return await _get_supabase(request.app)
