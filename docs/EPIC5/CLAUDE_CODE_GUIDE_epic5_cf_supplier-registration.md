# Claude Code Execution Guide — Epic 5 CF (Pendaftaran Supplier — Customer-Facing)

**Project:** reka-cipta-platform
**Slice:** Epic 5 Customer-Facing — Form pendaftaran supplier + halaman konfirmasi + endpoint public + email notification
**Task Breakdown Reference:** `epic5_task_breakdown_customer-facing.md` (WAJIB dibaca sebelum eksekusi)
**Prasyarat:** Epic 4B Slice 1 + Slice 2 sudah merged ke `main`, live production, sign-off klien
**Version:** 1.0
**Author:** Ach. Jazilul Qutbi
**Total Phase:** 14 | **STOP Gates:** 4

---

## Cara Pakai Guide Ini

Format sama dengan Slice 2 & Slice 3 guide. **Perbedaan risk profile fundamental dari slice sebelumnya:**

| Aspek | Slice Ini (Epic 5 CF) | Slice Sebelumnya (Epic 4B S2) |
|---|---|---|
| Primary risk | Zod/Pydantic constraint drift + RLS INSERT policy correctness + Email service extend regression | Prompt quality + Docker deps + Anthropic cost |
| External dependencies | Resend (sudah proven Epic 4 CF), slowapi (sudah installed) | **Anthropic API + WeasyPrint system libs + Resend attachments** |
| Cost implication | **Zero LLM cost** — hanya email delivery cost (Resend, negligible) | ~$0.02 per generation |
| Cross-slice touches | **Zero** — Epic 3, 4 CF, 4B tidak disentuh | LeadDetailView (Slice 1) |
| Highest-ROI activity | RLS policy correctness verification + smoke test end-to-end | Prompt iteration dengan real data |
| Estimated effort | 3-4 hari | 5-7 hari |

**Yang paling risky di slice ini (urutan severity):**

1. **RLS INSERT policy** — Public bisa insert, tapi harus enforce `status='new' AND admin_notes IS NULL`. Kalau policy salah, anon bisa preset status ke `active` (bypass verifikasi manual) atau prefill `admin_notes` (data corruption). **Verify manual via `SET ROLE anon;` test di Gate 1.**
2. **Zod ↔ Pydantic constraint sync** — 2 tempat definisikan validation (frontend UX + backend security). Kalau drift, user bisa dapat validation error dari server yang tidak ter-catch di client. Manual sync wajib R-46.
3. **WhatsApp normalization** — Input user variatif (`08xxx`, `+62xxx`, `62xxx`, dengan spasi/dash). Backend normalize ke canonical `+62xxx` sebelum insert. Kalau salah, format DB inconsistent dan admin panel Epic 5 (slice terpisah) akan display broken.
4. **Email service extend regression** — Extend `email_service.py` yang sudah live untuk Epic 4 CF. Kalau accidentally break `send_rfq_confirmation` (Epic 4 CF), semua RFQ submission Epic 4 CF gagal kirim email. **Test regression Epic 4 CF di Gate 3.**
5. **Konstanta `SUPPLIER_SALT_TYPES` sync** — Frontend TS constant + Backend Python set + Zod enum + Pydantic validator + email service label map — semua harus sync manual. Salah 1 = mismatch.

**Yang TIDAK jadi risk di slice ini (perbedaan dari Slice 2):**
- Tidak ada Docker system deps update — backend Dockerfile sudah accommodate WeasyPrint dari Slice 2, tidak perlu tambah
- Tidak ada environment variable baru
- Tidak ada blocking request UX concern — semua endpoint fast (< 2 detik)
- Tidak ada cross-slice touch UI

---

## Operating Rules — Delta dari Guide Sebelumnya

Operating Rules **R-01 sampai R-45** dari guide-guide sebelumnya tetap berlaku. Rules R-37 sampai R-45 (Slice 3 post-MVP) di-lock sebagai reserved walaupun Slice 3 belum executed — jangan reuse nomor tersebut.

Rules tambahan spesifik Epic 5 CF:

### R-46 — Konstanta Sync 5 Tempat: Manual, Bukan Ambient

Konstanta `SUPPLIER_SALT_TYPES` didefinisikan di **5 tempat** yang harus manual sync:

1. `lib/constants/supplier-salt-types.ts` — Frontend TS constant + type
2. `lib/validation/supplier-schema.ts` — Zod enum (derive dari #1)
3. `backend/constants/supplier.py` — Backend Python set
4. `backend/schemas/supplier.py` — Pydantic validator (derive dari #3)
5. `backend/services/email_service.py` — Label map untuk readable email content

**Pattern derivasi (untuk minimize drift):**
- Frontend: #2 derive dari #1 (`z.enum(SUPPLIER_SALT_TYPES.map(t => t.value))`)
- Backend: #4 derive dari #3 (validator check `in SUPPLIER_SALT_TYPES`)
- Cross-boundary #1 vs #3: **manual copy-paste dengan comment TODO**

Setiap file wajib ada comment:
```
# WARNING: Konstanta ini duplicate di [file lain]. Kalau ubah, sync manual.
```

- **JANGAN** ambient sync via config file / API — overengineering untuk 5 value stable.
- **JANGAN** derive backend dari frontend (mis. build-time codegen) — bikin backend deploy tergantung frontend build.
- **JANGAN** create migration DB `salt_types` reference table — sudah diputuskan di task breakdown AR-07 (hardcoded).

**Verifikasi sync**: setelah edit di 1 tempat, run mental checklist 5 file. Bikin PR review checklist item eksplisit.

### R-47 — WhatsApp Normalization: Backend Authoritative

Frontend Zod cukup validate format regex (`^(\+62|62|0)8\d{7,12}$`), **jangan normalize di frontend**. Backend Pydantic validator lakukan:

1. Strip spaces, dashes, parentheses
2. Normalize prefix:
   - `0xxx` → `+62xxx`
   - `62xxx` → `+62xxx`
   - `+62xxx` → keep as-is
3. Return canonical form

Rasional: kalau normalize di frontend juga, ada dual source of truth = risk drift. Backend adalah authoritative — konsisten dengan Epic 4 CF AR-07.

**Konsekuensi:**
- DB storage: **selalu** format `+62xxx`
- Admin panel Epic 5 (slice terpisah) render dengan formatter `+62 812-3456-7890`
- `wa.me/{number}` link: strip `+` jadi `62xxx`

- **JANGAN** normalize di frontend Zod validator — validasi format saja.
- **JANGAN** ubah normalization logic tanpa migration data lama (untung slice ini fresh table, tidak ada data lama).

### R-48 — Email Optional Field Handling: 3-Layer Empty Handling

Field `email` di form adalah opsional. Handling empty:

| Layer | Empty Representation |
|---|---|
| Form input (browser) | `""` empty string |
| Frontend submit payload | `undefined` (bukan `""` — kalau send `""`, backend Pydantic EmailStr akan reject sebagai invalid) |
| Backend Pydantic | `EmailStr \| None` |
| DB storage | `NULL` |

Pattern frontend sebelum submit:
```typescript
const payload = {
  ...data,
  email: data.email || undefined,  // "" → undefined
};
```

- **JANGAN** kirim `""` ke backend — akan return 422 "not a valid email".
- **JANGAN** default ke `null` di frontend TS — `null` bukan valid `undefined` dan bisa serialize sebagai `"null"` string di beberapa scenario.
- **JANGAN** tambah `.transform(v => v || undefined)` di Zod — Zod schema representasi form state, transform pas submit lebih explicit.

### R-49 — Rate Limit Pattern Reuse (Tidak Reinvent)

`slowapi` sudah installed dari Epic 2 Slice 3. `limiter` instance sudah di `backend/limiter.py`. Reuse:

```python
from ..limiter import limiter

@router.post("/register", ...)
@limiter.limit("5/hour")
async def register_supplier(request: Request, ...):
    ...
```

Konsisten dengan Epic 4 CF `POST /rfq/submit` (5/hour). Threshold sama walaupun expected volume beda — konsistensi > premature optimization.

- **JANGAN** install `slowapi` lagi (sudah di `requirements.txt`).
- **JANGAN** create new limiter instance — pakai singleton yang sudah ada.
- **JANGAN** ubah threshold jadi `5/minute` atau `10/hour` tanpa alasan konkret. Konsisten dulu, adjust setelah production data.
- **`request: Request` parameter WAJIB** untuk `@limiter.limit` decorator — kalau lupa, decorator silently no-op.

### R-50 — Email Failure Non-Blocking (Submit Sukses Walaupun Email Gagal)

Endpoint `POST /supplier/register` pattern:

1. **Blocking:** Insert ke `supplier_registrations` — kalau fail, raise 500 (data tidak tersimpan = user harus retry)
2. **Non-blocking:** Kirim email notifikasi ke admin — kalau fail, **log warning tapi jangan raise**

Rasional:
- Data supplier tersimpan = high priority
- Email delivery = medium priority (admin bisa cek DB kalau email delayed atau failed)
- User experience: kalau raise 500 karena email fail, user retry → 2 row data (duplicate)

Implementation:
```python
try:
    await send_supplier_notification_to_admin(supplier=supplier_row)
except Exception as e:
    logger.warning(f"Email notification failed for supplier {supplier_id}: {e}")
    # DO NOT raise — data sudah tersimpan
```

- **JANGAN** wrap DB insert dengan same try-except — insert failure ≠ email failure secara severity.
- **JANGAN** implement retry loop dengan exponential backoff — cost complexity vs benefit rendah untuk email admin.
- **JANGAN** kirim response ke frontend dengan `email_sent: false` — internal detail, jangan bocor. Frontend hanya tahu `success: true`.

### R-51 — Component Baru vs Reuse: `SupplierSaltTypesCheckboxGroup` Bukan Reuse

Epic 4 CF sudah punya `SaltTypeCheckboxGroup` untuk `products` table. Epic 5 CF butuh `SupplierSaltTypesCheckboxGroup` untuk supplier taxonomy.

**Semantically berbeda:**
- Epic 4 CF: 5 produk end-user (PRO YD, PRO L, dst) — populate dari DB
- Epic 5 CF: 5 kategori supplier raw material — hardcoded konstanta

**JANGAN reuse `SaltTypeCheckboxGroup`.** Buat component baru. Rasional (dari task breakdown AR-07):
- Konteks bisnis beda
- Data source beda (DB vs konstanta)
- Coupling reuse bikin fragile — kalau Epic 3 ubah products, form supplier ikut break

**Naming eksplisit `Supplier` prefix** untuk avoid confusion saat grep code.

- **JANGAN** parameterize `SaltTypeCheckboxGroup` dengan prop `dataSource: 'products' | 'supplier'` — overengineering.
- **JANGAN** extract shared abstraction premature (mis. `<GenericCheckboxGroup>`) — YAGNI, apply saat ada 3rd use case.

### R-52 — Email Service Extend Regression Discipline

`backend/services/email_service.py` **sudah live** dengan function `send_rfq_confirmation` (Epic 4 CF). Extend dengan `send_supplier_notification_to_admin` **tanpa modify existing functions**.

Pattern wajib:
1. **BACA DULU** file existing — identify structure, imports, shared constants
2. **APPEND function baru** di bawah existing functions
3. **Kalau perlu shared helper** (mis. `_wrap_email_html`), extract HANYA kalau lebih dari 1 fungsi butuh
4. **TEST regression Epic 4 CF** setelah edit — trigger RFQ submit di local/staging, verify email confirmation Epic 4 CF masih delivered

Backup tag sebelum edit:
```bash
git tag pre-e5cf-email-extend
```

Kalau regression detected, revert via `git reset --hard pre-e5cf-email-extend`.

- **JANGAN** refactor existing functions "sekalian" — scope creep + regression risk.
- **JANGAN** ubah signature `send_rfq_confirmation` — Epic 4 CF router memanggilnya, break signature = 500 di production.

---

# PHASE 1 — Preflight & Branch Setup

**Tujuan:** Verify prasyarat production stable, setup branch, baca semua file existing yang akan disentuh.

## Kerjakan

1. `git status` bersih, `git checkout main && git pull`.
2. Verify prasyarat production:
   - Login production, buka `/kontak` (Epic 2 Slice 3) → submit test → verify email delivery masih works (baseline Resend health)
   - Buka `/minta-penawaran` (Epic 4 CF) → submit test dummy → verify email confirmation ke customer + email notifikasi ke admin delivered (baseline Resend + email service pattern health)
   - Cleanup test row: `DELETE FROM rfq_leads WHERE full_name = 'Test Baseline';`
3. Verify file existing yang akan disentuh:
   ```bash
   ls backend/services/email_service.py
   ls backend/limiter.py
   ls components/layout/Navbar.tsx
   ls app/sitemap.ts
   ```
4. **BACA** `backend/services/email_service.py` end-to-end. Identify:
   - Shared imports (`resend`, `EMAIL_FROM_ADDRESS`, `logger`)
   - Existing function `send_rfq_confirmation` signature
   - Helper function pattern (kalau ada `_wrap_email_html` atau similar)
   - Konstanta `get_admin_email()` — reuse untuk supplier notification
5. **BACA** `backend/limiter.py` — verify `limiter` instance exported.
6. **BACA** `components/layout/Navbar.tsx` — identify nav items array structure.
7. **BACA** `app/sitemap.ts` — identify existing entries pattern.
8. Buat branch: `git checkout -b feature/epic5-cf-supplier-registration`
9. Backup tag pre-edit:
   ```bash
   git tag pre-e5cf-baseline
   ```

## Jangan

- **JANGAN** skip baseline health check. Kalau Epic 4 CF broken di production, itu baseline masalah — fix dulu, jangan lanjut Epic 5 di atas foundation broken.
- **JANGAN** proceed tanpa read existing `email_service.py` — extend blind = regression risk (R-52).
- **JANGAN** create file baru sebelum baca existing — bisa duplicate helper yang sudah ada.

## Verifikasi

- [ ] Branch `feature/epic5-cf-supplier-registration` aktif
- [ ] Baseline Epic 2 Slice 3 + Epic 4 CF email flow works
- [ ] Semua file existing yang akan disentuh sudah dibaca
- [ ] Backup tag `pre-e5cf-baseline` exists

---

# PHASE 2 — Database Migration (`supplier_registrations` + RLS)

**Tujuan:** Create table + RLS policies via 2 migration files.

## Kerjakan

1. Generate timestamp:
   ```bash
   TS=$(date -u +%Y%m%d%H%M%S)
   ```
2. Buat migration `supabase/migrations/{ts}_create_supplier_registrations_table.sql`:
   ```sql
   CREATE TABLE IF NOT EXISTS public.supplier_registrations (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       business_name VARCHAR(255) NOT NULL,
       location_city VARCHAR(100) NOT NULL,
       location_province VARCHAR(100) NOT NULL,
       salt_types_available TEXT[] NOT NULL,
       capacity_per_month DECIMAL(10, 2) NOT NULL CHECK (capacity_per_month > 0),
       capacity_unit VARCHAR(20) NOT NULL,
       whatsapp VARCHAR(20) NOT NULL,
       email VARCHAR(255),
       additional_notes TEXT,
       admin_notes TEXT,
       status VARCHAR(50) NOT NULL DEFAULT 'new',
       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       CONSTRAINT supplier_status_check
           CHECK (status IN ('new', 'verified', 'active', 'inactive')),
       CONSTRAINT supplier_capacity_unit_check
           CHECK (capacity_unit IN ('ton', 'kwintal', 'kg')),
       CONSTRAINT supplier_salt_types_nonempty
           CHECK (array_length(salt_types_available, 1) >= 1)
   );

   CREATE INDEX idx_supplier_status ON public.supplier_registrations(status);
   CREATE INDEX idx_supplier_created_at ON public.supplier_registrations(created_at DESC);
   CREATE INDEX idx_supplier_province ON public.supplier_registrations(location_province);

   CREATE TRIGGER trigger_supplier_set_updated_at
       BEFORE UPDATE ON public.supplier_registrations
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
   ```
3. Verify function `set_updated_at()` sudah ada di DB (di-create dari Epic 3):
   ```sql
   -- Run di Supabase Dashboard SQL Editor untuk verify existence:
   SELECT proname FROM pg_proc WHERE proname = 'set_updated_at';
   -- Expected: 1 row
   ```
   Kalau function tidak ada (extreme edge case), tambah di migration ini SEBELUM CREATE TRIGGER:
   ```sql
   CREATE OR REPLACE FUNCTION public.set_updated_at()
   RETURNS TRIGGER AS $$
   BEGIN
     NEW.updated_at = NOW();
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;
   ```
4. Buat migration `supabase/migrations/{ts+1}_supplier_registrations_rls.sql`:
   ```sql
   ALTER TABLE public.supplier_registrations ENABLE ROW LEVEL SECURITY;

   -- Public bisa INSERT dengan constraint state initial (defense in depth)
   CREATE POLICY "Public can submit supplier registration"
       ON public.supplier_registrations
       FOR INSERT
       TO anon, authenticated
       WITH CHECK (
           status = 'new'
           AND admin_notes IS NULL
       );

   -- Authenticated (admin) full access
   CREATE POLICY "Admin can read all suppliers"
       ON public.supplier_registrations FOR SELECT TO authenticated USING (TRUE);

   CREATE POLICY "Admin can update suppliers"
       ON public.supplier_registrations FOR UPDATE TO authenticated
       USING (TRUE) WITH CHECK (TRUE);

   CREATE POLICY "Admin can delete suppliers"
       ON public.supplier_registrations FOR DELETE TO authenticated USING (TRUE);
   ```
5. **JANGAN commit dulu.** Wait Phase 3 done (Pydantic schemas + konstanta), commit combined.

## Jangan

- **JANGAN** skip `CHECK array_length` constraint — defense in depth kalau Pydantic bypassed
- **JANGAN** allow public UPDATE atau DELETE — RLS tight untuk anon
- **JANGAN** hardcode `id = 1` PRIMARY KEY seperti Slice 3 settings pattern — supplier ada banyak row, PRIMARY KEY UUID default

## Verifikasi

- [ ] 2 migration file created di `supabase/migrations/`
- [ ] Function `set_updated_at()` verified exists di production DB
- [ ] Belum commit — wait Phase 3

---

# PHASE 3 — Backend Konstanta + Pydantic Schemas

**Tujuan:** Buat konstanta supplier + Pydantic schemas dengan validator lengkap.

## Kerjakan

1. Buat `backend/constants/supplier.py`:
   ```python
   # WARNING: Konstanta ini duplicate di:
   # - lib/constants/supplier-salt-types.ts (frontend TS constant)
   # - lib/validation/supplier-schema.ts (Zod enum)
   # - backend/services/email_service.py (label map)
   # Kalau ubah, sync manual R-46.

   SUPPLIER_SALT_TYPES: set[str] = {
       'kasar_petani',
       'halus_yodium',
       'halus_non_yodium',
       'industri_spo_m',
       'ghpt',
   }

   CAPACITY_UNITS: set[str] = {'ton', 'kwintal', 'kg'}
   ```
2. Buat `backend/schemas/supplier.py`:
   ```python
   from pydantic import BaseModel, ConfigDict, Field, EmailStr, field_validator
   import re

   from ..constants.supplier import SUPPLIER_SALT_TYPES, CAPACITY_UNITS


   class SupplierRegisterRequest(BaseModel):
       model_config = ConfigDict(extra='forbid')

       business_name: str = Field(min_length=2, max_length=255)
       location_city: str = Field(min_length=1, max_length=100)
       location_province: str = Field(min_length=1, max_length=100)
       salt_types_available: list[str] = Field(min_length=1)
       capacity_per_month: float = Field(gt=0)
       capacity_unit: str
       whatsapp: str = Field(min_length=8, max_length=20)
       email: EmailStr | None = None
       additional_notes: str | None = Field(default=None, max_length=500)

       @field_validator('capacity_unit')
       def validate_capacity_unit(cls, v: str) -> str:
           if v not in CAPACITY_UNITS:
               raise ValueError(f"Invalid capacity unit: {v}")
           return v

       @field_validator('salt_types_available')
       def validate_salt_types(cls, v: list[str]) -> list[str]:
           cleaned = [s.strip() for s in v if s.strip()]
           if not cleaned:
               raise ValueError("At least one salt type required")
           invalid = [s for s in cleaned if s not in SUPPLIER_SALT_TYPES]
           if invalid:
               raise ValueError(f"Invalid salt types: {invalid}")
           return list(dict.fromkeys(cleaned))  # dedup preserve order

       @field_validator('whatsapp')
       def validate_and_normalize_whatsapp(cls, v: str) -> str:
           # R-47: normalize di backend, canonical +62xxx
           cleaned = re.sub(r'[\s\-()]', '', v)
           if not re.match(r'^(\+62|62|0)8\d{7,12}$', cleaned):
               raise ValueError("Invalid WhatsApp number format")
           # Normalize prefix
           if cleaned.startswith('0'):
               cleaned = '+62' + cleaned[1:]
           elif cleaned.startswith('62'):
               cleaned = '+' + cleaned
           # cleaned yang mulai dengan '+62' keep as-is
           return cleaned


   class SupplierRegisterResponse(BaseModel):
       success: bool
       supplier_id: str
       message: str = "Pendaftaran supplier berhasil"
   ```
3. Unit test manual Pydantic:
   ```bash
   cd backend
   source .venv/bin/activate
   python -c "
   from schemas.supplier import SupplierRegisterRequest

   # Valid
   r = SupplierRegisterRequest(
       business_name='Petani X',
       location_city='Pamekasan',
       location_province='Jawa Timur',
       salt_types_available=['kasar_petani'],
       capacity_per_month=50,
       capacity_unit='ton',
       whatsapp='081234567890',
   )
   assert r.whatsapp == '+6281234567890', f'Got {r.whatsapp}'
   assert r.email is None
   print('OK valid + WA normalization')

   # Invalid WA
   try:
       SupplierRegisterRequest(
           business_name='X', location_city='Y', location_province='Z',
           salt_types_available=['kasar_petani'],
           capacity_per_month=1, capacity_unit='ton', whatsapp='invalid',
       )
       print('FAIL: should reject invalid WA')
   except Exception:
       print('OK reject invalid WA')

   # Invalid salt type
   try:
       SupplierRegisterRequest(
           business_name='X', location_city='Y', location_province='Z',
           salt_types_available=['unknown'],
           capacity_per_month=1, capacity_unit='ton', whatsapp='08123456789',
       )
       print('FAIL: should reject invalid salt type')
   except Exception:
       print('OK reject invalid salt type')

   # Extra field forbidden
   try:
       SupplierRegisterRequest(
           business_name='X', location_city='Y', location_province='Z',
           salt_types_available=['kasar_petani'],
           capacity_per_month=1, capacity_unit='ton', whatsapp='08123456789',
           hack='xxx',
       )
       print('FAIL: should reject extra field')
   except Exception:
       print('OK reject extra field')
   "
   ```
4. Commit Phase 2 + 3:
   ```bash
   git add supabase/migrations/ backend/constants/ backend/schemas/
   git commit -m "feat(supplier): migration + Pydantic schemas [Epic 5 CF]"
   ```

## Jangan

- **JANGAN** skip validator manual test — kalau schema salah, endpoint akan reject payload valid.
- **JANGAN** hardcode konstanta langsung di schema (mis. `salt_types_available: list[Literal['kasar_petani', ...]]`) — pakai import dari `constants/`, single source of truth di backend.
- **JANGAN** lupa comment WARNING sync di top file konstanta.

## Verifikasi

- [ ] File konstanta + schema created
- [ ] Unit test manual 4 skenario pass (valid + WA normalize, invalid WA, invalid salt, extra field)
- [ ] Commit done

---

# 🛑 STOP GATE 1 — Migration Apply + RLS Manual Verification

**Status:** Menunggu Jazil apply 2 migrations + manual test RLS policy correctness.

## Aksi Manual yang Jazil Lakukan

### 1. Apply 2 migrations via Supabase Dashboard SQL Editor

Buka production Supabase Dashboard → SQL Editor → paste content migration 1, run. Repeat migration 2.

**Verify table + policies exist:**
```sql
-- Table exists
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'supplier_registrations';
-- Expected: 1 row

-- Policies exist (4 policies)
SELECT policyname FROM pg_policies
WHERE tablename = 'supplier_registrations';
-- Expected: 4 rows (Public INSERT + Admin SELECT/UPDATE/DELETE)

-- Constraints exist
SELECT conname FROM pg_constraint
WHERE conrelid = 'public.supplier_registrations'::regclass;
-- Expected: minimal 3 CHECK constraint + PRIMARY KEY
```

### 2. RLS Test #1: Anon Valid Insert

```sql
SET ROLE anon;

INSERT INTO public.supplier_registrations
  (business_name, location_city, location_province, salt_types_available,
   capacity_per_month, capacity_unit, whatsapp)
VALUES
  ('RLS Test Valid', 'Pamekasan', 'Jawa Timur', ARRAY['kasar_petani'],
   50, 'ton', '+6281234567890');
-- Expected: INSERT 0 1 (success)

RESET ROLE;
```

### 3. RLS Test #2: Anon Bypass Attempt — Preset Status

```sql
SET ROLE anon;

INSERT INTO public.supplier_registrations
  (business_name, location_city, location_province, salt_types_available,
   capacity_per_month, capacity_unit, whatsapp, status)
VALUES
  ('RLS Test Bypass Status', 'X', 'Y', ARRAY['kasar_petani'],
   50, 'ton', '+6281234567890', 'active');  -- ← bypass attempt
-- Expected: ERROR: new row violates row-level security policy

RESET ROLE;
```

### 4. RLS Test #3: Anon Bypass Attempt — Preset admin_notes

```sql
SET ROLE anon;

INSERT INTO public.supplier_registrations
  (business_name, location_city, location_province, salt_types_available,
   capacity_per_month, capacity_unit, whatsapp, admin_notes)
VALUES
  ('RLS Test Bypass Notes', 'X', 'Y', ARRAY['kasar_petani'],
   50, 'ton', '+6281234567890', 'malicious note');  -- ← bypass attempt
-- Expected: ERROR: new row violates row-level security policy

RESET ROLE;
```

### 5. RLS Test #4: CHECK Constraint — Empty Salt Types

```sql
SET ROLE anon;

INSERT INTO public.supplier_registrations
  (business_name, location_city, location_province, salt_types_available,
   capacity_per_month, capacity_unit, whatsapp)
VALUES
  ('CHECK Test Empty Salts', 'X', 'Y', ARRAY[]::TEXT[],  -- ← empty array
   50, 'ton', '+6281234567890');
-- Expected: ERROR: check constraint "supplier_salt_types_nonempty"

RESET ROLE;
```

### 6. Cleanup test rows

```sql
DELETE FROM public.supplier_registrations WHERE business_name LIKE 'RLS Test%';
-- Expected: DELETE 1 (hanya row valid dari test #1)
```

## Setelah Gate Ini Clear

- Update `docs/epic-breakdown/epic5_execution_log.md` (create kalau belum ada) dengan tanggal migration applied
- Backend siap deploy

## Sinyal Masalah

- **Kalau Test #1 gagal** (INSERT reject) → policy INSERT salah, cek `WITH CHECK` clause
- **Kalau Test #2 atau #3 sukses** (INSERT accept saat harusnya reject) → policy INSERT `WITH CHECK` tidak enforce state initial. Fix policy, apply ulang migration.
- **Kalau Test #4 sukses** (INSERT accept saat harusnya reject) → CHECK constraint hilang atau salah syntax, fix migration

---

# PHASE 4 — Backend Router `POST /supplier/register` + Rate Limit

**Tujuan:** Endpoint public dengan rate limit, insert ke DB, trigger email notification non-blocking.

## Kerjakan

1. Buat `backend/routers/supplier.py`:
   ```python
   from fastapi import APIRouter, Depends, HTTPException, Request
   import logging

   from ..schemas.supplier import (
       SupplierRegisterRequest, SupplierRegisterResponse
   )
   from ..services.email_service import send_supplier_notification_to_admin
   from ..dependencies import get_supabase_service
   from ..limiter import limiter  # dari Epic 2 Slice 3

   router = APIRouter(prefix="/supplier", tags=["supplier"])

   logger = logging.getLogger(__name__)


   @router.post(
       "/register",
       response_model=SupplierRegisterResponse,
       status_code=201,
   )
   @limiter.limit("5/hour")  # R-49, konsisten Epic 4 CF
   async def register_supplier(
       request: Request,  # WAJIB untuk slowapi (R-49)
       payload: SupplierRegisterRequest,
   ) -> SupplierRegisterResponse:
       supabase = get_supabase_service()

       # R-50: Insert blocking, kalau fail raise 500
       result = supabase.table("supplier_registrations").insert({
           "business_name": payload.business_name,
           "location_city": payload.location_city,
           "location_province": payload.location_province,
           "salt_types_available": payload.salt_types_available,
           "capacity_per_month": payload.capacity_per_month,
           "capacity_unit": payload.capacity_unit,
           "whatsapp": payload.whatsapp,  # sudah normalized dari Pydantic validator
           "email": payload.email,
           "additional_notes": payload.additional_notes,
           # status default 'new' dari DB schema
       }).execute()

       if not result.data:
           logger.error("Failed insert supplier_registrations, no data returned")
           raise HTTPException(500, "Gagal menyimpan pendaftaran")

       supplier_row = result.data[0]
       supplier_id = supplier_row["id"]

       # R-50: Email fire-and-forget, kalau fail log tapi jangan raise
       try:
           await send_supplier_notification_to_admin(supplier=supplier_row)
       except Exception as e:
           logger.warning(
               f"Email notification failed for supplier {supplier_id}: {e}"
           )

       return SupplierRegisterResponse(
           success=True,
           supplier_id=supplier_id,
       )
   ```
2. Register router di `backend/main.py`:
   ```python
   from .routers import supplier  # tambah import

   app.include_router(supplier.router)
   ```
3. **JANGAN commit dulu.** Wait Phase 5 (email service) done.

## Jangan

- **JANGAN** lupa `request: Request` parameter — kalau lupa, `@limiter.limit` silently no-op
- **JANGAN** wrap DB insert dengan same try-except sebagai email — beda severity (R-50)
- **JANGAN** return `supplier_id` sebagai integer — schema DB pakai UUID, harus string di response
- **JANGAN** log payload lengkap ke Sentry — PII concern (nama, WA, email supplier)

## Verifikasi

- [ ] File router created
- [ ] Router registered di main
- [ ] Belum commit — wait Phase 5

---

# PHASE 5 — Backend Email Service Extend

**Tujuan:** Extend `email_service.py` dengan function `send_supplier_notification_to_admin` tanpa touch existing functions (R-52).

## Kerjakan

1. **BACA ULANG** `backend/services/email_service.py` — refresh mental model dari Phase 1.
2. Identify:
   - Import statements existing (`resend`, `logger`, etc)
   - `EMAIL_FROM_ADDRESS` konstanta
   - `get_admin_email()` function (dari Epic 4 CF)
   - Existing helper (kalau ada `_wrap_email_html`)
3. **APPEND** function baru di bottom file, jangan modify existing:
   ```python
   # ==============================================
   # Epic 5 CF — Supplier Registration Notification
   # ==============================================

   # Label map untuk readable email content
   # WARNING: Duplicate dari backend/constants/supplier.py values
   # dan lib/constants/supplier-salt-types.ts. Sync manual R-46.
   _SUPPLIER_SALT_TYPES_LABEL = {
       'kasar_petani': 'Kasar Petani',
       'halus_yodium': 'Halus Yodium',
       'halus_non_yodium': 'Halus Non-Yodium',
       'industri_spo_m': 'Industri (SPO/M)',
       'ghpt': 'GHPT',
   }


   def _readable_supplier_salt_types(salt_types: list[str]) -> str:
       labels = [_SUPPLIER_SALT_TYPES_LABEL.get(t, t) for t in salt_types]
       return ", ".join(labels)


   async def send_supplier_notification_to_admin(supplier: dict) -> None:
       """
       Kirim email notifikasi ke admin bahwa ada supplier baru mendaftar.

       Non-blocking (R-50): caller wrap dengan try-except, tidak raise dari sini
       kecuali kalau di dalam ada critical failure yang perlu investigate.
       """
       admin_email = get_admin_email()
       if not admin_email:
           logger.warning("No admin email configured, skip supplier notification")
           return

       salt_types_readable = _readable_supplier_salt_types(
           supplier['salt_types_available']
       )

       # Admin panel URL — page belum live sampai Epic 5 Admin Panel slice,
       # tapi URL structure fixed dari sekarang
       admin_panel_url = f"{FRONTEND_URL}/admin/suppliers/{supplier['id']}"

       subject = (
           f"[CV Reka Cipta] Supplier Baru Mendaftar — "
           f"{supplier['business_name']}"
       )

       body_text = f"""Halo Tim CV Reka Cipta,

   Ada pendaftaran supplier baru yang perlu ditindaklanjuti:

   Nama Usaha    : {supplier['business_name']}
   Lokasi        : {supplier['location_city']}, {supplier['location_province']}
   Jenis Garam   : {salt_types_readable}
   Kapasitas     : {supplier['capacity_per_month']} {supplier['capacity_unit']}/bulan
   WhatsApp      : {supplier['whatsapp']}
   Email         : {supplier.get('email') or '-'}

   Keterangan tambahan:
   {supplier.get('additional_notes') or '-'}

   Segera hubungi supplier dalam 2-3 hari kerja untuk verifikasi.

   Link ke admin panel: {admin_panel_url}

   --
   Notifikasi otomatis dari sistem Reka Cipta Platform
   """

       body_html = f"""<html><body style="font-family: system-ui, sans-serif; max-width: 600px;">
     <h2 style="color: #0EA5E9;">Supplier Baru Mendaftar</h2>
     <p>Halo Tim CV Reka Cipta,</p>
     <p>Ada pendaftaran supplier baru yang perlu ditindaklanjuti:</p>
     <table style="border-collapse: collapse; margin: 16px 0;">
       <tr><td style="padding: 4px 12px 4px 0; color: #666;">Nama Usaha</td>
           <td style="padding: 4px 0;"><strong>{supplier['business_name']}</strong></td></tr>
       <tr><td style="padding: 4px 12px 4px 0; color: #666;">Lokasi</td>
           <td style="padding: 4px 0;">{supplier['location_city']}, {supplier['location_province']}</td></tr>
       <tr><td style="padding: 4px 12px 4px 0; color: #666;">Jenis Garam</td>
           <td style="padding: 4px 0;">{salt_types_readable}</td></tr>
       <tr><td style="padding: 4px 12px 4px 0; color: #666;">Kapasitas</td>
           <td style="padding: 4px 0;">{supplier['capacity_per_month']} {supplier['capacity_unit']}/bulan</td></tr>
       <tr><td style="padding: 4px 12px 4px 0; color: #666;">WhatsApp</td>
           <td style="padding: 4px 0;">{supplier['whatsapp']}</td></tr>
       <tr><td style="padding: 4px 12px 4px 0; color: #666;">Email</td>
           <td style="padding: 4px 0;">{supplier.get('email') or '-'}</td></tr>
     </table>
     <p><strong>Keterangan tambahan:</strong><br>{supplier.get('additional_notes') or '-'}</p>
     <p style="margin: 24px 0;">
       <a href="{admin_panel_url}"
          style="background: #0EA5E9; color: white; padding: 10px 20px;
                 text-decoration: none; border-radius: 4px;">
         Buka di Admin Panel
       </a>
     </p>
     <hr style="margin: 32px 0; border: none; border-top: 1px solid #ddd;">
     <p style="font-size: 12px; color: #999;">
       Notifikasi otomatis dari sistem Reka Cipta Platform
     </p>
   </body></html>"""

       resend.emails.send({
           "from": EMAIL_FROM_ADDRESS,
           "to": admin_email,
           "subject": subject,
           "text": body_text,
           "html": body_html,
       })

       logger.info(
           f"Supplier notification email sent to {admin_email} "
           f"for supplier {supplier['id']}"
       )
   ```
4. Local test function (butuh Resend API key di local `.env`):
   ```bash
   cd backend
   source .venv/bin/activate
   python -c "
   import asyncio
   from services.email_service import send_supplier_notification_to_admin

   mock = {
       'id': 'test-id-123',
       'business_name': 'Petani Test Local',
       'location_city': 'Pamekasan',
       'location_province': 'Jawa Timur',
       'salt_types_available': ['kasar_petani', 'halus_yodium'],
       'capacity_per_month': 100,
       'capacity_unit': 'ton',
       'whatsapp': '+6281234567890',
       'email': 'test@example.com',
       'additional_notes': 'Test note dari local',
   }
   asyncio.run(send_supplier_notification_to_admin(mock))
   print('Email sent successfully')
   "
   ```
   Verify admin email inbox — email received dalam < 30 detik.
5. **Regression test Epic 4 CF locally** — trigger RFQ submit via curl atau frontend, verify `send_rfq_confirmation` masih works.
6. Commit Phase 4 + 5:
   ```bash
   git add backend/
   git commit -m "feat(supplier): register endpoint + email notification service [Epic 5 CF]"
   ```

## Jangan

- **JANGAN** modify existing functions di `email_service.py` (R-52). Kalau tergoda "sekalian cleanup", stop — save untuk sprint terpisah.
- **JANGAN** hardcode admin email — pakai `get_admin_email()` dari `company_settings`.
- **JANGAN** skip local test — kalau email service broken, admin tidak akan tahu dari feature Epic 5 (data tetap tersimpan karena R-50), tapi supplier registration jadi tidak actionable.
- **JANGAN** skip regression test Epic 4 CF — extend file live = risk.
- **JANGAN** lupa `logger.info` setelah send — audit trail penting kalau debug delivery issue.

## Verifikasi

- [ ] Function `send_supplier_notification_to_admin` appended, existing functions untouched
- [ ] Local email test delivered
- [ ] Epic 4 CF `send_rfq_confirmation` still works (regression pass)
- [ ] Commit done

---

# PHASE 6 — Backend Deploy + Production Curl Smoke Test

**Tujuan:** Deploy backend ke Railway, smoke test endpoint dengan real payload + rate limit.

## Kerjakan

1. Push branch:
   ```bash
   git push -u origin feature/epic5-cf-supplier-registration
   ```
2. Wait Railway build. Cek build logs — pastikan tidak ada import error atau missing dependency.
3. Setelah deploy sukses, smoke test dari terminal local:

   **Test 1 — Valid submission:**
   ```bash
   API_URL="https://your-railway-backend.up.railway.app"

   curl -X POST "${API_URL}/supplier/register" \
     -H "Content-Type: application/json" \
     -d '{
       "business_name": "Petani Test Curl",
       "location_city": "Pamekasan",
       "location_province": "Jawa Timur",
       "salt_types_available": ["kasar_petani"],
       "capacity_per_month": 50,
       "capacity_unit": "ton",
       "whatsapp": "081234567890"
     }'
   # Expected: 201, {"success":true,"supplier_id":"...","message":"..."}
   ```
4. **Test 2 — WA normalization:** verify di DB row baru, `whatsapp = "+6281234567890"` (bukan `"081234567890"`).
   ```sql
   SELECT whatsapp FROM supplier_registrations WHERE business_name = 'Petani Test Curl';
   -- Expected: +6281234567890
   ```
5. **Test 3 — Email admin received:** cek inbox admin, email received dalam < 30 detik.
6. **Test 4 — Invalid salt types:**
   ```bash
   curl -X POST "${API_URL}/supplier/register" \
     -H "Content-Type: application/json" \
     -d '{
       "business_name": "Test Invalid",
       "location_city": "X",
       "location_province": "Y",
       "salt_types_available": ["unknown"],
       "capacity_per_month": 50,
       "capacity_unit": "ton",
       "whatsapp": "081234567890"
     }'
   # Expected: 422
   ```
7. **Test 5 — Extra field forbidden:**
   ```bash
   curl -X POST "${API_URL}/supplier/register" \
     -H "Content-Type: application/json" \
     -d '{
       "business_name": "Test Extra",
       "location_city": "X", "location_province": "Y",
       "salt_types_available": ["kasar_petani"],
       "capacity_per_month": 50, "capacity_unit": "ton",
       "whatsapp": "081234567890",
       "hack": "malicious"
     }'
   # Expected: 422
   ```
8. **Test 6 — Rate limit:**
   ```bash
   for i in {1..6}; do
     echo "Attempt $i:"
     curl -s -o /dev/null -w "HTTP %{http_code}\n" \
       -X POST "${API_URL}/supplier/register" \
       -H "Content-Type: application/json" \
       -d "{
         \"business_name\": \"Rate Test $i\",
         \"location_city\": \"X\", \"location_province\": \"Y\",
         \"salt_types_available\": [\"kasar_petani\"],
         \"capacity_per_month\": 50, \"capacity_unit\": \"ton\",
         \"whatsapp\": \"081234567890\"
       }"
     sleep 1
   done
   # Expected:
   # Attempt 1-5: HTTP 201
   # Attempt 6: HTTP 429
   ```
9. **Cleanup test rows** via Supabase Dashboard SQL Editor:
   ```sql
   DELETE FROM public.supplier_registrations
   WHERE business_name LIKE 'Petani Test%'
      OR business_name LIKE 'Rate Test%'
      OR business_name LIKE 'Test %';
   ```

## Jangan

- **JANGAN** skip curl test dan langsung lanjut frontend. Backend broken di production = frontend debugging jadi ambigu.
- **JANGAN** lupa cleanup test rows sebelum lanjut. Test rows di production DB = confuse klien saat demo.

## Verifikasi

- [ ] Railway deploy sukses tanpa error
- [ ] 6 smoke test pass (valid, WA normalize, email delivered, invalid salt, extra field, rate limit)
- [ ] Test rows cleaned up

---

# 🛑 STOP GATE 2 — Backend Production Verified

**Status:** Menunggu Jazil konfirmasi backend production stable + ready untuk frontend integration.

## Aksi Manual yang Jazil Lakukan

1. Review Sentry backend — pastikan tidak ada unexpected error dari 6 smoke test
2. Review Anthropic Console — pastikan tidak ada spike biaya (harusnya zero karena Epic 5 CF tidak pakai Anthropic)
3. Review Resend dashboard — verify 5-6 email delivered dengan status `delivered`, no bounce
4. Update `epic5_execution_log.md`:
   - Tanggal backend deploy
   - Screenshot 6 smoke test result
   - Confirm zero regression Epic 4 CF

## Setelah Gate Ini Clear

- Backend endpoint public production-ready
- Frontend dev bisa mulai dengan confidence backend contract stable

## Sinyal Masalah

- Kalau rate limit test attempt 6 return 201 (bukan 429) — `slowapi` middleware tidak active atau `request: Request` parameter hilang. Investigate dan redeploy.
- Kalau WA di DB tidak ter-normalize (`081234567890` bukan `+6281234567890`) — Pydantic validator tidak apply. Cek order validator + import.
- Kalau email tidak delivered ke admin — cek `get_admin_email()` return valid, cek Resend domain verification, cek `EMAIL_FROM_ADDRESS` env var.

---

# PHASE 7 — Frontend Contract Layer (Types + lib/api + Konstanta)

**Tujuan:** TypeScript types + API client function + konstanta hardcoded sync dengan backend.

## Kerjakan

1. Buat `lib/constants/supplier-salt-types.ts`:
   ```typescript
   // WARNING: Konstanta ini duplicate di:
   // - backend/constants/supplier.py
   // - backend/services/email_service.py (label map)
   // Kalau ubah, sync manual R-46.

   export const SUPPLIER_SALT_TYPES = [
     { value: 'kasar_petani', label: 'Kasar Petani' },
     { value: 'halus_yodium', label: 'Halus Yodium' },
     { value: 'halus_non_yodium', label: 'Halus Non-Yodium' },
     { value: 'industri_spo_m', label: 'Industri (SPO/M)' },
     { value: 'ghpt', label: 'GHPT' },
   ] as const;

   export type SupplierSaltTypeValue = typeof SUPPLIER_SALT_TYPES[number]['value'];

   export const CAPACITY_UNITS = [
     { value: 'ton', label: 'Ton' },
     { value: 'kwintal', label: 'Kwintal' },
     { value: 'kg', label: 'Kg' },
   ] as const;

   export type CapacityUnitValue = typeof CAPACITY_UNITS[number]['value'];
   ```
2. Buat `types/supplier.ts`:
   ```typescript
   import type { SupplierSaltTypeValue, CapacityUnitValue } from '@/lib/constants/supplier-salt-types';

   export interface SupplierRegisterInput {
     business_name: string;
     location_city: string;
     location_province: string;
     salt_types_available: SupplierSaltTypeValue[];
     capacity_per_month: number;
     capacity_unit: CapacityUnitValue;
     whatsapp: string;
     email?: string;
     additional_notes?: string;
   }

   export interface SupplierRegisterResponse {
     success: boolean;
     supplier_id: string;
     message: string;
   }
   ```
3. Buat `lib/api/supplier.ts`:
   ```typescript
   import type { SupplierRegisterInput, SupplierRegisterResponse } from '@/types/supplier';
   import { apiFetch } from './client';

   export async function registerSupplier(
     input: SupplierRegisterInput
   ): Promise<SupplierRegisterResponse> {
     return apiFetch<SupplierRegisterResponse>('/supplier/register', {
       method: 'POST',
       body: input,
       // auth: false (public endpoint, apiFetch default false)
     });
   }
   ```
4. Verify import struktur `apiFetch` dari Epic 3B / Epic 4 CF — kalau signature beda, adjust. **JANGAN** modify `apiFetch` — reuse as-is.
5. Commit:
   ```bash
   git add lib/constants/ types/ lib/api/
   git commit -m "feat(supplier): frontend contract layer [Epic 5 CF]"
   ```

## Jangan

- **JANGAN** skip WARNING comment di top konstanta — future-you akan bingung sync ke mana.
- **JANGAN** import dari `backend/*` di frontend — cross-boundary, TypeScript tidak boleh (`baseUrl` project setup tidak allow).
- **JANGAN** hardcode API URL di `lib/api/supplier.ts` — pakai `apiFetch` yang sudah handle `NEXT_PUBLIC_API_URL`.

## Verifikasi

- [ ] TypeScript compile pass (`npm run typecheck` atau `tsc --noEmit`)
- [ ] Import path dari test manual: `import { SUPPLIER_SALT_TYPES } from '@/lib/constants/...'` works
- [ ] Commit done

---

# PHASE 8 — Frontend Zod Schema

**Tujuan:** Client-side validation schema yang manual sync dengan Pydantic.

## Kerjakan

1. Buat `lib/validation/supplier-schema.ts`:
   ```typescript
   import { z } from 'zod';
   import { SUPPLIER_SALT_TYPES, CAPACITY_UNITS } from '@/lib/constants/supplier-salt-types';

   const SALT_TYPE_VALUES = SUPPLIER_SALT_TYPES.map(t => t.value) as [string, ...string[]];
   const CAPACITY_UNIT_VALUES = CAPACITY_UNITS.map(u => u.value) as [string, ...string[]];

   export const supplierRegisterSchema = z.object({
     business_name: z.string().min(2, 'Minimal 2 karakter').max(255),
     location_city: z.string().min(1, 'Wajib diisi').max(100),
     location_province: z.string().min(1, 'Wajib diisi').max(100),
     salt_types_available: z
       .array(z.enum(SALT_TYPE_VALUES))
       .min(1, 'Pilih minimal 1 jenis garam'),
     capacity_per_month: z
       .number({ invalid_type_error: 'Harus berupa angka' })
       .positive('Kapasitas harus lebih dari 0'),
     capacity_unit: z.enum(CAPACITY_UNIT_VALUES),
     whatsapp: z
       .string()
       .min(8)
       .regex(
         /^(\+62|62|0)8\d{7,12}$/,
         'Format WhatsApp: 08xxx atau +62xxx'
       ),
     email: z
       .string()
       .email('Format email tidak valid')
       .optional()
       .or(z.literal('')),  // allow empty string dari form input
     additional_notes: z.string().max(500, 'Maksimal 500 karakter').optional(),
   });

   export type SupplierRegisterFormData = z.infer<typeof supplierRegisterSchema>;
   ```
2. Sync checklist manual — buka 2 file side-by-side:
   - `backend/schemas/supplier.py`
   - `lib/validation/supplier-schema.ts`
   
   Verify tiap constraint match:

   | Field | Pydantic | Zod | Match? |
   |---|---|---|---|
   | `business_name` | `min_length=2, max_length=255` | `.min(2).max(255)` | ✅ |
   | `location_city` | `min_length=1, max_length=100` | `.min(1).max(100)` | ✅ |
   | `location_province` | `min_length=1, max_length=100` | `.min(1).max(100)` | ✅ |
   | `salt_types_available` | `min_length=1` + validate values in set | `.array().min(1)` + `z.enum` | ✅ |
   | `capacity_per_month` | `gt=0` | `.positive()` | ✅ |
   | `capacity_unit` | `in CAPACITY_UNITS` | `z.enum(CAPACITY_UNIT_VALUES)` | ✅ |
   | `whatsapp` | regex `^(\+62\|62\|0)8\d{7,12}$` | same regex | ✅ |
   | `email` | `EmailStr \| None` | `.email().optional().or(z.literal(''))` | ✅ |
   | `additional_notes` | `max_length=500` | `.max(500)` | ✅ |

   **Kalau ada mismatch, fix salah satu dan document.**
3. Commit:
   ```bash
   git add lib/validation/
   git commit -m "feat(supplier): zod schema [Epic 5 CF]"
   ```

## Jangan

- **JANGAN** normalize whatsapp di Zod (R-47) — validate format saja, normalize di backend
- **JANGAN** skip sync checklist — drift antara Zod dan Pydantic = user experience broken (backend reject payload yang Zod loloskan)
- **JANGAN** `.transform()` field di Zod schema — schema representasi form state, transform pas submit lebih explicit

## Verifikasi

- [ ] Zod schema compile
- [ ] Sync checklist 9 field verified match
- [ ] Commit done

---

# PHASE 9 — Frontend Component `SupplierSaltTypesCheckboxGroup`

**Tujuan:** Component checkbox group static (bukan reuse Epic 4 CF, per R-51).

## Kerjakan

1. Buat `components/supplier/SupplierSaltTypesCheckboxGroup.tsx`:
   ```tsx
   'use client';

   import { SUPPLIER_SALT_TYPES } from '@/lib/constants/supplier-salt-types';

   interface Props {
     value: string[];
     onChange: (value: string[]) => void;
   }

   export function SupplierSaltTypesCheckboxGroup({ value, onChange }: Props) {
     function toggle(v: string) {
       if (value.includes(v)) {
         onChange(value.filter((x) => x !== v));
       } else {
         onChange([...value, v]);
       }
     }

     return (
       <div className="space-y-3">
         {SUPPLIER_SALT_TYPES.map((type) => (
           <label
             key={type.value}
             className="flex items-center gap-3 cursor-pointer focus-within:ring-2 focus-within:ring-blue-500 rounded p-2 hover:bg-neutral-50"
           >
             <input
               type="checkbox"
               checked={value.includes(type.value)}
               onChange={() => toggle(type.value)}
               className="w-5 h-5"
             />
             <span>{type.label}</span>
           </label>
         ))}
       </div>
     );
   }
   ```
2. Local dev test:
   - Isolate render component di dev sandbox atau add temp mount di `page.tsx`
   - Keyboard nav: Tab → checkbox → Space toggle → Tab ke next
   - Screen reader test (kalau ada axe DevTools installed): verify label association

## Jangan

- **JANGAN** reuse `SaltTypeCheckboxGroup` Epic 4 CF (R-51) — konteks bisnis beda, akan bikin fragile
- **JANGAN** parameterize dengan prop `products: []` — component ini konsumsi konstanta, tidak DB-driven
- **JANGAN** skip `focus-within:ring-2` — accessibility requirement

## Verifikasi

- [ ] Component render 5 checkbox
- [ ] Toggle multi-select works
- [ ] Keyboard nav accessible

---

# PHASE 10 — Frontend Component `SupplierRegistrationForm`

**Tujuan:** Form kompleks dengan react-hook-form + Zod + rate limit UI + Sentry integration.

## Kerjakan

1. Verify `sonner` (toast) sudah installed dan `<Toaster />` mounted di root layout — reuse dari Epic 4 CF.
2. Buat `components/supplier/SupplierRegistrationForm.tsx`:
   ```tsx
   'use client';

   import { useState } from 'react';
   import { useForm } from 'react-hook-form';
   import { zodResolver } from '@hookform/resolvers/zod';
   import { useRouter } from 'next/navigation';
   import { toast } from 'sonner';
   import * as Sentry from '@sentry/nextjs';

   import {
     supplierRegisterSchema,
     SupplierRegisterFormData,
   } from '@/lib/validation/supplier-schema';
   import { registerSupplier } from '@/lib/api/supplier';
   import { CAPACITY_UNITS } from '@/lib/constants/supplier-salt-types';
   import { SupplierSaltTypesCheckboxGroup } from './SupplierSaltTypesCheckboxGroup';
   import { FormSection } from '@/components/ui/FormSection';  // reuse dari Epic 4 CF
   import { Button } from '@/components/ui/button';

   export function SupplierRegistrationForm() {
     const router = useRouter();
     const [isSubmitting, setSubmitting] = useState(false);
     const [rateLimitCountdown, setRateLimitCountdown] = useState(0);

     const {
       register,
       handleSubmit,
       setValue,
       watch,
       formState: { errors },
     } = useForm<SupplierRegisterFormData>({
       resolver: zodResolver(supplierRegisterSchema),
       mode: 'onBlur',
       defaultValues: {
         salt_types_available: [],
         capacity_unit: 'ton',
       },
     });

     const saltTypes = watch('salt_types_available');

     async function onSubmit(data: SupplierRegisterFormData) {
       setSubmitting(true);
       try {
         // R-48: empty email → undefined
         const payload = {
           ...data,
           email: data.email || undefined,
         };
         await registerSupplier(payload);
         router.push('/jadi-supplier/terima-kasih');
       } catch (err: any) {
         if (err?.status === 429) {
           toast.error('Terlalu banyak permintaan. Coba lagi dalam 1 jam.');
           setRateLimitCountdown(60);
           const interval = setInterval(() => {
             setRateLimitCountdown((prev) => {
               if (prev <= 1) {
                 clearInterval(interval);
                 return 0;
               }
               return prev - 1;
             });
           }, 1000);
         } else if (err?.status === 422) {
           toast.error('Data tidak valid. Cek isian form.');
         } else {
           toast.error('Gagal mengirim pendaftaran. Coba lagi.');
           Sentry.captureException(err, {
             tags: { form: 'supplier_registration' },
           });
         }
       } finally {
         setSubmitting(false);
       }
     }

     const submitDisabled = isSubmitting || rateLimitCountdown > 0;

     return (
       <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
         <FormSection title="Informasi Usaha">
           <Field label="Nama / Nama Usaha" required error={errors.business_name?.message}>
             <input {...register('business_name')} type="text" className="input" />
           </Field>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Field label="Kota" required error={errors.location_city?.message}>
               <input {...register('location_city')} type="text" className="input" />
             </Field>
             <Field label="Provinsi" required error={errors.location_province?.message}>
               <input {...register('location_province')} type="text" className="input" />
             </Field>
           </div>
         </FormSection>

         <FormSection title="Produk Garam">
           <div>
             <label className="block mb-2 font-medium">
               Jenis Garam Tersedia <span className="text-red-500">*</span>
             </label>
             <SupplierSaltTypesCheckboxGroup
               value={saltTypes}
               onChange={(val) => setValue('salt_types_available', val, { shouldValidate: true })}
             />
             {errors.salt_types_available && (
               <p className="text-sm text-red-500 mt-1">
                 {errors.salt_types_available.message}
               </p>
             )}
           </div>
           <div className="grid grid-cols-2 gap-4">
             <Field label="Kapasitas per Bulan" required error={errors.capacity_per_month?.message}>
               <input
                 {...register('capacity_per_month', { valueAsNumber: true })}
                 type="number" min={0} step={0.01}
                 className="input"
               />
             </Field>
             <Field label="Satuan" required error={errors.capacity_unit?.message}>
               <select {...register('capacity_unit')} className="input">
                 {CAPACITY_UNITS.map((u) => (
                   <option key={u.value} value={u.value}>{u.label}</option>
                 ))}
               </select>
             </Field>
           </div>
         </FormSection>

         <FormSection title="Kontak">
           <Field
             label="Nomor WhatsApp"
             required
             error={errors.whatsapp?.message}
             hint="Contoh: 081234567890"
           >
             <input {...register('whatsapp')} type="tel" className="input" />
           </Field>
           <Field label="Email" error={errors.email?.message} hint="Opsional">
             <input {...register('email')} type="email" className="input" />
           </Field>
           <Field
             label="Keterangan Tambahan"
             error={errors.additional_notes?.message}
             hint="Opsional, maks. 500 karakter"
           >
             <textarea {...register('additional_notes')} rows={4} className="input" />
           </Field>
         </FormSection>

         <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
           Setelah submit, tim kami akan menghubungi via WhatsApp dalam 2–3 hari kerja untuk verifikasi.
         </div>

         <Button
           type="submit"
           disabled={submitDisabled}
           className="w-full md:w-auto"
         >
           {isSubmitting
             ? 'Mengirim...'
             : rateLimitCountdown > 0
               ? `Coba lagi dalam ${rateLimitCountdown} detik`
               : 'Daftar Sebagai Supplier'}
         </Button>
       </form>
     );
   }

   function Field({ label, required, error, hint, children }: {
     label: string; required?: boolean; error?: string; hint?: string;
     children: React.ReactNode;
   }) {
     return (
       <div>
         <label className="block mb-1 font-medium">
           {label} {required && <span className="text-red-500">*</span>}
           {hint && <span className="text-neutral-500 text-sm ml-1">({hint})</span>}
         </label>
         {children}
         {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
       </div>
     );
   }
   ```
3. Verify `FormSection` component sudah ada dari Epic 4 CF. Kalau belum, extract atau create inline.
4. Verify `.input` Tailwind class utility exists di project styles. Kalau tidak, gunakan explicit classes per input.

## Jangan

- **JANGAN** kirim `""` sebagai email (R-48) — payload sebelum submit HARUS convert `""` → `undefined`
- **JANGAN** default `mode: 'onChange'` — noisy UX saat user masih ngetik (konsisten Epic 4 CF UX-03)
- **JANGAN** log payload lengkap ke Sentry — pakai `tags` untuk metadata saja, jangan bocor PII
- **JANGAN** reset form setelah error — user harus bisa fix + resubmit tanpa re-fill semua

## Verifikasi

- [ ] Form render dengan 3 section
- [ ] Zod validation trigger on blur, inline error muncul
- [ ] Empty email tidak trigger validation error
- [ ] Submit dengan invalid → toast + button re-enabled
- [ ] Submit dengan valid → redirect ke `/jadi-supplier/terima-kasih`

---

# PHASE 11 — Frontend Route `/jadi-supplier` + BenefitsSection

**Tujuan:** Page shell dengan hero + benefits + form.

## Kerjakan

1. Buat `components/supplier/BenefitsSection.tsx`:
   ```tsx
   import { Globe, Repeat, Scale } from 'lucide-react';

   const BENEFITS = [
     {
       icon: Globe,
       title: 'Distribusi Luas',
       body: 'Produkmu terhubung ke jaringan buyer industri di seluruh Indonesia melalui CV Reka Cipta.',
     },
     {
       icon: Repeat,
       title: 'Pembelian Rutin',
       body: 'Kontrak jangka panjang dengan volume pembelian tetap setiap bulan.',
     },
     {
       icon: Scale,
       title: 'Harga Adil',
       body: 'Harga negosiasi transparan berbasis kualitas dan kapasitas produksi.',
     },
   ];

   export function BenefitsSection() {
     return (
       <section className="max-w-5xl mx-auto px-4 py-12">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {BENEFITS.map((b) => {
             const Icon = b.icon;
             return (
               <div key={b.title} className="text-center space-y-3">
                 <div className="inline-flex p-3 rounded-full bg-blue-50">
                   <Icon className="w-6 h-6 text-blue-600" />
                 </div>
                 <h3 className="font-semibold text-lg">{b.title}</h3>
                 <p className="text-neutral-600 text-sm">{b.body}</p>
               </div>
             );
           })}
         </div>
       </section>
     );
   }
   ```
2. Buat `app/jadi-supplier/page.tsx`:
   ```tsx
   import { Metadata } from 'next';
   import { InnerPageHero } from '@/components/layout/InnerPageHero';  // reuse Epic 2 Slice 2
   import { BenefitsSection } from '@/components/supplier/BenefitsSection';
   import { SupplierRegistrationForm } from '@/components/supplier/SupplierRegistrationForm';

   export const dynamic = 'force-static';

   export const metadata: Metadata = {
     title: 'Jadi Supplier — CV Reka Cipta Indonesia',
     description:
       'Bermitra dengan CV Reka Cipta sebagai supplier garam. Daftarkan usaha Anda dan bergabung dengan jaringan supplier terpercaya di Indonesia.',
     alternates: {
       canonical: '/jadi-supplier',
     },
   };

   export default function JadiSupplierPage() {
     return (
       <>
         <InnerPageHero
           title="Jadi Supplier Reka Cipta"
           subtitle="Bermitra dengan distributor garam industri terpercaya di Indonesia."
           breadcrumb={[
             { label: 'Beranda', href: '/' },
             { label: 'Jadi Supplier', href: '/jadi-supplier' },
           ]}
         />
         <BenefitsSection />
         <div className="max-w-3xl mx-auto px-4 py-12">
           <SupplierRegistrationForm />
         </div>
       </>
     );
   }
   ```
3. Local dev test: `npm run dev`, buka `http://localhost:3000/jadi-supplier`, verify semua section render.
4. Build test: `npm run build`, verify page marked static di output (`○ /jadi-supplier`, bukan `λ`).

## Jangan

- **JANGAN** fetch produk dari DB — form pakai konstanta hardcoded (AR-07)
- **JANGAN** lupa `export const dynamic = 'force-static'` — kalau lupa, Next.js default ke dynamic + auth check gagal
- **JANGAN** copy `<Metadata>` dari Epic 4 CF — content spesifik untuk supplier

## Verifikasi

- [ ] Page render lengkap di dev
- [ ] `next build` output marks page static
- [ ] Metadata canonical + description spesifik supplier

---

# PHASE 12 — Frontend Route `/jadi-supplier/terima-kasih`

**Tujuan:** Halaman konfirmasi static, direct URL access acceptable (AR-04).

## Kerjakan

1. Buat `app/jadi-supplier/terima-kasih/page.tsx`:
   ```tsx
   import { Metadata } from 'next';
   import Link from 'next/link';
   import { CheckCircle2 } from 'lucide-react';
   import { buttonVariants } from '@/components/ui/button';
   import { cn } from '@/lib/utils';

   export const dynamic = 'force-static';

   export const metadata: Metadata = {
     title: 'Pendaftaran Berhasil — CV Reka Cipta Indonesia',
     robots: 'noindex',
   };

   export default function TerimaKasihSupplierPage() {
     return (
       <div className="min-h-[70vh] flex items-center justify-center px-4">
         <div className="max-w-2xl text-center space-y-6">
           <div className="flex justify-center">
             <CheckCircle2 className="w-20 h-20 text-green-500" strokeWidth={1.5} />
           </div>

           <h1 className="text-3xl md:text-4xl font-bold">
             Pendaftaran Berhasil Dikirim!
           </h1>

           <p className="text-lg text-neutral-700">
             Terima kasih atas ketertarikan Anda menjadi mitra supplier CV Reka Cipta.
           </p>

           <p className="text-neutral-600">
             Tim kami akan menghubungi via WhatsApp dalam 2–3 hari kerja untuk proses verifikasi selanjutnya.
           </p>

           <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
             <Link href="/" className={cn(buttonVariants({ variant: 'default' }))}>
               Kembali ke Beranda
             </Link>
             <Link href="/tentang-kami" className={cn(buttonVariants({ variant: 'outline' }))}>
               Lihat Tentang Kami
             </Link>
           </div>
         </div>
       </div>
     );
   }
   ```
2. Test direct URL access (AR-04): buka `http://localhost:3000/jadi-supplier/terima-kasih` tanpa submit dulu — verify render tanpa error.
3. Test navigation dari `/jadi-supplier` after submit sukses — pattern router.push works.

## Jangan

- **JANGAN** pakai `<Button asChild>` pattern — Radix, bukan Base UI (memori project)
- **JANGAN** add `robots: 'index'` — halaman konfirmasi tidak untuk SEO
- **JANGAN** add sessionStorage check untuk restrict access — AR-04 explicit accept direct URL

## Verifikasi

- [ ] Page render dengan icon + heading + CTA
- [ ] Direct URL access works tanpa error
- [ ] Metadata `robots: noindex` verified di HTML output

---

# PHASE 13 — Navbar Update + Sitemap + Error Boundary

**Tujuan:** Integrate `/jadi-supplier` ke navigation & discovery + error handling.

## Kerjakan

1. **Navbar update** — `components/layout/Navbar.tsx`:
   
   Baca file existing, identify nav items array structure. Tambah entry:
   ```tsx
   { label: 'Jadi Supplier', href: '/jadi-supplier' }
   ```
   
   Posisi: setelah "Minta Penawaran" (kalau ada) atau di lokasi yang match dengan discussion klien. Kalau ragu, finalize dengan Jazil di Gate 3.
2. **Sitemap update** — `app/sitemap.ts`:
   
   Tambah entry (jangan add `/jadi-supplier/terima-kasih`):
   ```typescript
   {
     url: `${baseUrl}/jadi-supplier`,
     lastModified: new Date(),
     changeFrequency: 'monthly',
     priority: 0.7,
   },
   ```
3. **Error boundary** — `app/jadi-supplier/error.tsx`:
   ```tsx
   'use client';

   import { useEffect } from 'react';
   import * as Sentry from '@sentry/nextjs';
   import Link from 'next/link';
   import { buttonVariants } from '@/components/ui/button';
   import { cn } from '@/lib/utils';

   export default function JadiSupplierError({
     error,
     reset,
   }: {
     error: Error & { digest?: string };
     reset: () => void;
   }) {
     useEffect(() => {
       Sentry.captureException(error, {
         tags: { page: '/jadi-supplier' },
       });
     }, [error]);

     return (
       <div className="min-h-[60vh] flex items-center justify-center px-4">
         <div className="max-w-lg text-center space-y-4">
           <h1 className="text-2xl font-bold">Terjadi kesalahan</h1>
           <p className="text-neutral-600">
             Kami tidak bisa menampilkan halaman pendaftaran supplier saat ini.
             Coba refresh atau kembali ke beranda.
           </p>
           <div className="flex gap-2 justify-center">
             <button onClick={reset} className={cn(buttonVariants({ variant: 'default' }))}>
               Coba Lagi
             </button>
             <Link href="/" className={cn(buttonVariants({ variant: 'outline' }))}>
               Kembali ke Beranda
             </Link>
           </div>
         </div>
       </div>
     );
   }
   ```
4. Commit Phase 7-13:
   ```bash
   git add app/ components/ lib/
   git commit -m "feat(supplier): frontend page + form + navigation [Epic 5 CF]"
   ```

## Jangan

- **JANGAN** add `/jadi-supplier/terima-kasih` ke sitemap — noindex page tidak untuk SEO
- **JANGAN** modify existing Navbar entries — cuma append
- **JANGAN** lupa `'use client'` di error boundary — Next.js requirement

## Verifikasi

- [ ] Navbar render link "Jadi Supplier"
- [ ] `curl localhost:3000/sitemap.xml` include `/jadi-supplier`
- [ ] Trigger error di form manual → error boundary render
- [ ] Commit done

---

# 🛑 STOP GATE 3 — Full E2E QA + Regression Test

**Status:** Menunggu Jazil manual QA end-to-end + regression test slice sebelumnya.

## Aksi Manual yang Jazil Lakukan

### 1. Push branch → Vercel preview deploy

```bash
git push
```
Wait Vercel preview URL ready.

### 2. E2E Test #1 — Happy Path

- Buka Vercel preview `/jadi-supplier` (bukan production dulu)
- Verify: navbar link visible, hero + benefits + form render
- Isi form lengkap:
  - Business name: "Petani Garam Demo QA"
  - Kota: "Sumenep"
  - Provinsi: "Jawa Timur"
  - Salt types: check "Kasar Petani" + "Halus Yodium"
  - Kapasitas: 150
  - Satuan: ton
  - WhatsApp: `081234567890` (test WA normalize)
  - Email: `demo@example.com`
  - Notes: "Test QA sebelum production."
- Submit
- Verify: redirect ke `/jadi-supplier/terima-kasih`
- Verify: page konfirmasi render dengan icon check + CTA
- Verify: email admin received dalam < 30 detik dengan body sesuai template
- Verify DB row baru:
  ```sql
  SELECT * FROM supplier_registrations
  WHERE business_name = 'Petani Garam Demo QA';
  -- Expected: 1 row, whatsapp = '+6281234567890', status = 'new'
  ```

### 3. E2E Test #2 — Validation Client-Side

- Buka form lagi
- Klik submit tanpa isi apa-apa → verify inline errors muncul di semua required field
- Isi WA dengan format salah "abc123" → verify inline error "Format WhatsApp: 08xxx atau +62xxx"
- Salt types 0 checkbox → verify inline error "Pilih minimal 1 jenis garam"
- Kapasitas -5 → verify inline error "Kapasitas harus lebih dari 0"
- Fix semua → submit → success

### 4. E2E Test #3 — Optional Email

- Isi form tanpa email
- Submit → verify sukses (200, redirect)
- Verify DB row: `email IS NULL`

### 5. E2E Test #4 — Rate Limit UX

- Submit form 5x cepat dengan variasi business_name
- Attempt ke-6 → verify toast merah "Terlalu banyak permintaan" + button disabled dengan countdown
- Wait 60 detik → button re-enabled
- (Server-side rate limit 5/hour tetap active, tapi UI countdown reset — acceptable)

### 6. E2E Test #5 — Direct URL Konfirmasi

- Buka `/jadi-supplier/terima-kasih` langsung tanpa submit
- Verify: page render normal (AR-04)

### 7. Regression Test — Epic 4 CF

**CRITICAL** (per R-52):
- Buka `/minta-penawaran`
- Submit RFQ dengan data valid
- Verify: email confirmation ke customer + email notif ke admin delivered
- Verify: DB row baru di `rfq_leads`

### 8. Regression Test — Epic 2 Slice 3

- Buka `/kontak`
- Submit contact form dengan data valid
- Verify: email delivered

### 9. Regression Test — Epic 4B Slice 1 + 2

- Login admin
- Buka `/admin/leads/{some-id}`
- Verify: auto-save notes, status update, WA modal, generate proposal — semua works

### 10. Cleanup Test Rows

```sql
DELETE FROM supplier_registrations WHERE business_name LIKE '%Demo QA%' OR business_name LIKE '%Test%';
DELETE FROM rfq_leads WHERE full_name LIKE '%Test%' OR company_name LIKE '%Test%';
```

### 11. Sentry Check

Buka Sentry dashboard — pastikan tidak ada unexpected error dari 60 menit terakhir.

## Setelah Gate Ini Clear

- Frontend + backend production-ready
- Zero regression di Epic 2 Slice 3, Epic 4 CF, Epic 4B Slice 1+2
- Ready untuk merge ke `main`

## Sinyal Masalah

- **Kalau E2E Test #1 email tidak delivered** — cek Resend dashboard untuk delivery status. Kalau `bounced`, cek domain verification. Kalau `failed`, cek Sentry backend logs
- **Kalau regression Epic 4 CF fail** — R-52 violated. Revert Phase 5 email service extend, redesign
- **Kalau WA di DB tidak `+62xxx`** — Pydantic validator tidak apply. Cek order di endpoint, cek import
- **Kalau rate limit UX countdown reset after refresh** — expected behavior (client state), server-side rate limit still enforced. Acceptable

---

# PHASE 14 — Merge ke `dev` → Production Deploy

**Tujuan:** Merge, deploy production, tag release.

## Kerjakan

1. Merge ke `dev`:
   ```bash
   git checkout dev
   git pull
   git merge feature/epic5-cf-supplier-registration --no-ff
   git push
   ```
2. Verify Vercel + Railway `dev` environment auto-deploy sukses.
3. Smoke test di `dev` environment — repeat 3-4 E2E test dari Gate 3.
4. Merge `dev` ke `main`:
   ```bash
   git checkout main
   git pull
   git merge dev --no-ff
   git push
   ```
5. Verify production deploy sukses (Vercel + Railway).
6. **Post-production smoke test:**
   - Buka production URL `/jadi-supplier`
   - Submit 1 real test entry dengan data placeholder
   - Verify: email delivered ke admin, DB row exists, redirect works
   - **Delete test row segera** — jangan biarkan test data di production DB
7. Tag release:
   ```bash
   git tag epic5-cf-live
   git push --tags
   ```
8. Update `epic5_execution_log.md`:
   - Tanggal merge production
   - Release tag
   - Confirm regression tests pass

## Jangan

- **JANGAN** skip smoke test di `dev` environment sebelum merge ke `main` — Vercel `dev` = last checkpoint sebelum production
- **JANGAN** biarkan test row di production DB — cleanup langsung
- **JANGAN** merge `main` sebelum `dev` verify

## Verifikasi

- [ ] Merge sukses
- [ ] Production Vercel + Railway deploy verified
- [ ] Post-production smoke test pass + cleanup done
- [ ] Release tag pushed
- [ ] Execution log updated

---

# 🛑 STOP GATE 4 — Client Demo (Klien Operate Sendiri)

**Status:** Menunggu Jazil setup demo dengan klien Reka Cipta.

## Aksi Manual yang Jazil Lakukan

### 1. Setup Meeting

- Schedule 30 menit sesi dengan klien (Irwan Sugianto atau POC klien)
- Prepare screen share via meeting tool

### 2. Konteks (2 menit)

Kata pengantar:
> "Setelah slice sebelumnya kita launch RFQ + proposal generator untuk sisi buyer, sekarang saya launch jalur untuk sisi supplier. Petani atau produsen garam bisa mendaftar via website, dan Anda dapat notifikasi email langsung. Data supplier akan bisa di-manage via admin panel di slice berikutnya."

### 3. Live Demo — Public Flow (10 menit)

- Buka production `/jadi-supplier` dari klien device (biar mereka lihat real experience)
- Klien scroll baca section benefits
- Klien isi form pakai data placeholder realistic:
  - "Petani Garam Mandiri Sumenep"
  - Lokasi: Sumenep, Jawa Timur
  - Salt: Kasar Petani
  - Kapasitas: 200 ton
  - WA: 08xxx
- Klien klik submit
- Redirect ke halaman konfirmasi — klien baca copy

### 4. Klien Cek Email (5 menit)

- Klien buka inbox email admin
- Verify email notifikasi masuk dengan detail lengkap
- Explain: "Setiap supplier daftar, Anda dapat email seperti ini. Follow-up manual via WhatsApp dalam 2-3 hari."
- Tanya feedback: apakah content email cukup, ada info yang missing?

### 5. Explain Handover (3 menit)

- Klien saat ini masih perlu manual query DB kalau mau lihat detail supplier
- Slice berikutnya (**Epic 5 Admin Panel**) akan build UI `/admin/suppliers` supaya klien bisa manage supplier tanpa buka DB
- Timeline: 3-5 hari dari sekarang

### 6. Rate Limit Explanation (2 menit)

- Explain: form ada rate limit 5/jam per IP untuk prevent spam
- Klien tidak perlu action, tapi kalau ada report supplier gagal daftar berkali-kali, cek Sentry

### 7. Delete Test Data

Setelah demo done:
```sql
DELETE FROM supplier_registrations WHERE business_name = 'Petani Garam Mandiri Sumenep';
```

### 8. Sign-Off

Klien konfirmasi:
- [ ] Form UX acceptable
- [ ] Email notification content acceptable
- [ ] Ready untuk Epic 5 Admin Panel slice next

Documentasikan sign-off di `epic5_execution_log.md`:
- Tanggal demo
- Klien feedback
- Change request (kalau ada) — defer ke enhancement backlog kalau minor

## Setelah Gate Ini Clear

- Epic 5 CF fully closed
- Klien sign-off collected
- Ready untuk Epic 5 Admin Panel slice execution

## Sinyal Masalah

- Kalau klien komplain content email — adjust template di enhancement (small change, deploy dalam hari yang sama)
- Kalau klien request field baru di form — evaluate scope. Minor field (mis. "tahun berdiri usaha") = enhancement, ~1 hari. Major restructure = new slice
- Kalau klien tidak yakin content copy halaman — finalize copy di follow-up (2-3 hari), deploy update

---

# Kontingensi & Troubleshooting

## Situasi: Email tidak delivered ke admin di production

1. Buka Resend dashboard — cek status delivery latest emails
2. Kalau status `bounced` → cek domain verification, cek `EMAIL_FROM_ADDRESS` env var
3. Kalau status `failed` → cek Sentry backend logs untuk exception dari `send_supplier_notification_to_admin`
4. Kalau status `delivered` tapi admin tidak lihat → cek spam folder, add sender ke whitelist
5. **Fallback:** klien bisa query DB manual sebagai temporary workaround sampai email fix

## Situasi: WhatsApp normalization gagal (DB simpan `081234...`)

1. Pydantic validator tidak apply. Cek `backend/schemas/supplier.py`:
   - Import order — `field_validator` ter-import correctly?
   - Return statement — validator return `cleaned` bukan `v`?
2. Test unit isolated:
   ```python
   from schemas.supplier import SupplierRegisterRequest
   r = SupplierRegisterRequest(business_name='X', ..., whatsapp='081234567890')
   assert r.whatsapp == '+6281234567890'
   ```
3. Kalau unit test pass tapi endpoint gagal — cek dependency injection, cek middleware

## Situasi: Rate limit tidak trigger di production

1. Verify `request: Request` parameter ada di endpoint signature — WAJIB untuk slowapi
2. Verify `@limiter.limit("5/hour")` decorator applied
3. Verify `limiter` imported dari `..limiter` (bukan create new instance)
4. Verify Railway middleware `SlowAPIMiddleware` registered di `main.py` (biasanya dari Epic 2 Slice 3)
5. Test dengan multiple curl dari same IP dalam 1 menit — kalau semua 201, middleware broken

## Situasi: RLS INSERT reject valid payload dari backend

Ini seharusnya tidak terjadi karena backend pakai `service_role` (bypass RLS). Kalau reject:
1. Verify `get_supabase_service()` return client dengan service_role key (bukan anon key)
2. Verify env var `SUPABASE_SERVICE_ROLE_KEY` set di Railway
3. Test manual dari Supabase Dashboard SQL Editor:
   ```sql
   SET ROLE service_role;
   INSERT INTO supplier_registrations ... ;
   -- Should succeed
   ```

## Situasi: Regression Epic 4 CF email confirmation broken setelah deploy

1. Revert immediately:
   ```bash
   git revert HEAD  # or specific commit
   git push
   ```
2. Debug secara isolated di local:
   - Trigger RFQ submit di local dev
   - Cek log backend untuk exception dari `send_rfq_confirmation`
   - Diff `email_service.py` dengan `pre-e5cf-email-extend` tag
3. Kemungkinan cause:
   - Modified shared helper accidentally
   - Import order broken
   - Constant redefinition
4. Fix + regression test rigorous sebelum re-deploy

## Situasi: Frontend build gagal karena TypeScript error

1. Common: import path salah — pakai `@/lib/...` alias, verify `tsconfig.json` paths
2. Common: Zod `z.enum([])` argument type — cast dengan `as [string, ...string[]]`
3. Common: `SupplierRegisterFormData` inferred type conflict dengan `SupplierRegisterInput` — align 2 type atau cast di submit handler

## Situasi: Klien komplain "content email admin terlalu formal / kurang detail"

1. Enhancement — bukan bug
2. Update template di `backend/services/email_service.py` (function `send_supplier_notification_to_admin`)
3. Deploy — email template akan apply untuk supplier baru berikutnya
4. **Post-MVP:** editable template UI (Slice 3 admin panel pattern) kalau butuh flexibility runtime

---

# Ringkasan File Slice Ini

**Backend baru:**
- `backend/constants/supplier.py`
- `backend/schemas/supplier.py`
- `backend/routers/supplier.py`
- Migrations:
  - `{ts}_create_supplier_registrations_table.sql`
  - `{ts+1}_supplier_registrations_rls.sql`

**Backend edited (append only, R-52):**
- `backend/services/email_service.py` — append `send_supplier_notification_to_admin`
- `backend/main.py` — register router

**Frontend baru:**
- `lib/constants/supplier-salt-types.ts`
- `types/supplier.ts`
- `lib/api/supplier.ts`
- `lib/validation/supplier-schema.ts`
- `app/jadi-supplier/page.tsx`
- `app/jadi-supplier/terima-kasih/page.tsx`
- `app/jadi-supplier/error.tsx`
- `components/supplier/SupplierRegistrationForm.tsx`
- `components/supplier/SupplierSaltTypesCheckboxGroup.tsx`
- `components/supplier/BenefitsSection.tsx`

**Frontend edited:**
- `components/layout/Navbar.tsx` — append nav item
- `app/sitemap.ts` — append entry

**Docs:**
- `docs/wireframes/Epic5_slice1_supplier-form.md` (dari task breakdown)
- `docs/epic-breakdown/epic5_execution_log.md`

---

## Catatan Penutup

### 1. Gate 1 (RLS Manual Verify) adalah gate paling kritis

Public endpoint yang salah RLS = data corruption surface. Anon bisa preset `status = 'active'` bypass verifikasi. Bisa preset `admin_notes` sebagai spam. Test manual `SET ROLE anon;` bukan formality — ini defense in depth verification.

Kalau `SET ROLE anon;` test terlewat dan production go-live, discovery-nya baru saat klien komplain "kok ada supplier langsung status active padahal belum saya verify?" — trust incident yang mahal.

### 2. R-52 (Email service extend regression discipline) tidak boleh dilanggar

`email_service.py` sudah live untuk Epic 4 CF. Modify existing functions = 3 sistem fail sekaligus (Epic 5 CF supplier notification + Epic 4 CF RFQ confirmation + Epic 2 Slice 3 contact — kalau shared helper).

Append-only pattern + regression test rigorous = insurance yang murah.

### 3. Konstanta 5 tempat sync adalah tech debt yang di-lock

R-46 sadar konstanta duplicate di 5 tempat. Ini bukan ideal — ideal adalah single source dengan build-time codegen atau runtime config API. Tapi untuk 5 value stable, complexity codegen > risk manual sync drift.

**Trigger reconsider:** kalau di future ada 3rd konteks (mis. Epic 6 kalkulator garam butuh salt types juga), refactor jadi shared module. Untuk sekarang, disiplin sync manual.

### 4. Zero cost, zero cross-slice touch = "boring" slice yang bagus

Slice ini tidak ada excitement teknis — no AI, no complex UI, no new integrations. Ini **fitur, bukan bug**. Boring slice = predictable execution = ship dengan confidence.

Kalau tergoda "sekalian upgrade Sentry SDK" atau "sekalian refactor apiFetch" — stop. Scope creep di slice boring = boring slice jadi risky slice.

### 5. Handover ke Epic 5 Admin Panel harus clean

Setelah Epic 5 CF live, minimum 3-5 supplier registration real (dari testing + klien test drive) tersedia di production DB. Ini jadi seed data untuk Epic 5 Admin Panel development — populate list view saat dev tanpa harus manual insert.

Jangan cleanup semua test row post-demo — sisakan 2-3 dengan data placeholder yang klien approve untuk visibility. Delete accidental duplicates saja.

---

**File:** `docs/execution-guides/CLAUDE_CODE_GUIDE_epic5_cf_supplier-registration.md`
**Version:** 1.0 — {tanggal generate}
**Author:** Ach. Jazilul Qutbi
