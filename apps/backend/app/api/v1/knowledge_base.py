"""
Phase 2 — Knowledge Base Ingestion

POST /api/v1/knowledge-base/upload
  - Accepts a .pdf file
  - Extracts + chunks text with pdfplumber
  - Generates embeddings locally via sentence-transformers
  - Stores chunks in ChromaDB (persistent local vector store)
  - Optional ?replace=true removes existing chunks for the same filename first
"""

from __future__ import annotations

import uuid

import structlog
from chromadb import Collection
from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, status
from sentence_transformers import SentenceTransformer

from app.config import Settings, get_settings
from app.core.embeddings import get_embeddings_batch
from app.db.client import get_collection, run_in_thread
from app.models.schemas import UploadResponse
from app.utils.pdf_parser import extract_chunks

log = structlog.get_logger(__name__)
router = APIRouter(prefix="/knowledge-base", tags=["Knowledge Base"])

_INSERT_BATCH_SIZE = 200


def get_embedding_model(request: Request) -> SentenceTransformer:
    return request.app.state.embedding_model


@router.post(
    "/upload",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest a PDF into the local knowledge base",
)
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    replace: bool = Query(False, description="Delete existing chunks for this file first"),
    settings: Settings = Depends(get_settings),
    collection: Collection = Depends(get_collection),
    embed_model: SentenceTransformer = Depends(get_embedding_model),
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

    # Optional: remove old chunks for this document
    if replace:
        existing = await run_in_thread(
            collection.get, where={"filename": filename}
        )
        if existing["ids"]:
            await run_in_thread(collection.delete, ids=existing["ids"])
            log.info("upload.replaced_existing", filename=filename, deleted=len(existing["ids"]))

    # Extract and chunk the PDF
    chunks = extract_chunks(file_bytes, filename)

    if not chunks:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No extractable text found. The PDF may be image-only or encrypted.",
        )

    # Embed all chunks locally
    texts = [c.chunk_text for c in chunks]
    embeddings = await get_embeddings_batch(texts, embed_model)

    # Batch-insert into ChromaDB
    pages_seen: set[int] = set()

    for i in range(0, len(chunks), _INSERT_BATCH_SIZE):
        batch_chunks = chunks[i : i + _INSERT_BATCH_SIZE]
        batch_embeddings = embeddings[i : i + _INSERT_BATCH_SIZE]

        await run_in_thread(
            collection.add,
            ids=[str(uuid.uuid4()) for _ in batch_chunks],
            embeddings=batch_embeddings,
            documents=[c.chunk_text for c in batch_chunks],
            metadatas=[
                {
                    "filename": c.filename,
                    "page_number": c.page_number,
                    "chunk_index": c.chunk_index,
                }
                for c in batch_chunks
            ],
        )
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
    summary="Remove all chunks for a document from the knowledge base",
)
async def delete_document(
    filename: str,
    collection: Collection = Depends(get_collection),
) -> None:
    existing = await run_in_thread(collection.get, where={"filename": filename})
    if existing["ids"]:
        await run_in_thread(collection.delete, ids=existing["ids"])
    log.info("upload.deleted", filename=filename)


@router.get(
    "/",
    summary="List all ingested documents",
)
async def list_documents(
    collection: Collection = Depends(get_collection),
) -> dict:
    total = await run_in_thread(collection.count)
    # Get unique filenames from metadata
    if total == 0:
        return {"documents": [], "total_chunks": 0}

    all_meta = await run_in_thread(collection.get, include=["metadatas"])
    filenames: dict[str, int] = {}
    for meta in all_meta["metadatas"]:
        fn = meta.get("filename", "unknown")
        filenames[fn] = filenames.get(fn, 0) + 1

    return {
        "documents": [{"filename": k, "chunks": v} for k, v in filenames.items()],
        "total_chunks": total,
    }
