"""
Phase 2 — Knowledge Base Ingestion

POST /api/v1/knowledge-base/upload
  - Accepts a .pdf file
  - Extracts + chunks text with pdfplumber (sliding window 800c / 100c overlap)
  - Generates embeddings locally via sentence-transformers (all-MiniLM-L6-v2)
  - Batch-inserts chunks + embeddings into Supabase document_chunks table
  - Optional ?replace=true deletes existing chunks for the filename first
"""

from __future__ import annotations

import structlog
from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, status
from fastembed import TextEmbedding
from supabase import AsyncClient

from app.config import Settings, get_settings
from app.core.embeddings import get_embeddings_batch
from app.db.client import get_supabase
from app.models.schemas import UploadResponse
from app.utils.pdf_parser import extract_chunks

log = structlog.get_logger(__name__)
router = APIRouter(prefix="/knowledge-base", tags=["Knowledge Base"])

_INSERT_BATCH_SIZE = 100


async def get_embed_model(request: Request) -> TextEmbedding:
    from app.main import get_embedding_model
    return await get_embedding_model(request.app)


@router.post(
    "/upload",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest a PDF into the knowledge base",
)
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    replace: bool = Query(False, description="Delete existing chunks for this file first"),
    settings: Settings = Depends(get_settings),
    supabase: AsyncClient = Depends(get_supabase),
    embed_model: TextEmbedding = Depends(get_embed_model),
) -> UploadResponse:

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only .pdf files are accepted.",
        )

    file_bytes = await file.read()
    if len(file_bytes) > settings.max_pdf_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds the {settings.max_pdf_size // (1024*1024)} MB limit.",
        )

    filename = file.filename
    log.info("upload.start", filename=filename, bytes=len(file_bytes))

    if replace:
        await supabase.rpc("delete_document", {"p_filename": filename}).execute()
        log.info("upload.replaced", filename=filename)

    chunks = extract_chunks(file_bytes, filename)
    if not chunks:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No extractable text found. The PDF may be image-only or encrypted.",
        )

    texts = [c.chunk_text for c in chunks]
    embeddings = await get_embeddings_batch(texts, embed_model)

    pages_seen: set[int] = set()
    for i in range(0, len(chunks), _INSERT_BATCH_SIZE):
        batch_chunks = chunks[i : i + _INSERT_BATCH_SIZE]
        batch_embeddings = embeddings[i : i + _INSERT_BATCH_SIZE]

        payload = [
            {
                "filename": c.filename,
                "page_number": c.page_number,
                "chunk_index": c.chunk_index,
                "chunk_text": c.chunk_text,
                "embedding": emb,
            }
            for c, emb in zip(batch_chunks, batch_embeddings)
        ]

        await supabase.table("document_chunks").insert(payload).execute()
        pages_seen.update(c.page_number for c in batch_chunks)
        log.debug("upload.batch_inserted", start=i, size=len(batch_chunks))

    log.info("upload.complete", filename=filename, pages=len(pages_seen), chunks=len(chunks))

    return UploadResponse(
        message="Document ingested successfully.",
        filename=filename,
        pages_processed=len(pages_seen),
        chunks_created=len(chunks),
    )


@router.delete(
    "/{filename}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove all chunks for a document",
)
async def delete_document(
    filename: str,
    supabase: AsyncClient = Depends(get_supabase),
) -> None:
    await supabase.rpc("delete_document", {"p_filename": filename}).execute()
    log.info("upload.deleted", filename=filename)


@router.get("/", summary="List all ingested documents")
async def list_documents(supabase: AsyncClient = Depends(get_supabase)) -> dict:
    result = await supabase.table("document_chunks").select(
        "filename, chunk_index"
    ).execute()

    if not result.data:
        return {"documents": [], "total_chunks": 0}

    filename_counts: dict[str, int] = {}
    for row in result.data:
        fn = row["filename"]
        filename_counts[fn] = filename_counts.get(fn, 0) + 1

    return {
        "documents": [{"filename": k, "chunks": v} for k, v in filename_counts.items()],
        "total_chunks": len(result.data),
    }
