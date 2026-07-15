# Claude Code Execution Guide — Epic 5 Admin Panel (Manajemen Supplier)

**Project:** reka-cipta-platform
**Slice:** Epic 5 Admin Panel — List view + detail view + status update + admin notes + WA template modal
**Task Breakdown Reference:** `epic5_task_breakdown_admin-panel.md` (WAJIB dibaca sebelum eksekusi)
**Prasyarat:** Epic 5 CF sudah merged ke `main`, live production minimal 3-5 hari, minimum 3 supplier registration real tersedia di production DB
**Version:** 1.0
**Author:** Ach. Jazilul Qutbi
**Total Phase:** 14 | **STOP Gates:** 4

---

## Cara Pakai Guide Ini

Format sama dengan Epic 5 CF guide (Anda baru selesai executed). **Perbedaan risk profile fundamental:**

| Aspek | Slice Ini (Epic 5 Admin) | Slice Sebelumnya (Epic 5 CF) |
|---|---|---|
| Primary risk | **Cross-slice regression Epic 4B (AdminNotesEditor refactor)** + WA service namespace collision + RLS SELECT authenticated correctness | RLS INSERT policy + Zod/Pydantic sync + email service extend regression |
| Cross-slice touches | **HIGH** — `AdminNotesEditor` (Epic 4B Slice 1), sidebar nav (Epic 1), WA template service (Epic 4B Slice 1) | Zero |
| External dependencies | Zero — pure CRUD + shared component refactor | Resend + slowapi (proven) |
| Cost implication | **Zero** — pure DB queries + WA link generation | Email delivery (Resend, negligible) |
| Public exposure | Zero — auth-gated `/admin/*` | Public form endpoint |
| Highest-ROI activity | **AdminNotesEditor refactor discipline + regression verification** | RLS policy correctness + zod-pydantic sync |
| Estimated effort | 3-5 hari | 3-4 hari |

**Yang paling risky di slice ini (urutan severity):**

1. **`AdminNotesEditor` refactor cross-slice regression** — Component ini live di Epic 4B Slice 1 (`/admin/leads/{id}` auto-save). Kalau refactor jadi shared component + break signature atau import → **semua lead detail Epic 4B auto-save broken di production**. Ini bisa jadi discovery klien saat mereka lagi manage lead pipeline. **Gate 2 khusus untuk verify regression sebelum lanjut.**
2. **WA template service extend regression** — Similar pattern dengan R-52 di Epic 5 CF (email service). File `backend/services/wa_template_service.py` live untuk Epic 4B leads. Extend dengan supplier templates tanpa modify existing functions. Kalau accidentally break `generate_wa_template` (leads version), semua WA modal Epic 4B broken.
3. **RLS SELECT authenticated=TRUE** — Data supplier punya PII (WhatsApp, email supplier, kapasitas usaha). Verify anon key TIDAK bisa akses `/supplier` GET endpoints. **Test dengan curl tanpa Authorization header di Gate 1.**
4. **PATCH whitelist enforcement `extra='forbid'`** — Klien user story hanya update `status` + `admin_notes`. Kalau extra field lolos, admin bisa accidentally overwrite `business_name` atau `whatsapp` (via bug UI atau malicious request). Whitelist bukan optional.
5. **Sidebar nav position wrong** — Discoverability issue. Klien tidak akan tahu feature exist kalau nav item buried di posisi salah. **Verify visual di Gate 3.**

**Yang TIDAK jadi risk di slice ini:**
- Zero LLM cost concerns (no Anthropic)
- Zero payment / external service integrations
- Zero migration DB (schema sudah dari Epic 5 CF)
- Zero cross-slice touch UI ke Epic 3/4 CF (customer-facing untouched)

---

## Operating Rules — Delta dari Guide Sebelumnya

Operating Rules **R-01 sampai R-52** tetap berlaku. Rules R-37 sampai R-45 (Slice 3 Epic 4B post-MVP) tetap reserved.

Rules tambahan spesifik Epic 5 Admin:

### R-53 — Shared Component Extraction Discipline

Refactor `AdminNotesEditor` dari `components/admin/lead/` ke `components/admin/shared/` adalah **wajib** (task breakdown FE-07), tapi harus dilakukan dengan disiplin:

**Pattern wajib:**
1. **BACA DULU** existing `AdminNotesEditor.tsx` — identify props signature, internal state, API call pattern
2. **Verify generic-ness** — apakah component sudah punya prop `endpoint`? Kalau hardcoded pakai `/rfq/leads/{id}`, harus tambah prop
3. **Move file** — `git mv` (bukan copy delete), preserve git history
4. **Update all imports** — grep `from ['"].*AdminNotesEditor['"]` untuk find semua consumer (Epic 4B Slice 1 `LeadDetailView`)
5. **Update signature call** — pass `endpoint` prop di semua consumer
6. **Backup tag** sebelum edit: `git tag pre-e5adm-editor-refactor`
7. **Regression test** — Gate 2 khusus untuk verify Epic 4B lead auto-save masih works
8. **Commit atomic** — 1 commit untuk refactor + all import updates, mudah revert kalau regression

**Anti-pattern yang DILARANG:**
- **JANGAN** duplicate — create `SupplierNotesEditor.tsx` yang copy-paste = tech debt permanen
- **JANGAN** wrap — create `SupplierNotesEditor` yang wrap `AdminNotesEditor` = extra layer tanpa value
- **JANGAN** modify signature tanpa update consumer — akan break Epic 4B
- **JANGAN** refactor sambil "sekalian cleanup" existing code — scope creep + regression risk
- **JANGAN** skip regression test — component live, tanpa test = playing russian roulette

**Kalau refactor terbukti lebih kompleks dari estimasi (mis. component tidak generic, butuh multi-hour rewrite):**
Stop, dokumentasikan blocker, konsultasi. Alternative sementara: create `SupplierNotesEditor` sebagai duplicate + TODO refactor future — accept tech debt eksplisit daripada rushed regression.

### R-54 — WA Template Service Namespace Convention

`backend/services/wa_template_service.py` sudah live untuk Epic 4B leads (5 templates: new, contacted, sample_sent, negotiation, sample_received).

Extend dengan supplier templates dalam file yang SAMA (task breakdown BE-05), pakai namespace prefix:

```python
# Existing dari Epic 4B (JANGAN TOUCH):
WA_TEMPLATES_LEADS = { ... }
def generate_wa_template(lead: dict, status: str) -> str: ...

# NEW untuk Epic 5:
WA_TEMPLATES_SUPPLIER = { ... }
def generate_supplier_wa_template(supplier: dict, status: str) -> str: ...
```

**Konvensi wajib:**
- Konstanta dictionary: `WA_TEMPLATES_{RESOURCE_UPPER}`
- Function: `generate_{resource_lower}_wa_template(...)`
- Helper (kalau perlu): `_readable_{resource_lower}_...`

**JANGAN:**
- **JANGAN** rename existing `WA_TEMPLATES` (tanpa suffix) — signature Epic 4B akan break
- **JANGAN** rename `generate_wa_template` jadi `generate_leads_wa_template` "untuk konsistensi" — Epic 4B router memanggilnya
- **JANGAN** create shared helper premature (mis. `_generic_wa_render`) — YAGNI, apply saat ada 3rd resource

**Kalau nanti ada 3rd resource** (Epic 6 kalkulator? unlikely, or supplier notification supplier-facing? no), refactor jadi module-per-resource.

### R-55 — Pagination Absent: Full List Fetch, Threshold Reconsider

Task breakdown AR-08: expected volume supplier < 100 dalam tahun pertama, pagination = premature optimization.

**Konsekuensi eksekusi:**
- `GET /supplier` return **semua rows** dalam 1 response (tanpa `limit` / `offset`)
- Frontend fetch full list, render semua row di Server Component
- Kalau supplier count > 200: mulai lag noticeable di production

**Threshold reconsider trigger:**
- Klien complain "halaman /admin/suppliers lambat"
- Supplier count > 200 (query manual: `SELECT COUNT(*) FROM supplier_registrations;`)
- Vercel function timeout errors di Sentry dari route ini

**JANGAN premature-optimize di slice ini:**
- Jangan add `Query(limit: int = 50)` "untuk jaga-jaga"
- Jangan lazy load / infinite scroll di frontend
- Jangan cache di React Query / SWR premature

Kalau threshold hit di future, implement pagination via `?limit=50&offset=0` — effort ~1 hari.

### R-56 — No Status History: Semantic Difference from Leads

Task breakdown AR-05: Slice ini **tidak** create `supplier_status_history` table + trigger.

**Konsekuensi eksekusi:**
- `SupplierDetailView` **tidak** ada `<StatusHistoryTable>` section
- `SupplierUpdateResponse` return `Supplier` langsung, bukan `SupplierDetailResponse` wrapper dengan `history` field
- `PATCH /supplier/{id}` tidak trigger history log (no trigger DB level)

**Justifikasi (dari task breakdown AR-05):**
- Supplier data lebih stable dari lead
- `updated_at` sudah cukup untuk basic audit
- History table + trigger overkill untuk MVP

**JANGAN pattern copy-paste dari Epic 4B Slice 1 secara blind** — kalau baca guide Slice 1 dan tergoda "sekalian tambah history biar konsisten", stop. Konsistensi teknis ≠ konsistensi bisnis. Bisnis supplier ≠ bisnis lead.

**Kalau klien nanti minta audit trail supplier status changes** (post-launch feedback):
- Add table `supplier_status_history` (mirror Epic 4B DB-01 pattern)
- Backfill kosong (start from adoption date, no historical data pre-launch)
- Add `<StatusHistoryTable>` component di detail view

Ini enhancement, bukan MVP scope.

### R-57 — Table Layout, Bukan Kanban

Task breakdown AR-01: Slice ini pakai **tabel** untuk list view, bukan Kanban seperti Epic 4B Slice 1.

**Konsekuensi eksekusi:**
- **JANGAN** install `@dnd-kit` (sudah ada dari Epic 4B, tapi jangan import di slice ini)
- **JANGAN** create `SupplierKanbanBoard`, `SupplierKanbanColumn`, `SupplierKanbanCard`
- Component name eksplisit: `SupplierTable`, `SupplierRow` (bukan generic `SupplierList`)

**Justifikasi (task breakdown AR-01):**
- Supplier lifecycle jarang berubah (status bulan-bulanan)
- Master data pattern, bukan pipeline flow
- Tabel dengan filter + search adalah UX yang tepat

**JANGAN retrofit Kanban** kalau klien "penasaran" di demo. Explain rasional. Kalau klien insist Kanban, jadikan enhancement dengan usage data justification (mis. "kalau supplier count > 30 dan Anda actively move antar status seminggu > 3x, worth explore Kanban").

### R-58 — Filter State via URL Query Params (Reuse Epic 4B Pattern)

Filter status + search query = URL params (task breakdown AR-09), konsisten dengan Epic 4B `FilterPanel`.

**Pattern wajib:**
- Server Component page.tsx: baca `searchParams` (Next.js 15 = Promise, await dulu)
- Client Component `FilterPanel`: `useRouter` + `usePathname` + `useSearchParams` untuk update URL
- Search debounce 300ms sebelum URL push
- Status dropdown update URL immediate

**JANGAN:**
- **JANGAN** pakai local state (`useState`) tanpa URL sync — refresh reset filter, shareable link broken
- **JANGAN** wrap dengan React Query / SWR untuk filter state — URL sudah cukup
- **JANGAN** skip validate `status` di Server Component — invalid value dari URL (`?status=hacked`) harus di-default ke all (defense in depth)

Validation pattern di Server Component:
```typescript
const validStatus: SupplierStatus | undefined =
  params.status && ['new', 'verified', 'active', 'inactive'].includes(params.status)
    ? (params.status as SupplierStatus)
    : undefined;
```

---

# PHASE 1 — Preflight & Branch Setup + Read Existing Files

**Tujuan:** Verify Epic 5 CF stable production, verify Epic 4B Slice 1 files existing, setup branch, baca semua file yang akan disentuh.

## Kerjakan

1. `git status` bersih, `git checkout main && git pull`.
2. Verify prasyarat production:
   - Login production `/admin`, buka `/admin/leads` (Epic 4B Slice 1) → verify Kanban render, drag-drop works
   - Buka lead detail `/admin/leads/{some-id}` → verify auto-save notes works, status update works, WA modal opens with template
   - Buka production customer-facing `/jadi-supplier` (Epic 5 CF) → verify form loads, submit test dummy → verify redirect + email admin delivered
   - Cleanup test row: `DELETE FROM supplier_registrations WHERE business_name = 'Baseline Test';`
3. Verify minimum data untuk dev:
   ```sql
   SELECT COUNT(*) FROM supplier_registrations;
   -- Expected: >= 3 rows (dari testing Epic 5 CF + Gate 4 demo)
   ```
   Kalau < 3, seed dummy data via Supabase Dashboard:
   ```sql
   INSERT INTO supplier_registrations 
     (business_name, location_city, location_province, salt_types_available,
      capacity_per_month, capacity_unit, whatsapp, email, additional_notes)
   VALUES
     ('Petani Garam Mandiri', 'Sumenep', 'Jawa Timur', 
      ARRAY['kasar_petani'], 200, 'ton', '+6281234567891', NULL, 'Sudah 5 tahun produksi'),
     ('CV Garam Sejahtera', 'Pati', 'Jawa Tengah',
      ARRAY['halus_yodium', 'halus_non_yodium'], 500, 'ton', '+6281234567892',
      'sejahtera@example.com', NULL),
     ('Koperasi Petani Bali', 'Denpasar', 'Bali',
      ARRAY['kasar_petani', 'ghpt'], 150, 'ton', '+6281234567893',
      NULL, 'Kelompok koperasi 20 anggota');
   ```
4. **BACA** file existing yang akan disentuh (READ before edit — R-52 discipline extended):
   ```bash
   ls backend/services/wa_template_service.py
   ls backend/routers/supplier.py
   ls backend/schemas/supplier.py
   ls components/admin/lead/AdminNotesEditor.tsx
   ls components/admin/Sidebar.tsx  # atau lokasi nav config
   ```
5. **Deep read** `backend/services/wa_template_service.py`:
   - Identify existing `WA_TEMPLATES_LEADS` (atau `WA_TEMPLATES` tanpa suffix, kalau belum di-rename)
   - Identify existing `generate_wa_template` function signature
   - Identify helper functions
6. **Deep read** `components/admin/lead/AdminNotesEditor.tsx`:
   - Props signature (`resourceId`? `endpoint`? `initialValue`?)
   - Internal state (debounce logic, on-blur pattern)
   - API call pattern (`apiFetch` atau `updateLead`?)
   - **Critical:** apakah component sudah generic (pakai `endpoint` prop) atau hardcoded pakai `/rfq/leads/{id}`?
7. Cari all consumer `AdminNotesEditor`:
   ```bash
   grep -rn "AdminNotesEditor" components/ app/
   # Expected: minimal 1 usage di components/admin/lead/LeadDetailView.tsx
   ```
   Note all locations untuk update import di Phase 7.
8. **Deep read** `backend/routers/supplier.py` (dari Epic 5 CF):
   - Verify `POST /supplier/register` endpoint public
   - Identify import structure — akan reuse untuk endpoint admin baru
9. Buat branch: `git checkout -b feature/epic5-admin-supplier-management`
10. Backup tag:
    ```bash
    git tag pre-e5adm-baseline
    ```

## Jangan

- **JANGAN** proceed kalau Epic 4B Slice 1 broken di production. Baseline broken = tidak bisa distinguish regression baru vs bug lama
- **JANGAN** skip deep read `AdminNotesEditor` — refactor blind = regression risk R-53
- **JANGAN** skip verify supplier data count — dev tanpa data = frustrating debugging
- **JANGAN** proceed kalau existing WA service structure tidak clear — extend blind risky

## Verifikasi

- [ ] Branch `feature/epic5-admin-supplier-management` aktif
- [ ] Baseline Epic 4B Slice 1 + Epic 5 CF works di production
- [ ] Minimum 3 supplier row di production DB
- [ ] `AdminNotesEditor` signature + internal pattern understood
- [ ] All `AdminNotesEditor` consumers identified via grep
- [ ] `wa_template_service.py` existing structure understood
- [ ] Backup tag `pre-e5adm-baseline` exists

---

# PHASE 2 — Backend Pydantic Schemas Extend

**Tujuan:** Extend `backend/schemas/supplier.py` dengan model untuk admin operations (list, detail, update, WA template).

## Kerjakan

1. **BACA ULANG** `backend/schemas/supplier.py` — refresh mental model.
2. **APPEND** schemas baru di bottom file, jangan modify existing `SupplierRegisterRequest` / `SupplierRegisterResponse`:
   ```python
   # ==============================================
   # Epic 5 Admin — Schemas untuk admin operations
   # ==============================================

   from datetime import datetime

   SUPPLIER_STATUSES: set[str] = {'new', 'verified', 'active', 'inactive'}


   class Supplier(BaseModel):
       """Full supplier data untuk admin operations."""
       model_config = ConfigDict(from_attributes=True)

       id: str
       business_name: str
       location_city: str
       location_province: str
       salt_types_available: list[str]
       capacity_per_month: float
       capacity_unit: str
       whatsapp: str
       email: str | None
       additional_notes: str | None
       admin_notes: str | None
       status: str
       created_at: datetime
       updated_at: datetime


   class SupplierUpdateRequest(BaseModel):
       """Whitelist untuk PATCH — hanya status dan admin_notes (R-53 whitelist strict)."""
       model_config = ConfigDict(extra='forbid')

       status: str | None = None
       admin_notes: str | None = None

       @field_validator('status')
       def validate_status(cls, v: str | None) -> str | None:
           if v is not None and v not in SUPPLIER_STATUSES:
               raise ValueError(f"Invalid status: {v}")
           return v


   class SupplierListResponse(BaseModel):
       suppliers: list[Supplier]
       total: int


   class SupplierWATemplateRequest(BaseModel):
       model_config = ConfigDict(extra='forbid')
       supplier_id: str
       status: str

       @field_validator('status')
       def validate_status(cls, v: str) -> str:
           if v not in SUPPLIER_STATUSES:
               raise ValueError(f"Invalid status: {v}")
           return v


   class SupplierWATemplateResponse(BaseModel):
       template: str  # bisa empty string untuk status 'inactive' (task breakdown AR-04)
       whatsapp_number: str  # cleaned untuk wa.me (tanpa +)
   ```
3. Unit test manual:
   ```bash
   cd backend
   source .venv/bin/activate
   python -c "
   from schemas.supplier import (
       Supplier, SupplierUpdateRequest, SupplierWATemplateRequest
   )
   
   # Valid update — status only
   r = SupplierUpdateRequest(status='verified')
   assert r.status == 'verified'
   assert r.admin_notes is None
   print('OK partial update status')
   
   # Valid update — notes only
   r = SupplierUpdateRequest(admin_notes='test note')
   assert r.status is None
   print('OK partial update notes')
   
   # Invalid status
   try:
       SupplierUpdateRequest(status='hacked')
       print('FAIL: should reject invalid status')
   except Exception:
       print('OK reject invalid status')
   
   # Extra field forbidden (whitelist)
   try:
       SupplierUpdateRequest(status='new', business_name='hack')
       print('FAIL: should reject extra field')
   except Exception:
       print('OK reject extra field')
   
   # WA template request
   r = SupplierWATemplateRequest(supplier_id='abc', status='new')
   assert r.supplier_id == 'abc'
   print('OK WA template request')
   
   # Empty payload — should reject (no fields)
   try:
       SupplierUpdateRequest()
       # This will pass validation, endpoint handler yang reject
       print('OK empty request validated (endpoint should still reject)')
   except Exception:
       print('OK empty request rejected at schema')
   "
   ```
4. Commit progress:
   ```bash
   git add backend/schemas/supplier.py
   git commit -m "feat(supplier): admin operation schemas [Epic 5 Admin]"
   ```

## Jangan

- **JANGAN** modify existing `SupplierRegisterRequest` / `SupplierRegisterResponse` — Epic 5 CF endpoint depend on them
- **JANGAN** allow status `null` di response `Supplier` — DB constraint NOT NULL, response harus consistent
- **JANGAN** include `salt_types_readable` field di `Supplier` model — data transformation di frontend, keep backend response clean
- **JANGAN** lupa `field_validator` di `SupplierWATemplateRequest.status` — kalau miss, endpoint accept invalid status → service raise, bad UX
- **JANGAN** create `SupplierDetailResponse` wrapper dengan `history` field — R-56, no status history

## Verifikasi

- [ ] Schemas appended, existing schemas untouched
- [ ] Unit test 5 skenario pass
- [ ] Import di router (Phase 3) tidak error
- [ ] Commit done

---

# PHASE 3 — Backend Router Endpoints (GET list, GET detail, PATCH)

**Tujuan:** Tambah 3 endpoint auth-gated di `backend/routers/supplier.py`.

## Kerjakan

1. **BACA ULANG** `backend/routers/supplier.py` (dari Epic 5 CF) — refresh existing structure.
2. **APPEND** endpoints di file yang sama (jangan create file baru — endpoint prefix `/supplier` sama):
   ```python
   from fastapi import Query
   from typing import Optional
   
   from ..schemas.supplier import (
       # Existing Epic 5 CF:
       # SupplierRegisterRequest, SupplierRegisterResponse,
       # NEW Epic 5 Admin:
       Supplier, SupplierUpdateRequest, SupplierListResponse,
   )
   from ..dependencies import get_current_user  # AUTH dep dari Epic 3B


   @router.get(
       "",
       response_model=SupplierListResponse,
       dependencies=[Depends(get_current_user)],  # R-53 auth guard
   )
   async def list_suppliers(
       status: Optional[str] = Query(None),
       search: Optional[str] = Query(None),
   ) -> SupplierListResponse:
       supabase = get_supabase_service()
       query = supabase.table("supplier_registrations").select("*")

       if status:
           if status not in {'new', 'verified', 'active', 'inactive'}:
               raise HTTPException(422, f"Invalid status: {status}")
           query = query.eq("status", status)

       if search:
           # Case-insensitive search di 3 field
           pattern = f"%{search}%"
           query = query.or_(
               f"business_name.ilike.{pattern},"
               f"location_city.ilike.{pattern},"
               f"location_province.ilike.{pattern}"
           )

       query = query.order("created_at", desc=True)
       result = query.execute()
       suppliers = [Supplier(**row) for row in result.data]
       return SupplierListResponse(suppliers=suppliers, total=len(suppliers))


   @router.get(
       "/{supplier_id}",
       response_model=Supplier,
       dependencies=[Depends(get_current_user)],
   )
   async def get_supplier_detail(supplier_id: str) -> Supplier:
       supabase = get_supabase_service()
       result = (
           supabase.table("supplier_registrations")
           .select("*").eq("id", supplier_id).limit(1).execute()
       )
       if not result.data:
           raise HTTPException(404, "Supplier not found")
       return Supplier(**result.data[0])


   @router.patch(
       "/{supplier_id}",
       response_model=Supplier,
       dependencies=[Depends(get_current_user)],
   )
   async def update_supplier(
       supplier_id: str,
       payload: SupplierUpdateRequest,
   ) -> Supplier:
       supabase = get_supabase_service()

       update_data = payload.model_dump(exclude_none=True)
       if not update_data:
           raise HTTPException(422, "No fields to update")

       result = (
           supabase.table("supplier_registrations")
           .update(update_data).eq("id", supplier_id).execute()
       )

       if not result.data:
           raise HTTPException(404, "Supplier not found")

       return Supplier(**result.data[0])
   ```
3. **JANGAN commit dulu.** Wait Phase 4 (WA template) done.

## Jangan

- **JANGAN** urutkan `@router.get("/{supplier_id}")` SEBELUM `@router.get("")` — FastAPI route matching greedy, `""` bisa keliru match ke `{supplier_id}=""`. Verify urutan: `""` dulu, baru `/{supplier_id}`
- **JANGAN** lupa `dependencies=[Depends(get_current_user)]` di setiap endpoint admin — auth guard mandatory
- **JANGAN** allow update field selain `status` + `admin_notes` — whitelist strict via `extra='forbid'`
- **JANGAN** raise 500 kalau supplier not found — 404 sesuai HTTP semantic
- **JANGAN** hardcode ANON key di client. `get_supabase_service()` return service_role — bypass RLS untuk admin ops (justified karena auth-gated di layer FastAPI)

## Verifikasi

- [ ] 3 endpoint appended, existing `/supplier/register` untouched
- [ ] Import baru tidak conflict
- [ ] Belum commit — wait Phase 4

---

# PHASE 4 — Backend WA Template Service Extend + Endpoint

**Tujuan:** Extend `wa_template_service.py` dengan 3 template supplier + endpoint POST `/supplier/wa-template`. Discipline sama dengan R-54.

## Kerjakan

1. **Backup tag** sebelum touch service file:
   ```bash
   git tag pre-e5adm-wa-service-extend
   ```
2. **BACA ULANG** `backend/services/wa_template_service.py` — identify:
   - Existing `WA_TEMPLATES_LEADS` (atau tanpa suffix — kalau tanpa suffix, **rename dulu** dengan pattern konvensi R-54)
   - Existing `generate_wa_template` signature (jangan rename ini walaupun tergoda konsistensi)
   - Helper functions (kalau ada)
3. **Kalau existing pakai `WA_TEMPLATES` tanpa suffix** (kemungkinan besar dari Epic 4B Slice 1):
   
   Rename konstanta jadi `WA_TEMPLATES_LEADS`. Ini bukan cross-slice risk karena konstanta private, tapi update semua reference di file yang sama.
   
   **JANGAN rename function `generate_wa_template`** — router Epic 4B panggil pakai nama ini. Rename = break Epic 4B.
   
4. **APPEND** supplier templates + function di bottom file:
   ```python
   # ==============================================
   # Epic 5 Admin — Supplier WA Templates (R-54)
   # ==============================================

   # WARNING: Label map duplicate dari:
   # - backend/services/email_service.py (_SUPPLIER_SALT_TYPES_LABEL)
   # - lib/constants/supplier-salt-types.ts
   # Kalau ubah, sync manual R-46.
   _SUPPLIER_SALT_TYPES_LABEL_WA = {
       'kasar_petani': 'Kasar Petani',
       'halus_yodium': 'Halus Yodium',
       'halus_non_yodium': 'Halus Non-Yodium',
       'industri_spo_m': 'Industri (SPO/M)',
       'ghpt': 'GHPT',
   }


   def _readable_supplier_salt_types(salt_types: list[str]) -> str:
       labels = [_SUPPLIER_SALT_TYPES_LABEL_WA.get(t, t) for t in salt_types]
       return ", ".join(labels)


   WA_TEMPLATES_SUPPLIER = {
       'new': """Halo {business_name},

   Terima kasih telah mendaftar sebagai calon supplier CV Reka Cipta Indonesia.

   Pendaftaran Anda dari {location_city}, {location_province} untuk supply {salt_types_readable} sudah kami terima dengan kapasitas {capacity_per_month} {capacity_unit}/bulan.

   Tim kami akan melakukan verifikasi awal dalam 2-3 hari kerja. Setelah itu, kami akan menghubungi Anda untuk langkah selanjutnya (permintaan dokumen tambahan dan foto lokasi produksi).

   Kalau ada pertanyaan, silakan reply pesan ini.

   Salam,
   Tim CV Reka Cipta Indonesia""",

       'verified': """Halo {business_name},

   Kami info bahwa data Anda sedang dalam proses verifikasi. Untuk melanjutkan, mohon kirim:

   1. Foto lokasi produksi garam
   2. Sample produk (min. 500 gram) untuk quality check
   3. Copy identitas pemilik usaha

   Alamat kirim sample akan kami info di follow-up berikutnya.

   Estimasi verifikasi selesai: 1-2 minggu setelah dokumen lengkap.

   Salam,
   Tim CV Reka Cipta Indonesia""",

       'active': """Halo {business_name},

   Selamat! Anda resmi bergabung sebagai mitra supplier CV Reka Cipta Indonesia.

   Berikut informasi proses pembelian pertama:
   - Volume order awal: (akan dikonfirmasi tim purchasing)
   - Sistem pembayaran: (sesuai kesepakatan)
   - Kontak PIC purchasing: (akan diinfo)

   Tim purchasing kami akan menghubungi dalam 1-2 hari kerja untuk order pertama.

   Terima kasih atas kepercayaan Anda bermitra dengan kami.

   Salam,
   Tim CV Reka Cipta Indonesia""",
       # NOTE: status 'inactive' sengaja tidak ada template (task breakdown AR-04)
   }


   def generate_supplier_wa_template(supplier: dict, status: str) -> str:
       """
       Generate WA template string untuk supplier.

       Return empty string kalau status tidak ada template (mis. 'inactive').
       Frontend handle empty case di modal (task breakdown UX-05).
       """
       template = WA_TEMPLATES_SUPPLIER.get(status)
       if not template:
           return ""  # inactive tidak ada template

       return template.format(
           business_name=supplier['business_name'],
           location_city=supplier['location_city'],
           location_province=supplier['location_province'],
           salt_types_readable=_readable_supplier_salt_types(
               supplier['salt_types_available']
           ),
           capacity_per_month=supplier['capacity_per_month'],
           capacity_unit=supplier['capacity_unit'],
       )
   ```
5. **APPEND** endpoint di `backend/routers/supplier.py`:
   ```python
   import re
   from ..schemas.supplier import (
       SupplierWATemplateRequest, SupplierWATemplateResponse,
   )
   from ..services.wa_template_service import generate_supplier_wa_template


   @router.post(
       "/wa-template",
       response_model=SupplierWATemplateResponse,
       dependencies=[Depends(get_current_user)],
   )
   async def generate_supplier_wa_template_endpoint(
       payload: SupplierWATemplateRequest,
   ) -> SupplierWATemplateResponse:
       supabase = get_supabase_service()

       supplier_result = (
           supabase.table("supplier_registrations")
           .select("*").eq("id", payload.supplier_id).limit(1).execute()
       )
       if not supplier_result.data:
           raise HTTPException(404, "Supplier not found")

       supplier = supplier_result.data[0]
       template = generate_supplier_wa_template(
           supplier=supplier,
           status=payload.status,
       )

       # Clean WA number untuk wa.me link
       # supplier.whatsapp sudah normalized +62xxx dari Epic 5 CF R-47
       # wa.me expect format tanpa + (mis. 6281234567890)
       whatsapp_clean = re.sub(r'[\s\-+()]', '', supplier['whatsapp'])

       return SupplierWATemplateResponse(
           template=template,
           whatsapp_number=whatsapp_clean,
       )
   ```
6. Local test — trigger Epic 4B lead WA modal untuk verify regression:
   ```bash
   # Start backend local
   uvicorn backend.main:app --reload &
   
   # Test 1: leads WA template still works (regression)
   curl -X POST "http://localhost:8000/rfq/wa-template" \
     -H "Authorization: Bearer $LOCAL_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"lead_id": "SOME_LEAD_UUID", "status": "new"}'
   # Expected: 200 dengan template terisi
   
   # Test 2: supplier WA template
   curl -X POST "http://localhost:8000/supplier/wa-template" \
     -H "Authorization: Bearer $LOCAL_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"supplier_id": "SOME_SUPPLIER_UUID", "status": "new"}'
   # Expected: 200 dengan template terisi + business_name replaced
   
   # Test 3: supplier WA template status inactive
   curl -X POST "http://localhost:8000/supplier/wa-template" \
     -H "Authorization: Bearer $LOCAL_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"supplier_id": "SOME_SUPPLIER_UUID", "status": "inactive"}'
   # Expected: 200 dengan template = "" (empty string)
   ```
7. Commit Phase 3 + 4:
   ```bash
   git add backend/
   git commit -m "feat(supplier): admin endpoints + WA template service extend [Epic 5 Admin]"
   ```

## Jangan

- **JANGAN** modify function `generate_wa_template` existing (R-54) — Epic 4B router memanggilnya
- **JANGAN** hardcode WA template di endpoint file — separate service file, keep router thin
- **JANGAN** skip test regression Epic 4B WA template — R-54 explicit test requirement
- **JANGAN** convert empty template ke exception di endpoint — return empty string, frontend handle (task breakdown AR-04)
- **JANGAN** lupa comment WARNING sync di label map — R-46 discipline

## Verifikasi

- [ ] WA template service extended, existing `generate_wa_template` untouched
- [ ] Endpoint `POST /supplier/wa-template` added
- [ ] 3 curl test pass (leads regression, supplier new, supplier inactive)
- [ ] Backup tag `pre-e5adm-wa-service-extend` exists
- [ ] Commit done

---

# PHASE 5 — Backend Deploy + Production Curl Smoke Test

**Tujuan:** Deploy backend ke Railway, smoke test 4 endpoint baru + regression Epic 4B endpoints.

## Kerjakan

1. Push branch:
   ```bash
   git push -u origin feature/epic5-admin-supplier-management
   ```
2. Wait Railway build sukses.
3. Login admin production, get JWT token untuk curl testing.
4. **Smoke test 1 — GET list (no filter):**
   ```bash
   API_URL="https://your-railway-backend.up.railway.app"
   TOKEN="your_admin_jwt"
   
   curl "${API_URL}/supplier" -H "Authorization: Bearer ${TOKEN}"
   # Expected: 200, {"suppliers":[...],"total":N} dengan N >= 3
   ```
5. **Smoke test 2 — GET list dengan filter status:**
   ```bash
   curl "${API_URL}/supplier?status=new" -H "Authorization: Bearer ${TOKEN}"
   # Expected: 200, subset dari total, semua rows dengan status='new'
   ```
6. **Smoke test 3 — GET list dengan search:**
   ```bash
   curl "${API_URL}/supplier?search=jawa" -H "Authorization: Bearer ${TOKEN}"
   # Expected: 200, subset yang location_city/province/business_name match 'jawa'
   ```
7. **Smoke test 4 — GET list dengan combined filter:**
   ```bash
   curl "${API_URL}/supplier?status=verified&search=timur" \
     -H "Authorization: Bearer ${TOKEN}"
   # Expected: 200
   ```
8. **Smoke test 5 — GET detail:**
   ```bash
   SUPPLIER_ID="pick from list response"
   curl "${API_URL}/supplier/${SUPPLIER_ID}" -H "Authorization: Bearer ${TOKEN}"
   # Expected: 200, full Supplier object
   ```
9. **Smoke test 6 — GET detail invalid ID:**
   ```bash
   curl "${API_URL}/supplier/00000000-0000-0000-0000-000000000000" \
     -H "Authorization: Bearer ${TOKEN}"
   # Expected: 404
   ```
10. **Smoke test 7 — PATCH status only:**
    ```bash
    curl -X PATCH "${API_URL}/supplier/${SUPPLIER_ID}" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d '{"status": "verified"}'
    # Expected: 200, response.status = 'verified', response.updated_at newer
    ```
11. **Smoke test 8 — PATCH admin_notes only:**
    ```bash
    curl -X PATCH "${API_URL}/supplier/${SUPPLIER_ID}" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d '{"admin_notes": "Test dari curl smoke test"}'
    # Expected: 200
    ```
12. **Smoke test 9 — PATCH extra field forbidden:**
    ```bash
    curl -X PATCH "${API_URL}/supplier/${SUPPLIER_ID}" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d '{"status": "active", "business_name": "hack"}'
    # Expected: 422 (extra='forbid' whitelist)
    ```
13. **Smoke test 10 — PATCH invalid status:**
    ```bash
    curl -X PATCH "${API_URL}/supplier/${SUPPLIER_ID}" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d '{"status": "hacked"}'
    # Expected: 422
    ```
14. **Smoke test 11 — PATCH empty body:**
    ```bash
    curl -X PATCH "${API_URL}/supplier/${SUPPLIER_ID}" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d '{}'
    # Expected: 422 "No fields to update"
    ```
15. **Smoke test 12 — POST WA template (status=new):**
    ```bash
    curl -X POST "${API_URL}/supplier/wa-template" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{\"supplier_id\": \"${SUPPLIER_ID}\", \"status\": \"new\"}"
    # Expected: 200, {"template": "Halo {business_name}...","whatsapp_number":"6281234..."}
    ```
16. **Smoke test 13 — POST WA template (status=inactive):**
    ```bash
    curl -X POST "${API_URL}/supplier/wa-template" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{\"supplier_id\": \"${SUPPLIER_ID}\", \"status\": \"inactive\"}"
    # Expected: 200, template="", whatsapp_number populated
    ```
17. **Smoke test 14 — RLS AUTH negative test:**
    ```bash
    # Tanpa Authorization header
    curl "${API_URL}/supplier"
    # Expected: 401 atau 403
    
    curl "${API_URL}/supplier/${SUPPLIER_ID}"
    # Expected: 401 atau 403
    ```
18. **Smoke test 15 — Regression Epic 4B leads:**
    ```bash
    # GET leads list
    curl "${API_URL}/rfq/leads" -H "Authorization: Bearer ${TOKEN}"
    # Expected: 200 dengan data
    
    # POST leads WA template
    LEAD_ID="pick from leads list"
    curl -X POST "${API_URL}/rfq/wa-template" \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{\"lead_id\": \"${LEAD_ID}\", \"status\": \"new\"}"
    # Expected: 200
    ```
19. **Rollback test data:** kembalikan supplier yang di-modify saat test:
    ```sql
    UPDATE supplier_registrations 
    SET status = 'new', admin_notes = NULL 
    WHERE id = 'SUPPLIER_ID_FROM_TEST';
    ```

## Jangan

- **JANGAN** skip regression test Epic 4B leads (smoke test 15) — R-54 explicit requirement
- **JANGAN** lupa AUTH negative test (smoke test 14) — kalau endpoint accidentally public, data supplier bocor
- **JANGAN** biarkan test data modified permanent — rollback status + notes

## Verifikasi

- [ ] Railway deploy sukses
- [ ] 15 smoke test pass
- [ ] Regression Epic 4B leads works
- [ ] Test data rolled back

---

# 🛑 STOP GATE 1 — Backend Production Verified + AUTH Confirmed

**Status:** Menunggu Jazil konfirmasi backend production stable + AUTH policy tight.

## Aksi Manual yang Jazil Lakukan

### 1. Additional AUTH Verification

Selain smoke test 14, verify explicit dengan browser incognito:
- Buka `${API_URL}/supplier` di browser incognito (no cookies, no header)
- Expected: 401 atau redirect ke login
- Kalau return JSON data → **CRITICAL BUG**, endpoint bocor, immediate revert deploy

### 2. RLS Read Test — Verify anon key tidak bisa akses

Di Supabase Dashboard SQL Editor:
```sql
SET ROLE anon;
SELECT * FROM supplier_registrations LIMIT 1;
-- Expected: 0 rows (RLS block SELECT untuk anon — hanya INSERT allowed per Epic 5 CF)

RESET ROLE;
```

Kalau anon return data → RLS policy Epic 5 CF DB-02 salah, fix di migration terpisah sebelum lanjut.

### 3. Sentry Check

- Buka Sentry backend dashboard
- Filter last 30 menit — pastikan no error dari 15 smoke test
- Kalau ada `500` unexpected, investigate log

### 4. Update Execution Log

Create/append `docs/epic-breakdown/epic5_execution_log.md`:
```markdown
## Epic 5 Admin Panel — Backend Verified

- Tanggal deploy: ...
- 15 smoke test result: ✅ pass
- Auth negative test: ✅ pass (401 tanpa token)
- Anon RLS SELECT test: ✅ pass (0 rows)
- Regression Epic 4B leads: ✅ pass
- Sentry: ✅ clean
```

## Setelah Gate Ini Clear

- Backend production-ready
- Frontend dev bisa mulai dengan confidence backend contract stable + secure

## Sinyal Masalah

- Kalau AUTH negative test return data → **CRITICAL**, immediate revert, investigate `dependencies=[Depends(get_current_user)]` hilang di endpoint mana
- Kalau anon SELECT return data → RLS di Epic 5 CF salah, bukan bug slice ini tapi harus fix sebelum lanjut
- Kalau regression Epic 4B fail → R-54 violated, revert Phase 4 commit, redesign extend

---

# PHASE 6 — Frontend Contract Layer (Types + lib/api extend)

**Tujuan:** Extend `types/supplier.ts` + `lib/api/supplier.ts` untuk admin operations.

## Kerjakan

1. **BACA ULANG** `types/supplier.ts` dari Epic 5 CF — refresh signature existing.
2. **APPEND** types admin:
   ```typescript
   // Existing dari Epic 5 CF:
   // export interface SupplierRegisterInput { ... }
   // export interface SupplierRegisterResponse { ... }
   
   // ==============================================
   // Epic 5 Admin — Types untuk admin operations
   // ==============================================

   export type SupplierStatus = 'new' | 'verified' | 'active' | 'inactive';

   export interface Supplier {
     id: string;
     business_name: string;
     location_city: string;
     location_province: string;
     salt_types_available: string[];
     capacity_per_month: number;
     capacity_unit: 'ton' | 'kwintal' | 'kg';
     whatsapp: string;
     email: string | null;
     additional_notes: string | null;
     admin_notes: string | null;
     status: SupplierStatus;
     created_at: string;
     updated_at: string;
   }

   export interface SupplierListResponse {
     suppliers: Supplier[];
     total: number;
   }

   export interface SupplierUpdateInput {
     status?: SupplierStatus;
     admin_notes?: string;
   }

   export interface SupplierWATemplateInput {
     supplier_id: string;
     status: SupplierStatus;
   }

   export interface SupplierWATemplateResponse {
     template: string;
     whatsapp_number: string;
   }
   ```
3. **APPEND** API functions di `lib/api/supplier.ts`:
   ```typescript
   // Existing: registerSupplier

   // ==============================================
   // Epic 5 Admin — API functions
   // ==============================================
   import type {
     Supplier,
     SupplierListResponse,
     SupplierStatus,
     SupplierUpdateInput,
     SupplierWATemplateInput,
     SupplierWATemplateResponse,
   } from '@/types/supplier';

   export async function listSuppliers(params?: {
     status?: SupplierStatus;
     search?: string;
   }): Promise<SupplierListResponse> {
     const qs = new URLSearchParams();
     if (params?.status) qs.set('status', params.status);
     if (params?.search) qs.set('search', params.search);
     const query = qs.toString();
     return apiFetch<SupplierListResponse>(
       `/supplier${query ? `?${query}` : ''}`,
       { method: 'GET', auth: true }
     );
   }

   export async function getSupplier(id: string): Promise<Supplier> {
     return apiFetch<Supplier>(`/supplier/${id}`, {
       method: 'GET',
       auth: true,
     });
   }

   export async function updateSupplier(
     id: string,
     input: SupplierUpdateInput
   ): Promise<Supplier> {
     return apiFetch<Supplier>(`/supplier/${id}`, {
       method: 'PATCH',
       body: input,
       auth: true,
     });
   }

   export async function generateSupplierWATemplate(
     input: SupplierWATemplateInput
   ): Promise<SupplierWATemplateResponse> {
     return apiFetch<SupplierWATemplateResponse>('/supplier/wa-template', {
       method: 'POST',
       body: input,
       auth: true,
     });
   }
   ```
4. Verify TypeScript compile:
   ```bash
   npx tsc --noEmit
   # Expected: no errors
   ```
5. Commit:
   ```bash
   git add types/ lib/api/
   git commit -m "feat(supplier): admin contract layer [Epic 5 Admin]"
   ```

## Jangan

- **JANGAN** modify existing `SupplierRegisterInput` / `registerSupplier` — Epic 5 CF depend on it
- **JANGAN** hardcode `auth: false` di admin functions — akan bypass token, endpoint return 401
- **JANGAN** hardcode API URL — pakai `apiFetch` yang handle `NEXT_PUBLIC_API_URL`
- **JANGAN** create type `SupplierDetailResponse` dengan `history` field — R-56, no status history

## Verifikasi

- [ ] Types + functions appended
- [ ] TypeScript compile clean
- [ ] Commit done

---

# PHASE 7 — Cross-Slice: Refactor `AdminNotesEditor` to Shared Component (HIGH RISK — R-53)

**Tujuan:** Move `AdminNotesEditor` dari `components/admin/lead/` ke `components/admin/shared/`, generic-kan dengan `endpoint` prop, update semua consumer.

**Gate 2 khusus untuk verify regression Epic 4B.**

## Kerjakan

1. **Backup tag** eksplisit (sudah dari Phase 1, verify masih ada):
   ```bash
   git tag | grep pre-e5adm-editor-refactor
   # Kalau tidak ada, create sekarang:
   git tag pre-e5adm-editor-refactor
   ```
2. **BACA ULANG** `components/admin/lead/AdminNotesEditor.tsx` — verify signature current.
3. **Scenario A: Component sudah punya prop `endpoint` (dari Epic 4B foresight):**
   
   Cukup:
   - `git mv components/admin/lead/AdminNotesEditor.tsx components/admin/shared/AdminNotesEditor.tsx`
   - Update import di `components/admin/lead/LeadDetailView.tsx`:
     ```typescript
     // BEFORE:
     import { AdminNotesEditor } from './AdminNotesEditor';
     // AFTER:
     import { AdminNotesEditor } from '@/components/admin/shared/AdminNotesEditor';
     ```
   
4. **Scenario B: Component hardcoded pakai `/rfq/leads/{id}` (kemungkinan besar):**
   
   Refactor jadi generic:
   - `git mv` file ke shared location
   - Modify signature:
     ```typescript
     // BEFORE:
     interface Props {
       leadId: string;
       initialValue: string | null;
     }
     
     export function AdminNotesEditor({ leadId, initialValue }: Props) {
       // ... hardcoded call ke `/rfq/leads/${leadId}` ...
     }
     
     // AFTER:
     interface Props {
       resourceId: string;
       initialValue: string | null;
       endpoint: string;  // e.g., "/rfq/leads/abc" atau "/supplier/xyz"
     }
     
     export function AdminNotesEditor({ resourceId, initialValue, endpoint }: Props) {
       // ... call generic via apiFetch(endpoint, { method: 'PATCH', body: { admin_notes: value } })
     }
     ```
   - Update consumer `LeadDetailView.tsx`:
     ```typescript
     // BEFORE:
     <AdminNotesEditor leadId={lead.id} initialValue={lead.admin_notes} />
     
     // AFTER:
     <AdminNotesEditor
       resourceId={lead.id}
       initialValue={lead.admin_notes}
       endpoint={`/rfq/leads/${lead.id}`}
     />
     ```
5. Verify semua consumer updated:
   ```bash
   grep -rn "AdminNotesEditor" components/ app/ | grep -v shared/AdminNotesEditor
   # Expected: 0 references (semua sudah import dari shared)
   ```
6. TypeScript compile check:
   ```bash
   npx tsc --noEmit
   # Expected: no errors
   ```
7. **Commit atomic** — 1 commit untuk refactor + all import updates (mudah revert):
   ```bash
   git add components/admin/ app/
   git commit -m "refactor(admin): extract AdminNotesEditor to shared component [Epic 5 Admin]"
   ```
8. **JANGAN push dulu** — wait Gate 2 regression verify

## Jangan

- **JANGAN** duplicate — create `SupplierNotesEditor.tsx` yang copy-paste (R-53 anti-pattern)
- **JANGAN** commit refactor terpisah dari import update — split commit bikin revert susah kalau regression
- **JANGAN** refactor sambil "sekalian cleanup logic" — scope creep + regression risk
- **JANGAN** hilangkan debounce / on-blur logic — R-56 & Epic 4B AR-09 semantics
- **JANGAN** ubah error handling (toast pattern) — konsisten dengan Epic 4B UX

## Verifikasi

- [ ] File moved ke `components/admin/shared/`
- [ ] Prop `endpoint` added (kalau belum ada)
- [ ] Consumer `LeadDetailView.tsx` updated pass `endpoint`
- [ ] Grep verify no old imports
- [ ] TypeScript compile clean
- [ ] Commit atomic done
- [ ] Belum push — wait Gate 2

---

# 🛑 STOP GATE 2 — Regression Test Epic 4B Lead Detail (CRITICAL)

**Status:** Menunggu Jazil manual regression test Epic 4B lead detail auto-save DI LOCAL sebelum push.

## Aksi Manual yang Jazil Lakukan

**Test ini WAJIB done DI LOCAL sebelum push branch — kalau push dan regression detected di production, discovery = klien lagi manage leads → auto-save gagal → data loss risk.**

### 1. Start Dev Environment Local

```bash
# Terminal 1: backend
cd backend && source .venv/bin/activate
uvicorn main:app --reload

# Terminal 2: frontend
npm run dev
```

### 2. Login Admin Local

Buka `http://localhost:3000/admin/login`, login pakai credentials admin (yang match production akun untuk fetch data).

Alternative: seed local Supabase dengan dummy leads kalau tidak konek production.

### 3. Regression Test Epic 4B Lead Detail

- Navigate ke `/admin/leads` — verify Kanban render
- Klik lead → detail page `/admin/leads/{id}` — verify render normal
- **Type di admin notes textarea** — misalnya "Test regression setelah AdminNotesEditor refactor"
- **Blur textarea** (klik luar)
- Verify:
  - Toast atau visual indicator "Tersimpan" muncul
  - Network tab: PATCH request ke `/rfq/leads/{id}` fire dengan body `{"admin_notes": "..."}`
  - Response: 200 OK
- **Refresh page** — verify notes persist (bukan reset)
- Test edit ulang — type + blur → notes update di DB

### 4. Regression Test Status Update

Bonus verify (bukan langsung related tapi worth check karena LeadDetailView):
- Change status dropdown → save → verify success
- Kalau ada history table di Epic 4B, verify baris baru muncul

### 5. Verify Component Isolation

Buka network tab, test admin notes edit lagi:
- Verify PATCH request tetap ke `/rfq/leads/{id}` (bukan accidentally ke `/supplier/...` karena refactor bug)

## Setelah Gate Ini Clear

- Refactor `AdminNotesEditor` safe
- Push branch lanjut ke Vercel preview

**Kalau clear:**
```bash
git push -u origin feature/epic5-admin-supplier-management
```

## Sinyal Masalah

- **Kalau auto-save tidak trigger** setelah blur → refactor pass prop `endpoint` broken, atau useEffect dependency mismatch. Revert:
  ```bash
  git reset --hard pre-e5adm-editor-refactor
  ```
  Redesign refactor.
- **Kalau PATCH request go ke wrong endpoint** (mis. `/supplier/...` padahal di lead detail) → consumer `LeadDetailView.tsx` pass wrong `endpoint`. Fix.
- **Kalau TypeScript error muncul di runtime** (padahal compile clean) → prop drilling break, cek all usage.
- **Kalau notes not persist after refresh** → PATCH sukses tapi Server Component fetch stale data. Bukan refactor issue, cek `revalidatePath` di Server Action.

---

# PHASE 8 — Frontend Components: StatusBadge, SaltTypesCell, MetadataCard

**Tujuan:** Small reusable components untuk supplier UI. Buat sebelum route pages karena route pages depend on these.

## Kerjakan

1. Buat `components/admin/supplier/StatusBadge.tsx`:
   ```tsx
   import { cn } from '@/lib/utils';
   import type { SupplierStatus } from '@/types/supplier';

   const STATUS_CONFIG: Record<SupplierStatus, { label: string; className: string }> = {
     new: { label: 'Baru', className: 'bg-blue-100 text-blue-800' },
     verified: { label: 'Diverifikasi', className: 'bg-yellow-100 text-yellow-800' },
     active: { label: 'Aktif', className: 'bg-green-100 text-green-800' },
     inactive: { label: 'Tidak Aktif', className: 'bg-neutral-100 text-neutral-700' },
   };

   export function StatusBadge({ status }: { status: SupplierStatus }) {
     const config = STATUS_CONFIG[status];
     return (
       <span
         className={cn(
           'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
           config.className
         )}
       >
         {config.label}
       </span>
     );
   }

   // Export config untuk reuse di StatusPanel dropdown option
   export const SUPPLIER_STATUS_LABELS = STATUS_CONFIG;
   ```
2. Buat `components/admin/supplier/SaltTypesCell.tsx`:
   ```tsx
   // Reuse Base UI Tooltip (bukan Radix — memori project)
   // Kalau project belum ada Tooltip, gunakan native `<span title={...}>` sebagai fallback
   
   const LABEL_MAP: Record<string, string> = {
     kasar_petani: 'Kasar Petani',
     halus_yodium: 'Halus Yodium',
     halus_non_yodium: 'Halus Non-Yodium',
     industri_spo_m: 'Industri (SPO/M)',
     ghpt: 'GHPT',
   };

   export function SaltTypesCell({ types }: { types: string[] }) {
     const labels = types.map((t) => LABEL_MAP[t] || t);

     if (labels.length <= 2) {
       return <span>{labels.join(', ')}</span>;
     }

     const [first, second, ...rest] = labels;
     const fullList = labels.join(', ');
     
     return (
       <span 
         title={fullList} 
         className="underline decoration-dotted cursor-help"
       >
         {first}, {second} +{rest.length} lainnya
       </span>
     );
   }
   ```
3. Buat `components/admin/supplier/MetadataCard.tsx`:
   ```tsx
   import { format, formatDistanceToNow } from 'date-fns';
   import { id as idLocale } from 'date-fns/locale';

   interface Props {
     createdAt: string;
     updatedAt: string;
   }

   export function MetadataCard({ createdAt, updatedAt }: Props) {
     const createdDate = new Date(createdAt);
     const updatedDate = new Date(updatedAt);

     return (
       <div className="bg-neutral-50 border rounded-lg p-4 text-sm space-y-2">
         <div>
           <span className="text-neutral-500">Terdaftar:</span>{' '}
           <span title={format(createdDate, 'PPpp', { locale: idLocale })}>
             {format(createdDate, 'd MMM yyyy', { locale: idLocale })}
           </span>
         </div>
         <div>
           <span className="text-neutral-500">Update terakhir:</span>{' '}
           <span title={format(updatedDate, 'PPpp', { locale: idLocale })}>
             {formatDistanceToNow(updatedDate, { locale: idLocale, addSuffix: true })}
           </span>
         </div>
       </div>
     );
   }
   ```
4. Verify `date-fns` installed:
   ```bash
   npm list date-fns
   # Kalau tidak ada (likely already installed from Epic 4B):
   # npm install date-fns
   ```
5. Local test render manual — mount di test page atau Storybook kalau ada.

## Jangan

- **JANGAN** hardcode label map di 2 tempat (SaltTypesCell + di halaman lain) — extract ke shared kalau di-reuse
- **JANGAN** pakai `moment.js` — deprecated, `date-fns` pilihan project
- **JANGAN** pakai Radix Tooltip — Base UI atau native `<span title>` (memori project)

## Verifikasi

- [ ] 3 components created
- [ ] TypeScript compile clean
- [ ] Local render works

---

# PHASE 9 — Frontend Route `/admin/suppliers` (List View)

**Tujuan:** Route list + `SupplierTable` + `FilterPanel`.

## Kerjakan

1. Buat `components/admin/supplier/SupplierTable.tsx`:
   ```tsx
   import Link from 'next/link';
   import { Eye } from 'lucide-react';
   import { formatDistanceToNow } from 'date-fns';
   import { id as idLocale } from 'date-fns/locale';
   import { StatusBadge } from './StatusBadge';
   import { SaltTypesCell } from './SaltTypesCell';
   import type { Supplier } from '@/types/supplier';

   export function SupplierTable({ suppliers }: { suppliers: Supplier[] }) {
     if (suppliers.length === 0) {
       return (
         <div className="text-center py-16 space-y-4">
           <div className="text-neutral-400 text-lg">
             Tidak ada supplier match filter
           </div>
           <Link href="/admin/suppliers" className="text-blue-600 hover:underline">
             Reset filter
           </Link>
         </div>
       );
     }

     return (
       <div className="overflow-x-auto">
         <table className="w-full text-sm">
           <thead className="bg-neutral-50 border-b">
             <tr>
               <Th>Nama Usaha</Th>
               <Th>Lokasi</Th>
               <Th>Jenis Garam</Th>
               <Th>Kapasitas</Th>
               <Th>Status</Th>
               <Th>Daftar</Th>
               <Th className="text-right">Aksi</Th>
             </tr>
           </thead>
           <tbody>
             {suppliers.map((s) => <SupplierRow key={s.id} supplier={s} />)}
           </tbody>
         </table>
       </div>
     );
   }

   function SupplierRow({ supplier }: { supplier: Supplier }) {
     const capacityFmt = new Intl.NumberFormat('id-ID').format(supplier.capacity_per_month);

     return (
       <tr className="border-b hover:bg-neutral-50 transition">
         <Td>
           <Link
             href={`/admin/suppliers/${supplier.id}`}
             className="font-medium text-neutral-900 hover:text-blue-600"
           >
             {supplier.business_name}
           </Link>
         </Td>
         <Td>{supplier.location_city}, {supplier.location_province}</Td>
         <Td>
           <SaltTypesCell types={supplier.salt_types_available} />
         </Td>
         <Td>{capacityFmt} {supplier.capacity_unit}</Td>
         <Td>
           <StatusBadge status={supplier.status} />
         </Td>
         <Td className="text-neutral-500 text-xs">
           {formatDistanceToNow(new Date(supplier.created_at), {
             locale: idLocale,
             addSuffix: true,
           })}
         </Td>
         <Td className="text-right">
           <Link
             href={`/admin/suppliers/${supplier.id}`}
             aria-label={`Lihat detail ${supplier.business_name}`}
             className="inline-flex p-2 rounded hover:bg-neutral-100"
           >
             <Eye className="w-4 h-4" />
           </Link>
         </Td>
       </tr>
     );
   }

   function Th({ children, className }: { children: React.ReactNode; className?: string }) {
     return (
       <th className={`text-left px-4 py-3 font-semibold text-neutral-700 ${className || ''}`}>
         {children}
       </th>
     );
   }

   function Td({ children, className }: { children: React.ReactNode; className?: string }) {
     return <td className={`px-4 py-3 ${className || ''}`}>{children}</td>;
   }
   ```
2. Buat `components/admin/supplier/FilterPanel.tsx`:
   ```tsx
   'use client';

   import { useRouter, usePathname, useSearchParams } from 'next/navigation';
   import { useEffect, useState } from 'react';
   import { Search, X } from 'lucide-react';
   import type { SupplierStatus } from '@/types/supplier';

   const STATUS_OPTIONS: { value: SupplierStatus | 'all'; label: string }[] = [
     { value: 'all', label: 'Semua Status' },
     { value: 'new', label: 'Baru' },
     { value: 'verified', label: 'Diverifikasi' },
     { value: 'active', label: 'Aktif' },
     { value: 'inactive', label: 'Tidak Aktif' },
   ];

   export function FilterPanel() {
     const router = useRouter();
     const pathname = usePathname();
     const searchParams = useSearchParams();

     const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');
     const currentStatus = searchParams.get('status') || 'all';

     // Debounce search 300ms (R-58)
     useEffect(() => {
       const timer = setTimeout(() => {
         updateParam('search', searchValue || null);
       }, 300);
       return () => clearTimeout(timer);
       // eslint-disable-next-line react-hooks/exhaustive-deps
     }, [searchValue]);

     function updateParam(key: string, value: string | null) {
       const params = new URLSearchParams(searchParams);
       if (value) {
         params.set(key, value);
       } else {
         params.delete(key);
       }
       router.push(`${pathname}?${params.toString()}`);
     }

     const hasActiveFilter = searchParams.toString().length > 0;

     return (
       <div className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-neutral-50 p-4 rounded">
         <div className="relative flex-1 w-full md:max-w-md">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
           <input
             type="text"
             placeholder="Cari nama usaha atau lokasi..."
             value={searchValue}
             onChange={(e) => setSearchValue(e.target.value)}
             className="pl-10 pr-4 py-2 w-full border rounded"
           />
         </div>

         <select
           value={currentStatus}
           onChange={(e) => updateParam('status', e.target.value === 'all' ? null : e.target.value)}
           className="border rounded px-3 py-2"
         >
           {STATUS_OPTIONS.map((opt) => (
             <option key={opt.value} value={opt.value}>{opt.label}</option>
           ))}
         </select>

         {hasActiveFilter && (
           <button
             onClick={() => {
               setSearchValue('');
               router.push(pathname);
             }}
             className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900"
           >
             <X className="w-4 h-4" />
             Reset
           </button>
         )}
       </div>
     );
   }
   ```
3. Buat `app/admin/suppliers/page.tsx`:
   ```tsx
   import { listSuppliers } from '@/lib/api/supplier';
   import { SupplierTable } from '@/components/admin/supplier/SupplierTable';
   import { FilterPanel } from '@/components/admin/supplier/FilterPanel';
   import type { SupplierStatus } from '@/types/supplier';

   export const dynamic = 'force-dynamic';  // AR-11 task breakdown

   interface Props {
     searchParams: Promise<{
       status?: string;
       search?: string;
     }>;
   }

   export default async function SuppliersListPage({ searchParams }: Props) {
     const params = await searchParams;

     // R-58 validate status defense in depth
     const validStatus: SupplierStatus | undefined =
       params.status && ['new', 'verified', 'active', 'inactive'].includes(params.status)
         ? (params.status as SupplierStatus)
         : undefined;

     const { suppliers, total } = await listSuppliers({
       status: validStatus,
       search: params.search,
     });

     return (
       <div className="space-y-6">
         <div>
           <h1 className="text-2xl font-bold text-neutral-900">Manajemen Supplier</h1>
           <p className="text-sm text-neutral-500 mt-1">
             {total} supplier terdaftar
           </p>
         </div>
         <FilterPanel />
         <SupplierTable suppliers={suppliers} />
       </div>
     );
   }
   ```
4. Local test:
   - Buka `/admin/suppliers` local
   - Verify tabel render dengan 3 dummy supplier
   - Filter status "Baru" → tabel filter
   - Search "jawa" → tabel filter
   - Reset → tabel full

## Jangan

- **JANGAN** skip validate `status` di Server Component (R-58) — defense in depth
- **JANGAN** lupa `Promise<{...}>` di searchParams type — Next.js 15 breaking change
- **JANGAN** pakai `getServerSession` explicit di page — middleware sudah auth guard `/admin/*` (Epic 1)
- **JANGAN** hardcode dummy fetch fallback — kalau `listSuppliers` throw, biarkan error boundary handle

## Verifikasi

- [ ] Page render dengan tabel + filter panel
- [ ] Filter status URL sync
- [ ] Search debounce 300ms works
- [ ] Reset filter clean URL

---

# PHASE 10 — Frontend Route `/admin/suppliers/[id]` (Detail View)

**Tujuan:** Route detail + `SupplierDetailView` + `SupplierInfoCard`.

## Kerjakan

1. Buat `components/admin/supplier/SupplierInfoCard.tsx`:
   ```tsx
   import type { Supplier } from '@/types/supplier';

   const SALT_LABEL_MAP: Record<string, string> = {
     kasar_petani: 'Kasar Petani',
     halus_yodium: 'Halus Yodium',
     halus_non_yodium: 'Halus Non-Yodium',
     industri_spo_m: 'Industri (SPO/M)',
     ghpt: 'GHPT',
   };

   const UNIT_LABEL_MAP: Record<string, string> = {
     ton: 'Ton',
     kwintal: 'Kwintal',
     kg: 'Kg',
   };

   function formatWhatsApp(raw: string): string {
     // +6281234567890 → +62 812-3456-7890
     const match = raw.match(/^\+62(\d{3})(\d{4})(\d+)$/);
     if (!match) return raw;
     return `+62 ${match[1]}-${match[2]}-${match[3]}`;
   }

   export function SupplierInfoCard({ supplier }: { supplier: Supplier }) {
     const saltTypes = supplier.salt_types_available
       .map((t) => SALT_LABEL_MAP[t] || t)
       .join(', ');
     const capacityFmt = new Intl.NumberFormat('id-ID').format(supplier.capacity_per_month);

     return (
       <div className="bg-white border rounded-lg p-6 space-y-6">
         <Section title="Informasi Usaha">
           <Field label="Nama Usaha" value={supplier.business_name} />
           <Field label="Lokasi" value={`${supplier.location_city}, ${supplier.location_province}`} />
         </Section>

         <Section title="Produk Garam">
           <Field label="Jenis Garam" value={saltTypes} />
           <Field
             label="Kapasitas"
             value={`${capacityFmt} ${UNIT_LABEL_MAP[supplier.capacity_unit] || supplier.capacity_unit} / bulan`}
           />
         </Section>

         <Section title="Kontak">
           <Field label="WhatsApp" value={formatWhatsApp(supplier.whatsapp)} />
           <Field label="Email" value={supplier.email || '-'} />
           <Field label="Keterangan" value={supplier.additional_notes || '-'} multiline />
         </Section>
       </div>
     );
   }

   function Section({ title, children }: { title: string; children: React.ReactNode }) {
     return (
       <div>
         <h3 className="font-semibold text-neutral-700 mb-3 pb-2 border-b">{title}</h3>
         <div className="space-y-2">{children}</div>
       </div>
     );
   }

   function Field({ label, value, multiline }: {
     label: string; value: string; multiline?: boolean;
   }) {
     return (
       <div className={multiline ? 'space-y-1' : 'flex gap-2'}>
         <span className="text-sm text-neutral-500 min-w-[100px]">{label}</span>
         <span className={`text-sm text-neutral-900 ${multiline ? 'whitespace-pre-wrap' : ''}`}>
           {value}
         </span>
       </div>
     );
   }
   ```
2. Buat `components/admin/supplier/SupplierDetailView.tsx` (skeleton — akan lengkap di Phase 11-12):
   ```tsx
   import Link from 'next/link';
   import { StatusBadge } from './StatusBadge';
   import { SupplierInfoCard } from './SupplierInfoCard';
   import { MetadataCard } from './MetadataCard';
   import { AdminNotesEditor } from '@/components/admin/shared/AdminNotesEditor';  // reuse Epic 4B (Phase 7 refactor)
   // Import phase-11-12 components at those phases
   import { SupplierStatusPanel } from './SupplierStatusPanel';
   import { SupplierWATemplateButton } from './SupplierWATemplateButton';
   import type { Supplier } from '@/types/supplier';

   export function SupplierDetailView({ supplier }: { supplier: Supplier }) {
     return (
       <div className="space-y-6">
         {/* Breadcrumb */}
         <nav className="text-sm text-neutral-500">
           <Link href="/admin/suppliers" className="hover:text-neutral-900">
             Supplier
           </Link>
           <span className="mx-2">/</span>
           <span className="text-neutral-900">{supplier.business_name}</span>
         </nav>

         {/* Page header */}
         <div className="flex items-center gap-3">
           <h1 className="text-2xl font-bold">{supplier.business_name}</h1>
           <StatusBadge status={supplier.status} />
         </div>

         {/* 2-col layout */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 space-y-6">
             <SupplierInfoCard supplier={supplier} />
             <AdminNotesEditor
               resourceId={supplier.id}
               initialValue={supplier.admin_notes}
               endpoint={`/supplier/${supplier.id}`}
             />
           </div>

           <div className="space-y-6">
             <SupplierStatusPanel
               supplierId={supplier.id}
               currentStatus={supplier.status}
             />
             <SupplierWATemplateButton
               supplierId={supplier.id}
               currentStatus={supplier.status}
               whatsapp={supplier.whatsapp}
               businessName={supplier.business_name}
             />
             <MetadataCard
               createdAt={supplier.created_at}
               updatedAt={supplier.updated_at}
             />
           </div>
         </div>
       </div>
     );
   }
   ```
3. Buat `app/admin/suppliers/[id]/page.tsx`:
   ```tsx
   import { notFound } from 'next/navigation';
   import { getSupplier } from '@/lib/api/supplier';
   import { SupplierDetailView } from '@/components/admin/supplier/SupplierDetailView';

   export const dynamic = 'force-dynamic';

   interface Props {
     params: Promise<{ id: string }>;
   }

   export default async function SupplierDetailPage({ params }: Props) {
     const { id } = await params;

     try {
       const supplier = await getSupplier(id);
       return <SupplierDetailView supplier={supplier} />;
     } catch (err: any) {
       if (err?.status === 404) notFound();
       throw err;  // Let error boundary handle
     }
   }
   ```
4. Buat `app/admin/suppliers/error.tsx`:
   ```tsx
   'use client';

   import { useEffect } from 'react';
   import * as Sentry from '@sentry/nextjs';
   import Link from 'next/link';
   import { buttonVariants } from '@/components/ui/button';
   import { cn } from '@/lib/utils';

   export default function SuppliersError({
     error,
     reset,
   }: {
     error: Error & { digest?: string };
     reset: () => void;
   }) {
     useEffect(() => {
       Sentry.captureException(error, {
         tags: { page: '/admin/suppliers' },
       });
     }, [error]);

     return (
       <div className="min-h-[60vh] flex items-center justify-center px-4">
         <div className="max-w-lg text-center space-y-4">
           <h1 className="text-2xl font-bold">Terjadi kesalahan</h1>
           <p className="text-neutral-600">
             Kami tidak bisa menampilkan halaman ini. Coba refresh atau kembali ke daftar.
           </p>
           <div className="flex gap-2 justify-center">
             <button onClick={reset} className={cn(buttonVariants({ variant: 'default' }))}>
               Coba Lagi
             </button>
             <Link href="/admin/suppliers" className={cn(buttonVariants({ variant: 'outline' }))}>
               Kembali ke Daftar
             </Link>
           </div>
         </div>
       </div>
     );
   }
   ```
5. Local test:
   - Click row di list → navigate ke detail
   - Verify info card render, WhatsApp formatted `+62 812-3456-7890`
   - Verify AdminNotesEditor render dengan initial value
   - `SupplierStatusPanel` + `SupplierWATemplateButton` belum ada → TypeScript error acceptable, fix di Phase 11-12
   - Kalau butuh unblock, stub component sementara:
     ```tsx
     // Temporary stub:
     export function SupplierStatusPanel() { return <div>Status Panel TBD</div>; }
     ```

## Jangan

- **JANGAN** skip breadcrumb — navigation orientation critical untuk admin UX
- **JANGAN** hardcode whatsapp format function inline — extract ke `SupplierInfoCard.tsx` atau `lib/formatters/`
- **JANGAN** lupa 404 handling via `notFound()` — invalid UUID = clean 404 page

## Verifikasi

- [ ] Detail page render dengan info card
- [ ] WhatsApp formatted
- [ ] AdminNotesEditor works (dari Phase 7 refactor)
- [ ] Error boundary catch invalid ID

---

# PHASE 11 — Frontend `SupplierStatusPanel` + Server Action

**Tujuan:** Status update panel + Server Action untuk revalidate.

## Kerjakan

1. Buat `app/actions/supplier.ts`:
   ```typescript
   'use server';

   import { revalidatePath } from 'next/cache';

   export async function revalidateSupplierRoutes() {
     revalidatePath('/admin/suppliers');
     revalidatePath('/admin/suppliers/[id]', 'page');
   }
   ```
2. Buat `components/admin/supplier/SupplierStatusPanel.tsx`:
   ```tsx
   'use client';

   import { useState } from 'react';
   import { toast } from 'sonner';
   import { useRouter } from 'next/navigation';
   import { updateSupplier } from '@/lib/api/supplier';
   import { revalidateSupplierRoutes } from '@/app/actions/supplier';
   import { Button } from '@/components/ui/button';
   import type { SupplierStatus } from '@/types/supplier';

   const STATUS_OPTIONS: { value: SupplierStatus; label: string }[] = [
     { value: 'new', label: 'Baru' },
     { value: 'verified', label: 'Diverifikasi' },
     { value: 'active', label: 'Aktif' },
     { value: 'inactive', label: 'Tidak Aktif' },
   ];

   interface Props {
     supplierId: string;
     currentStatus: SupplierStatus;
   }

   export function SupplierStatusPanel({ supplierId, currentStatus }: Props) {
     const [selectedStatus, setSelectedStatus] = useState<SupplierStatus>(currentStatus);
     const [isSaving, setSaving] = useState(false);
     const router = useRouter();

     const isDirty = selectedStatus !== currentStatus;

     async function handleSave() {
       setSaving(true);
       try {
         await updateSupplier(supplierId, { status: selectedStatus });
         await revalidateSupplierRoutes();
         toast.success('Status berhasil diupdate');
         router.refresh();
       } catch {
         toast.error('Gagal update status');
         setSelectedStatus(currentStatus);  // rollback
       } finally {
         setSaving(false);
       }
     }

     return (
       <div className="bg-white border rounded-lg p-4 space-y-3">
         <h3 className="font-semibold text-neutral-700">Update Status</h3>
         <select
           value={selectedStatus}
           onChange={(e) => setSelectedStatus(e.target.value as SupplierStatus)}
           disabled={isSaving}
           className="w-full border rounded px-3 py-2"
         >
           {STATUS_OPTIONS.map((opt) => (
             <option key={opt.value} value={opt.value}>{opt.label}</option>
           ))}
         </select>
         <Button
           onClick={handleSave}
           disabled={!isDirty || isSaving}
           className="w-full"
         >
           {isSaving ? 'Menyimpan...' : 'Simpan Status'}
         </Button>
       </div>
     );
   }
   ```
3. Local test:
   - Change dropdown → button "Simpan Status" enabled
   - Click save → toast success + `StatusBadge` di header update via `router.refresh()`
   - Simulate error (temporarily set wrong endpoint di local) → rollback dropdown + toast error

## Jangan

- **JANGAN** enable button saat `!isDirty` — noise UX, klien tidak tahu apakah change tersimpan
- **JANGAN** skip rollback logic — kalau save fail, dropdown harus kembali ke current
- **JANGAN** trigger `router.refresh()` sebelum save success — race condition

## Verifikasi

- [ ] Panel render dropdown + button
- [ ] Save success → toast + badge update
- [ ] Error → rollback + toast

---

# PHASE 12 — Frontend `SupplierWATemplateButton` + Modal

**Tujuan:** WA template modal dengan 3 state (loading, ready-with-template, ready-empty).

## Kerjakan

1. Verify `@base-ui-components/react` installed (dari memori project). Kalau tidak:
   ```bash
   npm install @base-ui-components/react
   ```
2. Buat `components/admin/supplier/SupplierWATemplateButton.tsx`:
   ```tsx
   'use client';

   import { useState } from 'react';
   import { Dialog } from '@base-ui-components/react/dialog';
   import { toast } from 'sonner';
   import { MessageSquare, Copy, ExternalLink } from 'lucide-react';
   import { Button } from '@/components/ui/button';
   import { generateSupplierWATemplate } from '@/lib/api/supplier';
   import type { SupplierStatus } from '@/types/supplier';

   interface Props {
     supplierId: string;
     currentStatus: SupplierStatus;
     whatsapp: string;
     businessName: string;
   }

   export function SupplierWATemplateButton({
     supplierId, currentStatus, whatsapp, businessName,
   }: Props) {
     const [isOpen, setOpen] = useState(false);
     const [isLoading, setLoading] = useState(false);
     const [templateText, setTemplateText] = useState('');
     const [waNumberClean, setWaNumberClean] = useState('');

     async function handleOpen() {
       setOpen(true);
       setLoading(true);
       try {
         const result = await generateSupplierWATemplate({
           supplier_id: supplierId,
           status: currentStatus,
         });
         setTemplateText(result.template);
         setWaNumberClean(result.whatsapp_number);
       } catch {
         toast.error('Gagal load template');
         setTemplateText('');
       } finally {
         setLoading(false);
       }
     }

     function handleCopy() {
       navigator.clipboard.writeText(templateText);
       toast.success('Teks disalin');
     }

     function handleOpenWA() {
       const url = `https://wa.me/${waNumberClean}?text=${encodeURIComponent(templateText)}`;
       window.open(url, '_blank', 'noopener,noreferrer');
     }

     return (
       <>
         <Button variant="outline" onClick={handleOpen} className="w-full">
           <MessageSquare className="w-4 h-4 mr-2" />
           Buat Pesan WA
         </Button>

         <Dialog.Root open={isOpen} onOpenChange={setOpen}>
           <Dialog.Portal>
             <Dialog.Backdrop className="fixed inset-0 bg-black/50 z-40" />
             <Dialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto z-50">
               <Dialog.Title className="text-lg font-semibold mb-2">
                 Template Pesan WhatsApp
               </Dialog.Title>
               <Dialog.Description className="text-sm text-neutral-600 mb-4">
                 Untuk: {businessName} · Status: {currentStatus}
               </Dialog.Description>

               {isLoading ? (
                 <div className="py-8 text-center text-neutral-500">
                   Menyiapkan template...
                 </div>
               ) : templateText === '' && !isLoading ? (
                 <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-900">
                   Tidak ada template untuk status "{currentStatus}". Ketik pesan manual di textarea.
                 </div>
               ) : null}

               <textarea
                 value={templateText}
                 onChange={(e) => setTemplateText(e.target.value)}
                 rows={12}
                 className="w-full border rounded p-3 font-sans text-sm"
                 placeholder="Ketik pesan..."
                 disabled={isLoading}
               />

               <div className="flex gap-2 mt-4 justify-end">
                 <Button
                   variant="outline"
                   onClick={handleCopy}
                   disabled={!templateText}
                 >
                   <Copy className="w-4 h-4 mr-2" />
                   Salin Teks
                 </Button>
                 <Button onClick={handleOpenWA} disabled={!templateText}>
                   <ExternalLink className="w-4 h-4 mr-2" />
                   Buka di WhatsApp
                 </Button>
               </div>
             </Dialog.Popup>
           </Dialog.Portal>
         </Dialog.Root>
       </>
     );
   }
   ```
3. Local test dengan 4 skenario:
   - **Status `new`** — modal open, template terisi dengan `{business_name}` replaced
   - **Status `verified`** — template beda content
   - **Status `active`** — template beda content
   - **Status `inactive`** — modal show info kuning "Tidak ada template", textarea kosong, tapi bisa ketik manual
4. Test "Salin Teks" → paste ke text editor → verify content
5. Test "Buka di WhatsApp" → new tab `wa.me/62xxx?text=...` open

## Jangan

- **JANGAN** pakai Radix Dialog — Base UI (memori project)
- **JANGAN** skip 3-state handling (loading, ready-with, ready-empty) — status inactive lah edge case
- **JANGAN** allow "Buka di WhatsApp" saat `templateText === ''` — user click button = wa.me dengan empty message, awkward
- **JANGAN** hardcode `wa.me/xxx` — pakai `waNumberClean` yang dari backend (cleaned format)

## Verifikasi

- [ ] 4 status skenario render correct
- [ ] Copy + Open WA work
- [ ] Modal close via backdrop click atau ESC
- [ ] `noopener,noreferrer` di window.open (security best practice)

---

# PHASE 13 — Sidebar Nav Update + Final Component Wiring

**Tujuan:** Add "Supplier" nav item di sidebar, verify all components wired.

## Kerjakan

1. **BACA** file sidebar config — kemungkinan `components/admin/Sidebar.tsx` atau `lib/config/admin-nav.ts` (dari Epic 1 UX-06).
2. Identify nav items array structure.
3. **APPEND** entry setelah "Leads & RFQ" (task breakdown AR-12):
   ```tsx
   import { Store } from 'lucide-react';
   
   // ...
   {
     label: 'Supplier',
     href: '/admin/suppliers',
     icon: Store,
   }
   // ...
   ```
4. **Posisi:** setelah "Leads & RFQ" (Epic 4B), sebelum "Produk" (Epic 3B) — verify visual di sidebar.
5. Active state highlight — verify pathname matcher works untuk `/admin/suppliers*` (both list dan detail):
   ```tsx
   const isActive = pathname.startsWith(item.href);
   ```
6. Verify Phase 10 `SupplierDetailView` sekarang complete — remove stub imports kalau masih ada.
7. Local test full flow:
   - Click "Supplier" sidebar → navigate to list
   - Sidebar item highlighted
   - Click row → detail
   - Sidebar item still highlighted (pathname startsWith match)
8. Commit Phase 6-13:
   ```bash
   git add app/ components/ types/ lib/
   git commit -m "feat(supplier): admin panel frontend complete [Epic 5 Admin]"
   git push
   ```

## Jangan

- **JANGAN** posisi nav di top/bottom sidebar tanpa alasan — logical position between "Leads & RFQ" dan "Produk"
- **JANGAN** pakai icon random — `Store` atau `Package` dari lucide-react (semantic match)
- **JANGAN** lupa remove stub components dari Phase 10 kalau ada

## Verifikasi

- [ ] Sidebar item "Supplier" visible
- [ ] Active state highlight works
- [ ] Full flow list → detail navigable
- [ ] Push done

---

# 🛑 STOP GATE 3 — Full E2E QA + Regression Test

**Status:** Menunggu Jazil manual QA end-to-end di Vercel preview + regression slice sebelumnya.

## Aksi Manual yang Jazil Lakukan

### 1. Verify Vercel Preview URL Ready

Wait Vercel preview build sukses.

### 2. E2E Test #1 — List View + Filter

- Login admin di preview URL
- Navigate ke `/admin/suppliers` via sidebar
- Verify: tabel populated dengan minimum 3 supplier
- Filter status "Baru" → verify subset, URL = `?status=new`
- Search "jawa" → verify filter combined, URL update
- Reset filter → tabel full, URL clean

### 3. E2E Test #2 — Detail View

- Klik row pertama → navigate ke `/admin/suppliers/{id}`
- Verify:
  - Breadcrumb "Supplier / {business_name}"
  - Info card render semua field
  - WhatsApp format `+62 812-3456-7890`
  - Salt types readable label ("Kasar Petani", bukan `kasar_petani`)
  - Kapasitas formatted `50 Ton / bulan`
  - Metadata card show tanggal daftar + last update

### 4. E2E Test #3 — Update Status

- Change dropdown status ke "Diverifikasi" → verify button "Simpan Status" enabled
- Click save
- Verify: toast success + badge di header update ke "Diverifikasi"
- Navigate back ke `/admin/suppliers` → verify tabel row status update
- Return ke detail → confirm persist

### 5. E2E Test #4 — Admin Notes Auto-Save (CRITICAL — cross-slice regression)

- Type di admin notes: "Test QA Epic 5 admin"
- Blur (klik luar)
- Verify: PATCH request fire di network tab (`/supplier/{id}` dengan `admin_notes`)
- Verify: toast atau visual "Tersimpan"
- Refresh page → notes persist
- **CRITICAL REGRESSION** — buka `/admin/leads/{some-id}` → type di notes → blur → verify Epic 4B admin notes still works

### 6. E2E Test #5 — WA Template Modal (4 skenario)

- Update supplier status ke "Baru" (kalau belum) → click "Buat Pesan WA"
- Modal open, template terisi dengan business_name real replaced
- Klik "Salin Teks" → paste ke text editor → verify content
- Klik "Buka di WhatsApp" → new tab `wa.me/62xxx?text=...` (device tanpa WA = browser fallback)
- Close modal, update status ke "Diverifikasi" → click "Buat Pesan WA" → verify template beda
- Update ke "Aktif" → click → beda template
- Update ke "Tidak Aktif" → click → verify info kuning "Tidak ada template" + textarea empty tapi editable

### 7. Regression Test — Epic 5 CF

- Buka `/jadi-supplier` (public)
- Submit form dengan data valid
- Verify: redirect ke `/jadi-supplier/terima-kasih`
- Verify: email admin delivered
- Verify: row baru di `supplier_registrations` dengan status `new`
- Refresh `/admin/suppliers` → verify row baru muncul di list

### 8. Regression Test — Epic 4B Slice 1 + 2

- `/admin/leads` → Kanban render + drag-drop
- Lead detail → auto-save notes, status update, WA modal, generate proposal — semua works

### 9. Regression Test — Epic 4 CF

- `/minta-penawaran` → submit RFQ → email confirmation + admin notif

### 10. Mobile Responsive Test

- DevTools mobile view (375px)
- `/admin/suppliers` → tabel scroll horizontal OR card list (depends on implementation)
- `/admin/suppliers/{id}` → 2-col layout jadi single-col stack
- All action buttons accessible

### 11. Cleanup Test Rows

```sql
DELETE FROM supplier_registrations WHERE business_name LIKE '%Test QA%';
UPDATE supplier_registrations
SET status = 'new', admin_notes = NULL
WHERE business_name IN ('Petani Garam Mandiri', 'CV Garam Sejahtera', 'Koperasi Petani Bali')
  AND admin_notes LIKE '%Test QA%';
```

### 12. Sentry Check

Buka Sentry preview environment (kalau ada) atau shared Sentry — verify no unexpected error dari 60 menit testing.

## Setelah Gate Ini Clear

- Frontend + backend production-ready
- Zero regression di Epic 4 CF, Epic 4B Slice 1+2, Epic 5 CF
- Ready untuk merge ke `main`

## Sinyal Masalah

- **Kalau E2E Test #4 Epic 4B lead notes broken** → R-53 violated. Revert Phase 7 commit + refactor ulang. **JANGAN merge sampai fix.**
- **Kalau WA Template modal 3-state salah** — cek `templateText === ''` condition di Phase 12, verify empty template flow
- **Kalau filter URL sync broken** — cek `useSearchParams` + `router.push` di FilterPanel

---

# PHASE 14 — Merge ke `dev` → Production Deploy

**Tujuan:** Merge, deploy production, tag release, verify.

## Kerjakan

1. Merge ke `dev`:
   ```bash
   git checkout dev
   git pull
   git merge feature/epic5-admin-supplier-management --no-ff
   git push
   ```
2. Verify Vercel + Railway `dev` auto-deploy sukses.
3. Smoke test di `dev` — repeat 3-4 E2E test dari Gate 3.
4. Merge `dev` ke `main`:
   ```bash
   git checkout main
   git pull
   git merge dev --no-ff
   git push
   ```
5. Verify production deploy sukses.
6. **Post-production smoke test:**
   - Login admin production, buka `/admin/suppliers`
   - Test 1 supplier update (change + save + rollback ke original)
   - Test WA template modal 1 status
   - Verify no error di production Sentry
7. Tag release:
   ```bash
   git tag epic5-admin-live
   git tag epic5-fully-closed  # Epic 5 lengkap (CF + Admin)
   git push --tags
   ```
8. Update `epic5_execution_log.md`:
   ```markdown
   ## Epic 5 Admin Panel — Production Live
   
   - Tanggal deploy: ...
   - Release tag: epic5-admin-live
   - Regression Epic 4B + Epic 5 CF: ✅ pass
   - Cross-slice AdminNotesEditor refactor: ✅ verified no regression
   - Epic 5 fully closed: ✅
   ```

## Jangan

- **JANGAN** skip smoke test di `dev` sebelum merge ke `main`
- **JANGAN** lupa tag `epic5-fully-closed` — milestone marker penting

## Verifikasi

- [ ] Merge sukses
- [ ] Production deploy verified
- [ ] Post-production smoke test pass
- [ ] Release tags pushed
- [ ] Execution log updated

---

# 🛑 STOP GATE 4 — Client Demo + Epic 5 Fully Closed

**Status:** Menunggu Jazil setup demo dengan klien.

## Aksi Manual yang Jazil Lakukan

### 1. Setup Meeting (30 menit)

Schedule dengan klien (Irwan Sugianto atau POC).

### 2. Konteks (2 menit)

> "Slice sebelumnya kita launch form pendaftaran supplier public. Sekarang saya launch admin panel supaya Anda bisa manage semua supplier yang mendaftar — filter, update status, WA template — tanpa perlu buka database lagi."

### 3. Live Demo — List View (5 menit)

- Sidebar → "Supplier" (klien tunjuk sendiri)
- Tunjukkan tabel dengan supplier existing
- Demo filter status "Baru"
- Demo search "jawa timur"
- Explain URL bisa di-share untuk filter tertentu

### 4. Live Demo — Detail View (5 menit)

- Klik row
- Tunjukkan semua field render terpusat
- WhatsApp formatted readable
- Salt types dalam label human-readable

### 5. Live Demo — Status Update (3 menit)

- Change status dropdown ke "Diverifikasi"
- Klik simpan → tunjukkan badge update
- Navigate back ke list → status update tercermin

### 6. Live Demo — Admin Notes (3 menit)

- Type note: "Sudah konfirmasi lewat WA 15 Jan 2027, siap kirim sample minggu depan"
- Blur → auto-save
- Refresh → note persist

### 7. Live Demo — WA Template Modal (5 menit)

- Klik "Buat Pesan WA"
- Tunjukkan template pre-filled dengan nama supplier
- Klik "Buka di WhatsApp" → new tab dengan pesan ready-to-send
- Explain untuk status "Tidak Aktif" tidak ada template (bisa ketik manual)

### 8. Explain Handover ke Epic 6 (2 menit)

- Epic 5 fully closed
- Next: Epic 6 (Artikel + Kalkulator Garam)
- Timeline: TBD dengan klien

### 9. Rollback Demo Data

```sql
-- Cleanup notes dari demo
UPDATE supplier_registrations
SET admin_notes = NULL, status = 'new'
WHERE admin_notes LIKE '%konfirmasi lewat WA%';
```

### 10. Sign-Off

Klien konfirmasi:
- [ ] List view UX acceptable
- [ ] Detail view lengkap
- [ ] Status update flow smooth
- [ ] Admin notes berguna
- [ ] WA template content acceptable untuk 3 status
- [ ] Epic 5 fully closed → ready untuk Epic 6

Documentasikan sign-off di `epic5_execution_log.md`.

## Setelah Gate Ini Clear

- Epic 5 fully closed
- Klien sign-off collected
- Ready untuk Epic 6

## Sinyal Masalah

- Kalau klien komplain content WA template — adjust di enhancement (edit `WA_TEMPLATES_SUPPLIER` dict, redeploy dalam hari sama)
- Kalau klien request field baru di detail view (mis. "tampilkan tanggal kontak terakhir") — evaluate scope. Kalau butuh DB migration, enhancement 1-2 hari. Kalau computed dari existing data, ~2 jam.
- Kalau klien merasa need Kanban untuk supplier setelah melihat leads Kanban — reference R-57 rationale, tapi collect usage data 1-2 bulan sebelum reject definitively

---

# Kontingensi & Troubleshooting

## Situasi: AdminNotesEditor regression detected setelah production merge

1. **Immediate revert:**
   ```bash
   git checkout main
   git revert HEAD  # revert merge commit
   git push
   ```
2. Vercel + Railway auto re-deploy revert version
3. Verify Epic 4B lead notes works again
4. Debug refactor di local:
   - `git diff pre-e5adm-editor-refactor components/admin/shared/AdminNotesEditor.tsx`
   - Verify prop signature match consumer expectation
5. Fix + re-test di local + Gate 2 rigorous sebelum re-merge

## Situasi: WA Template service extend break Epic 4B WA modal

Similar pattern:
1. Revert
2. Debug `git diff pre-e5adm-wa-service-extend backend/services/wa_template_service.py`
3. Kemungkinan cause:
   - Rename konstanta `WA_TEMPLATES` tanpa update reference
   - Modify function signature
   - Import order break
4. Fix append-only pattern strict + regression test

## Situasi: Filter URL sync broken di production

1. Cek Sentry frontend errors
2. Common cause: `useSearchParams` return null saat SSR — wrap dengan `Suspense` boundary di Next.js 15
3. Fix di `app/admin/suppliers/page.tsx`:
   ```tsx
   import { Suspense } from 'react';
   
   export default function Page(props: Props) {
     return (
       <Suspense fallback={<div>Loading...</div>}>
         <SuppliersListPage {...props} />
       </Suspense>
     );
   }
   ```

## Situasi: Klien komplain "tabel supplier lambat load"

1. Cek supplier count: `SELECT COUNT(*) FROM supplier_registrations;`
2. Kalau > 100, likely R-55 threshold reached earlier than expected
3. Immediate mitigation: add server-side pagination
   - Backend: `Query(limit: int = 50)` + `Query(offset: int = 0)`
   - Frontend: pagination UI di list view
4. Effort ~1 hari

## Situasi: WA number di production broken (link wa.me tidak buka WhatsApp)

1. Debug `waNumberClean` format:
   - Should be: `6281234567890` (no +, no spaces, no dashes)
   - Kalau format salah → cek backend `re.sub` di endpoint
2. Test manual: `https://wa.me/6281234567890` di browser — should redirect ke WhatsApp
3. Kalau supplier WA raw di DB salah (mis. tidak ter-normalize dari Epic 5 CF) — data cleanup:
   ```sql
   UPDATE supplier_registrations 
   SET whatsapp = REGEXP_REPLACE(whatsapp, '^0', '+62')
   WHERE whatsapp LIKE '0%';
   ```

## Situasi: PATCH extra field lolos (whitelist tidak enforce)

1. Verify `model_config = ConfigDict(extra='forbid')` di `SupplierUpdateRequest`
2. Test manual: curl dengan extra field → should return 422
3. Kalau lolos: Pydantic version issue atau import salah. Update dependency + retest.

## Situasi: Klien minta bulk operations (bulk activate, bulk delete)

1. Ini beyond MVP scope (task breakdown framing)
2. Evaluate use case:
   - Bulk activate: klien punya batch supplier yang perlu status update sekaligus?
   - Bulk delete: reject — pakai bulk set status `inactive` sebagai substitute
3. Kalau real use case, enhancement dengan spec dulu (mirror Epic 4B admin operations pattern)

---

# Ringkasan File Slice Ini

**Backend baru:**
- Tidak ada file baru — semua APPEND ke file existing

**Backend edited (append discipline R-52 + R-54):**
- `backend/schemas/supplier.py` — append 5 model admin
- `backend/routers/supplier.py` — append 4 endpoint admin
- `backend/services/wa_template_service.py` — append 3 supplier templates + function

**Frontend baru:**
- `app/admin/suppliers/page.tsx`
- `app/admin/suppliers/[id]/page.tsx`
- `app/admin/suppliers/error.tsx`
- `app/actions/supplier.ts`
- `components/admin/supplier/StatusBadge.tsx`
- `components/admin/supplier/SaltTypesCell.tsx`
- `components/admin/supplier/MetadataCard.tsx`
- `components/admin/supplier/SupplierTable.tsx`
- `components/admin/supplier/FilterPanel.tsx`
- `components/admin/supplier/SupplierInfoCard.tsx`
- `components/admin/supplier/SupplierDetailView.tsx`
- `components/admin/supplier/SupplierStatusPanel.tsx`
- `components/admin/supplier/SupplierWATemplateButton.tsx`

**Frontend refactored (R-53 cross-slice):**
- `components/admin/lead/AdminNotesEditor.tsx` → `components/admin/shared/AdminNotesEditor.tsx` (moved + generic-ized)
- `components/admin/lead/LeadDetailView.tsx` — update import + pass `endpoint` prop

**Frontend edited:**
- `types/supplier.ts` — append 5 admin types
- `lib/api/supplier.ts` — append 4 API functions
- `components/admin/Sidebar.tsx` (atau nav config) — append "Supplier" nav item

**Docs:**
- `docs/wireframes/Epic5_admin_supplier-list.md` (dari task breakdown)
- `docs/epic-breakdown/epic5_execution_log.md` (updated)

---

## Catatan Penutup

### 1. R-53 (AdminNotesEditor refactor discipline) adalah gate paling risky

Cross-slice refactor bukan "sekalian rapikan code". Ini production live component yang Epic 4B klien pakai sehari-hari. Kalau refactor break, discovery = klien lagi manage lead pipeline → notes gagal auto-save → data loss.

Gate 2 khusus untuk verify regression **DI LOCAL sebelum push**. Kalau tergoda push tanpa test "toh cuma minor refactor" — stop. Refactor di sebelum production dengan test rigorous = insurance yang murah.

Alternative kalau refactor terlalu berisiko: create `SupplierNotesEditor` sebagai duplicate + TODO refactor future. Accept tech debt eksplisit lebih baik daripada rushed regression.

### 2. R-54 (WA Template service extend) similar discipline

Pattern append-only + namespace prefix + regression test. Konsisten dengan R-52 (email service Epic 5 CF).

Kalau existing `WA_TEMPLATES` (tanpa suffix) — rename dulu jadi `WA_TEMPLATES_LEADS` untuk konvensi konsistensi, TAPI **jangan rename function `generate_wa_template`** — Epic 4B router memanggilnya, rename = break Epic 4B.

Discipline: konstanta boleh di-rename (private), function public tidak boleh (public API).

### 3. R-56 (No status history) sengaja beda dari Epic 4B

Godaan besar: "Epic 4B punya status history, sekalian bikin di supplier biar konsisten." **Jangan.**

- Supplier lifecycle beda dari lead pipeline
- Data supplier stable → history overkill MVP
- Complexity budget better di-invest ke fitur lain

Kalau klien nanti minta audit trail, enhancement dengan justification usage.

### 4. R-57 (Tabel bukan Kanban) similar reasoning

Klien mungkin lihat Kanban di Epic 4B leads dan tanya "kenapa supplier tidak Kanban?". Explain rationale:
- Kanban = pipeline flow visualization (status berubah frequent)
- Supplier = master data (status berubah bulan-bulanan)
- Beda tool untuk beda konteks bisnis, bukan inconsistency

Kalau klien insist, propose eksperimen: usage data 1-2 bulan. Kalau klien actively move supplier antar status > 3x/minggu, worth explore. Kalau tidak (kemungkinan besar), tabel confirmed correct.

### 5. R-58 (Filter URL sync) reuse pattern

FilterPanel pattern konsisten dengan Epic 4B — bukan karena lazy, tapi karena **konsistensi UX admin**. Kalau list view supplier filter behavior beda dari list view leads, klien akan bingung. Reuse pattern reduce cognitive load klien saat operate 2 module.

### 6. Handover ke Epic 6 harus clean

Setelah Epic 5 admin live, verify:
- Klien acknowledge Epic 5 fully closed
- No pending change request yang kritis
- Klien punya bandwidth untuk review Epic 6 spec (Artikel + Kalkulator)

Kalau klien overwhelmed dengan Epic 4 + Epic 5 features yang baru (kombinasi 6+ new admin pages sejak Epic 4B), consider "adoption pause" 1-2 minggu sebelum start Epic 6. Klien mastering fitur > shipping fitur baru.

Ini bukan technical concern, tapi product concern. Sensitif dengan bandwidth klien.

### 7. Zero cross-slice ke CF, but heavy cross-slice ke Epic 4B admin

Menarik untuk observed: Slice ini secara UI tidak touch customer-facing sama sekali. Tapi backend + frontend admin components heavily depend on Epic 4B pattern. Ini bukan risk per se, tapi awareness — Epic 4B admin adalah "backbone" untuk admin operations di project ini.

Kalau di future Epic 4B admin di-refactor major, propagate impact ke Epic 5 admin. Documentasikan dependency di `docs/architecture/admin-shared-components.md` (create kalau belum ada).

---

**File:** `docs/execution-guides/CLAUDE_CODE_GUIDE_epic5_admin_supplier-management.md`
**Version:** 1.0 — {tanggal generate}
**Author:** Ach. Jazilul Qutbi
