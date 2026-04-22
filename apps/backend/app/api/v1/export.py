"""
Phase 5 — Exact-Format Export

POST /api/v1/rfp/export
  - Accepts the original .xlsx file + a JSON string of approved answers
  - Loads the workbook preserving ALL original formatting (keep_vba=True)
  - Injects approved answers into Column B
  - Streams the modified file back as a downloadable .xlsx

The JSON answers are sent as a Form field (not request body) so they can
travel alongside the multipart file upload in a single HTTP request.
"""

from __future__ import annotations

import json

import structlog
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from fastapi.responses import Response

from app.models.schemas import ExportRequest
from app.utils.excel_parser import inject_answers

log = structlog.get_logger(__name__)
router = APIRouter(prefix="/rfp", tags=["RFP"])

_XLSX_CONTENT_TYPE = (
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
)


@router.post(
    "/export",
    summary="Inject approved answers and download the completed RFP workbook",
    response_class=Response,
    responses={
        200: {
            "content": {_XLSX_CONTENT_TYPE: {}},
            "description": "Modified XLSX workbook with answers in Column B",
        }
    },
)
async def export_rfp(
    file: UploadFile = File(..., description="The original RFP workbook (.xlsx)"),
    answers: str = Form(
        ...,
        description="JSON array: [{row_index: int, answer: string}, ...]",
    ),
) -> Response:

    # ── Validate file ─────────────────────────────────────────
    if not file.filename or not file.filename.lower().endswith(".xlsx"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only .xlsx files are accepted.",
        )

    file_bytes = await file.read()

    # ── Parse and validate approved answers ───────────────────
    try:
        raw_payload = json.loads(answers)
        export_request = ExportRequest(answers=raw_payload)
    except (json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid answers payload: {exc}",
        ) from exc

    if not export_request.answers:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No approved answers provided.",
        )

    # ── Build row_index → answer mapping ─────────────────────
    answer_map: dict[int, str] = {
        a.row_index: a.answer for a in export_request.answers
    }

    log.info(
        "export.start",
        filename=file.filename,
        approved_count=len(answer_map),
    )

    # ── Inject answers into the workbook ──────────────────────
    modified_bytes = inject_answers(file_bytes, answer_map)

    # ── Derive output filename ────────────────────────────────
    base_name = file.filename.removesuffix(".xlsx")
    output_filename = f"{base_name}_veripitch_completed.xlsx"

    log.info("export.complete", output_filename=output_filename)

    return Response(
        content=modified_bytes,
        media_type=_XLSX_CONTENT_TYPE,
        headers={
            "Content-Disposition": f'attachment; filename="{output_filename}"',
            "Content-Length": str(len(modified_bytes)),
        },
    )
