"""
Local embedding engine using fastembed (ONNX Runtime — no PyTorch).

Model: sentence-transformers/all-MiniLM-L6-v2
  - 384 dimensions  (matches pgvector column vector(384))
  - ~80 MB ONNX model download, cached after first run
  - Runs on CPU via ONNXRuntime — no GPU required
  - ~3000 sentences/sec on a single CPU core

fastembed.TextEmbedding.embed() is synchronous and CPU-bound.
We run it via asyncio.to_thread() to avoid blocking the event loop.
"""

from __future__ import annotations

import asyncio
import numpy as np
import structlog
from fastembed import TextEmbedding

log = structlog.get_logger(__name__)

# fastembed model name for all-MiniLM-L6-v2
_FASTEMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2"


def load_embedding_model(model_name: str) -> TextEmbedding:
    """
    Load (and cache) the fastembed ONNX model at startup.
    The model_name config value is accepted for API compatibility but
    we always resolve to the fastembed equivalent.
    """
    log.info("embeddings.loading_model", model=_FASTEMBED_MODEL)
    model = TextEmbedding(model_name=_FASTEMBED_MODEL)
    # Warm-up: force the model file download / cache check now
    _ = list(model.embed(["warmup"]))
    log.info("embeddings.model_ready", model=_FASTEMBED_MODEL)
    return model


async def get_embedding(
    text: str,
    model: TextEmbedding,
) -> list[float]:
    """Return a single normalized embedding vector."""
    def _embed() -> list[float]:
        vecs = list(model.embed([text]))
        return vecs[0].tolist()

    return await asyncio.to_thread(_embed)


async def get_embeddings_batch(
    texts: list[str],
    model: TextEmbedding,
) -> list[list[float]]:
    """Batch-encode a list of texts."""
    log.debug("embeddings.batch_encode", count=len(texts))

    def _embed_batch() -> list[list[float]]:
        vecs = list(model.embed(texts))
        return [v.tolist() for v in vecs]

    return await asyncio.to_thread(_embed_batch)
