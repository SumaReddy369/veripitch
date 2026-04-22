"""
Phase 3 — RFP Processing & RAG Engine

POST /api/v1/rfp/process
  - Accepts an .xlsx file
  - Parses questions from Column A
  - For each question: sentence-transformers embedding → Supabase pgvector search
    → Groq LLM answer
  - Processes questions concurrently (bounded by rfp_concurrency_limit)
  - Returns structured JSON array for the frontend review dashboard
"""

from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timezone

import structlog
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from fastembed import TextEmbedding
from openai import AsyncOpenAI
from supabase import AsyncClient

from app.config import Settings, get_settings
from app.core.embeddings import get_embedding
from app.core.llm import generate_rfp_answer
from app.core.rag import assemble_context, search_chunks
from app.db.client import get_supabase
from app.models.schemas import ProcessRFPResponse, RFPResult, RFPStatus
from app.utils.excel_parser import extract_questions

log = structlog.get_logger(__name__)
router = APIRouter(prefix="/rfp", tags=["RFP"])


async def get_embed_model(request: Request) -> TextEmbedding:
    from app.main import get_embedding_model
    return await get_embedding_model(request.app)


async def get_groq_client(request: Request) -> AsyncOpenAI:
    from app.main import get_groq
    return await get_groq(request.app)


@router.post(
    "/process",
    response_model=ProcessRFPResponse,
    summary="Process an RFP XLSX and generate AI answers via RAG",
)
async def process_rfp(
    request: Request,
    file: UploadFile = File(...),
    settings: Settings = Depends(get_settings),
    supabase: AsyncClient = Depends(get_supabase),
    embed_model: TextEmbedding = Depends(get_embed_model),
    groq_client: AsyncOpenAI = Depends(get_groq_client),
) -> ProcessRFPResponse:

    if not file.filename or not file.filename.lower().endswith(".xlsx"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only .xlsx files are accepted.",
        )

    file_bytes = await file.read()
    if len(file_bytes) > settings.max_xlsx_size:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds the {settings.max_xlsx_size // (1024*1024)} MB limit.",
        )

    filename = file.filename
    job_id = str(uuid.uuid4())
    log.info("rfp.process.start", filename=filename, job_id=job_id)

    questions = extract_questions(file_bytes)
    if not questions:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No questions found in Column A of the workbook.",
        )

    # Log job to Supabase audit table
    await supabase.table("rfp_jobs").insert({
        "id": job_id,
        "original_name": filename,
        "question_count": len(questions),
        "status": "processing",
    }).execute()

    semaphore = asyncio.Semaphore(settings.rfp_concurrency_limit)

    async def process_one(row_index: int, question: str) -> RFPResult:
        async with semaphore:
            try:
                embedding = await get_embedding(question, embed_model)
                chunks = await search_chunks(embedding, supabase, settings)
                context = assemble_context(chunks)
                llm_resp = await generate_rfp_answer(
                    question, context, groq_client, settings
                )
                return RFPResult(
                    row_index=row_index,
                    question=question,
                    answer=llm_resp.answer,
                    confidence_score=llm_resp.confidence_score,
                    source_citation=llm_resp.source_citation,
                    status=RFPStatus.PENDING,
                )
            except Exception as exc:
                log.error("rfp.question_failed", row=row_index, error=str(exc))
                return RFPResult(
                    row_index=row_index,
                    question=question,
                    answer="[Processing error — please review manually]",
                    confidence_score=0,
                    source_citation="N/A",
                    status=RFPStatus.PENDING,
                )

    tasks = [process_one(idx, q) for idx, q in questions]
    results: list[RFPResult] = list(await asyncio.gather(*tasks))
    results.sort(key=lambda r: r.row_index)

    await supabase.table("rfp_jobs").update({
        "status": "complete",
        "completed_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", job_id).execute()

    log.info("rfp.process.complete", job_id=job_id, count=len(results))

    return ProcessRFPResponse(
        job_id=job_id,
        filename=filename,
        total_questions=len(results),
        results=results,
    )
