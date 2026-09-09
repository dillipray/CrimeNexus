"""
PDF OCR Service
---------------
Dual-mode PDF text extraction:
  - pypdf  → fast text layer extraction for digital (born-digital) PDFs
  - PaddleOCR → rasterises pages and runs OCR for scanned / image-only PDFs

Strategy:
  1. Try pypdf first; if it yields meaningful text (>30 chars/page average), return it.
  2. If the PDF is image-only or text is sparse, fall back to PaddleOCR on each page image.

Lazy initialisation is used so the heavy PaddleOCR models are only loaded when
a scanned PDF is actually uploaded, not at server startup.
"""

import io
import os
import logging
import tempfile
from typing import List, Optional, Tuple

logger = logging.getLogger("nexusintel.pdf_ocr")

# ── pypdf import ──────────────────────────────────────────────────────────────
try:
    from pypdf import PdfReader
    _PYPDF_AVAILABLE = True
except ImportError:
    _PYPDF_AVAILABLE = False
    logger.warning("pypdf not installed; digital PDF extraction disabled.")

# ── PaddleOCR lazy singleton ──────────────────────────────────────────────────
# We keep the singleton here so it is only instantiated once per process life.
_paddle_ocr_instance = None
_PADDLE_AVAILABLE = False

def _get_paddle_ocr():
    """Lazy-load PaddleOCR the first time a scanned PDF is processed."""
    global _paddle_ocr_instance, _PADDLE_AVAILABLE
    if _paddle_ocr_instance is not None:
        return _paddle_ocr_instance
    try:
        # Disable connectivity check so the engine starts faster after first
        # model download.
        os.environ.setdefault("PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK", "True")
        from paddleocr import PaddleOCR  # noqa: PLC0415
        _paddle_ocr_instance = PaddleOCR(
            use_doc_orientation_classify=False,   # skip doc-orientation model
            use_doc_unwarping=False,               # skip unwarping model
            use_textline_orientation=False,        # skip text-line orientation
            lang="en",
        )
        _PADDLE_AVAILABLE = True
        logger.info("PaddleOCR engine loaded successfully.")
    except Exception as exc:  # pragma: no cover
        logger.error("Failed to initialise PaddleOCR: %s", exc)
        _paddle_ocr_instance = None
    return _paddle_ocr_instance


# ── helpers ───────────────────────────────────────────────────────────────────

def _extract_text_pypdf(pdf_bytes: bytes) -> Tuple[List[str], bool]:
    """
    Extract per-page text from a digital PDF using pypdf.

    Returns
    -------
    pages : list of str — one entry per page (may be empty string for image pages)
    is_digital : bool — True when pypdf found real text content overall
    """
    if not _PYPDF_AVAILABLE:
        return [], False

    pages: List[str] = []
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        for page in reader.pages:
            text = page.extract_text() or ""
            pages.append(text.strip())
    except Exception as exc:
        logger.warning("pypdf extraction failed: %s", exc)
        return [], False

    total_chars = sum(len(p) for p in pages)
    avg_chars = total_chars / max(len(pages), 1)
    # Heuristic: if characters exist and average per page >= 10 or total >= 15,
    # it is a digital PDF with extractable text layer.
    is_digital = total_chars >= 15 or (total_chars > 0 and avg_chars >= 10)
    return pages, is_digital


def _extract_text_paddleocr(pdf_bytes: bytes) -> List[str]:
    """
    Rasterise each PDF page and run PaddleOCR on it.
    Requires `pypdfium2` (installed as a dependency of paddleocr) or pillow+pdf2image.

    Returns a list of OCR-extracted text strings, one per page.
    """
    pages: List[str] = []
    ocr = _get_paddle_ocr()
    if ocr is None:
        logger.error("PaddleOCR is unavailable; cannot process scanned PDF.")
        return pages

    # Rasterise pages using pypdfium2 (bundled with PaddleOCR / paddlex)
    try:
        import pypdfium2 as pdfium  # noqa: PLC0415
    except ImportError:
        logger.error("pypdfium2 not available; cannot rasterise PDF pages for OCR.")
        return pages

    try:
        pdf_doc = pdfium.PdfDocument(pdf_bytes)
        for page_idx in range(len(pdf_doc)):
            page = pdf_doc[page_idx]
            # Render at 200 DPI for good OCR quality without excessive memory
            bitmap = page.render(scale=200 / 72, rotation=0)
            pil_image = bitmap.to_pil()

            # Save to a temp file because PaddleOCR accepts file paths or np arrays
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                tmp_path = tmp.name
                pil_image.save(tmp_path, format="PNG")

            try:
                result = ocr.ocr(tmp_path)
                page_text = _flatten_ocr_result(result)
            except Exception as exc:
                logger.warning("PaddleOCR failed on page %d: %s", page_idx, exc)
                page_text = ""
            finally:
                os.unlink(tmp_path)

            pages.append(page_text)

    except Exception as exc:
        logger.error("PDF rasterisation error: %s", exc)

    return pages


def _flatten_ocr_result(result) -> str:
    """
    Flatten PaddleOCR result structure into a plain text string.

    PaddleOCR result is a list of pages; each page is a list of line-results,
    each line result is [bounding_box, (text, confidence)].
    """
    lines: List[str] = []
    if not result:
        return ""
    # result may be [[line, line, ...]] for a single image
    for item in result:
        if item is None:
            continue
        # item can be a list of detections
        if isinstance(item, list):
            for detection in item:
                if isinstance(detection, (list, tuple)) and len(detection) >= 2:
                    text_conf = detection[1]
                    if isinstance(text_conf, (list, tuple)) and len(text_conf) >= 1:
                        lines.append(str(text_conf[0]))
                    elif isinstance(text_conf, str):
                        lines.append(text_conf)
    return "\n".join(lines)


# ── Public API ────────────────────────────────────────────────────────────────

class PDFExtractionResult:
    """Container for the result of a PDF ingestion."""

    def __init__(
        self,
        filename: str,
        mode: str,
        page_count: int,
        full_text: str,
        per_page_text: List[str],
        error: Optional[str] = None,
    ):
        self.filename = filename
        self.mode = mode            # "digital" | "ocr" | "hybrid"
        self.page_count = page_count
        self.full_text = full_text
        self.per_page_text = per_page_text
        self.error = error

    def to_dict(self) -> dict:
        return {
            "filename": self.filename,
            "mode": self.mode,
            "page_count": self.page_count,
            "char_count": len(self.full_text),
            "full_text": self.full_text,
            "per_page_text": self.per_page_text,
            "error": self.error,
        }


def extract_text_from_pdf(
    pdf_bytes: bytes,
    filename: str = "document.pdf",
    force_ocr: bool = False,
) -> PDFExtractionResult:
    """
    Main entry point.  Automatically selects digital or OCR extraction.

    Parameters
    ----------
    pdf_bytes : raw bytes of the uploaded PDF file
    filename  : original filename (used for logging / response)
    force_ocr : if True, skip pypdf and always use PaddleOCR

    Returns
    -------
    PDFExtractionResult with full text and per-page breakdown
    """
    if not pdf_bytes:
        return PDFExtractionResult(
            filename=filename,
            mode="error",
            page_count=0,
            full_text="",
            per_page_text=[],
            error="Empty file received.",
        )

    # ── Step 1: try digital extraction ───────────────────────────────────────
    mode = "digital"
    per_page: List[str] = []

    if not force_ocr and _PYPDF_AVAILABLE:
        digital_pages, is_digital = _extract_text_pypdf(pdf_bytes)

        if is_digital:
            per_page = digital_pages
            mode = "digital"
            logger.info(
                "[%s] Digital PDF: extracted %d pages via pypdf.", filename, len(per_page)
            )
        else:
            # sparse text — try OCR, then merge
            ocr_pages = _extract_text_paddleocr(pdf_bytes)
            if ocr_pages:
                # Prefer OCR text when digital extraction was poor
                per_page = [
                    ocr if len(ocr) > len(dig) else dig
                    for dig, ocr in zip(
                        digital_pages + [""] * len(ocr_pages),
                        ocr_pages + [""] * len(digital_pages),
                    )
                ]
                mode = "hybrid"
            else:
                per_page = digital_pages
                mode = "digital"
            logger.info(
                "[%s] Hybrid/OCR mode: %d pages processed.", filename, len(per_page)
            )
    else:
        # force_ocr or pypdf not available
        per_page = _extract_text_paddleocr(pdf_bytes)
        mode = "ocr"
        logger.info(
            "[%s] Scanned PDF: %d pages via PaddleOCR.", filename, len(per_page)
        )

    full_text = "\n\n".join(p for p in per_page if p)

    return PDFExtractionResult(
        filename=filename,
        mode=mode,
        page_count=len(per_page),
        full_text=full_text,
        per_page_text=per_page,
    )
