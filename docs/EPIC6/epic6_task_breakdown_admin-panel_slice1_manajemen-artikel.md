# Epic 6 Task Breakdown — Admin Panel Manajemen Artikel · Slice 1 (List + CRUD Dasar)

**Depends on:** Epic 6 Customer-Facing Slice 1 (Artikel & Berita — **wajib**: tabel `articles` + kolom `view_count`/`thumbnail_path`, RLS `authenticated` full access, bucket `article-thumbnails`, tipe `Article`/`ArticleRow`/`ArticleCategory` di `types/api.ts`, semua sudah live production), Epic 1 (auth guard `/admin/*`, `AdminSidebar`, `AdminHeader`), Epic 3B Slice 1 (pola admin list Server Component + form edit react-hook-form+zod — direplikasi persis di slice ini), Epic 5 Admin (pola whitelist `extra='forbid'`, disiplin auth guard FastAPI)

**Blocks:** Epic 6 Admin Panel Slice 2 (Rich Text Editor + Upload Thumbnail — butuh `ArticleForm.tsx` dan endpoint create/update dari slice ini sudah stabil)

**Tidak bergantung pada:** Epic 6 Customer-Facing Slice 2 (Kalkulator) dan Slice 3 (homepage section) — keduanya fitur baca-saja yang tidak disentuh CRUD admin.

---

## Konteks Slice

Slice ini adalah **separuh pertama** dari Epic 6 Admin Panel: CRUD dasar artikel dari sisi admin — list semua artikel (draft + published), buat artikel baru, edit artikel, toggle publish/unpublish, dan hapus. **Konten artikel di slice ini memakai `<textarea>` teks polos, BUKAN rich text editor** — lihat AR-01 untuk alasan pemisahan ini.

**Yang TIDAK termasuk slice ini:**
- **Rich Text Editor** (Tiptap) untuk field `content` — Slice 2.
- **Upload thumbnail** — Slice 2. Artikel yang dibuat di slice ini punya `thumbnail_path = NULL` (fallback gradient + ikon `BookOpen` sudah dihandle `ArticleCard` sejak Epic 6 CF Slice 1).
- **Upload gambar di dalam konten artikel** — Slice 2 (butuh editor untuk toolbar insert-image).

**Kenapa dipisah seperti ini (bukan satu slice besar):** mengikuti pola yang sudah terbukti di Epic 3B (`epic3B_task_breakdown_admin-panel.md` — Slice 1 "admin-list-edit" lalu Slice 2 "file-uploads"). CRUD dasar (create/read/update/delete/publish-toggle) adalah fondasi yang independen secara fungsional dari kompleksitas integrasi editor pihak ketiga + upload multipart — memisahkannya memberi slice ini demo point yang jujur dan mandiri: **admin bisa membuat, mengedit, mem-publish, dan menghapus artikel end-to-end setelah slice ini selesai**, meski kontennya masih teks polos.

---

## Prasyarat Teknis (Konfirmasi Sebelum Mulai)

- [ ] Epic 6 CF Slice 1 sudah live production — `SELECT * FROM articles LIMIT 1;` berhasil, kolom `thumbnail_path` (bukan `thumbnail_url`) ada
- [ ] RLS `articles` sudah benar: `SET ROLE authenticated; SELECT * FROM articles;` return semua baris termasuk draft (kebalikan dari `anon` yang hanya lihat published)
- [ ] Bucket `article-thumbnails` sudah ada dan public (dikonfirmasi sejak Epic 6 CF Slice 1)
- [ ] `backend/dependencies/auth.py` (`get_current_user`) dan `backend/core/supabase.py` (`get_supabase()`, service role) dipahami — dipakai persis, tidak dimodifikasi
- [ ] `backend/services/storage_service.py` (`upload_to_storage`/`delete_from_storage`) dipahami — akan dipakai lagi di Slice 2, tidak perlu diubah

---

## Keputusan Arsitektur Slice

### AR-01 — Konten Teks Polos di Slice Ini, Rich Text Editor Menyusul di Slice 2

Field `content` (kolom `TEXT`, disimpan sebagai HTML — lihat Epic 6 CF Slice 1 AR-05) diisi lewat `<textarea>` biasa di slice ini. Saat disimpan, teks dari textarea **ditransformasi jadi paragraf HTML sederhana**: setiap baris kosong ganda (`\n\n`) jadi pemisah `<p>`, karakter `<`/`>` di-escape supaya admin yang belum familiar HTML tidak bisa accidentally inject tag (lihat `BE-03` untuk implementasi `_plain_text_to_html`).

**Kenapa bukan langsung terima HTML mentah dari textarea:** admin non-teknis (PRD §"tim admin 2 orang, non-teknis") tidak diharapkan menulis tag HTML manual. Auto-escape + auto-paragraf memberi hasil yang terlihat rapi di halaman publik tanpa perlu editor canggih dulu. Ini transisi sementara — begitu Slice 2 selesai, form beralih ke Tiptap dan transformasi ini tidak lagi dipanggil untuk artikel baru (artikel lama yang sudah tersimpan sebagai HTML hasil transformasi ini tetap valid, karena tetap HTML sah).

### AR-02 — Reuse Pola Products Admin (Direct Supabase Read), Bukan Pola Supplier Admin (FastAPI Read)

Codebase punya **dua pola berbeda** untuk admin read:
- **Products Admin** (`app/admin/products/page.tsx`, `app/admin/products/[id]/edit/page.tsx`): Server Component fetch langsung via `lib/supabase/server.ts` (cookie session), RLS `authenticated` yang mengizinkan baca semua baris. FastAPI hanya dipakai untuk write (PUT, upload).
- **Supplier Admin** (`SupplierListView.tsx`): fetch client-side via `apiFetch(auth:true)` ke FastAPI, karena halaman itu butuh filter+search interaktif tersinkron URL.

**Keputusan: Slice ini ikut pola Products Admin.** Artikel tidak butuh filter/search kompleks di list-nya (Epic Doc 2 spec admin articles: cuma tabel semua artikel, tidak ada filter param) — jadi tidak ada alasan menambah lapisan FastAPI GET yang tidak perlu. List (`/admin/articles`) dan form edit (`/admin/articles/[id]/edit`) sama-sama fetch langsung dari Supabase via `createClient()` server client. **FastAPI hanya untuk operasi tulis**: `POST /articles`, `PUT /articles/{id}`, `DELETE /articles/{id}`, `PATCH /articles/{id}/publish` — konsisten dengan pola Products, bukan pola Supplier.

### AR-03 — DELETE Sungguhan (Hard Delete), Endpoint Pertama di Codebase Ini

Grep seluruh `backend/routers/*.py` mengonfirmasi **tidak ada satupun `@router.delete` di codebase ini** — Products tidak punya delete (hanya `is_active` toggle sebagai soft-hide, katalog tetap 5 baris tetap). Epic Doc 2 eksplisit minta tombol "Hapus" untuk artikel dengan konfirmasi — artinya slice ini **membangun pola DELETE pertama** di backend.

**Keputusan: hard delete** (row benar-benar dihapus dari tabel), bukan soft-delete dengan kolom `deleted_at` baru. Alasan: `is_published` sudah jadi lever untuk "sembunyikan dari publik tanpa hapus" — kalau admin klik tombol "Hapus" secara eksplisit (bukan cuma unpublish), itu adalah niat yang jelas untuk benar-benar membuang record, konsisten dengan makna kata "Hapus" di UI. Konfirmasi wajib via `window.confirm(...)` sebelum panggil endpoint (pola yang sudah dipakai `WATemplateEditor.tsx`, `HistoryPanel.tsx` — **bukan** modal/dialog baru, cukup native browser confirm, konsisten pola existing).

**Konsekuensi teknis:** kalau artikel yang dihapus punya `thumbnail_path`, file di storage **tidak** ikut dihapus otomatis di slice ini (thumbnail baru ada di Slice 2) — jadi tidak ada orphaned-file cleanup logic yang perlu ditulis sekarang. Dicatat di Slice 2 sebagai item yang perlu ditambahkan (`DELETE /articles/{id}` nanti perlu extend untuk cleanup storage best-effort, R-17 style, setelah upload thumbnail eksis).

### AR-04 — Slug: Utility Baru, Bukan Reuse Helper Filename yang Sudah Ada

Ada 2 fungsi `_slugify*` yang sudah eksis di backend (`products.py:_slugify_code` untuk nama file upload, `rfq.py` untuk nama file PDF) — **keduanya tidak dipakai ulang** karena tujuannya beda (filename-safe slug dari kode produk pendek, bukan slug URL SEO dari judul artikel panjang). Slice ini menulis `backend/utils/slugify.py` baru, khusus untuk slug artikel (lowercase, transliterasi spasi→dash, strip karakter non-alfanumerik, collapse dash ganda, trim dash pinggir).

**Slug auto-generate dari judul, admin bisa edit manual.** Uniqueness dicek di backend saat create/update (query `articles.slug`, exclude row sendiri saat update) — response `409 Conflict` kalau bentrok, frontend tampilkan pesan "Slug sudah dipakai artikel lain, coba judul/slug berbeda."

**Slug tetap bisa diedit di artikel yang sudah published** (tidak di-lock) — tapi form menampilkan peringatan inline (bukan hard block) kalau admin ubah slug pada artikel `is_published = true`: "Mengubah slug pada artikel yang sudah publish akan mengubah URL publiknya — link lama yang sudah dibagikan akan 404." Ini keputusan sadar memberi admin kendali penuh tanpa membatasi mereka, konsisten filosofi "purposeful, not performative" — bukan menambah proteksi yang belum tentu dibutuhkan (YAGNI: tidak ada redirect/alias URL lama, itu di luar scope MVP).

### AR-05 — Skema Admin Reuse Persis Field CF, `view_count` Read-Only

`ArticleCreateRequest`/`ArticleUpdateRequest` **tidak** menyertakan `view_count` sama sekali (bukan optional dengan default — benar-benar tidak ada di whitelist, konsisten `extra='forbid'`). Ini menegaskan ulang AR-06 dari `epic6_task_breakdown_slice1_artikel-berita.md`: kolom itu cuma berubah lewat RPC `increment_article_view` yang dipanggil dari sisi publik, bukan form admin.

`thumbnail_path` **ada** di skema admin (nullable, string) tapi **tidak ada field input untuk mengisinya secara manual di slice ini** — field ini hanya diisi lewat endpoint upload khusus (Slice 2). Form Slice 1 hanya menampilkan (read-only, kalau ada) tanpa kontrol edit — dalam praktiknya di slice ini nilainya selalu `null` karena belum ada UI upload.

### AR-06 — Revalidasi Harus Menjangkau Homepage, Bukan Cuma `/artikel`

`app/actions/products.ts` (`revalidateProductRoutes`) awalnya **lupa** revalidate `/` (homepage) dan itu jadi bug yang harus di-fix belakangan (dicatat eksplisit di komentar file itu sendiri: *"AR-03 awalnya skip revalidate('/') ... Asumsi itu salah"*). Slice ini **tidak mengulangi kesalahan itu**: `revalidateArticleRoutes()` (`BE` action baru) revalidate `/`, `/artikel`, `/artikel/{slug}`, dan `/sitemap.xml` sejak awal — karena homepage (`ArticlesPreview`, Epic 6 CF Slice 3) menampilkan data artikel juga.

---

## Ringkasan Task per Layer

| Layer | Jumlah Task | Prefix |
|---|---|---|
| UX | 2 | `E6-ADM-S1-UX` |
| User Stories | 3 | `E6-ADM-S1-US` |
| Backend | 6 | `E6-ADM-S1-BE` |
| Contract | 2 | `E6-ADM-S1-CT` |
| Frontend Admin | 7 | `E6-ADM-S1-FE` |
| QA | 5 | `E6-ADM-S1-QA` |
| **Total** | **25** | |

---

## Layer 1 — UX Tasks

### E6-ADM-S1-UX-01 — Wireframe `/admin/articles` (List)

**Priority:** P0 · **Tags:** `wireframe` `admin`

**Deliverable:** `docs/wireframes/Epic6_admin_slice1_articles-list.md`

```
┌─────────────────────────────────────────────────┐
│  <AdminHeader title="Manajemen Artikel"          │
│    breadcrumb="Artikel" />                       │
├─────────────────────────────────────────────────┤
│  <main>                                          │
│   6 artikel (5 published, 1 draft)               │
│                          [+ Tambah Artikel Baru] │  ← kanan atas, Link ke /new
│   ┌───────────────────────────────────────────┐ │
│   │ Judul      │Kategori│Status │Update│Aksi   │ │
│   ├───────────────────────────────────────────┤ │
│   │Standar SNI…│Edukasi │●Publish│2j lalu│⏻ ✎ 🗑│ │  ← ⏻=toggle publish, ✎=edit, 🗑=hapus
│   │Draft belum…│Edukasi │○Draft  │1h lalu│⏻ ✎ 🗑│ │
│   │ ...                                        │ │
│   └───────────────────────────────────────────┘ │
│  </main>                                         │
└─────────────────────────────────────────────────┘
```

**Empty state:** "Belum ada artikel. Klik 'Tambah Artikel Baru' untuk mulai." + tombol yang sama.

**Verifikasi:** Wireframe committed.

---

### E6-ADM-S1-UX-02 — Wireframe Form `/admin/articles/new` dan `/admin/articles/[id]/edit`

**Priority:** P0 · **Tags:** `wireframe` `admin`

**Deliverable:** `docs/wireframes/Epic6_admin_slice1_article-form.md`

```
┌─────────────────────────────────────────────────┐
│  <AdminHeader title="Tambah Artikel Baru"        │  ← atau "Edit Artikel"
│    breadcrumb="Artikel / Tambah" />              │
├─────────────────────────────────────────────────┤
│  <main>                                          │
│   Judul*        [___________________________]   │
│   Slug          [standar-sni-garam-indus___]     │  ← auto dari judul, editable
│                 (⚠ muncul kalau edit slug pada    │
│                  artikel published)               │
│   Kategori*     [Edukasi Garam ▼]                │
│   Meta Desc     [___________________________]   │
│                 120/300 karakter                 │
│   Konten*       [___________________________]   │  ← textarea polos, Slice 1
│                 [                             ]   │
│                 [                             ]   │
│   ☐ Publish sekarang                             │
│                                                    │
│   [Simpan]  [Batal]                              │
│  </main>                                          │
└─────────────────────────────────────────────────┘
```

**Verifikasi:** Wireframe committed.

---

## Layer 2 — User Stories

### E6-ADM-S1-US-01 — Admin Membuat Artikel Baru

**As** admin (2 orang tim non-teknis CV Reka Cipta),
**I want** membuat artikel baru dengan judul, kategori, dan isi tanpa perlu tahu HTML,
**So that** saya bisa cepat mempublikasikan konten edukasi/berita tanpa bergantung developer.

**Acceptance:**
- Slug otomatis terisi dari judul saat mengetik, bisa diedit manual
- Validasi jelas per field (asterisk merah untuk wajib)
- Setelah simpan, redirect ke list dengan toast sukses

### E6-ADM-S1-US-02 — Admin Publish/Unpublish Artikel Langsung dari List

**As** admin,
**I want** toggle status publish langsung dari tabel tanpa buka halaman edit,
**So that** saya cepat mengatur artikel mana yang tampil ke publik.

**Acceptance:**
- Klik toggle → status berubah seketika (optimistic atau loading singkat), tidak perlu reload manual
- `published_at` otomatis terisi `now()` saat pertama kali di-publish (tidak berubah lagi di publish berikutnya kalau sudah pernah terisi — lihat BE-05)

### E6-ADM-S1-US-03 — Admin Menghapus Artikel dengan Konfirmasi

**As** admin,
**I want** menghapus artikel yang salah buat atau sudah tidak relevan,
**So that** daftar artikel tetap rapi.

**Acceptance:**
- Klik "Hapus" → muncul konfirmasi browser native, bukan langsung terhapus
- Setelah konfirmasi, artikel hilang dari list dan tidak lagi accessible di `/artikel/{slug}` (404)

---

## Layer 3 — Backend

### E6-ADM-S1-BE-01 — `backend/utils/slugify.py`

**Priority:** P0 · **Tags:** `backend` `utility`

```python
# backend/utils/slugify.py
# Epic 6 Admin Slice 1 — slug generator untuk judul artikel. BUKAN reuse
# _slugify_code (products.py) atau slugify company name (rfq.py) — tujuan
# beda (slug URL SEO dari judul panjang, bukan filename dari kode pendek).

import re
import unicodedata


def slugify_title(title: str) -> str:
    normalized = unicodedata.normalize('NFKD', title).encode('ascii', 'ignore').decode('ascii')
    slug = normalized.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    slug = re.sub(r'-{2,}', '-', slug)
    return slug.strip('-')
```

**Verifikasi:**
```python
assert slugify_title("Mengenal Standar SNI untuk Garam Industri") == "mengenal-standar-sni-untuk-garam-industri"
assert slugify_title("5 Jenis Garam & Kegunaannya!") == "5-jenis-garam-kegunaannya"
```

---

### E6-ADM-S1-BE-02 — `backend/schemas/article.py`

**Priority:** P0 · **Tags:** `backend` `schema`

```python
# backend/schemas/article.py
# Epic 6 Admin Slice 1 — Schemas untuk CRUD artikel admin.
#
# ATURAN (ARCHITECTURE.md §16): setiap perubahan file ini WAJIB
# diikuti update types/api.ts.
#
# view_count TIDAK ADA di Create/Update — read-only, hanya berubah lewat
# RPC increment_article_view (public, lihat Epic 6 CF Slice 1 AR-06).

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

ARTICLE_CATEGORIES: set[str] = {'education', 'company_news'}


class ArticleAdmin(BaseModel):
    """Artikel lengkap untuk tampilan admin (termasuk draft)."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    slug: str
    category: str
    content: str
    thumbnail_url: Optional[str] = None
    meta_description: Optional[str] = None
    view_count: int
    is_published: bool
    published_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class ArticleCreateRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')

    title: str = Field(min_length=3, max_length=500)
    slug: Optional[str] = Field(default=None, max_length=500)
    category: str
    content: str = Field(min_length=1)
    meta_description: Optional[str] = Field(default=None, max_length=300)
    is_published: bool = False

    @field_validator('category')
    def validate_category(cls, v: str) -> str:
        if v not in ARTICLE_CATEGORIES:
            raise ValueError(f"Invalid category: {v}")
        return v


class ArticleUpdateRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')

    title: str = Field(min_length=3, max_length=500)
    slug: str = Field(min_length=1, max_length=500)
    category: str
    content: str = Field(min_length=1)
    meta_description: Optional[str] = Field(default=None, max_length=300)

    @field_validator('category')
    def validate_category(cls, v: str) -> str:
        if v not in ARTICLE_CATEGORIES:
            raise ValueError(f"Invalid category: {v}")
        return v


class ArticlePublishRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    is_published: bool


class ArticleAdminListResponse(BaseModel):
    articles: list[ArticleAdmin]
    total: int
    published_count: int
    draft_count: int


class ArticleDetailResponse(BaseModel):
    article: ArticleAdmin
```

**Catatan penting:**
- `ArticleUpdateRequest` **tidak** punya `is_published` — status publish diubah khusus lewat `PATCH /articles/{id}/publish` (`ArticlePublishRequest`), dipisah dari update konten. Ini mencegah admin accidentally publish artikel saat cuma mau edit typo (form edit dan toggle publish adalah dua aksi UI terpisah, lihat FE-05/FE-07).
- `thumbnail_path` **tidak** ada di kedua request — diisi eksklusif lewat endpoint upload (Slice 2).

**Verifikasi:** Import tanpa error, `ArticleCreateRequest(title="x"*3, category="education", content="isi")` valid dengan `slug=None, is_published=False`.

---

### E6-ADM-S1-BE-03 — Helper `_plain_text_to_html` + `_row_to_article_admin`

**Priority:** P0 · **Tags:** `backend`

**File:** `backend/routers/articles.py` (bagian atas, sebelum endpoint)

```python
import html


def _plain_text_to_html(text: str) -> str:
    """Textarea polos (Slice 1, lihat AR-01) -> HTML paragraf sederhana.
    Escape dulu supaya admin tidak bisa inject tag manual dari sini."""
    paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
    escaped = [html.escape(p).replace('\n', '<br>') for p in paragraphs]
    return ''.join(f'<p>{p}</p>' for p in escaped)


def _row_to_article_admin(row: dict) -> "ArticleAdmin":
    from schemas.article import ArticleAdmin
    from core.storage import get_public_storage_url

    thumbnail_path = row.get('thumbnail_path')
    return ArticleAdmin(
        **{k: v for k, v in row.items() if k != 'thumbnail_path'},
        thumbnail_url=get_public_storage_url('article-thumbnails', thumbnail_path) if thumbnail_path else None,
    )
```

**Verifikasi:**
```python
assert _plain_text_to_html("Paragraf satu.\n\nParagraf dua <script>.") == \
    "<p>Paragraf satu.</p><p>Paragraf dua &lt;script&gt;.</p>"
```

---

### E6-ADM-S1-BE-04 — `POST /articles` (Create)

**Priority:** P0 · **Tags:** `backend` `endpoint`

**File:** `backend/routers/articles.py`

```python
import logging
from fastapi import APIRouter, Depends, HTTPException
from dependencies.auth import get_current_user
from core.supabase import get_supabase
from schemas.article import (
    ArticleAdminListResponse,
    ArticleCreateRequest,
    ArticleDetailResponse,
    ArticlePublishRequest,
    ArticleUpdateRequest,
)
from utils.slugify import slugify_title

router = APIRouter(prefix="/articles", tags=["articles"])
logger = logging.getLogger(__name__)


def _ensure_unique_slug(supabase, slug: str, exclude_id: str | None = None) -> None:
    query = supabase.table("articles").select("id").eq("slug", slug)
    if exclude_id:
        query = query.neq("id", exclude_id)
    result = query.limit(1).execute()
    if result.data:
        raise HTTPException(status_code=409, detail=f"Slug '{slug}' sudah dipakai artikel lain")


@router.post("", response_model=ArticleDetailResponse, dependencies=[Depends(get_current_user)])
async def create_article(payload: ArticleCreateRequest):
    supabase = get_supabase()
    slug = payload.slug.strip() if payload.slug else slugify_title(payload.title)
    if not slug:
        raise HTTPException(status_code=422, detail="Slug tidak valid, gunakan judul dengan huruf/angka")

    _ensure_unique_slug(supabase, slug)

    insert_data = {
        "title": payload.title,
        "slug": slug,
        "category": payload.category,
        "content": _plain_text_to_html(payload.content),
        "meta_description": payload.meta_description,
        "is_published": payload.is_published,
        "published_at": "now()" if payload.is_published else None,
    }

    try:
        result = supabase.table("articles").insert(insert_data).execute()
    except Exception as e:
        logger.error(f"articles_create_failed: {e!r}")
        raise HTTPException(status_code=500, detail="Gagal membuat artikel")

    return ArticleDetailResponse(article=_row_to_article_admin(result.data[0]))
```

**Catatan:** `"now()"` literal string tidak akan dieval sebagai SQL oleh Supabase client Python (beda dari raw SQL) — **ganti dengan `datetime.utcnow().isoformat()`** sebelum insert. (Ditulis eksplisit di sini sebagai jangan-lupa; lihat Verifikasi di bawah untuk test yang menangkap ini.)

**Verifikasi:**
```bash
curl -X POST "${API_URL}/articles" -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Artikel Baru","category":"education","content":"Isi test.\n\nParagraf dua."}'
# Expected: 200, article.slug = "test-artikel-baru", article.content = "<p>Isi test.</p><p>Paragraf dua.</p>"

# Slug bentrok:
curl -X POST "${API_URL}/articles" ... -d '{"title":"Test Artikel Baru","category":"education","content":"x"}'
# Expected: 409
```

---

### E6-ADM-S1-BE-05 — `PUT /articles/{id}` (Update) + `PATCH /articles/{id}/publish`

**Priority:** P0 · **Tags:** `backend` `endpoint`

```python
@router.put("/{article_id}", response_model=ArticleDetailResponse, dependencies=[Depends(get_current_user)])
async def update_article(article_id: str, payload: ArticleUpdateRequest):
    supabase = get_supabase()

    existing = supabase.table("articles").select("id, slug").eq("id", article_id).limit(1).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Artikel tidak ditemukan")

    slug = payload.slug.strip()
    if slug != existing.data[0]["slug"]:
        _ensure_unique_slug(supabase, slug, exclude_id=article_id)

    update_data = {
        "title": payload.title,
        "slug": slug,
        "category": payload.category,
        "content": _plain_text_to_html(payload.content),
        "meta_description": payload.meta_description,
    }

    try:
        result = supabase.table("articles").update(update_data).eq("id", article_id).execute()
    except Exception as e:
        logger.error(f"articles_update_failed: id={article_id} error={e!r}")
        raise HTTPException(status_code=500, detail="Gagal menyimpan perubahan artikel")

    return ArticleDetailResponse(article=_row_to_article_admin(result.data[0]))


@router.patch("/{article_id}/publish", response_model=ArticleDetailResponse, dependencies=[Depends(get_current_user)])
async def toggle_publish_article(article_id: str, payload: ArticlePublishRequest):
    supabase = get_supabase()

    existing = supabase.table("articles").select("published_at").eq("id", article_id).limit(1).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Artikel tidak ditemukan")

    update_data: dict = {"is_published": payload.is_published}
    # published_at hanya di-set SEKALI (first publish) — unpublish lalu
    # publish lagi TIDAK reset tanggal publish awal. Konsisten ekspektasi
    # "tanggal publish" sebagai tanggal artikel pertama kali tayang, bukan
    # tanggal toggle terakhir.
    if payload.is_published and not existing.data[0]["published_at"]:
        from datetime import datetime, timezone
        update_data["published_at"] = datetime.now(timezone.utc).isoformat()

    try:
        result = supabase.table("articles").update(update_data).eq("id", article_id).execute()
    except Exception as e:
        logger.error(f"articles_publish_toggle_failed: id={article_id} error={e!r}")
        raise HTTPException(status_code=500, detail="Gagal mengubah status publish")

    return ArticleDetailResponse(article=_row_to_article_admin(result.data[0]))
```

**Catatan:** `update_article` (PUT) sengaja **tidak** menyentuh `is_published`/`published_at` sama sekali (lihat AR-05 catatan schema) — dua aksi tetap terpisah di level backend, bukan cuma di level UI.

**Verifikasi:**
```bash
# Update
curl -X PUT "${API_URL}/articles/${ID}" -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"title":"Judul Diedit","slug":"test-artikel-baru","category":"education","content":"Isi baru."}'
# Expected: 200

# Publish pertama kali
curl -X PATCH "${API_URL}/articles/${ID}/publish" -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" -d '{"is_published": true}'
# Expected: 200, published_at terisi

# Unpublish lalu publish lagi
curl -X PATCH "${API_URL}/articles/${ID}/publish" ... -d '{"is_published": false}'
curl -X PATCH "${API_URL}/articles/${ID}/publish" ... -d '{"is_published": true}'
# Expected: published_at TIDAK berubah dari nilai pertama
```

---

### E6-ADM-S1-BE-06 — `DELETE /articles/{id}`

**Priority:** P0 · **Tags:** `backend` `endpoint`

```python
@router.delete("/{article_id}", status_code=204, dependencies=[Depends(get_current_user)])
async def delete_article(article_id: str):
    supabase = get_supabase()

    existing = supabase.table("articles").select("id").eq("id", article_id).limit(1).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Artikel tidak ditemukan")

    try:
        supabase.table("articles").delete().eq("id", article_id).execute()
    except Exception as e:
        logger.error(f"articles_delete_failed: id={article_id} error={e!r}")
        raise HTTPException(status_code=500, detail="Gagal menghapus artikel")
```

**Catatan (lihat AR-03):** cleanup file `thumbnail_path` di storage **tidak** dilakukan di sini — belum ada thumbnail yang bisa diupload di slice ini. Task untuk Slice 2: extend endpoint ini dengan `delete_from_storage` best-effort setelah upload thumbnail dibangun.

**Verifikasi:**
```bash
curl -X DELETE "${API_URL}/articles/${ID}" -H "Authorization: Bearer ${TOKEN}" -w "%{http_code}"
# Expected: 204

curl "${API_URL}/../../artikel/test-artikel-baru"  # via Next.js, bukan FastAPI
# Expected: 404 (artikel benar-benar hilang)
```

Terakhir, register router di `backend/main.py`:
```python
from routers.articles import router as articles_router
# ...
app.include_router(articles_router, prefix="/api/v1")
```

---

## Layer 4 — Contract (Types + lib/api)

### E6-ADM-S1-CT-01 — `types/api.ts` Append Admin Article Types

**Priority:** P0 · **Tags:** `contract`

```typescript
// === Epic 6 Admin Slice 1: Article CRUD (E6-ADM-S1-CT-01) ===
// Mirror dari backend/schemas/article.py — jaga sinkron (ARCHITECTURE.md §16).

export interface ArticleAdmin {
  id: string
  title: string
  slug: string
  category: ArticleCategory
  content: string
  thumbnail_url: string | null
  meta_description: string | null
  view_count: number
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface ArticleCreateRequest {
  title: string
  slug?: string
  category: ArticleCategory
  content: string
  meta_description: string | null
  is_published: boolean
}

export interface ArticleUpdateRequest {
  title: string
  slug: string
  category: ArticleCategory
  content: string
  meta_description: string | null
}

export interface ArticlePublishRequest {
  is_published: boolean
}

export interface ArticleAdminListResponse {
  articles: ArticleAdmin[]
  total: number
  published_count: number
  draft_count: number
}

export interface ArticleDetailResponse {
  article: ArticleAdmin
}
```

**Catatan:** ditambahkan setelah blok `Article`/`ArticleRow` yang sudah ada dari Epic 6 CF Slice 1 (`E6-S1-CT-01`) — tipe publik dan admin **sengaja terpisah** (`Article` untuk publik, `ArticleAdmin` untuk admin) meski overlap besar, karena `ArticleAdmin` punya field admin-only (`is_published`, `created_at`, `updated_at`) yang tidak pernah dikirim ke publik.

**Verifikasi:** `npx tsc --noEmit` clean.

---

### E6-ADM-S1-CT-02 — `lib/api.ts` Append Article Admin Functions

**Priority:** P0 · **Tags:** `contract`

```typescript
// === Epic 6 Admin Slice 1: Article CRUD (E6-ADM-S1-CT-02) ===
// [AUTH] Dipakai Client Component saja — lihat komentar apiFetch di atas.

export async function createArticle(payload: ArticleCreateRequest): Promise<ArticleDetailResponse> {
  return apiFetch<ArticleDetailResponse>('/articles', {
    method: 'POST',
    auth: true,
    body: JSON.stringify(payload),
  })
}

export async function updateArticle(
  id: string,
  payload: ArticleUpdateRequest
): Promise<ArticleDetailResponse> {
  return apiFetch<ArticleDetailResponse>(`/articles/${id}`, {
    method: 'PUT',
    auth: true,
    body: JSON.stringify(payload),
  })
}

export async function toggleArticlePublish(
  id: string,
  payload: ArticlePublishRequest
): Promise<ArticleDetailResponse> {
  return apiFetch<ArticleDetailResponse>(`/articles/${id}/publish`, {
    method: 'PATCH',
    auth: true,
    body: JSON.stringify(payload),
  })
}

export async function deleteArticle(id: string): Promise<void> {
  await apiFetch<void>(`/articles/${id}`, { method: 'DELETE', auth: true })
}
```

**Catatan:** tidak ada `listArticlesAdmin`/`getArticleAdmin` di sini — list dan detail-untuk-edit fetch langsung dari Supabase di Server Component (AR-02), bukan lewat `apiFetch`.

**Verifikasi:** `npx tsc --noEmit` clean.

---

## Layer 5 — Frontend Admin

### E6-ADM-S1-FE-01 — `lib/slugify.ts` (Preview Client-Side)

**Priority:** P1 · **Tags:** `utility`

```typescript
// lib/slugify.ts
// Epic 6 Admin Slice 1 — preview slug di form, sinkron logika dengan
// backend/utils/slugify.py (slugify_title). Otoritas final tetap backend
// (uniqueness check ada di server, ini cuma UX preview instan).

export function slugifyTitle(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
}
```

**Verifikasi:** `slugifyTitle('Mengenal Standar SNI untuk Garam Industri')` → `'mengenal-standar-sni-untuk-garam-industri'`.

---

### E6-ADM-S1-FE-02 — `lib/validation/article-schema.ts`

**Priority:** P0 · **Tags:** `validation`

```typescript
import { z } from 'zod'

export const articleFormSchema = z.object({
  title: z.string().min(3, 'Minimal 3 karakter').max(500),
  slug: z.string().min(1, 'Slug wajib diisi').max(500)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Hanya huruf kecil, angka, dan tanda hubung'),
  category: z.enum(['education', 'company_news']),
  meta_description: z.string().max(300).nullable(),
  content: z.string().min(1, 'Konten wajib diisi'),
})

export type ArticleFormData = z.infer<typeof articleFormSchema>
```

**Verifikasi:** `npx tsc --noEmit` clean.

---

### E6-ADM-S1-FE-03 — `app/admin/articles/page.tsx`

**Priority:** P0 · **Tags:** `page` `admin`

```tsx
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { mapArticleRow } from '@/lib/article-mapper'
import { AdminHeader } from '@/components/layout/AdminHeader'
import { ArticlesAdminList } from '@/components/admin/article/ArticlesAdminList'
import type { ArticleRow } from '@/types/api'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Manajemen Artikel — Admin RCI' }

export default async function AdminArticlesPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('[AdminArticles] Gagal fetch articles:', error.message)
  }

  const articles = (data ?? []).map((row) => ({
    ...mapArticleRow(row as ArticleRow),
    is_published: (row as ArticleRow).is_published,
    updated_at: (row as ArticleRow).updated_at,
  }))
  const publishedCount = articles.filter((a) => a.is_published).length

  return (
    <>
      <AdminHeader title="Manajemen Artikel" breadcrumb="Artikel" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-6xl space-y-6 page-transition">
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-600">
              {articles.length} artikel ({publishedCount} published, {articles.length - publishedCount} draft)
            </p>
            <Link
              href="/admin/articles/new"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-teal-600 px-3 text-sm font-medium text-white hover:bg-brand-teal-500"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Tambah Artikel Baru
            </Link>
          </div>
          <ArticlesAdminList articles={articles} />
        </div>
      </main>
    </>
  )
}
```

**Catatan:** `mapArticleRow` (dari `lib/article-mapper.ts`, Epic 6 CF Slice 1) dipakai ulang untuk resolve `thumbnail_url` — tapi hasilnya perlu digabung manual dengan `is_published`/`updated_at` (field admin-only yang tidak ada di tipe `Article` publik). Kalau ini terasa janggal berulang di beberapa tempat, pertimbangkan menambah `mapArticleRowAdmin()` terpisah di iterasi berikutnya — untuk slice ini, inline merge seperti di atas cukup dan tidak menambah abstraksi prematur (YAGNI, satu pemakaian).

**Verifikasi:** `/admin/articles` (login required) menampilkan tabel dengan draft + published.

---

### E6-ADM-S1-FE-04 — `components/admin/article/ArticlesAdminList.tsx` + `ArticleAdminRow.tsx`

**Priority:** P0 · **Tags:** `component` `admin`

`ArticlesAdminList.tsx` — Server Component, pola identik `ProductsAdminList.tsx` (tabel + empty state), delegasi tiap baris ke `ArticleAdminRow`.

`ArticleAdminRow.tsx` — **Client Component** (beda dari `ProductAdminRow` yang full Server Component) karena butuh tombol toggle publish + hapus yang mutasi state:

```tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { toggleArticlePublish, deleteArticle, ApiFetchError } from '@/lib/api'

const CATEGORY_LABEL = { education: 'Edukasi Garam', company_news: 'Berita Perusahaan' } as const

interface ArticleAdminRowData {
  id: string
  title: string
  slug: string
  category: 'education' | 'company_news'
  is_published: boolean
  updated_at: string
}

export function ArticleAdminRow({ article }: { article: ArticleAdminRowData }) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  async function handleTogglePublish() {
    setIsPending(true)
    try {
      await toggleArticlePublish(article.id, { is_published: !article.is_published })
      toast.success(article.is_published ? 'Artikel di-unpublish' : 'Artikel di-publish')
      router.refresh()
    } catch (err) {
      if (err instanceof ApiFetchError && err.status === 401) router.push('/admin/login')
      else toast.error('Gagal mengubah status publish')
    } finally {
      setIsPending(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Hapus artikel "${article.title}"? Tindakan tidak bisa dibatalkan.`)) return
    setIsPending(true)
    try {
      await deleteArticle(article.id)
      toast.success('Artikel dihapus')
      router.refresh()
    } catch (err) {
      if (err instanceof ApiFetchError && err.status === 401) router.push('/admin/login')
      else toast.error('Gagal menghapus artikel')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <tr className="transition-colors duration-100 hover:bg-neutral-50">
      <td className="px-4 py-3">
        <Link href={`/admin/articles/${article.id}/edit`} className="font-medium text-ink-700 hover:text-brand-teal-600">
          {article.title}
        </Link>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center rounded bg-brand-teal-50 px-2 py-0.5 text-xs font-medium text-brand-teal-700">
          {CATEGORY_LABEL[article.category]}
        </span>
      </td>
      <td className="px-4 py-3">
        {article.is_published ? (
          <span className="inline-flex items-center rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
            Published
          </span>
        ) : (
          <span className="inline-flex items-center rounded bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600">
            Draft
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-neutral-500">
        {format(new Date(article.updated_at), 'd MMM yyyy, HH:mm', { locale: idLocale })}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="inline-flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleTogglePublish}
            disabled={isPending}
            title={article.is_published ? 'Unpublish' : 'Publish'}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-neutral-300 text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
          >
            {article.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <Link
            href={`/admin/articles/${article.id}/edit`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-neutral-300 text-neutral-600 hover:bg-neutral-50"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-danger-200 text-danger-600 hover:bg-danger-50 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}
```

**Verifikasi:** Klik toggle publish → status berubah, `router.refresh()` re-fetch Server Component induk. Klik hapus → confirm muncul, batal = tidak terjadi apa-apa, konfirmasi = row hilang.

---

### E6-ADM-S1-FE-05 — `app/actions/articles.ts`

**Priority:** P0 · **Tags:** `server-action`

```typescript
'use server'

// app/actions/articles.ts
// Epic 6 Admin Slice 1 — revalidate rute publik setelah CRUD artikel.
// Lihat AR-06: WAJIB include revalidatePath('/') — products.ts sempat lupa
// ini dan itu jadi bug production (lihat komentar di file itu).

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function revalidateArticleRoutes(slug?: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('UNAUTHORIZED')
  }

  revalidatePath('/')
  revalidatePath('/artikel')
  if (slug) revalidatePath(`/artikel/${slug}`)
  revalidatePath('/sitemap.xml')

  return { revalidated: true, timestamp: new Date().toISOString() }
}
```

**Verifikasi:** Dipanggil dari `ArticleForm.tsx` setelah create/update sukses, dan dari `ArticleAdminRow.tsx` setelah toggle publish/delete sukses.

---

### E6-ADM-S1-FE-06 — `components/admin/article/ArticleForm.tsx`

**Priority:** P0 · **Tags:** `component` `admin` `form`

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { articleFormSchema, type ArticleFormData } from '@/lib/validation/article-schema'
import { slugifyTitle } from '@/lib/slugify'
import { createArticle, updateArticle, ApiFetchError } from '@/lib/api'
import { revalidateArticleRoutes } from '@/app/actions/articles'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import type { ArticleAdmin } from '@/types/api'

const META_MAX = 300

interface ArticleFormProps {
  mode: 'create' | 'edit'
  initialData?: ArticleAdmin
}

export function ArticleForm({ mode, initialData }: ArticleFormProps) {
  const router = useRouter()
  const [isPublishChecked, setIsPublishChecked] = useState(initialData?.is_published ?? false)
  const slugManuallyEdited = useRef(mode === 'edit') // edit: jangan auto-overwrite slug existing

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ArticleFormData>({
    resolver: zodResolver(articleFormSchema),
    defaultValues: {
      title: initialData?.title ?? '',
      slug: initialData?.slug ?? '',
      category: initialData?.category ?? 'education',
      meta_description: initialData?.meta_description ?? null,
      content: initialData ? stripHtmlToPlainText(initialData.content) : '',
    },
  })

  const titleValue = watch('title')
  useEffect(() => {
    if (slugManuallyEdited.current) return
    setValue('slug', slugifyTitle(titleValue))
  }, [titleValue, setValue])

  const metaLength = watch('meta_description')?.length ?? 0
  const wasPublished = initialData?.is_published ?? false
  const slugChangedOnPublished = mode === 'edit' && wasPublished && watch('slug') !== initialData?.slug

  async function onSubmit(values: ArticleFormData) {
    try {
      if (mode === 'create') {
        const { article } = await createArticle({ ...values, is_published: isPublishChecked })
        await revalidateArticleRoutes(article.slug)
        toast.success('Artikel berhasil dibuat')
        router.push('/admin/articles')
      } else {
        const { article } = await updateArticle(initialData!.id, values)
        await revalidateArticleRoutes(article.slug)
        toast.success('Perubahan disimpan')
        router.push('/admin/articles')
      }
    } catch (err) {
      if (err instanceof ApiFetchError && err.status === 401) {
        router.push('/admin/login')
      } else if (err instanceof ApiFetchError && err.status === 409) {
        toast.error(err.message)
      } else {
        toast.error('Gagal menyimpan artikel')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="title">Judul <span className="text-danger-600">*</span></Label>
        <Input id="title" {...register('title')} disabled={isSubmitting} />
        {errors.title && <p className="text-sm text-danger-600">{errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          {...register('slug', {
            onChange: () => { slugManuallyEdited.current = true },
          })}
          disabled={isSubmitting}
        />
        {errors.slug && <p className="text-sm text-danger-600">{errors.slug.message}</p>}
        {slugChangedOnPublished && (
          <p className="text-sm text-warning-600">
            ⚠ Artikel ini sudah publish — mengubah slug akan mengubah URL publiknya, link lama akan 404.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category">Kategori <span className="text-danger-600">*</span></Label>
        <select
          id="category"
          {...register('category')}
          disabled={isSubmitting}
          className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
        >
          <option value="education">Edukasi Garam</option>
          <option value="company_news">Berita Perusahaan</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="meta_description">Meta Description</Label>
        <Textarea id="meta_description" {...register('meta_description')} disabled={isSubmitting} rows={2} />
        <p className={`text-xs ${metaLength > META_MAX ? 'text-danger-600' : 'text-neutral-400'}`}>
          {metaLength}/{META_MAX} karakter
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="content">Konten <span className="text-danger-600">*</span></Label>
        <Textarea id="content" {...register('content')} disabled={isSubmitting} rows={12} />
        {errors.content && <p className="text-sm text-danger-600">{errors.content.message}</p>}
        <p className="text-xs text-neutral-400">
          Pisahkan paragraf dengan baris kosong. Editor teks lengkap segera hadir.
        </p>
      </div>

      {mode === 'create' && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPublishChecked}
            onChange={(e) => setIsPublishChecked(e.target.checked)}
            disabled={isSubmitting}
          />
          Publish sekarang (kalau tidak dicentang, tersimpan sebagai draft)
        </label>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simpan'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push('/admin/articles')} disabled={isSubmitting}>
          Batal
        </Button>
      </div>
    </form>
  )
}

// Kebalikan _plain_text_to_html backend — dipakai saat load form edit
// supaya admin lihat teks polos lagi, bukan tag <p> mentah.
function stripHtmlToPlainText(html: string): string {
  return html
    .replace(/<\/p>\s*<p>/g, '\n\n')
    .replace(/<br\s*\/?>/g, '\n')
    .replace(/<\/?p>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}
```

**Catatan penting:**
- `mode === 'create'` render checkbox "Publish sekarang" — di mode `edit`, toggle publish **tidak** ada di form ini sama sekali (dilakukan dari tombol di list, `FE-04`), konsisten AR-05/skema `ArticleUpdateRequest` yang tidak punya `is_published`.
- `stripHtmlToPlainText` adalah operasi **lossy** untuk kasus HTML yang lebih kompleks dari hasil `_plain_text_to_html` sendiri (mis. kalau artikel nanti pernah diedit lewat Rich Text Editor di Slice 2 lalu dibuka lagi di form Slice 1 — skenario ini seharusnya tidak terjadi lagi setelah Slice 2 selesai karena form akan pakai `RichTextEditor`, bukan textarea, tapi dicatat sebagai known limitation transisi).
- `slugManuallyEdited` ref dimulai `true` untuk mode edit (slug existing tidak auto-diganti begitu form dibuka), `false` untuk mode create (auto-generate sampai admin mengetik manual di field slug).

**Verifikasi:** Create artikel baru → redirect ke list, artikel muncul. Edit artikel → perubahan tersimpan, redirect ke list. Ubah slug artikel published → warning muncul, tetap bisa disimpan (bukan blocked).

---

### E6-ADM-S1-FE-07 — `app/admin/articles/new/page.tsx` + `app/admin/articles/[id]/edit/page.tsx`

**Priority:** P0 · **Tags:** `page` `admin`

```tsx
// app/admin/articles/new/page.tsx
import { AdminHeader } from '@/components/layout/AdminHeader'
import { ArticleForm } from '@/components/admin/article/ArticleForm'

export const metadata = { title: 'Tambah Artikel — Admin RCI' }

export default function NewArticlePage() {
  return (
    <>
      <AdminHeader title="Tambah Artikel Baru" breadcrumb="Artikel / Tambah" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="page-transition">
          <ArticleForm mode="create" />
        </div>
      </main>
    </>
  )
}
```

```tsx
// app/admin/articles/[id]/edit/page.tsx
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { mapArticleRow } from '@/lib/article-mapper'
import { AdminHeader } from '@/components/layout/AdminHeader'
import { ArticleForm } from '@/components/admin/article/ArticleForm'
import type { ArticleRow } from '@/types/api'

export const metadata = { title: 'Edit Artikel — Admin RCI' }

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('articles').select('*').eq('id', id).limit(1).maybeSingle()

  if (!data) notFound()

  const row = data as ArticleRow
  const article = {
    ...mapArticleRow(row),
    is_published: row.is_published,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }

  return (
    <>
      <AdminHeader title="Edit Artikel" breadcrumb={`Artikel / ${article.title}`} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="page-transition">
          <ArticleForm mode="edit" initialData={article} />
        </div>
      </main>
    </>
  )
}
```

**Verifikasi:** `/admin/articles/new` render form kosong. `/admin/articles/{id}/edit` render form terisi data existing. `/admin/articles/id-tidak-ada/edit` → 404.

---

## Layer 6 — QA Tasks

### E6-ADM-S1-QA-01 — CRUD End-to-End

**Steps:** Create artikel baru (draft) → muncul di list dengan badge "Draft" → Edit judul & konten → tersimpan → Toggle publish → badge jadi "Published", `published_at` terisi → Buka `/artikel/{slug}` di tab lain → artikel terlihat publik → Hapus artikel → hilang dari list → `/artikel/{slug}` → 404.

**Verifikasi:** Seluruh siklus berjalan tanpa error, tidak perlu reload manual browser.

---

### E6-ADM-S1-QA-02 — Slug Uniqueness & Auto-Generate

**Steps:** Buat artikel judul "Test Slug Unik" → slug auto `test-slug-unik`. Buat artikel kedua judul sama persis → submit → error 409 tampil di toast, form tidak ter-redirect.

**Verifikasi:** Tidak ada 2 artikel dengan slug sama di DB.

---

### E6-ADM-S1-QA-03 — Whitelist & Auth Guard

**Steps:**
```bash
# Tanpa token
curl -X POST "${API_URL}/articles" -d '{"title":"x","category":"education","content":"y"}'
# Expected: 401

# Extra field terlarang
curl -X PUT "${API_URL}/articles/${ID}" -H "Authorization: Bearer ${TOKEN}" \
  -d '{"title":"x","slug":"x","category":"education","content":"y","view_count":9999}'
# Expected: 422 (extra='forbid')
```

**Verifikasi:** Kedua kasus di atas ditolak sesuai expected.

---

### E6-ADM-S1-QA-04 — Publish/Unpublish Idempotency `published_at`

**Steps:** Publish artikel → catat `published_at`. Unpublish → publish lagi → bandingkan `published_at` — harus identik dengan nilai pertama.

**Verifikasi:** `published_at` tidak reset di publish kedua dan seterusnya.

---

### E6-ADM-S1-QA-05 — Regresi Homepage & Sitemap

**Steps:** Publish artikel baru dari admin → buka homepage (`/`) tanpa hard-refresh cache browser → section "Wawasan & Kabar Terbaru" (Epic 6 CF Slice 3) menampilkan artikel baru dalam waktu wajar (revalidate). Cek `/sitemap.xml` → URL artikel baru muncul.

**Verifikasi:** Konsisten dengan AR-06 — homepage ikut ter-update, bukan cuma `/artikel`.

---

## Definition of Done — Slice 1

- [ ] `POST /articles`, `PUT /articles/{id}`, `DELETE /articles/{id}`, `PATCH /articles/{id}/publish` semua berfungsi dan auth-gated
- [ ] Slug auto-generate + unique constraint terverifikasi (409 saat bentrok)
- [ ] `/admin/articles` menampilkan semua artikel (draft+published) dengan aksi toggle/edit/hapus
- [ ] `/admin/articles/new` dan `/admin/articles/[id]/edit` berfungsi penuh (create & update)
- [ ] Delete dengan konfirmasi, artikel benar-benar hilang dari publik setelah dihapus
- [ ] Revalidate mencakup homepage, `/artikel`, `/artikel/{slug}`, sitemap
- [ ] Semua 5 QA task pass
- [ ] `npx tsc --noEmit`, `npm run lint`, `next build` clean

**Demo ke klien:**
- [ ] Sign-off Jazil/klien: admin buat artikel dari nol → publish → cek tampil di `/artikel` dan homepage → edit → hapus

---

## Handover ke Slice 2

Slice 2 (Rich Text Editor + Upload) bergantung pada:
- `ArticleForm.tsx` (`FE-06`) — textarea `content` diganti `<RichTextEditor>`, ditambah `<ThumbnailUploader>` (baru muncul setelah artikel punya `id`, yaitu di mode `edit`)
- `DELETE /articles/{id}` (`BE-06`) — akan di-extend untuk cleanup `thumbnail_path` di storage
- `_plain_text_to_html` (`BE-03`) — tidak lagi dipanggil untuk artikel baru begitu Rich Text Editor aktif, tapi tetap ada di kode untuk kompatibilitas artikel lama (tidak dihapus)

---

## Catatan Penutup

**1. Dua pola admin read yang beda sengaja didokumentasikan (AR-02), bukan konflik yang terlewat.** Products Admin (direct Supabase) vs Supplier Admin (FastAPI) adalah dua keputusan valid untuk konteks berbeda — slice ini eksplisit memilih salah satu dengan alasan, bukan meniru yang terakhir dikerjakan secara default.

**2. DELETE adalah endpoint pertama di codebase ini (AR-03)** — tidak ada preseden untuk disalin persis, jadi pola di atas (404 check dulu, lalu delete, tanpa soft-delete) adalah keputusan baru yang perlu ditinjau kalau epic mendatang butuh delete di resource lain (leads/suppliers sengaja tidak punya delete sampai saat ini — pertimbangkan apakah pola ini pantas direplikasi atau resource itu punya alasan bisnis khusus untuk tidak pernah dihapus).

**3. Transisi textarea → rich text editor (AR-01) adalah scope control yang disengaja**, bukan kompromi kualitas permanen. Kalau karena alasan waktu Slice 2 tertunda lama, Slice 1 tetap memberi admin kemampuan CRUD penuh yang fungsional — bukan setengah-jadi yang tidak bisa dipakai sampai kedua slice selesai.

---

**File:** `docs/EPIC6/epic6_task_breakdown_admin-panel_slice1_manajemen-artikel.md`
**Versi:** 1.0
**Berdasarkan:** `Epic_Doc2_Epics4-6_RekaCirciptaIndonesia.md` (Epic 6 bagian B), `PRD_WebGaram_RekaCirciptaIndonesia_v1.docx` §5.3.3, `DESIGN_SYSTEM_RekaCirciptaIndonesia_v2.md` v2.0, `epic6_task_breakdown_slice1_artikel-berita.md` (dependency utama, skema `articles` sudah live), `epic3B_task_breakdown_admin-panel.md` (pola split slice), verifikasi langsung kode `backend/routers/products.py`, `backend/core/supabase.py`, `components/admin/product/*`, `constants/adminNavigation.ts` (nav "Artikel" sudah pre-provisioned, tidak ada task nav baru)
