"""
All Pydantic request/response models for the VeriPitch API.
Keeping models in one file makes the contract immediately readable.
"""

from __future__ import annotations

from enum import Enum
from typing import Annotated

from pydantic import BaseModel, Field, field_validator


# ── Shared ────────────────────────────────────────────────────────────────────

class ApiError(BaseModel):
    """Standard error envelope returned on every non-2xx response."""
    detail: str
    code: str = "INTERNAL_ERROR"


# ── Knowledge Base ────────────────────────────────────────────────────────────

class ChunkInput(BaseModel):
    """Internal: a single chunk ready to be embedded and stored."""
    filename: str
    page_number: int
    chunk_index: int
    chunk_text: str


class ChunkRecord(ChunkInput):
    """A chunk with its computed embedding (pre-insertion)."""
    embedding: list[float]


class UploadResponse(BaseModel):
    message: str
    filename: str
    pages_processed: int
    chunks_created: int


# ── RAG / Vector Search ───────────────────────────────────────────────────────

class MatchedChunk(BaseModel):
    """A chunk returned from the ChromaDB similarity search."""
    id: str
    filename: str
    page_number: int
    chunk_text: str
    similarity: float


# ── LLM ──────────────────────────────────────────────────────────────────────

class LLMResponse(BaseModel):
    """Validated JSON structure expected from GPT-4o."""
    answer: str
    confidence_score: Annotated[int, Field(ge=0, le=100)]
    source_citation: str

    @field_validator("answer")
    @classmethod
    def strip_answer(cls, v: str) -> str:
        return v.strip()


# ── RFP Processing ────────────────────────────────────────────────────────────

class RFPStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class RFPResult(BaseModel):
    """A single processed RFP question with its AI-generated answer."""
    row_index: int = Field(description="1-based row index in the source XLSX")
    question: str
    answer: str
    confidence_score: int = Field(ge=0, le=100)
    source_citation: str
    status: RFPStatus = RFPStatus.PENDING


class ProcessRFPResponse(BaseModel):
    job_id: str
    filename: str
    total_questions: int
    results: list[RFPResult]


# ── Export ────────────────────────────────────────────────────────────────────

class ApprovedAnswer(BaseModel):
    """The user-edited answer for a single RFP row."""
    row_index: int
    answer: str


class ExportRequest(BaseModel):
    """JSON payload sent alongside the original XLSX for export."""
    answers: list[ApprovedAnswer]
