from fastapi import APIRouter

from app.api.v1 import export, knowledge_base, rfp

v1_router = APIRouter(prefix="/api/v1")

v1_router.include_router(knowledge_base.router)
v1_router.include_router(rfp.router)
v1_router.include_router(export.router)
