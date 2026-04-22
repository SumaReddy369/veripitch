"""
VeriPitch FastAPI application — Supabase + Groq + fastembed stack.

Startup sequence:
  1. Validate env vars (Pydantic Settings raises on missing required keys)
  2. Configure structlog structured logging
  3. Load fastembed ONNX embedding model (baked into Docker image)
  4. Open Supabase async client (persistent vector store)
  5. Build Groq async client (LLM)
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import structlog
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import v1_router
from app.config import Settings, get_settings
from app.core.embeddings import load_embedding_model
from app.core.llm import build_groq_client
from app.db.client import init_supabase


def _configure_logging(settings: Settings) -> None:
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.dev.ConsoleRenderer()
            if not settings.is_production
            else structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            logging.DEBUG if settings.debug else logging.INFO
        ),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
    )


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    settings: Settings = app.state.settings
    _configure_logging(settings)
    log = structlog.get_logger(__name__)

    log.info("startup", app=settings.app_name, env=settings.app_env)

    # Initialise each dependency independently so a single failure doesn't
    # prevent the server from starting — /health will still respond and logs
    # will show exactly which component failed.
    try:
        app.state.embedding_model = load_embedding_model(settings.embedding_model)
        log.info("startup.embeddings_ready")
    except Exception as exc:
        log.error("startup.embeddings_failed", error=str(exc))
        app.state.embedding_model = None

    try:
        app.state.supabase = await init_supabase(settings)
        log.info("startup.supabase_ready")
    except Exception as exc:
        log.error("startup.supabase_failed", error=str(exc))
        app.state.supabase = None

    try:
        app.state.groq_client = build_groq_client(settings)
        log.info("startup.groq_ready")
    except Exception as exc:
        log.error("startup.groq_failed", error=str(exc))
        app.state.groq_client = None

    log.info("startup.complete", llm=settings.llm_model)

    yield

    log.info("shutdown")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Autonomous RFP Completion Agent — RAG-powered answers from your knowledge base.",
        docs_url="/docs" if not settings.is_production else None,
        redoc_url=None,
        lifespan=lifespan,
    )

    app.state.settings = settings

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(v1_router)

    @app.get("/health", include_in_schema=False)
    async def health() -> dict:
        return {
            "status": "ok",
            "version": settings.app_version,
            "embeddings": app.state.embedding_model is not None,
            "supabase":   app.state.supabase is not None,
            "groq":       app.state.groq_client is not None,
        }

    @app.exception_handler(Exception)
    async def unhandled(request: Request, exc: Exception) -> JSONResponse:
        log = structlog.get_logger(__name__)
        log.error("unhandled_exception", path=request.url.path, error=str(exc), exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "An unexpected error occurred.", "code": "INTERNAL_ERROR"},
        )

    return app


app = create_app()
