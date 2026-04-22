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
    """
    Lightweight startup: configure logging and mark all deps as unloaded.
    Heavy initialisation (ONNX model, Supabase, Groq) happens lazily on
    first use so the /health endpoint can respond immediately and the
    platform healthcheck passes.
    """
    settings: Settings = app.state.settings
    _configure_logging(settings)
    log = structlog.get_logger(__name__)

    log.info("startup", app=settings.app_name, env=settings.app_env)

    app.state.embedding_model = None
    app.state.supabase = None
    app.state.groq_client = None

    log.info("startup.complete — dependencies will load lazily on first use")

    yield

    log.info("shutdown")


async def get_embedding_model(app: FastAPI):
    """Lazy-load the fastembed ONNX model. Cached on app.state after first call."""
    if app.state.embedding_model is None:
        log = structlog.get_logger(__name__)
        log.info("lazy_load.embeddings")
        app.state.embedding_model = load_embedding_model(app.state.settings.embedding_model)
    return app.state.embedding_model


async def get_supabase(app: FastAPI):
    """Lazy-load the Supabase client. Cached on app.state after first call."""
    if app.state.supabase is None:
        log = structlog.get_logger(__name__)
        log.info("lazy_load.supabase")
        app.state.supabase = await init_supabase(app.state.settings)
    return app.state.supabase


async def get_groq(app: FastAPI):
    """Lazy-load the Groq client. Cached on app.state after first call."""
    if app.state.groq_client is None:
        log = structlog.get_logger(__name__)
        log.info("lazy_load.groq")
        app.state.groq_client = build_groq_client(app.state.settings)
    return app.state.groq_client


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
        """Fast healthcheck — always returns 200 so the platform sees the
        container as ready. Component status is reported for debugging."""
        return {
            "status": "ok",
            "version": settings.app_version,
            "embeddings_loaded": app.state.embedding_model is not None,
            "supabase_loaded":   app.state.supabase is not None,
            "groq_loaded":       app.state.groq_client is not None,
        }

    @app.get("/", include_in_schema=False)
    async def root() -> dict:
        return {"service": settings.app_name, "status": "ok", "docs": "/docs"}

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
