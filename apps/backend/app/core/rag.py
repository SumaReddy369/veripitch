"""
RAG retrieval engine — Supabase pgvector edition.

Calls the match_chunks() Postgres function (defined in supabase/schema.sql)
which does a cosine-similarity search over the document_chunks table.
"""

from __future__ import annotations

import structlog
from supabase import AsyncClient

from app.config import Settings
from app.models.schemas import MatchedChunk

log = structlog.get_logger(__name__)


async def search_chunks(
    query_embedding: list[float],
    supabase: AsyncClient,
    settings: Settings,
) -> list[MatchedChunk]:
    """
    Call the match_chunks Postgres RPC and return ranked chunks.
    Falls back gracefully if the collection is empty.
    """
    response = await supabase.rpc(
        "match_chunks",
        {
            "query_embedding": query_embedding,
            "match_count": settings.rag_match_count,
            "match_threshold": settings.rag_match_threshold,
        },
    ).execute()

    if not response.data:
        log.debug("rag.no_chunks_found")
        return []

    chunks = [MatchedChunk(**row) for row in response.data]
    log.debug("rag.chunks_retrieved", count=len(chunks))
    return chunks


def assemble_context(chunks: list[MatchedChunk]) -> str:
    """
    Format retrieved chunks into a numbered, attributed context block.

        [1] SOURCE: security_policy.pdf | Page 4
        ...chunk text...
    """
    if not chunks:
        return ""

    parts: list[str] = []
    for i, chunk in enumerate(chunks, start=1):
        parts.append(
            f"[{i}] SOURCE: {chunk.filename} | Page {chunk.page_number}\n"
            f"{chunk.chunk_text}"
        )
    return "\n\n---\n\n".join(parts)
