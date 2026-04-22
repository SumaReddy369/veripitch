"""
VeriPitch FastAPI application factory — local stack edition.

Startup:
  1. Validate env vars (Pydantic Settings raises if GROQ_API_KEY is missing)
  2. Configure structlog
  3. Load sentence-transformers embedding model (downloads ~80 MB on first run)
  4. Open ChromaDB persistent client + collection
  5. Build Groq (OpenAI-compatible) async client
  6. Store all shared resources on app.state
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
from app.db.client import init_chromadb


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

    # 1. Load embedding model (blocks briefly on first run while downloading)
    app.state.embedding_model = load_embedding_model(settings.embedding_model)

    # 2. ChromaDB — local persistent vector store
    chroma_client, chroma_collection = init_chromadb(settings)
    app.state.chroma_client = chroma_client
    app.state.chroma_collection = chroma_collection

    # 3. Groq client (AsyncOpenAI pointed at Groq's base URL)
    app.state.groq_client = build_groq_client(settings)

    log.info("startup.complete", model=settings.llm_model)

    yield

    log.info("shutdown")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Autonomous RFP Completion Agent — RAG-powered answers from your knowledge base.",
        docs_url="/docs",
        redoc_url="/redoc",
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

    @app.get("/health", tags=["Meta"], include_in_schema=False)
    async def health() -> dict[str, str]:
        return {"status": "ok", "version": settings.app_version}

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
