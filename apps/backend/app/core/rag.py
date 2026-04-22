"""
RAG retrieval engine — ChromaDB edition.

Queries the local ChromaDB collection for the top-K most similar chunks
to a query embedding, then formats them into a numbered context string
for the LLM prompt.
"""

from __future__ import annotations

import structlog
from chromadb import Collection

from app.config import Settings
from app.db.client import run_in_thread
from app.models.schemas import MatchedChunk

log = structlog.get_logger(__name__)


async def search_chunks(
    query_embedding: list[float],
    collection: Collection,
    settings: Settings,
) -> list[MatchedChunk]:
    """
    Query ChromaDB for the most semantically similar chunks.
    Returns results sorted by similarity descending.
    """
    n = min(settings.rag_match_count, collection.count())
    if n == 0:
        log.warning("rag.empty_collection")
        return []

    results = await run_in_thread(
        collection.query,
        query_embeddings=[query_embedding],
        n_results=n,
        include=["documents", "metadatas", "distances"],
    )

    chunks: list[MatchedChunk] = []

    # ChromaDB returns lists wrapped in an outer list (one per query)
    ids       = results["ids"][0]
    documents = results["documents"][0]
    metadatas = results["metadatas"][0]
    distances = results["distances"][0]   # cosine distance: 0 = identical

    for chunk_id, doc, meta, dist in zip(ids, documents, metadatas, distances):
        similarity = 1.0 - dist  # convert cosine distance → similarity score
        chunks.append(
            MatchedChunk(
                id=chunk_id,
                filename=meta.get("filename", "unknown"),
                page_number=int(meta.get("page_number", 0)),
                chunk_text=doc,
                similarity=round(similarity, 4),
            )
        )

    log.debug("rag.chunks_retrieved", count=len(chunks))
    return chunks


def assemble_context(chunks: list[MatchedChunk]) -> str:
    """
    Format retrieved chunks into a numbered, attributed context block.

        [1] SOURCE: security_policy.pdf | Page 4
        ...chunk text...

        [2] SOURCE: product_overview.pdf | Page 12
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
