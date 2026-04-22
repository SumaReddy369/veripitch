"""
POST /api/v1/waitlist — store name + email in the waitlist table.
"""

import structlog
from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr
from supabase import AsyncClient

from app.db.client import get_supabase

router = APIRouter(tags=["waitlist"])
log = structlog.get_logger(__name__)


class WaitlistRequest(BaseModel):
    full_name: str
    email: EmailStr


@router.post("/waitlist", status_code=201)
async def join_waitlist(
    body: WaitlistRequest,
    supabase: AsyncClient = Depends(get_supabase),
):
    """Add name + email to the waitlist. Silently deduplicates by email."""
    try:
        await supabase.table("waitlist").upsert(
            {"full_name": body.full_name, "email": body.email},
            on_conflict="email",
        ).execute()
        log.info("waitlist.joined", email=body.email, name=body.full_name)
    except Exception as exc:
        log.warning("waitlist.error", error=str(exc))
    return {"ok": True}
