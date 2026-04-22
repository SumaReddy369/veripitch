"""
Local embedding engine using sentence-transformers.

Model: all-MiniLM-L6-v2
  - 384 dimensions
  - ~80 MB download, cached after first run
  - Runs on CPU — no GPU required
  - ~2500 sentences/sec on a modern laptop

sentence-transformers' encode() is CPU-bound and synchronous.
We run it with asyncio.to_thread() to avoid blocking FastAPI's event loop.
"""

from __future__ import annotations

import asyncio

import structlog
from sentence_transformers import SentenceTransformer

log = structlog.get_logger(__name__)


def load_embedding_model(model_name: str) -> SentenceTransformer:
    """Load (and cache) the sentence-transformers model at startup."""
    log.info("embeddings.loading_model", model=model_name)
    model = SentenceTransformer(model_name)
    log.info("embeddings.model_ready", model=model_name)
    return model


async def get_embedding(
    text: str,
    model: SentenceTransformer,
) -> list[float]:
    """Return a single normalized embedding vector."""
    embedding = await asyncio.to_thread(
        model.encode, text, normalize_embeddings=True
    )
    return embedding.tolist()


async def get_embeddings_batch(
    texts: list[str],
    model: SentenceTransformer,
) -> list[list[float]]:
    """
    Batch-encode a list of texts.
    sentence-transformers handles internal batching efficiently.
    """
    log.debug("embeddings.batch_encode", count=len(texts))
    embeddings = await asyncio.to_thread(
        model.encode,
        texts,
        normalize_embeddings=True,
        show_progress_bar=len(texts) > 50,
        batch_size=64,
    )
    return [e.tolist() for e in embeddings]
