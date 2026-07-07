# backend/services/pdf_service.py
# Epic 4B Slice 2 (E4B-S2-BE-05) — HTML → PDF konversi via WeasyPrint.
# AR-03: PDF generate on-demand, tidak di-cache/persist ke Storage —
# regenerasi cheap (~1-2 detik) dan menghindari orphan file management.

import io
import logging

from weasyprint import HTML

logger = logging.getLogger(__name__)


def html_to_pdf(html_string: str) -> bytes:
    """Convert HTML string to PDF bytes. Biarkan exception native
    bubble up — router yang decide response (R jangan sanitize di sini,
    caller punya lebih banyak context untuk pesan error yang tepat)."""
    try:
        pdf_buffer = io.BytesIO()
        HTML(string=html_string).write_pdf(target=pdf_buffer)
        return pdf_buffer.getvalue()
    except Exception as e:
        logger.error(f"pdf_generation_failed: {e!r}")
        raise
