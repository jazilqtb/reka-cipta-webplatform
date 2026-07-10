# backend/services/pdf_service.py
# Epic 4B Slice 2 (E4B-S2-BE-05) — HTML → PDF konversi via WeasyPrint.
# AR-03: PDF generate on-demand, tidak di-cache/persist ke Storage —
# regenerasi cheap (~1-2 detik) dan menghindari orphan file management.

import io
import logging
import re

from weasyprint import HTML

from schemas.proposal_settings import ProposalSettings

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


def apply_layout(html: str, settings: ProposalSettings) -> str:
    """Epic 4B Slice 3C (E4B-S3C-BE-04) — suntik header/footer/logo/warna
    aksen ke HTML proposal yang sudah di-generate LLM.

    String injection (bukan HTML parser penuh) supaya tidak nambah
    dependency baru — proposal HTML dari LLM sudah predictable (selalu
    <html><head>...</head><body>...</body></html>, berkat sanity check
    di ProposalGeneratorService.generate()). Kalau tidak ada <head>
    ditemukan, style di-prepend sebelum <body> sebagai fallback.

    Header/footer TIDAK di-treat sebagai HTML — WeasyPrint @page
    `content` adalah CSS string value, bukan markup, jadi tidak ada PDF
    injection surface dari input admin di sini. Tanda kutip ganda
    di-strip supaya tidak menutup CSS string value lebih awal.
    """
    header = (settings.layout_header_text or "").replace('"', "'")
    footer = (settings.layout_footer_text or "").replace('"', "'")
    color = settings.layout_primary_color or "#0B7D6E"

    layout_style = f"""<style>
      @page {{
        margin: 2cm;
        @top-center {{ content: "{header}"; font-size: 9pt; color: #666666; }}
        @bottom-center {{ content: "{footer}"; font-size: 8pt; color: #999999; }}
        @bottom-right {{ content: counter(page) " / " counter(pages); font-size: 8pt; color: #999999; }}
      }}
      .proposal-layout-logo {{ max-height: 60px; margin-bottom: 1cm; }}
      h1, h2 {{ color: {color} !important; }}
    </style>"""

    if "</head>" in html:
        html = html.replace("</head>", f"{layout_style}</head>", 1)
    elif "<body" in html:
        html = html.replace("<body", f"{layout_style}<body", 1)
    else:
        html = layout_style + html

    if settings.layout_logo_url:
        logo_img = f'<img class="proposal-layout-logo" src="{settings.layout_logo_url}" />'
        body_match = re.search(r"<body[^>]*>", html)
        if body_match:
            insert_at = body_match.end()
            html = html[:insert_at] + logo_img + html[insert_at:]
        else:
            html = logo_img + html

    return html
