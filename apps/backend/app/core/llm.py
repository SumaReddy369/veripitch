"""
LLM chain — Groq via the OpenAI-compatible client.

Groq's API is a drop-in replacement for OpenAI's chat completions endpoint.
We point the AsyncOpenAI client at Groq's base URL and use
llama-3.3-70b-versatile as the default model.

Design:
  - temperature=0  → deterministic, auditable answers
  - JSON mode      → guaranteed parseable output
  - tenacity       → exponential backoff on rate-limit / transient errors
  - Pydantic       → validates the JSON shape before it hits the API layer
"""

from __future__ import annotations

import json

import structlog
from openai import AsyncOpenAI, RateLimitError, APIStatusError
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from app.config import Settings
from app.models.schemas import LLMResponse

log = structlog.get_logger(__name__)

_SYSTEM_PROMPT = """\
You are an enterprise sales engineer completing a Request for Proposal (RFP).

RULES — follow them exactly:
1. Answer using ONLY the provided context passages. Do NOT use outside knowledge.
2. If the context does not contain enough information, set:
   - answer: "Information not found in knowledge base."
   - confidence_score: 0
   - source_citation: "N/A"
3. confidence_score is an integer from 0 to 100 reflecting how well the context
   supports your answer (100 = perfectly answered, 0 = not found).
4. source_citation must reference the most relevant passage as "filename, Page N".
5. Do NOT guess, speculate, or infer beyond what the context states explicitly.

Always respond with ONLY a valid JSON object with exactly these three keys:
{
  "answer": "<your complete answer>",
  "confidence_score": <integer 0-100>,
  "source_citation": "<filename, Page N>"
}
"""

_NOT_FOUND_RESPONSE = LLMResponse(
    answer="Information not found in knowledge base.",
    confidence_score=0,
    source_citation="N/A",
)


def build_groq_client(settings: Settings) -> AsyncOpenAI:
    """Create an AsyncOpenAI client pointed at Groq's endpoint."""
    return AsyncOpenAI(
        api_key=settings.groq_api_key,
        base_url=settings.groq_base_url,
    )


def _retry():
    return retry(
        retry=retry_if_exception_type((RateLimitError, APIStatusError)),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        stop=stop_after_attempt(4),
        reraise=True,
    )


async def generate_rfp_answer(
    question: str,
    context: str,
    client: AsyncOpenAI,
    settings: Settings,
) -> LLMResponse:
    if not context.strip():
        log.info("llm.empty_context", question=question[:80])
        return _NOT_FOUND_RESPONSE

    user_message = (
        f"CONTEXT PASSAGES:\n{context}\n\n"
        f"RFP QUESTION:\n{question}\n\n"
        "Respond with JSON only."
    )

    raw = await _chat(client, settings.llm_model, user_message)
    return _parse(raw, question)


@_retry()
async def _chat(client: AsyncOpenAI, model: str, user_message: str) -> str:
    response = await client.chat.completions.create(
        model=model,
        temperature=0,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
    )
    return response.choices[0].message.content or "{}"


def _parse(raw: str, question: str) -> LLMResponse:
    try:
        data = json.loads(raw)
        return LLMResponse(**data)
    except Exception as exc:
        log.error("llm.parse_error", error=str(exc), raw=raw[:200], q=question[:80])
        return LLMResponse(
            answer="[Parse error — please review manually]",
            confidence_score=0,
            source_citation="N/A",
        )
