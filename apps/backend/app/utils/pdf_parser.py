"""
PDF text extraction and chunking.

Strategy:
  - Extract text page-by-page with pdfplumber (handles tables better than PyPDF2).
  - Apply a sliding-window chunker: 800-character target size, 100-character overlap.
    This reduces context bleeding at chunk boundaries — a known RAG quality issue.
  - Filter out chunks that are too short to carry semantic meaning (<50 chars).
"""

from __future__ import annotations

import io
import re

import pdfplumber
import structlog

from app.models.schemas import ChunkInput

log = structlog.get_logger(__name__)

CHUNK_SIZE = 800
CHUNK_OVERLAP = 100
MIN_CHUNK_LENGTH = 50


def _sliding_window_chunks(text: str, size: int, overlap: int) -> list[str]:
    """
    Split a string into overlapping windows.
    Uses word boundaries to avoid slicing mid-token.
    """
    chunks: list[str] = []
    start = 0
    text = text.strip()

    while start < len(text):
        end = start + size

        if end < len(text):
            # Walk back to the nearest whitespace so we don't cut mid-word
            boundary = text.rfind(" ", start, end)
            if boundary != -1 and boundary > start:
                end = boundary

        chunk = text[start:end].strip()
        if len(chunk) >= MIN_CHUNK_LENGTH:
            chunks.append(chunk)

        start = end - overlap  # slide back by the overlap amount

    return chunks


def _clean_text(raw: str) -> str:
    """Normalize whitespace and remove null bytes that break embeddings."""
    text = raw.replace("\x00", "")
    text = re.sub(r"\n{3,}", "\n\n", text)   # collapse excessive newlines
    text = re.sub(r"[ \t]{2,}", " ", text)   # collapse horizontal whitespace
    return text.strip()


def extract_chunks(file_bytes: bytes, filename: str) -> list[ChunkInput]:
    """
    Main entry point: accept raw PDF bytes, return a flat list of ChunkInputs
    ready to be embedded and stored.
    """
    chunks: list[ChunkInput] = []

    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        total_pages = len(pdf.pages)
        log.info("pdf.opened", filename=filename, total_pages=total_pages)

        for page_num, page in enumerate(pdf.pages, start=1):
            raw_text = page.extract_text()

            if not raw_text:
                log.debug("pdf.empty_page", filename=filename, page=page_num)
                continue

            clean = _clean_text(raw_text)
            page_chunks = _sliding_window_chunks(clean, CHUNK_SIZE, CHUNK_OVERLAP)

            for idx, chunk_text in enumerate(page_chunks):
                chunks.append(
                    ChunkInput(
                        filename=filename,
                        page_number=page_num,
                        chunk_index=idx,
                        chunk_text=chunk_text,
                    )
                )

        log.info(
            "pdf.extracted",
            filename=filename,
            total_pages=total_pages,
            total_chunks=len(chunks),
        )

    return chunks
