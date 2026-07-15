# backend/utils/slugify.py
# Epic 6 Admin Slice 1 (E6-ADM-S1-BE-01) — slug generator untuk judul
# artikel. BUKAN reuse _slugify_code (routers/products.py) atau slugify
# nama perusahaan (routers/rfq.py) — tujuan beda: slug URL SEO dari judul
# panjang, bukan filename dari kode/nama pendek.

import re
import unicodedata


def slugify_title(title: str) -> str:
    normalized = unicodedata.normalize("NFKD", title).encode("ascii", "ignore").decode("ascii")
    slug = normalized.lower()
    slug = re.sub(r"[^a-z0-9]+", "-", slug)
    slug = re.sub(r"-{2,}", "-", slug)
    return slug.strip("-")
