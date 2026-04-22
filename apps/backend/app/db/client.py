"""
ChromaDB persistent client — replaces Supabase for local development.

ChromaDB stores all vector data on disk at `chromadb_path`.
The collection persists between server restarts — no re-ingestion needed.
"""

from __future__ import annotations

import asyncio

import chromadb
import structlog
from chromadb import Collection, PersistentClient
from fastapi import Request

from app.config import Settings

log = structlog.get_logger(__name__)


def init_chromadb(settings: Settings) -> tuple[PersistentClient, Collection]:
    """
    Create a persistent ChromaDB client and ensure the collection exists.
    Called once at application startup.
    ChromaDB is synchronous — we wrap heavy operations with asyncio.to_thread elsewhere.
    """
    client = chromadb.PersistentClient(path=settings.chromadb_path)

    collection = client.get_or_create_collection(
        name=settings.chromadb_collection,
        metadata={"hnsw:space": "cosine"},  # cosine similarity, matches pgvector behaviour
    )

    log.info(
        "chromadb.ready",
        path=settings.chromadb_path,
        collection=settings.chromadb_collection,
        existing_items=collection.count(),
    )
    return client, collection


def get_collection(request: Request) -> Collection:
    """FastAPI dependency: returns the shared ChromaDB collection."""
    return request.app.state.chroma_collection


async def run_in_thread(fn, *args, **kwargs):
    """Helper: run any synchronous ChromaDB call off the async event loop."""
    return await asyncio.to_thread(fn, *args, **kwargs)
