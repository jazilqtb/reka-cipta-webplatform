# Epic 5 Task Breakdown — Manajemen Supplier (Admin Panel)

**Project:** reka-cipta-platform
**Epic:** Epic 5 — Pendaftaran Supplier
**Scope Dokumen:** Bagian **B. CRM / Admin Panel** — Single Slice
**Version:** 1.0
**Author:** Ach. Jazilul Qutbi
**Status:** Draft — menunggu review sebelum eksekusi
**Depends on:** Epic 1, Epic 2 (semua), Epic 3B (pattern admin CRUD), Epic 4 CF, **Epic 4B Slice 1 (WAJIB — reuse pattern LeadDetailView, AdminNotesEditor, WATemplateModal, sidebar nav)**, **Epic 5 CF (WAJIB — supply `supplier_registrations` table)**
**Blocks:** Epic 6 (Artikel + Kalkulator)

---

## Konteks Slice

Setelah Epic 5 Customer-Facing live, calon supplier bisa mendaftar dan admin dapat notifikasi email. Tapi admin masih harus **manual query database Supabase** untuk lihat detail supplier — anti-pattern operasional yang sama dengan gap antara Epic 4 CF dan Epic 4B Slice 1.

Epic 5 Admin Panel melengkapi loop:
- **List view** `/admin/suppliers` — tabel supplier dengan filter status + search
- **Detail view** `/admin/suppliers/[id]` — data lengkap + update status + admin notes + WA template modal untuk follow-up

Setelah Slice ini live, klien bisa manage supplier lifecycle end-to-end tanpa buka DB.

## Framing MVP vs Post-MVP

Berbeda dengan Epic 4B admin panel yang di-split 3 slice (CRM Pipeline + Proposal Generator + Advanced), Epic 5 Admin Panel **cukup single slice** karena scope-nya lebih modest:

| Feature | Include MVP? | Rasional |
|---|---|---|
| List view supplier dengan filter + search | ✅ MVP | Core value — replace manual DB query |
| Detail view + read-only display | ✅ MVP | Klien butuh lihat data supplier terpusat |
| Update status (4 status: new → verified → active → inactive) | ✅ MVP | Klien butuh track lifecycle supplier |
| Admin notes auto-save | ✅ MVP | Reuse pattern dari Epic 4B, negligible effort |
| WA template modal untuk 3 status | ✅ MVP | Reuse pattern dari Epic 4B |
| Kanban view untuk supplier | ❌ Skip | Supplier ≠ sales pipeline, status jarang berpindah |
| Status history table | ❌ Skip | Supplier data lebih stable dari lead, historical tracking overkill MVP |
| Bulk operations (bulk activate, bulk export) | ❌ Post-MVP | Speculative — expected volume rendah |
| Editable WA template UI | ❌ Post-MVP | Konsisten dengan Epic 4B Slice 3 pattern |
| Supplier notification via WA otomatis | ❌ Post-MVP | Admin masih trigger manual via wa.me link |
| Pagination | ❌ Skip untuk MVP | Expected < 100 supplier tahun pertama; simple full-list acceptable |

**Justifikasi single-slice:**
- ~27 task total, comparable size dengan Epic 4B Slice 1 tanpa Kanban complexity
- No AI integration
- No cross-slice touch besar (cuma sidebar nav update)
- Split further = overhead > effort execute

---

## Prasyarat Teknis

- [ ] Epic 5 CF live: `supplier_registrations` table populated dengan minimal 3-5 dummy supplier
- [ ] Epic 4B Slice 1 pattern reference sudah live: `LeadDetailView`, `AdminNotesEditor`, `WATemplateModal`, `StatusPanel` — akan di-adapt untuk supplier
- [ ] Middleware auth Epic 1 active untuk `/admin/*`
- [ ] Pattern `apiFetch` dengan `auth: true` (Epic 3B) working
- [ ] Sidebar admin (Epic 1 UX-06) sudah punya struktur untuk add nav item baru
- [ ] `company_settings` table populated (untuk context WA template)
- [ ] Klien konfirmasi WA template content untuk 3 status (`new`, `verified`, `active`)

---

## Keputusan Arsitektur Slice

### AR-01 — List View: Tabel, Bukan Kanban

Berbeda dengan Epic 4B Slice 1 (leads Kanban). Rasional:

| Aspek | Leads (Epic 4B) | Suppliers (Epic 5) |
|---|---|---|
| Lifecycle | Sales pipeline — status berpindah frekuen (new → contacted → negotiation → deal/lost dalam hari/minggu) | Master data — status transitions jarang (bisa berbulan-bulan di status `active`) |
| Volume | Puluhan-ratusan leads bulanan | Belasan supplier per tahun awal |
| Interaksi utama | Move card antar column (drag-drop) | View data + occasional status change + follow-up WA |
| Visual overview | Butuh Kanban untuk cepat lihat pipeline health | Butuh tabel untuk sortable + searchable master list |

Kanban untuk supplier = **overengineering untuk use case yang tidak match**. Tabel dengan filter + search adalah UX yang tepat.

**Konsekuensi:** tidak install `@dnd-kit` lagi (sudah di project dari Epic 4B, tapi tidak dipakai di slice ini).

### AR-02 — Reuse Pattern dari Epic 4B Slice 1

Component pattern yang di-adapt (bukan reuse langsung karena schema beda):

| Epic 4B Slice 1 Component | Epic 5 Admin Adaptation | Adaptation Reason |
|---|---|---|
| `LeadDetailView` | `SupplierDetailView` | Field berbeda (supplier vs lead schema) |
| `AdminNotesEditor` | **Reuse langsung** | Field `admin_notes` semantics identik |
| `StatusPanel` | `SupplierStatusPanel` | 4 status vs 6 status, no history table (AR-05) |
| `WATemplateModal` | **Reuse pattern, adapt data source** | Modal shell sama, template content beda |
| `revalidateLeadRoutes` (Server Action) | `revalidateSupplierRoutes` (Server Action) | Path revalidate beda |

**JANGAN** create abstraction premature (mis. `<GenericAdminNotesEditor>` polymorphic). Reuse `AdminNotesEditor` as-is dengan `endpoint` prop yang generic. Kalau nanti butuh 3rd resource dengan `admin_notes`, baru refactor.

### AR-03 — Status Transitions: Free (No State Machine)

Konsisten dengan Epic 4B AR-08. MVP tidak enforce transisi valid (mis. tidak boleh `inactive` → `verified`). Klien bisa pilih status bebas via dropdown.

**Konsekuensi:** Data histori bisa aneh secara business logic, tapi acceptable untuk MVP. State machine dengan allowed transitions matrix = enhancement future.

### AR-04 — WA Template: Hardcoded 3 Template

Konsisten dengan Epic 4B AR-05. Template hardcoded di `backend/services/wa_template_service.py` — extend existing service, jangan create module baru.

**3 template (bukan 4):**
- `new` — Konfirmasi penerimaan pendaftaran + info langkah selanjutnya (verifikasi)
- `verified` — Info data sedang diverifikasi + request dokumen tambahan (foto lokasi, sample produk)
- `active` — Selamat bergabung sebagai mitra + info proses pembelian pertama

**Status `inactive` tidak ada template.** Rasional:
- Transisi ke `inactive` biasanya karena supplier tidak responsif atau tidak match kualitas — situasi yang klien handle offline / no follow-up
- Kalau klien butuh template untuk offboarding, tambahkan post-MVP

Editability via admin settings di-defer ke Post-MVP (konsisten dengan Epic 4B Slice 3 pattern).

### AR-05 — No Status History Table untuk Supplier

Berbeda dengan Epic 4B Slice 1 yang punya `lead_status_history` table + trigger auto-log. Rasional:

- Supplier status transitions **jarang** (data lebih stable dari lead)
- Historical audit trail overkill untuk MVP — kalau audit dibutuhkan, `updated_at` sudah cukup untuk track kapan last change
- Complexity budget better di-invest ke fitur lain (mis. filter, search)

**Konsekuensi:** UI detail supplier **tidak ada** history table section. `SupplierStatusPanel` cuma dropdown + save button, tanpa history log.

Enhancement future kalau klien mau audit trail: tambah `supplier_status_history` table (mirror Epic 4B DB-01 pattern), backfill kosong (start from adoption date), UI history section di detail view.

### AR-06 — Admin Notes Auto-Save Debounced On-Blur

Reuse pattern Epic 4B AR-09 langsung. `AdminNotesEditor` component pass ke supplier context via `endpoint` prop:

```tsx
<AdminNotesEditor
  resourceId={supplier.id}
  initialValue={supplier.admin_notes}
  endpoint={`/supplier/${supplier.id}`}
/>
```

Component internal handle debounce + on-blur + PATCH call.

### AR-07 — Auth Guard All Admin Endpoints

Semua endpoint di router `/supplier` (selain `POST /supplier/register` yang public untuk Epic 5 CF) WAJIB `Depends(get_current_user)`. Konsisten dengan Epic 4B AR-07.

**Router struktur:**
- `POST /supplier/register` — PUBLIC (dari Epic 5 CF, sudah ada)
- `GET /supplier` — AUTH
- `GET /supplier/{id}` — AUTH
- `PATCH /supplier/{id}` — AUTH
- `POST /supplier/wa-template` — AUTH

**Consequence naming:** router file existing dari Epic 5 CF = `backend/routers/supplier.py`. Tambah endpoint di file yang sama, jangan create `supplier_admin.py` — endpoint prefix sama (`/supplier`), split file bikin discovery lebih susah.

### AR-08 — Pagination: Skip untuk MVP

Expected volume supplier < 100 dalam tahun pertama. Full-list fetch di single API call acceptable. Pagination = premature optimization.

**Threshold reconsider:** kalau supplier count > 200, add pagination via `?limit=50&offset=0`. Enhancement, bukan MVP concern.

**Konsekuensi:** endpoint `GET /supplier` return semua rows dalam 1 response. Kalau performance issue muncul dari klien di production, ini sinyal untuk implement pagination.

### AR-09 — Filter State: URL Query Params (Konsisten Epic 4B)

Filter status + search query = URL params supaya:
- Shareable (admin bisa kirim link "supplier dengan status verified" via WA ke rekan)
- Refresh-safe
- Back-button navigation works

Pattern reuse dari Epic 4B `FilterPanel`:
- `/admin/suppliers?status=verified&search=jawa+timur`
- Kalau param kosong, omit dari URL (`/admin/suppliers` = default all)

### AR-10 — Delete Supplier: Tidak Ada di MVP

Endpoint `DELETE /supplier/{id}` di-declare di RLS (Epic 5 CF DB-02) tapi **tidak ada UI action** untuk delete.

Rasional:
- Delete supplier = destructive action, klien mungkin regret kalau accidental
- Alternative: set status ke `inactive` untuk "hide" tanpa loss data
- Kalau klien benar-benar mau permanent delete, do via Supabase Dashboard (with admin awareness)

Enhancement future: soft-delete pattern dengan `deleted_at` column + confirm modal.

### AR-11 — Rendering Strategy

- `/admin/suppliers` — **Dynamic** (dynamic route, data fetch every request via `cookies()` — auth-gated, tidak bisa static)
- `/admin/suppliers/[id]` — **Dynamic** (same reason)

Konsisten dengan Epic 4B admin routes.

### AR-12 — Sidebar Nav Naming

Sidebar nav item: **"Supplier"** (bukan "Manajemen Supplier" atau "Daftar Supplier"). Rasional:
- Konsisten dengan pattern "Leads & RFQ" (Epic 4B) — noun langsung, tidak verbose
- Icon `Store` atau `Package` dari `lucide-react`
- Posisi: setelah "Leads & RFQ", sebelum "Produk"

---

## Ringkasan Task per Layer

| Layer | Task Count | Fokus |
|---|---|---|
| UX | 5 | Wireframe list + detail + spec komponen |
| US | 4 | 4 user story utama |
| Backend | 5 | Schemas + 4 endpoints + WA template extend |
| Contract | 1 | Types + lib/api |
| Frontend | 10 | Route list + route detail + komponen + sidebar |
| QA | 5 | E2E + filter + notes + WA + demo |

**Total: 30 task.** Estimasi effort: 3-5 hari kerja (lebih ringan dari Epic 4B Slice 1 yang 33 task karena tidak ada Kanban drag-drop + tidak ada status history).

---

## Layer 1 — UX Tasks

### E5-ADM-UX-01 — Wireframe `/admin/suppliers` (List View)

**Priority:** P0 · **Tags:** `wireframe` `admin`

**Deliverable:** `docs/wireframes/Epic5_admin_supplier-list.md`

**Struktur wireframe:**
```
┌──────────────────────────────────────────────────────────────┐
│  <AdminLayout>                                               │
│    <Sidebar>...Supplier (active)...</Sidebar>                │
│    <MainContent>                                             │
│      <PageHeader title="Manajemen Supplier"                  │
│        subtitle="{total} supplier terdaftar" />              │
│                                                              │
│      <FilterPanel>                                           │
│        [Search bar: nama usaha / kota ▼]                     │
│        [Status filter: Semua ▼]                              │
│        [Reset Filter]                                        │
│      </FilterPanel>                                          │
│                                                              │
│      <SupplierTable>                                         │
│      ┌─────────────────────────────────────────────────────┐│
│      │Nama Usaha│Lokasi │Jenis Garam │Kapasitas│Status│Aksi││
│      ├─────────────────────────────────────────────────────┤│
│      │Petani X  │Pmk,JT │Kasar Ptn+2 │50 ton   │[Baru]│[👁]││
│      │CV Y      │Sbn,JT │Halus Yodium│100 ton  │[Aktif]│[👁]││
│      │...       │       │            │         │      │    ││
│      └─────────────────────────────────────────────────────┘│
│                                                              │
│      Kalau result kosong:                                    │
│      [ Ilustrasi + "Tidak ada supplier match filter"        │
│        + tombol Reset Filter                    ]           │
│    </MainContent>                                            │
│  </AdminLayout>                                              │
└──────────────────────────────────────────────────────────────┘
```

**Badge status warna (konsisten dengan spec Epic Doc):**

| Status | Label | Warna Badge |
|---|---|---|
| `new` | Baru | Biru (`bg-blue-100 text-blue-800`) |
| `verified` | Diverifikasi | Kuning (`bg-yellow-100 text-yellow-800`) |
| `active` | Aktif | Hijau (`bg-green-100 text-green-800`) |
| `inactive` | Tidak Aktif | Abu (`bg-neutral-100 text-neutral-700`) |

**Kolom tabel (7 kolom):**
1. Nama Usaha (klik → detail)
2. Lokasi (format: "Kota, Provinsi")
3. Jenis Garam (kalau > 2, tampilkan "Kasar Petani +2 lainnya" dengan tooltip full list)
4. Kapasitas (format: "50 ton" — combine capacity + unit)
5. Status (badge)
6. Tanggal Daftar (relatif: "3 hari lalu", tooltip absolute date)
7. Aksi (icon eye → link ke detail)

**Responsive:**
- Desktop: full table 7 kolom
- Mobile (< 768px): table jadi card list, tiap card show name + location + status + jenis garam pertama + kapasitas, action full card click ke detail

**Verifikasi:** Wireframe committed.

---

### E5-ADM-UX-02 — Wireframe `/admin/suppliers/[id]` (Detail)

**Priority:** P0 · **Tags:** `wireframe` `admin`

**Deliverable:** Section di file wireframe yang sama.

**Struktur:**
```
┌──────────────────────────────────────────────────────────────┐
│  <AdminLayout>                                               │
│    <Sidebar>...Supplier (active)...</Sidebar>                │
│    <MainContent>                                             │
│      <Breadcrumb>Supplier / {business_name}</Breadcrumb>     │
│                                                              │
│      <PageHeader>                                            │
│        {business_name}    [Status Badge]                     │
│        Daftar {relative_date}                                │
│      </PageHeader>                                           │
│                                                              │
│      <TwoColLayout>                                          │
│        <LeftCol span="2/3">                                  │
│          <SupplierInfoCard>                                  │
│            <Section title="Informasi Usaha">                 │
│              Nama Usaha  : {business_name}                   │
│              Lokasi      : {city}, {province}                │
│            </Section>                                        │
│            <Section title="Produk Garam">                    │
│              Jenis Garam : {salt_types_readable}             │
│              Kapasitas   : {capacity} {unit}/bulan           │
│            </Section>                                        │
│            <Section title="Kontak">                          │
│              WhatsApp    : {whatsapp_formatted}              │
│              Email       : {email or "-"}                    │
│              Keterangan  : {additional_notes or "-"}         │
│            </Section>                                        │
│          </SupplierInfoCard>                                 │
│                                                              │
│          <AdminNotesEditor                                   │
│            resourceId={supplier.id}                          │
│            initialValue={supplier.admin_notes}               │
│            endpoint="/supplier/{id}"                         │
│          />                                                  │
│        </LeftCol>                                            │
│                                                              │
│        <RightCol span="1/3">                                 │
│          <SupplierStatusPanel                                │
│            currentStatus={supplier.status}                   │
│            supplierId={supplier.id}                          │
│          />                                                  │
│                                                              │
│          <WATemplateButton                                   │
│            supplierId={supplier.id}                          │
│            currentStatus={supplier.status}                   │
│            whatsapp={supplier.whatsapp}                      │
│          />                                                  │
│                                                              │
│          <MetadataCard>                                      │
│            Terdaftar : {created_at absolute}                 │
│            Updated   : {updated_at relative}                 │
│          </MetadataCard>                                     │
│        </RightCol>                                           │
│      </TwoColLayout>                                         │
│    </MainContent>                                            │
│  </AdminLayout>                                              │
└──────────────────────────────────────────────────────────────┘
```

**Perbedaan dengan Epic 4B Slice 1 `/admin/leads/[id]`:**
- **Tidak ada** `StatusHistoryTable` (AR-05)
- **Tidak ada** `ProposalGeneratorPanel` (Epic 5 tidak ada proposal untuk supplier)

**Responsive:**
- Desktop: 2-col layout (2/3 kiri, 1/3 kanan)
- Mobile: single-col stack, status panel + WA button + metadata di top (biar action ready-hand), lalu info card + notes

**Verifikasi:** Wireframe committed.

---

### E5-ADM-UX-03 — Spec Component `SupplierTable` + `SupplierRow`

**Priority:** P0 · **Tags:** `component-spec`

**Deliverable:** Section spec di wireframe.

**`SupplierTable` (Server Component):**
- Terima props `suppliers: Supplier[]`
- Render `<thead>` + map ke `<SupplierRow>` per supplier
- Empty state kalau `suppliers.length === 0`: ilustrasi + text + reset filter button
- **Bukan Client Component** — tidak butuh interaktivitas (row click ditangani `<Link>`)

**`SupplierRow` (Server Component):**
- Terima props `supplier: Supplier`
- Render 7 kolom sesuai UX-01
- Nama usaha wrapped di `<Link href="/admin/suppliers/{id}">` — klik row navigate
- Salt types: kalau > 2, render "{first} +{n-1} lainnya" dengan `<Tooltip>` (dari Base UI) untuk full list
- Kapasitas: format `Intl.NumberFormat('id-ID')` (mis. `1.000 ton`)
- Tanggal daftar: `formatDistanceToNow(date, { locale: id, addSuffix: true })` — pakai `date-fns`

**Mobile responsive:**
- CSS: `hidden md:table-row` di `<tr>` desktop, `flex md:hidden` di alternate card layout
- Atau: satu component yang render conditionally berbasis Tailwind class

**Verifikasi:** Section spec committed.

---

### E5-ADM-UX-04 — Spec `FilterPanel` untuk Supplier

**Priority:** P0 · **Tags:** `component-spec` `client-component`

**Deliverable:** Section spec.

**Behavior:**
- Client Component (`'use client'`) — pakai `useRouter` + `useSearchParams`
- Search input:
  - Placeholder: "Cari nama usaha atau lokasi..."
  - Debounce 300ms sebelum update URL (avoid every keystroke = re-render)
  - Icon search di kiri
- Status filter dropdown:
  - Opsi: Semua, Baru, Diverifikasi, Aktif, Tidak Aktif (dengan color dot indicator)
  - Default: Semua
- Reset button:
  - Muncul kalau ada filter aktif
  - Klik → clear URL query params → navigate ke `/admin/suppliers`

**URL sync logic:**
```typescript
const searchParams = useSearchParams();
const router = useRouter();
const pathname = usePathname();

function updateFilter(key: string, value: string | null) {
  const params = new URLSearchParams(searchParams);
  if (value) {
    params.set(key, value);
  } else {
    params.delete(key);
  }
  router.push(`${pathname}?${params.toString()}`);
}
```

**Pattern reuse dari Epic 4B `FilterPanel`** — adapt untuk 2 filter (search + status) instead of 4 (Epic 4B ada industry + date range).

---

### E5-ADM-UX-05 — Spec `SupplierWATemplateModal`

**Priority:** P0 · **Tags:** `component-spec` `client-component` `modal`

**Deliverable:** Section spec.

**Behavior:**
- Client Component, pakai Base UI `<Dialog>` (bukan Radix)
- Trigger: button "Buat Pesan WA" di detail page
- On open:
  1. Fetch template via `POST /supplier/wa-template` dengan body `{ supplier_id, status: currentStatus }`
  2. Show loading spinner selama fetch
  3. Populate textarea dengan `template` field dari response
- Textarea editable (admin bisa tweak template sebelum kirim)
- Bottom buttons:
  - **"Salin Teks"** — copy to clipboard, toast "Teks disalin"
  - **"Buka di WhatsApp"** — buka `https://wa.me/{whatsapp_number}?text={encodeURIComponent(edited_template)}` di new tab

**Modal states:**
1. **Loading** — spinner + "Menyiapkan template..."
2. **Ready** — textarea + 2 button aktif
3. **Error fetch** — pesan "Gagal load template" + retry button
4. **Empty template (edge case)** — kalau backend return string kosong (mis. status = `inactive` yang tidak ada template), tampilkan info "Tidak ada template untuk status ini. Ketik pesan manual di textarea."

**Pattern reuse dari Epic 4B `WATemplateModal`** — adapt data source dari `/rfq/wa-template` ke `/supplier/wa-template`.

**JANGAN** duplicate modal component secara literal. Refactor kalau reasonable (mis. jadikan `<WATemplateModal>` accept `endpoint` prop). Tapi kalau schema response berbeda cukup signifikan, create adaptation.

---

## Layer 2 — User Stories

### E5-ADM-US-01 — Admin View & Filter Supplier List

**As** admin CV Reka Cipta yang tanggung jawab supplier onboarding,
**I want** melihat semua supplier terdaftar dalam 1 tabel dengan kemampuan filter status dan search,
**So that** saya bisa cepat identify supplier yang butuh follow-up tanpa scroll manual.

**Acceptance:**
- Buka `/admin/suppliers` → tabel populated dengan semua supplier
- Filter status: pilih "Baru" → tabel filter ke supplier `status = 'new'`
- Search "jawa timur" → tabel filter supplier yang `location_city` atau `location_province` atau `business_name` contain match (case-insensitive)
- Filter + search combinable
- URL update saat filter change (shareable link)
- Kalau result kosong, empty state jelas dengan reset filter option

---

### E5-ADM-US-02 — Admin View Detail Supplier

**As** admin yang mau follow-up supplier baru,
**I want** melihat detail lengkap supplier dalam 1 halaman terpusat,
**So that** saya punya semua context (kontak, kapasitas, keterangan) sebelum menghubungi via WhatsApp.

**Acceptance:**
- Klik row di list → navigate ke `/admin/suppliers/{id}`
- Halaman render semua field: nama usaha, lokasi, jenis garam, kapasitas, kontak, keterangan
- WhatsApp number formatted readable (`+62 812-3456-7890`)
- Salt types displayed dengan label human-readable (bukan `kasar_petani` raw value)
- Kalau field opsional kosong, tampilkan `-` bukan blank

---

### E5-ADM-US-03 — Admin Update Status Supplier

**As** admin yang sudah verifikasi supplier via WhatsApp,
**I want** update status supplier dari "Baru" ke "Diverifikasi",
**So that** saya track lifecycle supplier tanpa buka DB.

**Acceptance:**
- Panel status di detail page: dropdown 4 opsi + tombol "Simpan Status"
- Klik "Simpan Status" → PATCH request ke `/supplier/{id}`
- Success → toast "Status berhasil diupdate" + badge di header update
- Error → toast merah + status tidak berubah (rollback UI)
- Free transitions (AR-03) — bisa move ke status apa pun tanpa validation

---

### E5-ADM-US-04 — Admin Generate WA Follow-Up Template

**As** admin yang mau follow-up supplier baru,
**I want** click 1 tombol untuk dapat template WA yang sudah pre-filled dengan nama supplier,
**So that** saya tidak perlu manual ketik pesan yang sama tiap follow-up.

**Acceptance:**
- Button "Buat Pesan WA" di detail page → open modal
- Modal load template dari backend sesuai `status` current
- Template pre-fill dengan `business_name` dan `location_city`
- Textarea editable — admin bisa tweak sebelum kirim
- Klik "Buka di WhatsApp" → buka `wa.me/{cleaned_number}?text={encoded}` di new tab
- Kalau status = `inactive`, modal tampilkan info "Tidak ada template" + textarea kosong (bisa ketik manual)

---

## Layer 3 — Engineering

### 3a. Database

**Catatan:** Tabel `supplier_registrations` sudah dibuat di Epic 5 CF DB-01. **Tidak ada migration baru** di slice admin panel ini — schema sudah cukup untuk cover admin use case.

Kalau nanti di enhancement tambah `supplier_status_history` (AR-05), migration di-add di slice terpisah.

---

### 3b. Backend

#### E5-ADM-BE-01 — Pydantic Schemas Extend

**Priority:** P0 · **Tags:** `backend` `schema`

**File:** `backend/schemas/supplier.py` (extend dari Epic 5 CF)

**Konten baru:**
```python
from datetime import datetime

class Supplier(BaseModel):
    """Full supplier data untuk admin."""
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
    """Whitelist untuk PATCH — hanya status dan admin_notes."""
    model_config = ConfigDict(extra='forbid')

    status: str | None = None
    admin_notes: str | None = None

    @field_validator('status')
    def validate_status(cls, v: str | None) -> str | None:
        if v is not None and v not in {'new', 'verified', 'active', 'inactive'}:
            raise ValueError(f"Invalid status: {v}")
        return v


class SupplierListResponse(BaseModel):
    suppliers: list[Supplier]
    total: int


class SupplierWATemplateRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    supplier_id: str
    status: str


class SupplierWATemplateResponse(BaseModel):
    template: str
    whatsapp_number: str  # cleaned untuk wa.me (tanpa +)
```

**Verifikasi:**
- Import `Supplier` di router tidak error
- Test PATCH dengan `{status: "verified"}` → validate pass
- Test PATCH dengan `{status: "hacked"}` → 422
- Test PATCH dengan `{status: "verified", email: "x@y.z"}` → 422 (extra field forbidden — email tidak boleh di-update via admin panel)

---

#### E5-ADM-BE-02 — Router `GET /supplier` (List dengan Filter + Search)

**Priority:** P0 · **Tags:** `backend` `router` `auth`

**File:** `backend/routers/supplier.py` (extend)

**Konten:**
```python
from fastapi import Query

@router.get(
    "",
    response_model=SupplierListResponse,
    dependencies=[Depends(get_current_user)],
)
async def list_suppliers(
    status: str | None = Query(None),
    search: str | None = Query(None),
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
```

**Verifikasi (curl test):**
```bash
# No filter
curl "${API_URL}/supplier" -H "Authorization: Bearer $TOKEN"

# Filter status
curl "${API_URL}/supplier?status=new" -H "Authorization: Bearer $TOKEN"

# Search
curl "${API_URL}/supplier?search=pamekasan" -H "Authorization: Bearer $TOKEN"

# Combined
curl "${API_URL}/supplier?status=active&search=jawa" -H "Authorization: Bearer $TOKEN"
```

---

#### E5-ADM-BE-03 — Router `GET /supplier/{id}` (Detail)

**Priority:** P0 · **Tags:** `backend` `router`

**Konten:**
```python
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
```

**Perbedaan dari Epic 4B Slice 1 BE-03:**
- Tidak ada history table fetch (AR-05)
- Response = `Supplier` langsung, bukan `SupplierDetailResponse` wrapper

---

#### E5-ADM-BE-04 — Router `PATCH /supplier/{id}` (Update Status/Notes)

**Priority:** P0 · **Tags:** `backend` `router` `whitelist`

**Konten:**
```python
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

**Konsistensi dengan Epic 4B BE-04:**
- Whitelist enforcement via `extra='forbid'` di schema
- `exclude_none=True` supaya PATCH partial (bisa update status only, atau notes only)
- Return updated resource langsung (bukan re-fetch)

**Verifikasi:**
- PATCH dengan `{status: "verified"}` → 200 + updated
- PATCH dengan `{admin_notes: "test"}` → 200 + updated
- PATCH dengan `{business_name: "hack"}` → 422 (extra field forbidden)
- PATCH dengan `{}` → 422 (no fields)

---

#### E5-ADM-BE-05 — Router `POST /supplier/wa-template` + Service Extend

**Priority:** P0 · **Tags:** `backend` `router` `wa`

**File:** `backend/routers/supplier.py` (extend)

**Router:**
```python
from ..services.wa_template_service import generate_supplier_wa_template
import re

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
    # supplier.whatsapp sudah normalized ke +62xxx dari Epic 5 CF BE-01
    # wa.me expect format tanpa + (mis. 6281234567890)
    whatsapp_clean = re.sub(r'[\s\-+()]', '', supplier['whatsapp'])

    return SupplierWATemplateResponse(
        template=template,
        whatsapp_number=whatsapp_clean,
    )
```

**Service extend (`backend/services/wa_template_service.py`):**
```python
# Existing dari Epic 4B (leads templates):
# WA_TEMPLATES_LEADS = {...}
# def generate_wa_template(lead, status): ...

# NEW untuk supplier:
SALT_TYPES_LABEL_MAP = {
    'kasar_petani': 'Kasar Petani',
    'halus_yodium': 'Halus Yodium',
    'halus_non_yodium': 'Halus Non-Yodium',
    'industri_spo_m': 'Industri (SPO/M)',
    'ghpt': 'GHPT',
}

def _readable_salt_types(salt_types: list[str]) -> str:
    labels = [SALT_TYPES_LABEL_MAP.get(t, t) for t in salt_types]
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
}


def generate_supplier_wa_template(supplier: dict, status: str) -> str:
    """Generate WA template string untuk supplier.

    Return empty string kalau status tidak ada template (mis. 'inactive').
    """
    template = WA_TEMPLATES_SUPPLIER.get(status)
    if not template:
        return ""  # AR-04: inactive tidak ada template

    return template.format(
        business_name=supplier['business_name'],
        location_city=supplier['location_city'],
        location_province=supplier['location_province'],
        salt_types_readable=_readable_salt_types(supplier['salt_types_available']),
        capacity_per_month=supplier['capacity_per_month'],
        capacity_unit=supplier['capacity_unit'],
    )
```

**Catatan pattern:**
- Extend service Epic 4B, jangan create module baru. Same file, split by resource via naming (`WA_TEMPLATES_LEADS` vs `WA_TEMPLATES_SUPPLIER`).
- Kalau di future ada resource ke-3 (mis. articles), refactor jadi module-per-resource.
- Return empty string untuk status yang tidak ada template — frontend handle edge case (UX-05).

**Verifikasi:**
- POST dengan `{supplier_id, status: "new"}` → template terisi, `{business_name}` replaced
- POST dengan `{supplier_id, status: "inactive"}` → template kosong string
- POST dengan supplier_id invalid → 404

---

### 3c. Contract

#### E5-ADM-CT-01 — Types + `lib/api`

**Priority:** P0 · **Tags:** `contract` `types`

**File:** `types/supplier.ts` (extend dari Epic 5 CF)

```typescript
// Existing dari Epic 5 CF:
// export interface SupplierRegisterInput { ... }
// export interface SupplierRegisterResponse { ... }

// NEW untuk admin:

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

**File:** `lib/api/supplier.ts` (extend)

```typescript
// Existing: registerSupplier

// NEW admin functions:
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

**Verifikasi:** TypeScript compile, no `any` types.

---

### 3d. Frontend List View

#### E5-ADM-FE-01 — Route `app/admin/suppliers/page.tsx`

**Priority:** P0 · **Tags:** `frontend` `page` `dynamic` `server-component`

**File:** `app/admin/suppliers/page.tsx`

```tsx
import { listSuppliers } from '@/lib/api/supplier';
import { SupplierTable } from '@/components/admin/supplier/SupplierTable';
import { FilterPanel } from '@/components/admin/supplier/FilterPanel';
import { PageHeader } from '@/components/admin/PageHeader';
import type { SupplierStatus } from '@/types/supplier';

export const dynamic = 'force-dynamic';  // AR-11

interface Props {
  searchParams: Promise<{
    status?: string;
    search?: string;
  }>;
}

export default async function SuppliersListPage({ searchParams }: Props) {
  const params = await searchParams;

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
      <PageHeader
        title="Manajemen Supplier"
        subtitle={`${total} supplier terdaftar`}
      />
      <FilterPanel />
      <SupplierTable suppliers={suppliers} />
    </div>
  );
}
```

**Catatan:**
- `searchParams` di Next.js 15 = Promise (breaking change dari v14), harus di-await
- Validate `status` value sebelum pass ke API — defense in depth
- Server Component fetch — token diambil dari cookies via `apiFetch` internal (pattern Epic 3B)

---

#### E5-ADM-FE-02 — Component `SupplierTable` + `SupplierRow`

**Priority:** P0 · **Tags:** `frontend` `component` `server-component`

**File:** `components/admin/supplier/SupplierTable.tsx`

```tsx
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { StatusBadge } from './StatusBadge';
import { SalttypesCell } from './SaltTypesCell';
import type { Supplier } from '@/types/supplier';

interface Props {
  suppliers: Supplier[];
}

export function SupplierTable({ suppliers }: Props) {
  if (suppliers.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="text-neutral-400 text-lg">
          Tidak ada supplier match filter
        </div>
        <Link
          href="/admin/suppliers"
          className="text-blue-600 hover:underline"
        >
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
          {suppliers.map((s) => (
            <SupplierRow key={s.id} supplier={s} />
          ))}
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
        <SalttypesCell types={supplier.salt_types_available} />
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

**Verifikasi:**
- Populate dengan 3 supplier → tabel render correct
- Empty state test dengan filter yang tidak match

---

#### E5-ADM-FE-03 — Component `StatusBadge`

**Priority:** P0 · **Tags:** `frontend` `component`

**File:** `components/admin/supplier/StatusBadge.tsx`

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
```

**Catatan:** Config map exportable — bisa di-reuse di `SupplierStatusPanel` dropdown option render.

---

#### E5-ADM-FE-04 — Component `SaltTypesCell`

**Priority:** P0 · **Tags:** `frontend` `component`

**File:** `components/admin/supplier/SaltTypesCell.tsx`

```tsx
import { Tooltip } from '@/components/ui/tooltip'; // Base UI

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
  return (
    <Tooltip content={labels.join(', ')}>
      <span className="underline decoration-dotted cursor-help">
        {first}, {second} +{rest.length} lainnya
      </span>
    </Tooltip>
  );
}
```

**Verifikasi:**
- 1 type: render single label
- 2 types: comma-separated
- 3+ types: "A, B +N lainnya" dengan tooltip full list

---

#### E5-ADM-FE-05 — Component `FilterPanel`

**Priority:** P0 · **Tags:** `frontend` `client-component`

**File:** `components/admin/supplier/FilterPanel.tsx`

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

  // Debounce search
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

**Verifikasi:**
- Type di search → 300ms delay → URL update
- Change dropdown → URL update immediate
- Reset button → URL clean

---

### 3e. Frontend Detail View

#### E5-ADM-FE-06 — Route `app/admin/suppliers/[id]/page.tsx`

**Priority:** P0 · **Tags:** `frontend` `page` `dynamic`

**File:** `app/admin/suppliers/[id]/page.tsx`

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
    throw err;  // Let error.tsx handle
  }
}
```

**Verifikasi:**
- Valid ID → render detail
- Invalid UUID → 404 page
- Server error → error boundary

---

#### E5-ADM-FE-07 — Component `SupplierDetailView`

**Priority:** P0 · **Tags:** `frontend` `component`

**File:** `components/admin/supplier/SupplierDetailView.tsx`

```tsx
import Link from 'next/link';
import { StatusBadge } from './StatusBadge';
import { SupplierInfoCard } from './SupplierInfoCard';
import { SupplierStatusPanel } from './SupplierStatusPanel';
import { SupplierWATemplateButton } from './SupplierWATemplateButton';
import { MetadataCard } from './MetadataCard';
import { AdminNotesEditor } from '@/components/admin/shared/AdminNotesEditor';  // reuse Epic 4B
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

**Catatan reuse `AdminNotesEditor`:**
- Component ini dari Epic 4B Slice 1 FE-10 sudah generic (props `resourceId`, `endpoint`)
- Kalau ternyata belum generic (mis. hardcoded pakai `/rfq/leads/`), **refactor dulu** di Epic 4B code (add `endpoint` prop), lalu import di sini. Ini bukan duplicate — extract-to-shared pattern.
- Move file dari `components/admin/lead/AdminNotesEditor.tsx` → `components/admin/shared/AdminNotesEditor.tsx` (regression risk medium — update import di Epic 4B `LeadDetailView` juga).

**JANGAN** create `SupplierNotesEditor.tsx` yang copy paste dari `AdminNotesEditor.tsx`. Duplicate code = maintenance debt.

---

#### E5-ADM-FE-08 — Component `SupplierInfoCard`

**Priority:** P0 · **Tags:** `frontend` `component`

**File:** `components/admin/supplier/SupplierInfoCard.tsx`

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
  // Input: +6281234567890 → Output: +62 812-3456-7890
  const match = raw.match(/^\+62(\d{3})(\d{4})(\d+)$/);
  if (!match) return raw;
  return `+62 ${match[1]}-${match[2]}-${match[3]}`;
}

export function SupplierInfoCard({ supplier }: { supplier: Supplier }) {
  const saltTypes = supplier.salt_types_available.map((t) => SALT_LABEL_MAP[t] || t).join(', ');
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

---

#### E5-ADM-FE-09 — Component `SupplierStatusPanel`

**Priority:** P0 · **Tags:** `frontend` `client-component`

**File:** `components/admin/supplier/SupplierStatusPanel.tsx`

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

**Verifikasi:**
- Change dropdown → "Simpan Status" enabled
- Click save → toast success + status badge di header update (via `router.refresh()`)
- Simulate 500 error → rollback dropdown ke current status + toast error

---

#### E5-ADM-FE-10 — Component `SupplierWATemplateButton` + Modal

**Priority:** P0 · **Tags:** `frontend` `client-component` `modal`

**File:** `components/admin/supplier/SupplierWATemplateButton.tsx`

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
          <Dialog.Backdrop className="fixed inset-0 bg-black/50" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
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
            ) : templateText === '' ? (
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
            />

            <div className="flex gap-2 mt-4 justify-end">
              <Button variant="outline" onClick={handleCopy} disabled={!templateText}>
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

**Catatan pattern:**
- Pakai Base UI `Dialog` (bukan Radix — dari memori project)
- Handle 3 state: loading, ready-with-template, ready-empty (untuk status `inactive`)
- WA number sudah cleaned dari backend (BE-05), tinggal insert ke `wa.me/{number}?text=...`

**Verifikasi:**
- Click "Buat Pesan WA" → modal open, template load
- Test status = 'new' → template terisi dengan business_name replaced
- Test status = 'inactive' → info "tidak ada template" + textarea empty
- Click "Salin Teks" → clipboard populated, toast
- Click "Buka di WhatsApp" → new tab dengan wa.me URL

---

#### E5-ADM-FE-11 — Component `MetadataCard`

**Priority:** P1 · **Tags:** `frontend` `component`

**File:** `components/admin/supplier/MetadataCard.tsx`

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

---

### 3f. Server Actions + Navigation

#### E5-ADM-FE-12 — Server Action `revalidateSupplierRoutes`

**Priority:** P0 · **Tags:** `frontend` `server-action`

**File:** `app/actions/supplier.ts`

```typescript
'use server';

import { revalidatePath } from 'next/cache';

export async function revalidateSupplierRoutes() {
  revalidatePath('/admin/suppliers');
  revalidatePath('/admin/suppliers/[id]', 'page');
}
```

**Konsisten dengan Epic 4B Slice 1 FE-14 pattern.** Trigger dari status update, notes save, dsb.

---

#### E5-ADM-FE-13 — Update Sidebar Nav "Supplier"

**Priority:** P0 · **Tags:** `frontend` `navigation`

**File:** `components/admin/Sidebar.tsx` (atau file konfigurasi nav items dari Epic 1 UX-06)

Tambah entry:
```tsx
{
  label: 'Supplier',
  href: '/admin/suppliers',
  icon: Store,  // dari lucide-react
}
```

**Posisi:** setelah "Leads & RFQ" (Epic 4B), sebelum "Produk" (Epic 3B).

**Verifikasi:**
- Sidebar render item baru dengan icon
- Active state highlight ketika berada di `/admin/suppliers*`

---

## Layer 4 — QA Tasks

### E5-ADM-QA-01 — E2E Manage Supplier Flow

**Priority:** P0 · **Tags:** `qa` `e2e`

**Prasyarat:** Minimum 3 dummy supplier di DB.

**Steps:**
1. Login admin → navigate ke `/admin/suppliers` via sidebar
2. Verify tabel populated
3. Klik row pertama → navigate ke detail page
4. Verify semua field render correct (name, location, salt types readable, kapasitas formatted, WA formatted)
5. Change status dropdown ke "Diverifikasi" → klik Simpan Status
6. Verify toast success + badge header update
7. Navigate back ke `/admin/suppliers` → verify status column update
8. Return ke detail
9. Klik "Buat Pesan WA" → modal open
10. Verify template pre-filled dengan `{business_name}` real
11. Klik "Buka di WhatsApp" → new tab wa.me dengan text encoded

**Verifikasi:** Semua step pass.

---

### E5-ADM-QA-02 — Filter & Search Test

**Priority:** P0 · **Tags:** `qa` `filter`

**Steps:**
1. Seed 5 supplier dengan status berbeda (2 new, 1 verified, 1 active, 1 inactive)
2. Buka `/admin/suppliers` → 5 rows
3. Filter status "Baru" → 2 rows, URL = `?status=new`
4. Search "jawa" (asumsi ada di lokasi salah satu supplier) → filter ke matching row, URL = `?status=new&search=jawa`
5. Reset filter → 5 rows, URL clean
6. Test invalid status via URL manual (`?status=hacked`) → default all (validation di Server Component)
7. Search debounce: type "a" lalu "b" cepat → hanya 1 URL push setelah 300ms

**Verifikasi:** Semua behavior correct.

---

### E5-ADM-QA-03 — Admin Notes Auto-Save

**Priority:** P0 · **Tags:** `qa` `notes`

**Steps:**
1. Buka detail supplier
2. Type di admin notes textarea: "Test note dari QA"
3. Blur (klik luar textarea) → auto-save trigger
4. Verify toast atau visual indicator "Tersimpan"
5. Refresh page → note persist
6. Test regression: buka detail lead Epic 4B → notes auto-save Masih works (karena `AdminNotesEditor` di-share, R-refactor risk)

**Verifikasi:** Notes auto-save + regression Epic 4B lolos.

---

### E5-ADM-QA-04 — WA Template Test

**Priority:** P0 · **Tags:** `qa` `wa`

**Steps:**
1. Buka detail supplier dengan status "Baru"
2. Klik "Buat Pesan WA" → modal open
3. Verify template terisi dengan `business_name`, `location_city`, `salt_types_readable` real
4. Update status ke "Diverifikasi" → simpan
5. Klik "Buat Pesan WA" → template berubah ke template verified
6. Update status ke "Tidak Aktif" → simpan
7. Klik "Buat Pesan WA" → modal show "Tidak ada template" info + textarea empty
8. Test edit textarea → click "Salin Teks" → paste ke text editor, verify content
9. Test klik "Buka di WhatsApp" → verify wa.me URL open (kalau di device tanpa WA, browser fallback)

**Verifikasi:** Semua status behavior correct.

---

### E5-ADM-QA-05 — Client Demo Script

**Priority:** P0 · **Tags:** `qa` `demo`

**Script (7 menit):**

1. **Intro (30 detik):** "Setelah slice sebelumnya, supplier bisa mendaftar dan Anda dapat notifikasi email. Sekarang saya tunjukkan panel admin untuk kelola supplier."
2. **Sidebar → Supplier (30 detik):** navigate ke `/admin/suppliers`, tunjukkan tabel.
3. **Filter status "Baru" (1 menit):** filter, tunjukkan URL sync, share link.
4. **Search "jawa timur" (1 menit):** tunjukkan real-time search + reset.
5. **Klik row → detail (1 menit):** tunjukkan info card, semua field readable.
6. **Update status (1 menit):** dropdown → Diverifikasi → simpan → tunjukkan badge update.
7. **Admin notes (1 menit):** type note "Sudah verifikasi dokumen 12 Nov 2026" → blur → auto-save.
8. **WA template (1 menit):** klik "Buat Pesan WA" → tunjukkan template pre-filled → klik "Buka di WhatsApp" → tunjukkan new tab.

**Verifikasi:** Klien sign-off untuk Epic 5 Admin Panel.

---

## Definition of Done

**Backend:**
- [ ] 4 endpoint admin (`GET /supplier`, `GET /supplier/{id}`, `PATCH /supplier/{id}`, `POST /supplier/wa-template`) protected JWT
- [ ] Whitelist enforcement `extra='forbid'` di PATCH
- [ ] WA template service extend dengan 3 template supplier
- [ ] Empty template handling untuk status `inactive`

**Frontend:**
- [ ] Route `/admin/suppliers` list dengan tabel + filter + search + URL sync
- [ ] Route `/admin/suppliers/[id]` detail dengan info card + status panel + notes + WA modal + metadata
- [ ] `AdminNotesEditor` di-refactor jadi shared component (dari Epic 4B), Epic 4B lead detail tidak regression
- [ ] `StatusBadge`, `SaltTypesCell`, `MetadataCard` render correct
- [ ] `SupplierWATemplateButton` handle 3 state: loading, ready-with-template, ready-empty
- [ ] Sidebar nav item "Supplier" active
- [ ] Empty state list view (no result) + reset filter action

**QA:**
- [ ] E2E manage flow pass
- [ ] Filter & search URL sync verified
- [ ] Notes auto-save + regression Epic 4B lolos
- [ ] WA template 3 status test pass
- [ ] Mobile responsive (list card view + detail single-col)

**Demo:** Sign-off from klien.

---

## Handover ke Epic 6

Setelah Epic 5 Admin Panel live:
- Epic 5 fully closed (customer facing + admin manage supplier end-to-end)
- Klien bisa manage lifecycle supplier tanpa buka DB
- **Sisa gap:** editable WA template (Post-MVP, konsisten Epic 4B Slice 3 pattern) + supplier notification auto-WA (Post-MVP)

**Epic 6 (Artikel + Kalkulator Garam)** bisa mulai. Task breakdown terpisah.

---

## Catatan Penutup

**Pushback dari spec Epic Doc + rekomendasi:**

**1. Kanban vs Tabel untuk supplier**

Epic Doc tidak eksplisit specify view type, saya pilih tabel (AR-01). Rasional: supplier ≠ sales pipeline. Kalau klien nanti minta Kanban view supplier setelah live, tanya use case konkret dulu — sering kali klien minta Kanban karena "familiar", bukan karena fit untuk data mereka.

**2. No status history table (AR-05)**

Beda dengan Epic 4B Slice 1 yang punya lead status history. Justifikasi: supplier status jarang berubah, historical audit overkill MVP. Kalau klien minta audit trail, add di enhancement — pattern-nya sudah proven di Epic 4B.

**3. Reuse `AdminNotesEditor` bikin refactor risk Epic 4B**

Reuse pattern (AR-02, FE-07) require refactor `AdminNotesEditor` jadi generic dengan `endpoint` prop. Kalau di Epic 4B belum generic (mis. hardcoded `/rfq/leads/`), execute refactor **di slice ini** dengan awareness regression risk. Alternative = create `SupplierNotesEditor` copy-paste = tech debt yang akan menghantui. Pilih refactor + regression test rigor.

**4. WA template `inactive` sengaja empty**

Klien mungkin tanya "kenapa status inactive tidak ada template?". Justifikasi sudah di AR-04. Kalau klien insist, add 1 template lagi — effort minimal (< 30 menit).

**5. Delete supplier tidak ada UI (AR-10)**

Klien mungkin request "kok tidak bisa hapus supplier?". Redirect ke set status `inactive` — sama effect operationally, no data loss. Kalau klien insist permanent delete, do via Supabase Dashboard (dengan admin awareness) atau enhancement soft-delete pattern.

**6. Pagination absent (AR-08)**

Kalau volume supplier > 200, tabel load slow. Monitor performance setelah live. Kalau lag muncul, add pagination via `?limit=50&offset=0` — enhancement 1 hari.

**7. Konsistensi vs innovation**

Slice ini banyak reuse pattern Epic 4B — bukan karena lazy, tapi karena **konsistensi UX admin**. Kalau list view supplier tampil beda dari list view leads, klien akan bingung. Reuse pattern reduce cognitive load klien saat operate 2 module (leads + supplier).

Kalau ada pertanyaan atau ada bagian yang perlu di-clarify sebelum eksekusi, bilang sekarang.

**File:** `docs/epic-breakdown/epic5_task_breakdown_admin-panel.md`
**Version:** 1.0 — {tanggal generate}
