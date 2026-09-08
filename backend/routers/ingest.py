"""
PDF Ingestion Router — /api/v1/ingest
--------------------------------------
Endpoints:
  POST /api/v1/ingest/pdf            — upload a PDF for text extraction
  POST /api/v1/ingest/pdf/ner-extract — extract PDF text + run NER pipeline on it
"""

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from typing import Optional
from backend.services.pdf_ocr_service import extract_text_from_pdf
from backend.services.nlp_service import nlp_service
from backend.services.audit_service import audit_service
from backend.services.text_cleaner import clean_text

router = APIRouter(prefix="/ingest", tags=["PDF Ingestion & OCR"])

MAX_FILE_SIZE_MB = 50
MAX_FILE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024


@router.post("/pdf")
async def ingest_pdf(
    file: UploadFile = File(..., description="PDF file to ingest (digital or scanned)"),
    force_ocr: bool = Form(False, description="Force PaddleOCR even for digital PDFs"),
    actor: str = Form("R. Basu", description="Investigator performing the ingestion"),
    role: str = Form("Investigating Officer", description="Role of the actor"),
):
    """
    Upload a PDF for text extraction.

    - Digital PDFs: text extracted instantly with pypdf.
    - Scanned / image PDFs: rasterised page-by-page, then run through PaddleOCR.
    - Mixed PDFs: hybrid strategy automatically applied.

    Returns the full extracted text and per-page breakdown.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    contents = await file.read()
    if len(contents) > MAX_FILE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum allowed size is {MAX_FILE_SIZE_MB} MB.",
        )
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    result = extract_text_from_pdf(
        pdf_bytes=contents,
        filename=file.filename,
        force_ocr=force_ocr,
    )

    if result.error:
        raise HTTPException(status_code=422, detail=result.error)

    audit_service.log(
        actor=actor,
        role=role,
        action_type="PDF_INGESTION",
        target_type="DOCUMENT",
        target_id=file.filename[:40],
        details=(
            f"PDF '{file.filename}' ingested via {result.mode} mode. "
            f"{result.page_count} pages, {len(result.full_text)} chars extracted."
        ),
    )

    return {
        "status": "success",
        "extraction": result.to_dict(),
        "disclaimer": (
            "AI-assisted text extraction for authorized investigator review; "
            "extracted content must be verified before use in legal proceedings."
        ),
    }


@router.post("/pdf/ner-extract")
async def ingest_pdf_with_ner(
    file: UploadFile = File(..., description="PDF file to ingest and analyse"),
    force_ocr: bool = Form(False, description="Force PaddleOCR even for digital PDFs"),
    actor: str = Form("R. Basu", description="Investigator performing the ingestion"),
    role: str = Form("Investigating Officer", description="Role of the actor"),
):
    """
    Upload a PDF, extract its full text, then run the NER pipeline on it.

    Returns both the extracted text and the structured entity list
    (persons, phones, vehicles, accounts, locations).
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    contents = await file.read()
    if len(contents) > MAX_FILE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum allowed size is {MAX_FILE_SIZE_MB} MB.",
        )
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # ── Step 1: extract text ─────────────────────────────────────────────────
    result = extract_text_from_pdf(
        pdf_bytes=contents,
        filename=file.filename,
        force_ocr=force_ocr,
    )

    if result.error:
        raise HTTPException(status_code=422, detail=result.error)

    # ── Step 2: clean text & run NER + relationships ─────────────────────────
    entities = {}
    relationships = []
    cleaned_text = ""
    if result.full_text.strip():
        cleaned_text = clean_text(result.full_text)
        entities = nlp_service.extract_entities(cleaned_text)
        relationships = nlp_service.extract_relationships(cleaned_text, entities)

    # ── Audit ────────────────────────────────────────────────────────────────
    audit_service.log(
        actor=actor,
        role=role,
        action_type="PDF_INGESTION_NER",
        target_type="DOCUMENT",
        target_id=file.filename[:40],
        details=(
            f"PDF '{file.filename}' ingested ({result.mode} mode, {result.page_count} pages). "
            f"NER: {len(entities.get('persons', []))} persons, "
            f"{len(entities.get('phones', []))} phones, "
            f"{len(entities.get('vehicles', []))} vehicles, "
            f"{len(relationships)} relationships extracted."
        ),
    )

    return {
        "status": "success",
        "extraction": result.to_dict(),
        "cleaned_text": cleaned_text,
        "extracted": entities,
        "relationships": relationships,
        "document_title": file.filename,
        "disclaimer": (
            "AI-assisted analytical output for authorized human review; "
            "not a final legal conclusion."
        ),
    }
