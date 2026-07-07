# backend/services/proposal_generator.py
# Epic 4B Slice 2 (E4B-S2-BE-04) — Anthropic Haiku integration untuk Quick
# Mode proposal generator. AR-04 (task breakdown): service abstraction
# minimal supaya provider bisa diganti nanti tanpa refactor router.
#
# R-30: 3 failure mode WAJIB handled terpisah (timeout/rate-limit/generic)
# supaya router bisa return pesan spesifik ke admin, bukan generic 500.

import logging

from anthropic import Anthropic, APIError, APITimeoutError, RateLimitError

from core.config import settings
from prompts.proposal_prompt import SYSTEM_PROMPT, build_user_prompt

logger = logging.getLogger(__name__)

# Hardcoded (bukan env var) — perubahan model harus lewat code review,
# bukan config change tanpa jejak (AR-01, task breakdown).
MODEL = "claude-haiku-4-5-20251001"
MAX_TOKENS = 4096
TIMEOUT_SECONDS = 30.0


class ProposalGeneratorError(Exception):
    """Pesan di sini aman ditampilkan ke admin — sudah disanitasi dari
    detail internal Anthropic API."""


class ProposalGeneratorService:
    def __init__(self, client_provider: str = "anthropic"):
        # MVP: hanya Anthropic. Future provider bisa branch di sini tanpa
        # ubah signature generate() (AR-04).
        self._client = Anthropic(api_key=settings.ANTHROPIC_API_KEY, timeout=TIMEOUT_SECONDS)

    async def generate(
        self,
        lead_data: dict,
        products: list[dict],
        company_settings: dict,
    ) -> str:
        """Generate proposal HTML. Raises ProposalGeneratorError kalau
        Anthropic API gagal — pesan sudah aman ditampilkan ke admin."""
        user_prompt = build_user_prompt(lead_data, products, company_settings)

        try:
            message = self._client.messages.create(
                model=MODEL,
                max_tokens=MAX_TOKENS,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_prompt}],
            )
        except APITimeoutError:
            logger.error(f"proposal_generate_timeout: lead={lead_data.get('id')}")
            raise ProposalGeneratorError("AI tidak merespons. Coba lagi dalam beberapa menit.")
        except RateLimitError:
            logger.error(f"proposal_generate_rate_limited: lead={lead_data.get('id')}")
            raise ProposalGeneratorError("Batas AI harian tercapai. Hubungi admin.")
        except APIError as e:
            logger.error(f"proposal_generate_api_error: lead={lead_data.get('id')} error={e!r}")
            raise ProposalGeneratorError("AI service sedang bermasalah. Coba lagi nanti.")

        html = message.content[0].text.strip()

        # Sanity check: kalau LLM tidak wrap dengan <html> (kadang terjadi
        # meski di-instruksikan), wrap manual supaya WeasyPrint tidak
        # dapat fragment tanpa <head>/<style>.
        if "<html" not in html.lower():
            logger.warning(f"proposal_generate_missing_html_tag: lead={lead_data.get('id')}")
            html = f"<html><body>{html}</body></html>"

        logger.info(f"proposal_generated: lead={lead_data.get('id')} chars={len(html)}")
        return html


_service: ProposalGeneratorService | None = None


def get_proposal_service() -> ProposalGeneratorService:
    """Singleton factory — hindari re-init Anthropic client per request."""
    global _service
    if _service is None:
        _service = ProposalGeneratorService()
    return _service
