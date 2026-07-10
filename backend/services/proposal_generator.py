# backend/services/proposal_generator.py
# Epic 4B Slice 2 (E4B-S2-BE-04) — Anthropic Haiku integration untuk Quick
# Mode proposal generator. AR-04 (task breakdown): service abstraction
# minimal supaya provider bisa diganti nanti tanpa refactor router.
#
# R-30: 3 failure mode WAJIB handled terpisah (timeout/rate-limit/generic)
# supaya router bisa return pesan spesifik ke admin, bukan generic 500.
#
# Epic 4B Slice 3A (E4B-S3A-BE-04, R-38/R-39) — refactored untuk load
# prompt + default temperature/max_tokens dari ProposalSettingsService
# (DB, dengan R-37 fallback ke hardcoded default) alih-alih hardcoded
# module constant. temperature/max_tokens/custom_instructions SEMUA
# optional — kalau caller tidak pass apa pun (Quick Mode, Slice 2
# behavior asli), hasil generate identik dengan sebelum Slice 3A karena
# default DB row = persis prompt v1 hardcoded (lihat
# ProposalSettings.hardcoded_default() dan migration seed row).

import logging

from anthropic import Anthropic, APIError, APITimeoutError, RateLimitError

from core.config import settings
from core.supabase import get_supabase
from prompts.proposal_prompt import build_user_prompt
from services.proposal_settings_service import ProposalSettingsService

logger = logging.getLogger(__name__)

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
        temperature: float | None = None,
        max_tokens: int | None = None,
        custom_instructions: str | None = None,
    ) -> str:
        """Generate proposal HTML. Raises ProposalGeneratorError kalau
        Anthropic API gagal — pesan sudah aman ditampilkan ke admin.

        temperature/max_tokens/custom_instructions: Advanced Mode (R-38),
        semua optional. None → pakai default dari ProposalSettings (DB,
        fallback hardcoded R-37). Ini yang membuat Quick Mode (caller
        tidak pass apa pun) berperilaku identik dengan Slice 2 asli.
        """
        # R-37: load settings fresh setiap call, tanpa cache — supaya
        # edit admin di /admin/proposal-settings langsung efektif di
        # generate berikutnya.
        proposal_settings = ProposalSettingsService(get_supabase()).get()

        system_prompt = proposal_settings.build_full_prompt()
        if custom_instructions:
            system_prompt += (
                "\n\nINSTRUKSI TAMBAHAN (dari admin, Advanced Mode — "
                f"prioritaskan di atas instruksi umum di atas):\n{custom_instructions}"
            )

        user_prompt = build_user_prompt(lead_data, products, company_settings)

        resolved_temperature = (
            temperature if temperature is not None else proposal_settings.default_temperature
        )
        resolved_max_tokens = (
            max_tokens if max_tokens is not None else proposal_settings.default_max_tokens
        )

        try:
            message = self._client.messages.create(
                model=proposal_settings.model_id,
                max_tokens=resolved_max_tokens,
                temperature=resolved_temperature,
                system=system_prompt,
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

        # R-38 audit trail: log advanced params usage untuk cost monitoring
        # (bedakan Quick Mode vs Advanced Mode generation di log grep).
        logger.info(
            f"proposal_generated: lead={lead_data.get('id')} chars={len(html)} "
            f"model={proposal_settings.model_id} temperature={resolved_temperature} "
            f"max_tokens={resolved_max_tokens} custom_instr_len={len(custom_instructions or '')}"
        )
        return html


_service: ProposalGeneratorService | None = None


def get_proposal_service() -> ProposalGeneratorService:
    """Singleton factory — hindari re-init Anthropic client per request."""
    global _service
    if _service is None:
        _service = ProposalGeneratorService()
    return _service
