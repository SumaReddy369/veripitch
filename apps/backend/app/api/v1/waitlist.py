"""
POST /api/v1/waitlist — store an email in the waitlist table.
"""

from fastapi import APIRouter
from pydantic import BaseModel, EmailStr
import structlog

from app.db.client import get_supabase_client

router = APIRouter(tags=["waitlist"])
log = structlog.get_logger(__name__)


class WaitlistRequest(BaseModel):
    email: EmailStr


@router.post("/waitlist", status_code=201)
async def join_waitlist(body: WaitlistRequest):
    """Add an email to the waitlist. Silently ignores duplicates."""
    client = get_supabase_client()
    try:
        client.table("waitlist").upsert(
            {"email": body.email},
            on_conflict="email",
        ).execute()
        log.info("waitlist.joined", email=body.email)
    except Exception as exc:
        log.warning("waitlist.error", error=str(exc))
    return {"ok": True}
