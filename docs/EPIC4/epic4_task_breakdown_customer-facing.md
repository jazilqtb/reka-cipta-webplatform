# Epic 4 Task Breakdown — Sistem RFQ (Customer-Facing)

**Project:** reka-cipta-platform
**Epic:** Epic 4 — Sistem RFQ + AI Proposal Generator
**Scope Dokumen:** Bagian **A. Customer-Facing Web** saja
**Version:** 1.0
**Author:** Ach. Jazilul Qutbi
**Status:** Draft — menunggu review sebelum eksekusi
**Depends on:** Epic 1, Epic 2 (semua), Epic 3 Customer-Facing (untuk repurpose CTA detail produk), Epic 3B (opsional — kalau belum done, seed produk statis)
**Blocks:** Epic 4 Admin Panel (Slice 1 — CRM Pipeline)

---

## Konteks Slice

**PIVOT dari Epic Doc original.** Alur di Epic Doc bilang "customer submit RFQ → AI generate proposal instant → email proposal ke customer < 30 detik." Alur ini di-refactor untuk MVP menjadi:

```
Customer submit form RFQ
  → POST /rfq/submit (public endpoint, TIDAK ada LLM call)
    → Insert ke rfq_leads dengan status='new'
    → Kirim email KONFIRMASI ke customer (bukan proposal — proposal manual by admin later)
    → Kirim email NOTIFIKASI ke admin: "RFQ baru dari {company}"
  → Frontend redirect ke halaman konfirmasi
  Target: submit + email delivery < 5 detik
```

**Konsekuensi DoD original berubah:**
- ❌ Original: "Email proposal terkirim ke calon mitra (isi proposal sesuai data)"
- ✅ Revisi: "Email konfirmasi terkirim ke calon mitra (personalized, mention produk yang dipilih, tim akan hubungi dalam 1×24 jam)"

Rasional pivot: proposal generation dengan quality control butuh admin review. Auto-generation instant tanpa human check = risk kirim proposal dengan error factual ke calon partner. Trade-off UX cepat vs kualitas → pilih kualitas untuk B2B context yang deal size tinggi.

Setelah Slice ini selesai, alur end-to-end user:
1. Calon partner dari halaman detail produk Epic 3 klik CTA "Dapatkan Penawaran" → redirect ke `/minta-penawaran?produk={slug}`
2. Form pre-fill dengan produk yang dipilih tercentang
3. Isi form, submit
4. Redirect ke `/minta-penawaran/terima-kasih`
5. Terima email konfirmasi dalam < 30 detik
6. Admin dapat notif email + lead muncul di database (belum ada UI admin di slice ini — dibangun di Epic 4 Admin Panel Slice 1)

**Slice tunggal untuk customer-facing karena:**
- Cuma 2 halaman baru (`/minta-penawaran` + `/minta-penawaran/terima-kasih`)
- 1 backend endpoint public (no AI complexity)
- 1 tabel baru (`rfq_leads`)
- Cross-slice touch minimal (Epic 3 detail page CTA repurpose)

Kalau di-split lebih lanjut, effort split lebih besar dari effort execute.

---

## Prasyarat Teknis

- [ ] Epic 1 selesai: middleware, Navbar/Footer, Sentry, lib/env.ts
- [ ] Epic 2 Slice 3 selesai: pattern email service via Resend, pattern rate limiting via slowapi (dari `/contact/send` endpoint)
- [ ] Epic 3 Customer-Facing Slice 2 selesai: detail produk dengan CTA `<Link href="/kontak?produk=X&intent=Y">` — akan di-repurpose
- [ ] `products` table live dengan minimal 5 produk `is_active = true` — form checkbox jenis garam populate dari DB
- [ ] `company_settings` table (Epic 2) menyimpan email admin destination (dari field `email`)
- [ ] Resend domain verified, API key set di env production

---

## Keputusan Arsitektur Slice

### AR-01 — TIDAK Ada LLM Integration di Customer-Facing

Endpoint `POST /rfq/submit` **tidak** call Anthropic API. Insert + 2 emails saja. LLM integration ada di Epic 4 Admin Panel Slice 2 (admin manually trigger).

Consequence untuk env vars: **`ANTHROPIC_API_KEY` tidak dibutuhkan** untuk deploy customer-facing. Jangan set — reduce accidental leak surface.

### AR-02 — Rate Limiting: 5 RFQ per IP per Jam

Konsisten dengan pattern Epic 2 Slice 3 (`/contact/send` rate limit 5/menit). Untuk RFQ, threshold lebih tinggi karena expected legitimate volume rendah. Adjust ke 5/jam supaya:
- Legitimate user tidak accidentally hit limit (kalau salah submit, retry 4x masih OK)
- Spam bot ter-throttle (bot bisa submit ratusan tanpa limit)

Implementasi via `slowapi` — decorator `@limiter.limit("5/hour")` di router.

### AR-03 — Email Confirmation Template Hardcoded di Slice Ini

Content email confirmation: personalized dengan nama, perusahaan, produk yang dipilih. Template **hardcoded** di backend `backend/services/email_service.py` untuk Slice ini.

Editability via admin settings di-defer ke Epic 4 Admin Panel Slice 3 (Post-MVP). Ini konsekuen dengan MVP philosophy — jangan build customization tanpa validated demand.

Template content (contoh):
```
Subject: [CV Reka Cipta] Konfirmasi Permintaan Penawaran — {company_name}

Halo {full_name},

Terima kasih atas ketertarikan Anda pada produk kami: {list_produk}.

Kami sudah menerima permintaan penawaran Anda dan tim kami akan
menyiapkan proposal khusus sesuai kebutuhan {company_name}
({volume_per_month} ton/{delivery_frequency}, pengiriman ke {delivery_city}).

Tim kami akan menghubungi Anda via WhatsApp di {whatsapp_masked}
dalam 1×24 jam dengan proposal lengkap.

Kalau ada pertanyaan mendesak, silakan reply email ini atau
hubungi kami di {company_whatsapp}.

Salam,
Tim CV Reka Cipta Indonesia
```

`{whatsapp_masked}` = mask 4 digit tengah untuk privacy (`+62812****5678`).

### AR-04 — Halaman Konfirmasi: Accept Direct URL Access

Alternatif access control (sessionStorage flag, cookie flag, referrer check) semua punya trade-off UX vs security. Untuk MVP, **accept direct URL access** ke `/minta-penawaran/terima-kasih`.

Konsekuensi: user yang share URL, atau bookmark, bisa akses halaman ini tanpa submit. **Not a security issue** — halaman tidak leak data, cuma static content.

Kalau nanti klien mau restrict (mis. tracking conversion untuk analytics), tambah query param `?ref=submit-{lead_id}` yang set setelah submit. Ini enhancement, not MVP blocker.

### AR-05 — CTA Repurpose Epic 3

CTA `<Link href="/kontak?produk={slug}&intent={sample|quotation}">` di detail produk Epic 3 di-**repurpose** ke `<Link href="/minta-penawaran?produk={slug}">`.

**Konsekuensi:**
- `/kontak` (Epic 2 Slice 3) tetap live sebagai general contact channel — tidak di-remove
- Product-specific inquiry mengalir ke RFQ form (higher-intent, structured data)
- Prefill parameter berubah dari `intent` (sample/quotation) ke `produk` (slug)

Ini **touch ke Epic 3 code**. Regression risk minimal karena tidak modify logic Epic 3, cuma ubah target link. Task eksplisit di Layer 3d.

### AR-06 — Prefill Produk: Multi-Select Support

Form field "Jenis Garam Dibutuhkan" adalah multi-checkbox (5 produk). Query param `?produk={slug}` = single value → prefill 1 checkbox.

**Extension:** Support multi-slug via comma-separated: `?produk=garam-halus-yodium,garam-halus-non-yodium`. Ini optional — Epic 3 detail page cuma link 1 produk per CTA, jadi single value adequate untuk MVP.

### AR-07 — Field Validation Boundary: Server-Side Authoritative

Frontend validation via Zod = UX layer (feedback cepat). Backend validation via Pydantic = security layer (source of truth). Sama pattern dengan Epic 3B admin panel — jangan skip backend validation.

Zod schema di `lib/validation/rfq-schema.ts` dan Pydantic schema di `backend/schemas/rfq.py` **wajib manual sync**.

### AR-08 — Rendering Strategy

- `/minta-penawaran` — **Static + revalidate 3600** (form structure statis, list produk dari DB revalidate hourly)
- `/minta-penawaran/terima-kasih` — **Static full** (no data fetch, revalidate = false)

Data yang butuh fetch di build time: list 5 produk untuk checkbox group. Fetch via `lib/supabase/public.ts` (R-02 dari operating rules global).

### AR-09 — Client Storage: `sessionStorage` untuk Submission State

Setelah submit sukses, redirect ke `/terima-kasih`. Tapi kalau user refresh page terima-kasih, atau share URL, tidak ada indikator "sudah submit vs direct access." 

**MVP: no indicator.** Halaman terima-kasih render generic message yang applicable both cases.

**Enhancement future:** set `sessionStorage.setItem('rfq_submitted', lead_id)` setelah submit → check di terima-kasih untuk personalize ("Terima kasih, {name}. Reference ID: {lead_id}"). Skip untuk MVP.

---

## Ringkasan Task per Layer

| Layer | Task Count | Fokus |
|---|---|---|
| UX | 5 | Wireframe form + confirmation + spec komponen kompleks |
| US | 5 | 5 user story utama |
| Backend | 6 | Migration + endpoint + email service + rate limit |
| Contract | 1 | Types + lib/api |
| Frontend | 10 | Route + form komponen + prefill + Epic 3 touch |
| QA | 5 | E2E + rate limit + email + prefill + demo |

**Total: 32 task.** Estimasi effort: 4-6 hari kerja (form validation + email integration + prefill + regression risk manageable).

---

## Layer 1 — UX Tasks

### E4-CF-UX-01 — Wireframe `/minta-penawaran`

**Priority:** P0 · **Tags:** `wireframe` `public`

**Deliverable:** `docs/wireframes/Epic4_slice1_rfq-form.md`

**Struktur wireframe:**
```
┌─────────────────────────────────────────────────┐
│  <Navbar />                                     │
├─────────────────────────────────────────────────┤
│  <InnerPageHero                                 │  ← reuse Epic 2 Slice 2
│    title="Minta Penawaran Sekarang"             │
│    subtitle="Dapatkan proposal khusus..."       │
│    breadcrumb=[Beranda / Minta Penawaran]       │
│  />                                             │
├─────────────────────────────────────────────────┤
│  <RFQForm>                                      │
│    <FormSection title="Informasi Perusahaan">   │
│      [Nama Lengkap*    ]                        │
│      [Nama Perusahaan* ]                        │
│      [Jabatan          ] (opsional)             │
│      [Jenis Industri▼* ] (7 opsi)               │
│    </FormSection>                               │
│                                                 │
│    <FormSection title="Kebutuhan Produk">       │
│      Jenis Garam* (min 1):                      │
│      ☑ Garam Halus Yodium (PRO YD)              │
│      ☐ Garam Halus Non-Yodium (PRO L)           │
│      ☐ Garam Kasar Industri (SPO/M)             │
│      ☐ Garam Kasar Petani (PTN PREMIUM)         │
│      ☐ Garam Halus Pakan Ternak (GHPT)          │
│      [Volume per Bulan*] ton                    │
│      [Frekuensi▼*      ] (3 opsi)               │
│      [Kota Tujuan*     ]                        │
│    </FormSection>                               │
│                                                 │
│    <FormSection title="Kontak">                 │
│      [Email*           ]                        │
│      [WhatsApp*        ]                        │
│      [Keterangan       ] (textarea, opsional)   │
│    </FormSection>                               │
│                                                 │
│    <Info block>                                 │
│      Setelah submit, tim kami akan menghubungi  │
│      via WhatsApp dalam 1×24 jam.               │
│    </Info>                                      │
│                                                 │
│    [Kirim & Dapatkan Penawaran]                 │
│  </RFQForm>                                     │
├─────────────────────────────────────────────────┤
│  <Footer />                                     │
└─────────────────────────────────────────────────┘
```

**Responsive:**
- Desktop: form max-width 720px, centered
- Mobile: full-width dengan padding horizontal 16px

**Verifikasi:** Wireframe committed.

---

### E4-CF-UX-02 — Wireframe `/minta-penawaran/terima-kasih`

**Priority:** P0 · **Tags:** `wireframe` `public`

**Deliverable:** Section di file wireframe.

**Struktur:**
```
┌─────────────────────────────────────────────────┐
│  <Navbar />                                     │
├─────────────────────────────────────────────────┤
│  <ConfirmationHero centered>                    │
│    [✓ Success Icon]                             │
│                                                 │
│    Permintaan Penawaran Anda                    │
│    Berhasil Dikirim!                            │
│                                                 │
│    Proposal khusus sedang disiapkan tim kami.   │
│    Anda akan dihubungi via WhatsApp dalam       │
│    1×24 jam.                                    │
│                                                 │
│    Cek juga inbox email Anda untuk konfirmasi.  │
│                                                 │
│    [Kembali ke Beranda] [Lihat Produk Lainnya]  │
│  </ConfirmationHero>                            │
├─────────────────────────────────────────────────┤
│  <Footer />                                     │
└─────────────────────────────────────────────────┘
```

**Verifikasi:** Wireframe committed.

---

### E4-CF-UX-03 — Spec Component `RFQForm` (Client Component)

**Priority:** P0 · **Tags:** `component-spec` `client-component` `complex`

**Deliverable:** Section detail di wireframe.

**Behavior:**
- Client Component (`'use client'`) — pakai react-hook-form + Zod
- 3 section grouped: Informasi Perusahaan, Kebutuhan Produk, Kontak
- Field validation inline (on blur, tidak on change — mengurangi noise saat user masih ngetik)
- Submit button:
  - Default: enabled, label "Kirim & Dapatkan Penawaran"
  - Loading: disabled, spinner + label "Mengirim..."
  - Success: redirect (button state irrelevant)
  - Error: enabled, toast merah + inline error kalau applicable

**States:**
1. **Idle** — form pristine
2. **Filling** — user typing, submit enabled
3. **Validating (blur)** — inline error muncul untuk field yang invalid
4. **Submitting** — button disabled + spinner
5. **Success** — redirect
6. **Error (network/server)** — toast merah + button re-enabled
7. **Error (rate limit)** — toast merah "Terlalu banyak permintaan. Coba lagi dalam 1 jam." + button disabled 60 detik

**Prefill logic:**
- On mount: baca `searchParams.get('produk')` via `useSearchParams()`
- Kalau ada valid slug, prefill checkbox jenis garam yang sesuai
- Kalau slug invalid (tidak match produk manapun), ignore silently

---

### E4-CF-UX-04 — Spec Component `SaltTypeCheckboxGroup`

**Priority:** P0 · **Tags:** `component-spec` `dynamic`

**Deliverable:** Section spec.

**Behavior:**
- Terima props: `products: Array<{ slug, name, code }>`, `value: string[]`, `onChange: (value: string[]) => void`
- Render checkbox per produk (5 rows)
- Label format: `{name} ({code})` — contoh "Garam Halus Yodium (PRO YD)"
- Kalau `products` populate dari DB kosong (edge case, semua `is_active = false`), render error message dan disable form submit

**Design:**
- Vertical stack checkbox (bukan grid) untuk readability
- Focus visible ring untuk keyboard navigation
- Label clickable (semantic `<label htmlFor>`)

**Validation:**
- Minimal 1 checkbox tercentang
- Kalau 0, inline error "Pilih minimal 1 jenis garam"

---

### E4-CF-UX-05 — Edge States Form

**Priority:** P1 · **Tags:** `edge-case`

**Deliverable:** Section di wireframe.

**Skenario:**

1. **Prefill valid** — checkbox tercentang, form scroll ke section produk
2. **Prefill invalid** — silent ignore, form empty
3. **Validation error single field** — inline error, form scroll ke field pertama yang error
4. **Rate limit hit** — toast + button disabled 60 detik dengan countdown ("Coba lagi dalam 58 detik...")
5. **Network error** — toast merah + button re-enabled + form data preserved (jangan reset)
6. **Server 500** — sama seperti network error + log ke Sentry
7. **Success** — redirect ke `/terima-kasih` (dengan optional `sessionStorage.setItem` untuk track submission)
8. **Email domain suspicious** — no validation di frontend, backend yang handle (mis. block disposable email domains → deffer ke enhancement)

---

## Layer 2 — User Stories

### E4-CF-US-01 — Calon Partner Submit RFQ

**As** calon partner dari industri makanan yang butuh garam halus yodium,
**I want** mengisi form permintaan penawaran dengan minimum friction,
**So that** saya bisa cepat dapat proposal dari CV Reka Cipta tanpa harus telpon manual.

**Acceptance:**
- Form single-page (no multi-step wizard)
- Field mandatory jelas (asterisk merah)
- Validation feedback muncul saat blur, bukan saat typing
- Submit < 5 detik return response
- Setelah submit sukses, redirect ke halaman konfirmasi yang clear

---

### E4-CF-US-02 — Prefill Produk dari CTA Epic 3

**As** calon partner yang klik CTA "Dapatkan Penawaran" dari halaman detail produk PRO YD,
**I want** form RFQ auto-prefill checkbox PRO YD tercentang,
**So that** saya tidak perlu re-select produk yang sudah saya lihat.

**Acceptance:**
- Klik CTA di `/produk/garam-halus-yodium` → landing di `/minta-penawaran?produk=garam-halus-yodium`
- Checkbox PRO YD tercentang
- User bisa uncheck atau tambah produk lain
- Kalau `produk` param invalid, form empty tanpa error message

---

### E4-CF-US-03 — Email Konfirmasi Personalized

**As** calon partner yang baru submit RFQ,
**I want** menerima email konfirmasi yang personalized dengan detail request saya,
**So that** saya yakin data terkirim benar dan tahu apa yang di-expect selanjutnya.

**Acceptance:**
- Email delivered dalam < 30 detik
- Subject mention nama perusahaan saya
- Body mention produk yang dipilih, volume, kota tujuan
- Info clear: "Tim akan hubungi via WhatsApp dalam 1×24 jam"
- WhatsApp number saya di-mask untuk privacy
- Reply-to field: email admin (bukan noreply)

---

### E4-CF-US-04 — Admin Dapat Notifikasi Real-Time

**As** admin (Irwan Sugianto) yang tanggung jawab follow-up leads,
**I want** dapat email notifikasi setiap RFQ baru masuk,
**So that** saya tidak perlu manual cek database dan bisa cepat follow-up.

**Acceptance:**
- Email delivered ke admin address dalam < 30 detik setelah customer submit
- Subject: "RFQ baru dari {company_name}"
- Body: summary field utama (perusahaan, industri, volume, kota, kontak)
- Link ke admin panel lead detail (nanti, saat Admin Slice 1 live — untuk Slice CF ini, link ke placeholder atau skip link)

---

### E4-CF-US-05 — Redirect Konfirmasi Setelah Submit

**As** calon partner yang baru submit form,
**I want** landing di halaman konfirmasi yang jelas ("permintaan berhasil"),
**So that** saya yakin submit sukses dan tidak perlu resubmit accidentally.

**Acceptance:**
- Setelah submit sukses, redirect otomatis ke `/minta-penawaran/terima-kasih`
- Halaman menampilkan visual success (icon check)
- Message jelas tentang next steps
- 2 CTA untuk navigate: Beranda + Katalog Produk
- Kalau user refresh atau share URL halaman ini, tetap render tanpa error

---

## Layer 3 — Engineering

### 3a. Database

#### E4-CF-DB-01 — Migration Create Table `rfq_leads`

**Priority:** P0 · **Tags:** `migration` `database`

**File:** `supabase/migrations/{ts}_create_rfq_leads_table.sql`

**Schema:**
```sql
CREATE TABLE IF NOT EXISTS public.rfq_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    position VARCHAR(100),
    industry_type VARCHAR(100) NOT NULL,
    salt_types TEXT[] NOT NULL,
    volume_per_month DECIMAL(10, 2) NOT NULL CHECK (volume_per_month > 0),
    delivery_frequency VARCHAR(50) NOT NULL,
    delivery_city VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(20) NOT NULL,
    notes TEXT,
    admin_notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'new',
    proposal_html TEXT,
    proposal_generated BOOLEAN NOT NULL DEFAULT FALSE,
    proposal_generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT rfq_leads_status_check
        CHECK (status IN ('new', 'contacted', 'sample_sent', 'negotiation', 'deal', 'lost')),
    CONSTRAINT rfq_leads_frequency_check
        CHECK (delivery_frequency IN ('weekly', 'biweekly', 'monthly'))
);

CREATE INDEX idx_rfq_leads_status ON public.rfq_leads(status);
CREATE INDEX idx_rfq_leads_created_at ON public.rfq_leads(created_at DESC);
CREATE INDEX idx_rfq_leads_email ON public.rfq_leads(email);
CREATE INDEX idx_rfq_leads_industry ON public.rfq_leads(industry_type);

CREATE TRIGGER trigger_rfq_leads_set_updated_at
    BEFORE UPDATE ON public.rfq_leads
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

**Catatan penting:**
- `proposal_generated_at` field tambahan dari Epic Doc — track kapan proposal di-generate (untuk admin analytics)
- `admin_notes` di-include walaupun tidak di-use di customer-facing — schema stability, jangan alter table nanti
- Trigger `set_updated_at` reuse function dari Epic 3 (kalau function belum ada, create di migration ini)

**Verifikasi:** `SELECT * FROM rfq_leads LIMIT 1;` tidak error, semua constraint applied.

---

#### E4-CF-DB-02 — Migration RLS Policies

**Priority:** P0 · **Tags:** `migration` `security` `rls`

**File:** `supabase/migrations/{ts}_rfq_leads_rls.sql`

**Konten:**
```sql
ALTER TABLE public.rfq_leads ENABLE ROW LEVEL SECURITY;

-- Public bisa INSERT (untuk submit RFQ dari form public)
-- BUT: kita pakai service_role dari backend, jadi RLS policy INSERT tidak critical.
-- Tapi tetap declare untuk defense in depth kalau ada frontend direct insert.
CREATE POLICY "Public can submit RFQ"
    ON public.rfq_leads
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        status = 'new'
        AND proposal_generated = FALSE
        AND admin_notes IS NULL
        AND proposal_html IS NULL
    );

-- Authenticated (admin) bisa SELECT/UPDATE/DELETE
CREATE POLICY "Admin can read all RFQ"
    ON public.rfq_leads FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Admin can update RFQ"
    ON public.rfq_leads FOR UPDATE TO authenticated
    USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Admin can delete RFQ"
    ON public.rfq_leads FOR DELETE TO authenticated USING (TRUE);
```

**Catatan RLS INSERT:** Public policy include `WITH CHECK` constraint yang enforce state initial — mencegah anon accidentally bypass status atau prefill admin fields via direct Supabase call. Backend endpoint yang legitimate pakai service_role (bypass RLS), jadi tidak affected.

**Verifikasi:** Test policy dengan `SET ROLE anon; INSERT INTO rfq_leads (...) VALUES (...);` — succeed untuk data valid, reject untuk data yang preset `status = 'contacted'`.

---

### 3b. Backend

#### E4-CF-BE-01 — Pydantic Schemas

**Priority:** P0 · **Tags:** `backend` `schema`

**File:** `backend/schemas/rfq.py`

**Konten:**
```python
from pydantic import BaseModel, ConfigDict, Field, EmailStr, field_validator
import re

INDUSTRY_TYPES = {
    'makanan-minuman', 'farmasi', 'kimia', 'peternakan',
    'tekstil', 'pengolahan-ikan', 'lainnya'
}

DELIVERY_FREQUENCIES = {'weekly', 'biweekly', 'monthly'}


class RFQSubmitRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')  # security: reject unknown fields

    full_name: str = Field(min_length=3, max_length=255)
    company_name: str = Field(min_length=1, max_length=255)
    position: str | None = Field(default=None, max_length=100)
    industry_type: str
    salt_types: list[str] = Field(min_length=1)
    volume_per_month: float = Field(gt=0)
    delivery_frequency: str
    delivery_city: str = Field(min_length=1, max_length=100)
    email: EmailStr
    whatsapp: str = Field(min_length=8, max_length=20)
    notes: str | None = Field(default=None, max_length=500)

    @field_validator('industry_type')
    def validate_industry(cls, v: str) -> str:
        if v not in INDUSTRY_TYPES:
            raise ValueError(f"Invalid industry type: {v}")
        return v

    @field_validator('delivery_frequency')
    def validate_frequency(cls, v: str) -> str:
        if v not in DELIVERY_FREQUENCIES:
            raise ValueError(f"Invalid frequency: {v}")
        return v

    @field_validator('whatsapp')
    def validate_whatsapp(cls, v: str) -> str:
        # Accept: 08xxx, +62xxx, 62xxx
        cleaned = re.sub(r'[\s\-()]', '', v)
        if not re.match(r'^(\+62|62|0)8\d{7,12}$', cleaned):
            raise ValueError("Invalid WhatsApp number format")
        return cleaned

    @field_validator('salt_types')
    def validate_salt_types(cls, v: list[str]) -> list[str]:
        # Dedup + strip
        cleaned = [s.strip() for s in v if s.strip()]
        if not cleaned:
            raise ValueError("At least one salt type required")
        return list(dict.fromkeys(cleaned))  # preserve order, remove dup


class RFQSubmitResponse(BaseModel):
    success: bool
    lead_id: str
    message: str = "RFQ berhasil disubmit"
```

**Verifikasi:**
- Test valid payload → validate pass
- Test payload dengan `whatsapp: "+62812-3456-7890"` → sanitized ke `+628123456789...`
- Test payload dengan `industry_type: "unknown"` → 422
- Test payload dengan `salt_types: []` → 422

---

#### E4-CF-BE-02 — Router `POST /rfq/submit`

**Priority:** P0 · **Tags:** `backend` `router`

**File:** `backend/routers/rfq.py`

**Konten high-level:**
```python
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
from slowapi import Limiter
from slowapi.util import get_remote_address
from backend.schemas.rfq import RFQSubmitRequest, RFQSubmitResponse
from backend.services.email_service import (
    send_rfq_customer_confirmation,
    send_rfq_admin_notification,
)
from backend.dependencies.supabase_client import get_supabase_service

router = APIRouter(prefix="/rfq", tags=["rfq"])
limiter = Limiter(key_func=get_remote_address)


@router.post(
    "/submit",
    response_model=RFQSubmitResponse,
    status_code=201,
    summary="Submit RFQ (public)",
)
@limiter.limit("5/hour")
async def submit_rfq(
    request: Request,
    payload: RFQSubmitRequest,
    background_tasks: BackgroundTasks,
) -> RFQSubmitResponse:
    supabase = get_supabase_service()

    # 1. Insert to DB
    insert_data = payload.model_dump()
    result = supabase.table("rfq_leads").insert(insert_data).execute()

    if not result.data:
        raise HTTPException(500, "Failed to save RFQ")

    lead = result.data[0]
    lead_id = lead["id"]

    # 2. Fetch product names untuk email personalization
    product_slugs = payload.salt_types
    products_result = (
        supabase.table("products")
        .select("slug, name, code")
        .in_("slug", product_slugs)
        .execute()
    )
    products = products_result.data or []

    # 3. Fetch admin email dari company_settings
    settings_result = (
        supabase.table("company_settings")
        .select("value")
        .eq("key", "email")
        .limit(1)
        .execute()
    )
    admin_email = settings_result.data[0]["value"] if settings_result.data else None

    if not admin_email:
        # Log warning tapi jangan fail — RFQ tetap saved
        logger.warning(f"No admin email configured, RFQ {lead_id} saved without notification")

    # 4. Queue emails via background task (async, tidak block response)
    background_tasks.add_task(
        send_rfq_customer_confirmation,
        to_email=payload.email,
        lead_data=lead,
        products=products,
    )
    if admin_email:
        background_tasks.add_task(
            send_rfq_admin_notification,
            to_email=admin_email,
            lead_data=lead,
            products=products,
        )

    return RFQSubmitResponse(success=True, lead_id=lead_id)
```

**Catatan penting:**
- `BackgroundTasks` untuk email send — jangan block response 30 detik hanya untuk email
- Kalau `admin_email` tidak ada di settings, RFQ tetap saved (fail-open untuk customer experience)
- `@limiter.limit("5/hour")` diterapkan per IP

**Verifikasi:** Curl test valid RFQ → 201 dengan `lead_id`. Query DB → row inserted. Cek Resend dashboard → 2 email delivered.

---

#### E4-CF-BE-03 — Email Service Extend

**Priority:** P0 · **Tags:** `backend` `email`

**File:** `backend/services/email_service.py` (extend existing dari Epic 2 Slice 3)

**Tambah 2 fungsi:**

```python
def send_rfq_customer_confirmation(
    to_email: str,
    lead_data: dict,
    products: list[dict],
) -> None:
    """Send confirmation email to customer after RFQ submit."""
    product_names = ", ".join(
        f"{p['name']} ({p['code']})" for p in products
    )
    whatsapp_masked = _mask_whatsapp(lead_data['whatsapp'])
    frequency_label = {
        'weekly': 'mingguan',
        'biweekly': 'dua minggu sekali',
        'monthly': 'bulanan',
    }[lead_data['delivery_frequency']]

    subject = f"[CV Reka Cipta] Konfirmasi Permintaan Penawaran — {lead_data['company_name']}"
    body = f"""
Halo {lead_data['full_name']},

Terima kasih atas ketertarikan Anda pada produk kami: {product_names}.

Kami sudah menerima permintaan penawaran Anda dan tim kami akan
menyiapkan proposal khusus sesuai kebutuhan {lead_data['company_name']}
({lead_data['volume_per_month']} ton/{frequency_label},
pengiriman ke {lead_data['delivery_city']}).

Tim kami akan menghubungi Anda via WhatsApp di {whatsapp_masked}
dalam 1×24 jam dengan proposal lengkap.

Kalau ada pertanyaan mendesak, silakan reply email ini.

Salam,
Tim CV Reka Cipta Indonesia
    """.strip()

    _send_email(
        to=to_email,
        subject=subject,
        text=body,
        reply_to=_get_admin_email(),  # helper untuk fetch dari settings
    )


def send_rfq_admin_notification(
    to_email: str,
    lead_data: dict,
    products: list[dict],
) -> None:
    """Notify admin about new RFQ."""
    product_names = ", ".join(f"{p['code']}" for p in products)
    subject = f"RFQ baru: {lead_data['company_name']} ({lead_data['industry_type']})"
    body = f"""
RFQ baru masuk:

Perusahaan: {lead_data['company_name']}
Kontak: {lead_data['full_name']} ({lead_data.get('position') or '-'})
Industri: {lead_data['industry_type']}
Produk: {product_names}
Volume: {lead_data['volume_per_month']} ton/{lead_data['delivery_frequency']}
Kota Tujuan: {lead_data['delivery_city']}

Email: {lead_data['email']}
WhatsApp: {lead_data['whatsapp']}

Catatan: {lead_data.get('notes') or '-'}

Lihat detail di admin panel:
{settings.FRONTEND_URL}/admin/leads/{lead_data['id']}
    """.strip()

    _send_email(to=to_email, subject=subject, text=body)


def _mask_whatsapp(wa: str) -> str:
    """Mask middle digits of WhatsApp number for privacy."""
    if len(wa) < 8:
        return wa
    return wa[:4] + "*" * (len(wa) - 8) + wa[-4:]
```

**Verifikasi:** Manual test email delivery via Resend sandbox. Cek subject + body render correct.

---

#### E4-CF-BE-04 — Register Router + slowapi Middleware

**Priority:** P0 · **Tags:** `backend` `wiring`

**File:** `backend/main.py`

**Tambah:**
```python
from backend.routers import rfq
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

app.include_router(rfq.router)

# Rate limit error handler (kalau belum di-setup di Epic 2 Slice 3)
app.state.limiter = rfq.limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

**Verifikasi:** `/docs` menampilkan endpoint `POST /rfq/submit` dengan rate limit info.

---

#### E4-CF-BE-05 — Manual Test Rate Limit

**Priority:** P0 · **Tags:** `testing` `manual`

**Test:**
```bash
# Submit 6 kali dalam 1 menit
for i in {1..6}; do
  curl -X POST http://localhost:8000/rfq/submit \
    -H "Content-Type: application/json" \
    -d '{"full_name":"Test","company_name":"Test",...}' \
    -w "\nAttempt $i: HTTP %{http_code}\n"
done

# Expected:
# Attempt 1-5: 201
# Attempt 6: 429 (Too Many Requests)
```

**Verifikasi:** Rate limit fires after 5 attempts. Response include `Retry-After` header.

---

#### E4-CF-BE-06 — Deploy Backend Railway + Production Curl Test

**Priority:** P0 · **Tags:** `deployment` `qa`

Similar dengan pattern Epic 3B. Push, tunggu deploy, curl test production URL untuk verify endpoint accessible + email delivery.

**Verifikasi:** Production `/rfq/submit` return 201 untuk valid payload, 429 untuk rate limit, 422 untuk invalid data.

---

### 3c. Contract

#### E4-CF-CT-01 — Types + lib/api

**Priority:** P0 · **Tags:** `contract`

**File 1:** `types/api.ts` (extend)

```typescript
export type DeliveryFrequency = 'weekly' | 'biweekly' | 'monthly';

export type IndustryType =
  | 'makanan-minuman'
  | 'farmasi'
  | 'kimia'
  | 'peternakan'
  | 'tekstil'
  | 'pengolahan-ikan'
  | 'lainnya';

export interface RFQSubmitRequest {
  full_name: string;
  company_name: string;
  position: string | null;
  industry_type: IndustryType;
  salt_types: string[];
  volume_per_month: number;
  delivery_frequency: DeliveryFrequency;
  delivery_city: string;
  email: string;
  whatsapp: string;
  notes: string | null;
}

export interface RFQSubmitResponse {
  success: boolean;
  lead_id: string;
  message: string;
}
```

**File 2:** `lib/api.ts`

```typescript
export async function submitRFQ(
  payload: RFQSubmitRequest
): Promise<RFQSubmitResponse> {
  return apiFetch<RFQSubmitResponse>('/rfq/submit', {
    method: 'POST',
    auth: false,
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  });
}
```

**Verifikasi:** Type check pass.

---

### 3d. Frontend Public

#### E4-CF-FE-01 — Zod Schema

**Priority:** P0 · **Tags:** `frontend` `validation`

**File:** `lib/validation/rfq-schema.ts`

```typescript
import { z } from 'zod';

export const rfqSubmitSchema = z.object({
  full_name: z.string().min(3, 'Minimal 3 karakter').max(255),
  company_name: z.string().min(1, 'Wajib diisi').max(255),
  position: z.string().max(100).nullable(),
  industry_type: z.enum([
    'makanan-minuman', 'farmasi', 'kimia', 'peternakan',
    'tekstil', 'pengolahan-ikan', 'lainnya'
  ]),
  salt_types: z.array(z.string()).min(1, 'Pilih minimal 1 jenis garam'),
  volume_per_month: z.number().positive('Volume harus lebih dari 0'),
  delivery_frequency: z.enum(['weekly', 'biweekly', 'monthly']),
  delivery_city: z.string().min(1, 'Wajib diisi').max(100),
  email: z.string().email('Format email tidak valid'),
  whatsapp: z.string().regex(
    /^(\+62|62|0)8\d{7,12}$/,
    'Format: 08xx atau +62xx'
  ),
  notes: z.string().max(500, 'Maks 500 karakter').nullable(),
});

export type RFQSubmitFormData = z.infer<typeof rfqSubmitSchema>;
```

**Sync note:** Enum values di Zod harus **exactly match** Pydantic constants di backend. Kalau update salah satu, update juga yang lain.

---

#### E4-CF-FE-02 — Route `/minta-penawaran/page.tsx`

**Priority:** P0 · **Tags:** `frontend` `server-component`

**File:** `app/minta-penawaran/page.tsx`

```typescript
import type { Metadata } from 'next';
import { createPublicSupabaseClient } from '@/lib/supabase/public';
import { InnerPageHero } from '@/components/hero/InnerPageHero';
import { RFQForm } from '@/components/rfq/RFQForm';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Minta Penawaran | CV Reka Cipta Indonesia',
  description: 'Dapatkan proposal penawaran khusus untuk kebutuhan garam industri Anda.',
};

export default async function MintaPenawaranPage() {
  const supabase = createPublicSupabaseClient();
  const { data: products } = await supabase
    .from('products')
    .select('slug, name, code')
    .eq('is_active', true)
    .order('sort_order');

  return (
    <main>
      <InnerPageHero
        title="Minta Penawaran Sekarang"
        subtitle="Dapatkan proposal khusus sesuai kebutuhan bisnis Anda"
        breadcrumb={[
          { label: 'Beranda', href: '/' },
          { label: 'Minta Penawaran', href: '/minta-penawaran' },
        ]}
      />
      <section className="container mx-auto px-4 py-12 max-w-3xl">
        <RFQForm availableProducts={products ?? []} />
      </section>
    </main>
  );
}
```

**Verifikasi:** Build output menampilkan `/minta-penawaran` sebagai `○` (Static + revalidate).

---

#### E4-CF-FE-03 — Component `RFQForm` (Client Component)

**Priority:** P0 · **Tags:** `frontend` `client-component` `complex`

**File:** `components/rfq/RFQForm.tsx`

**Struktur high-level:**
```typescript
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { rfqSubmitSchema, type RFQSubmitFormData } from '@/lib/validation/rfq-schema';
import { submitRFQ } from '@/lib/api';
import { SaltTypeCheckboxGroup } from './SaltTypeCheckboxGroup';
// ... other imports

interface Props {
  availableProducts: Array<{ slug: string; name: string; code: string }>;
}

export function RFQForm({ availableProducts }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const prefilledSlug = searchParams.get('produk');

  // Prefill logic: kalau ada slug valid, prefill array
  const prefilledSaltTypes = prefilledSlug
    && availableProducts.some(p => p.slug === prefilledSlug)
      ? [prefilledSlug]
      : [];

  const form = useForm<RFQSubmitFormData>({
    resolver: zodResolver(rfqSubmitSchema),
    mode: 'onBlur',
    defaultValues: {
      full_name: '',
      company_name: '',
      position: null,
      industry_type: 'makanan-minuman',
      salt_types: prefilledSaltTypes,
      volume_per_month: 0,
      delivery_frequency: 'monthly',
      delivery_city: '',
      email: '',
      whatsapp: '',
      notes: null,
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(data: RFQSubmitFormData) {
    setIsSubmitting(true);
    try {
      await submitRFQ(data);
      router.push('/minta-penawaran/terima-kasih');
    } catch (err) {
      if (err instanceof Error && err.message.includes('429')) {
        toast.error('Terlalu banyak permintaan. Coba lagi dalam 1 jam.');
      } else {
        toast.error('Gagal mengirim. Silakan coba lagi.');
      }
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {/* Section 1: Informasi Perusahaan */}
      <FormSection title="Informasi Perusahaan">
        {/* full_name, company_name, position, industry_type */}
      </FormSection>

      {/* Section 2: Kebutuhan Produk */}
      <FormSection title="Kebutuhan Produk">
        <Controller
          name="salt_types"
          control={form.control}
          render={({ field, fieldState }) => (
            <SaltTypeCheckboxGroup
              products={availableProducts}
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
        {/* volume_per_month, delivery_frequency, delivery_city */}
      </FormSection>

      {/* Section 3: Kontak */}
      <FormSection title="Kontak">
        {/* email, whatsapp, notes */}
      </FormSection>

      <InfoBlock>
        Setelah submit, tim kami akan menghubungi via WhatsApp dalam 1×24 jam.
      </InfoBlock>

      <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
        {isSubmitting ? 'Mengirim...' : 'Kirim & Dapatkan Penawaran'}
      </Button>
    </form>
  );
}
```

**Verifikasi:** Form render, validate, submit works. Prefill test dengan URL `?produk=garam-halus-yodium` → checkbox pre-selected.

---

#### E4-CF-FE-04 — Component `SaltTypeCheckboxGroup`

**Priority:** P0 · **Tags:** `frontend` `component`

**File:** `components/rfq/SaltTypeCheckboxGroup.tsx`

**Struktur:**
```typescript
'use client';

interface Props {
  products: Array<{ slug: string; name: string; code: string }>;
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
}

export function SaltTypeCheckboxGroup({ products, value, onChange, error }: Props) {
  function toggle(slug: string) {
    if (value.includes(slug)) {
      onChange(value.filter(s => s !== slug));
    } else {
      onChange([...value, slug]);
    }
  }

  if (products.length === 0) {
    return (
      <div className="text-red-600">
        Katalog produk sedang tidak tersedia. Silakan coba lagi nanti.
      </div>
    );
  }

  return (
    <fieldset>
      <legend className="mb-3 text-sm font-medium text-ink-primary">
        Jenis Garam Dibutuhkan *
      </legend>
      <div className="space-y-2">
        {products.map(product => (
          <label
            key={product.slug}
            className="flex items-center gap-3 rounded border border-slate-200 p-3 cursor-pointer hover:bg-slate-50"
          >
            <input
              type="checkbox"
              checked={value.includes(product.slug)}
              onChange={() => toggle(product.slug)}
              className="h-5 w-5"
            />
            <span>
              <strong>{product.name}</strong>{' '}
              <span className="font-mono text-sm text-ink-muted">
                ({product.code})
              </span>
            </span>
          </label>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </fieldset>
  );
}
```

**Verifikasi:** Multi-select works. Prefill dari parent form works. Empty state kalau `products = []`.

---

#### E4-CF-FE-05 — Route `/minta-penawaran/terima-kasih/page.tsx`

**Priority:** P0 · **Tags:** `frontend` `server-component`

**File:** `app/minta-penawaran/terima-kasih/page.tsx`

```typescript
import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Terima Kasih | CV Reka Cipta Indonesia',
  robots: { index: false, follow: false }, // don't index confirmation page
};

export default function TerimaKasihPage() {
  return (
    <main className="container mx-auto px-4 py-16 md:py-24 max-w-2xl text-center">
      <CheckCircle
        className="mx-auto mb-6 h-20 w-20 text-brand-teal-600"
        strokeWidth={1.5}
      />
      <h1 className="mb-4 text-3xl md:text-4xl font-bold text-ink-primary">
        Permintaan Penawaran Anda Berhasil Dikirim!
      </h1>
      <p className="mb-2 text-lg text-ink-secondary">
        Proposal khusus sedang disiapkan tim kami.
      </p>
      <p className="mb-8 text-lg text-ink-secondary">
        Anda akan dihubungi via WhatsApp dalam <strong>1×24 jam</strong>.
      </p>
      <p className="mb-10 text-sm text-ink-muted">
        Cek juga inbox email Anda untuk konfirmasi.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/"
          className={cn(buttonVariants({ variant: 'default', size: 'lg' }))}
        >
          Kembali ke Beranda
        </Link>
        <Link
          href="/produk"
          className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
        >
          Lihat Produk Lainnya
        </Link>
      </div>
    </main>
  );
}
```

**Catatan:** `robots: { index: false }` — halaman konfirmasi tidak boleh muncul di Google search (irrelevant untuk SEO, malah bisa membuat orang skip form).

---

#### E4-CF-FE-06 — Update Navbar Link "Minta Penawaran"

**Priority:** P1 · **Tags:** `frontend` `nav`

**Aksi:** Verify Navbar (dari Epic 1) sudah punya link "Minta Penawaran" pointing ke `/minta-penawaran`. Kalau belum, tambahkan.

**Verifikasi:** Klik nav link → land di form.

---

#### E4-CF-FE-07 — Update `app/sitemap.ts`

**Priority:** P1 · **Tags:** `frontend` `seo`

**Tambah:**
```typescript
{ url: `${baseUrl}/minta-penawaran`, priority: 0.9, changeFrequency: 'monthly' }
```

**Note:** `/terima-kasih` **tidak** ditambah ke sitemap — halaman internal flow, tidak untuk SEO.

**Verifikasi:** `/sitemap.xml` include `/minta-penawaran`, tidak include `/terima-kasih`.

---

#### E4-CF-FE-08 — Cross-Slice Touch: Epic 3 Detail Page CTA Repurpose

**Priority:** P0 · **Tags:** `frontend` `cross-slice-integration`

**Aksi:** Update `components/product/ProductCTA.tsx` (dari Epic 3 Slice 2):

**Sebelum:**
```typescript
const sampleHref = `/kontak?produk=${product.slug}&intent=sample`;
const quotationHref = `/kontak?produk=${product.slug}&intent=quotation`;
```

**Sesudah:**
```typescript
const quotationHref = `/minta-penawaran?produk=${product.slug}`;
const sampleHref = `/kontak?produk=${product.slug}&intent=sample`; // TETAP ke kontak untuk sampel
```

**Rationale:** "Dapatkan Penawaran" = high-intent → RFQ form. "Minta Sampel" = lower-intent, general inquiry → tetap ke `/kontak`. Kalau nanti mau unify keduanya, decision terpisah.

**Regression test wajib:**
- Klik "Dapatkan Penawaran" dari detail PRO YD → landing di `/minta-penawaran?produk=garam-halus-yodium` dengan checkbox pre-selected
- Klik "Minta Sampel" → landing di `/kontak?produk=...` (existing Epic 2 flow, tidak break)

**Verifikasi:** 2 alur tested manual, semua works.

---

#### E4-CF-FE-09 — Update Contact Form (Optional Cleanup)

**Priority:** P2 · **Tags:** `frontend` `optional`

Sebelumnya Epic 3 Slice 2 update contact form untuk baca `intent=quotation`. Sekarang `quotation` di-redirect ke `/minta-penawaran`, jadi contact form hanya perlu handle `intent=sample` (dan implicit "kontak umum").

**Aksi opsional:** Simplify contact form logic — buang branching untuk `intent=quotation` yang tidak akan ter-trigger lagi.

**Skip kalau:** tight timeline. Dead code tidak break anything.

**Verifikasi:** Kalau di-execute, contact form test regression pass.

---

#### E4-CF-FE-10 — Error Boundary `/minta-penawaran/error.tsx`

**Priority:** P1 · **Tags:** `frontend` `error-handling`

Standard error boundary dengan retry button. Kalau backend error atau network fail saat page load (mis. fetch products), tampilkan pesan + retry.

**File:** `app/minta-penawaran/error.tsx`

```typescript
'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="container mx-auto px-4 py-16 text-center">
      <h1 className="mb-4 text-2xl font-semibold">Gagal memuat halaman</h1>
      <p className="mb-6 text-ink-secondary">
        Silakan coba lagi atau hubungi kami langsung.
      </p>
      <button
        onClick={reset}
        className="rounded bg-brand-teal-600 px-6 py-2 text-white"
      >
        Coba lagi
      </button>
    </main>
  );
}
```

---

## Layer 4 — QA Tasks

### E4-CF-QA-01 — E2E Submission Flow

**Priority:** P0 · **Tags:** `qa` `e2e`

**Test:**
1. Buka `/minta-penawaran`
2. Fill semua field (valid data)
3. Submit
4. Verify redirect ke `/terima-kasih`
5. Cek inbox email (Resend sandbox atau real) — customer confirmation delivered
6. Cek email admin — notification delivered
7. Query DB `rfq_leads` — row inserted dengan data correct
8. Verify `status = 'new'`, `proposal_generated = false`

---

### E4-CF-QA-02 — Rate Limit Test

**Priority:** P0 · **Tags:** `qa` `security`

Submit 6 kali cepat → 6th attempt return 429. Wait 1 jam, retry → 201.

Kalau tidak mau wait, bisa mock IP dengan `X-Forwarded-For` header untuk testing.

---

### E4-CF-QA-03 — Prefill dari Epic 3 CTA

**Priority:** P0 · **Tags:** `qa` `cross-slice`

Dari `/produk/garam-halus-yodium` → klik "Dapatkan Penawaran" → land di `/minta-penawaran?produk=garam-halus-yodium` → checkbox PRO YD pre-selected.

Test 5 produk berbeda.

---

### E4-CF-QA-04 — Validation Test

**Priority:** P0 · **Tags:** `qa`

- Submit dengan email invalid → inline error muncul on blur
- Submit dengan WhatsApp format salah → inline error
- Submit dengan salt_types kosong → inline error di section
- Submit dengan volume 0 → inline error
- Submit dengan notes > 500 char → counter merah + submit blocked

---

### E4-CF-QA-05 — Client Demo Script

**Priority:** P0 · **Tags:** `demo`

**File:** `docs/demos/epic4_slice_cf_demo_script.md`

**Struktur (~7 menit):**
1. Konteks (30 detik) — "Ini adalah channel utama untuk RFQ. Klien bisa collect leads dengan data terstruktur, siap dianalisis di admin panel next slice."
2. Demo alur user (3 menit) — Dari detail produk → klik CTA → prefill form → isi → submit → confirmation
3. Demo email delivery (1 menit) — buka inbox customer + admin, tunjukkan konten personalized
4. Demo query database (1 menit) — buka Supabase SQL Editor, `SELECT * FROM rfq_leads ORDER BY created_at DESC LIMIT 5;`
5. Roadmap Admin Slice 1 (1.5 menit) — "Selanjutnya, admin panel untuk manage leads dengan pipeline Kanban."

**Sign-off:** klien setuju alur, konten email, dan struktur data.

---

## Definition of Done

**Backend:**
- [ ] Migration `rfq_leads` applied, 4 index + 2 CHECK constraint active
- [ ] RLS policies active (public INSERT dengan initial state constraint, admin ALL)
- [ ] Endpoint `POST /rfq/submit` deployed, rate limit 5/hour aktif
- [ ] Email service 2 fungsi (customer + admin) working via Resend
- [ ] Deploy Railway production

**Frontend:**
- [ ] `/minta-penawaran` Static + revalidate 3600, form render
- [ ] Prefill dari query param works untuk 5 produk
- [ ] Submit flow: validate → POST → redirect ke terima-kasih
- [ ] Rate limit error handling di frontend (429 → toast Indonesian)
- [ ] `/minta-penawaran/terima-kasih` Static, robots noindex
- [ ] CTA Epic 3 detail page repurposed ke RFQ (regression pass)
- [ ] Navbar link aktif
- [ ] Sitemap include `/minta-penawaran`

**Integration:**
- [ ] E2E flow tested: form → email → DB row
- [ ] Regression Epic 3: filter tab, detail page, "Minta Sampel" masih works
- [ ] Regression Epic 2: `/kontak` still works (contact form intact)

**Kualitas kode:**
- [ ] `pnpm tsc --noEmit` pass
- [ ] `pnpm lint` pass
- [ ] Zod ↔ Pydantic schema sync verified

**QA:**
- [ ] E2E submission test pass
- [ ] Rate limit test pass
- [ ] Prefill test 5 produk pass
- [ ] Validation edge cases pass

**Demo:**
- [ ] Client demo done
- [ ] Sign-off recorded

---

## Handover ke Epic 4 Admin Panel Slice 1

Setelah customer-facing live:
- `rfq_leads` table populated dengan data real (dari test + demo)
- Admin belum ada UI untuk manage — cuma dapat notif email
- **Blocker klien:** klien butuh admin panel untuk tidak scroll DB manual. Prioritas start Slice 1 admin panel.

**Slice 1 admin panel akan:**
- Bikin Kanban pipeline
- Bikin detail lead page
- Bikin WA template generator
- **Belum ada proposal generator** — itu Slice 2 admin

**File:** `docs/epic-breakdown/epic4_task_breakdown_customer-facing.md`
**Version:** 1.0 — 2026-07-05
