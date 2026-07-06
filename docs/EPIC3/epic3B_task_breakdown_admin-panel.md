# Epic 3B Task Breakdown — Admin Panel Produk

**Project:** reka-cipta-platform
**Epic:** Epic 3B — Admin Panel Produk (CRM)
**Scope Dokumen:** Bagian **B. Admin/CRM** dari scope Epic 3 original (yang di-defer saat customer-facing dibangun)
**Version:** 1.0
**Author:** Ach. Jazilul Qutbi
**Status:** Draft — menunggu review sebelum eksekusi
**Depends on:** Epic 1 (auth middleware + admin login), Epic 2 (semua Slice — pattern Server Action revalidate dari Slice 3), Epic 3 Customer-Facing Slice 1 & 2 (products table + endpoints public + 5 detail pages)
**Blocks:** Epic 4 (RFQ System — belum ada direct dependency, tapi RFQ akan reference produk yang di-manage di sini)

---

## Konteks Slice

Epic 3B melengkapi loop Epic 3. Sebelum ini, semua data produk (5 seed) dikelola via SQL Editor Supabase Dashboard — proses developer-only. Klien (Manager Pemasaran Irwan Sugianto) tidak punya akses independen. Epic 3B memindahkan otoritas edit produk ke klien melalui panel admin, sehingga:

1. Klien bisa edit deskripsi marketing, spec teknis, industries served secara mandiri
2. Klien bisa toggle visibility produk (out of stock temporary via `is_active`)
3. Klien bisa upload foto dan PDF lab **real** — mengganti placeholder yang dipakai selama Epic 3 customer-facing

Tanpa Epic 3B, klien tergantung 100% ke Anda untuk update konten produk — anti-pattern untuk product platform yang meng-claim "empowerment".

Karena scope admin edit produk mencakup form kompleks (15+ field, JSONB editor, array editor) plus file upload (2 buckets, preview, cleanup), scope **dibagi menjadi 2 slice**:

| Slice | Scope Utama | Demoable Outcome |
|---|---|---|
| **Slice 1 — List + Edit Non-File Fields** | Backend `PUT /products/{id}` + admin GET + Frontend `/admin/products` list + `/admin/products/[id]/edit` form (semua field kecuali foto/PDF) + cache invalidation Server Action | Klien login ke admin, edit deskripsi PRO YD, ubah spec `nacl_pct` dari 97.5 ke 97.8, toggle GHPT jadi is_active=false. Refresh public `/produk` → perubahan reflect dalam < 1 detik. |
| **Slice 2 — File Uploads (Foto + PDF)** | Backend `POST /products/{id}/upload-photo` + `POST /products/{id}/upload-lab-doc` + Frontend upload components + integration ke edit form + old file cleanup | Klien upload foto asli PRO YD (replace placeholder), upload PDF hasil uji lab asli. Refresh public detail page → asset baru muncul. |

---

## Prasyarat Teknis (Konfirmasi Sebelum Mulai)

- [ ] Epic 1 selesai: middleware auth di `/admin/*`, admin login page, admin layout template
- [ ] Epic 2 Slice 3 selesai: pattern Server Action `revalidatePath` sudah ter-implement di `/admin/settings` — akan direplikasi
- [ ] Epic 3 Customer-Facing Slice 1 & 2 selesai:
  - `products` table + RLS aktif
  - Storage buckets `product-photos` + `lab-docs` aktif dengan RLS
  - 5 seed produk dengan placeholder assets
  - Backend `GET /products` + `GET /products/{slug}` accessible
  - Frontend `/produk` list + 5 `/produk/[slug]` detail pages live
  - Registry `lib/product-spec-labels.ts` + `lib/product-industry-icons.ts` tersedia
- [ ] `lib/api.ts` pattern `apiFetch` dengan flag `auth: true` sudah tested (dari Epic 2 Slice 3)
- [ ] Design System v2.0 aktif dengan brand tokens

---

## Keputusan Arsitektur Global Epic 3B

### AR-01 — Whitelist Editable Fields Ketat

**Non-editable via admin panel** (locked di backend, frontend tidak render input):

| Field | Alasan Lock |
|---|---|
| `id` | Immutable, primary key |
| `slug` | Stabilitas URL SEO — perubahan slug break existing backlinks, sitemap.xml, dan Google cache |
| `code` | Business identifier (PRO YD, SPO/M) — canonical reference dari klien, jarang berubah |
| `category` | Struktural — mempengaruhi filter tab. Perubahan butuh koordinasi (mungkin butuh update wording tab) |
| `created_at` | Audit standard |
| `updated_at` | Auto-managed by trigger |

**Editable via Slice 1 form:** `name`, `tagline`, `description`, `specs`, `industries`, `is_sni`, `is_active`, `sort_order`

**Editable via Slice 2 upload endpoint:** `photo_url`, `lab_doc_url`

**Enforcement:** Whitelist di-enforce di **backend** (bukan hanya frontend). PUT request dengan field non-whitelisted → 422 validation error. Frontend juga tidak render input untuk locked field (defense in depth).

Kalau klien butuh ubah `slug`/`code`/`category`, prosesnya out-of-band: klien request ke Anda → Anda evaluate impact → migration + koordinasi SEO.

### AR-02 — Upload Strategy: Proxy via Backend

**Chosen:** Client upload multipart form-data ke `POST /products/{id}/upload-photo` (dan `/upload-lab-doc`). Backend receive, validate, upload ke Supabase Storage, update DB.

**Alternatif rejected:** Signed URL (client upload direct ke Storage) — trade-off 4-step flow vs. simplicity backend validation.

Backend responsibilities dalam proxy approach:
1. Validate MIME type (whitelist `image/jpeg`, `image/png`, `image/webp` untuk photo; `application/pdf` untuk lab)
2. Validate file size (5MB photo, 10MB PDF)
3. Delete old file di Storage (kalau ada) sebelum upload baru — mencegah orphan file
4. Upload file ke bucket dengan naming convention: `{product-code-lowercase}-{timestamp}.{ext}` (contoh: `pro-yd-1720123456.jpg`) — timestamp mencegah CDN cache stale
5. Update `photo_url` atau `lab_doc_url` di DB dengan public URL baru
6. Return response dengan URL baru

### AR-03 — Cache Invalidation via Server Action (Pattern Epic 2 Slice 3)

Server Action `revalidateProductRoutes(slug: string)` di `app/actions/products.ts`:

```typescript
'use server';
import { revalidatePath } from 'next/cache';

export async function revalidateProductRoutes(slug: string) {
  revalidatePath('/produk');
  revalidatePath(`/produk/${slug}`);
  revalidatePath('/sitemap.xml');
  // '/' tidak di-invalidate karena Beranda tidak reference produk spesifik
}
```

Dipanggil dari client component `ProductEditForm` setelah:
- Slice 1: PUT sukses (dari mutation submit)
- Slice 2: Upload sukses (dari upload handler)

**Consequence:** Perubahan reflect di public route dalam < 1 detik (revalidate tidak butuh 3600 detik ISR expiry). Klien lihat feedback langsung.

### AR-04 — JSONB Spec Editor: Registry-Backed + Custom Key Allowed

Editor `SpecJSONBEditor` di Slice 1 punya UX:
- **Dropdown "Tambah Field"** yang populate dari `SPEC_LABEL_REGISTRY` (dari Epic 3 customer-facing Slice 2)
- User pilih field (mis. "Kadar NaCl") → row baru muncul dengan key `nacl_pct` auto-set + input value + unit auto-display
- Tombol "Tambah Custom Field" untuk kasus edge: klien butuh input field yang belum di registry — bisa input key manual + value + unit (harus valid SQL identifier: alphanumeric + underscore)
- Tombol hapus per row

Existing rows: iterate `Object.entries(product.specs)` saat form initial load. Kalau key di-registry, tampilkan label human-readable; kalau tidak, tampilkan key raw dengan indikator "(Custom)".

### AR-05 — Industries Editor: Chip-Based dengan Autocomplete

Editor `IndustriesEditor` di Slice 1:
- Chip display array `industries: string[]`
- Input field dengan autocomplete dari list industri yang existing di semua produk lain (populate dari GET /products result)
- Enter atau klik "Tambah" untuk add chip
- Klik X di chip untuk remove
- Free-text allowed — klien bisa input industri baru yang belum pernah ada di produk lain

### AR-06 — Read-Only Info Block di Edit Form

Locked fields (slug, code, category, id, created_at) ditampilkan sebagai **info block** di top form:

```
[Info Produk]
Slug:        garam-halus-yodium
Kode:        PRO YD
Kategori:    Halus
ID Sistem:   uuid-xxx
Dibuat:      3 Januari 2026
```

Style: monospace text, muted color, non-interactive. Klien tetap lihat konteks tapi tidak ada input.

### AR-07 — Auth Integration

- **Frontend:** Route `/admin/products` dan `/admin/products/[id]/edit` dilindungi middleware existing Epic 1 — unauthenticated redirect ke `/admin/login`.
- **Backend:** Semua endpoint admin (`PUT /products/{id}`, `GET /products/admin`, `POST /products/{id}/upload-*`) WAJIB `Depends(get_current_user)` — return 401 kalau JWT invalid/expired.
- **Frontend fetch admin endpoint:** Pakai `apiFetch(..., { auth: true })` dari `lib/api.ts` — JWT auto-attached dari session cookie.

### AR-08 — Form Validation: react-hook-form + Zod

Konsisten dengan pattern Epic 2 Slice 3 (contact form) dan settings form. Zod schema di `lib/validation/product-schema.ts`:

```typescript
export const productUpdateSchema = z.object({
  name: z.string().min(3, 'Minimal 3 karakter').max(255),
  tagline: z.string().max(300).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  specs: z.record(z.string(), z.union([z.string(), z.number()])).default({}),
  industries: z.array(z.string().min(1)).min(1, 'Minimal 1 industri'),
  is_sni: z.boolean(),
  is_active: z.boolean(),
  sort_order: z.number().int().nonnegative(),
});
```

### AR-09 — Optimistic UI vs Refetch: Pilih Refetch

Setelah submit sukses:
1. Toast success ("Produk berhasil diperbarui")
2. Panggil Server Action `revalidateProductRoutes(slug)`
3. Router refresh di admin page → refetch data dari backend

Trade-off: Sedikit slower feedback (~200ms extra) vs. ensure UI sync dengan server truth. Untuk admin panel yang tidak high-traffic, refetch acceptable.

### AR-10 — Audit Trail Deferred

Field `updated_by` (UUID admin user) **TIDAK ditambah di Epic 3B MVP**.

Rasional: Deployment awal hanya 1-2 admin user (Irwan Sugianto + backup). Traceability "siapa edit apa" belum critical. Kalau nanti butuh (mis. multi-branch operations, dispute resolution), migration terpisah dengan default value untuk backfill.

### AR-11 — Reuse Pattern Epic 2 Slice 3

Route `/admin/products` dan `/admin/products/[id]/edit` adalah **admin CRUD page kedua** setelah `/admin/settings`. Pattern yang WAJIB direplikasi:
- Server Component wrapper + Client Component leaf
- Server Action untuk revalidate
- `apiFetch` dengan `auth: true`
- react-hook-form + Zod + shadcn Sonner toast
- Base UI primitive (bukan Radix)
- Loading skeleton saat mutation in-flight

Ini adalah **pattern reference** untuk future admin pages (mis. Epic 4 admin RFQ, Epic 6 artikel CMS). Kualitas eksekusi di sini menentukan template untuk yang lain.

---

## Ringkasan Task per Slice

| Slice | UX | US | Backend | Contract | Frontend | QA | Total |
|---|---|---|---|---|---|---|---|
| **Slice 1** | 6 | 4 | 5 | 1 | 10 | 5 | **31** |
| **Slice 2** | 3 | 3 | 4 | 1 | 6 | 5 | **22** |

Total **53 task** across kedua slice. Estimasi effort:
- Slice 1: 4-6 hari kerja (form-heavy, ada 2 komponen kompleks: SpecJSONBEditor & IndustriesEditor)
- Slice 2: 3-5 hari kerja (multipart handling + upload UX + old file cleanup)

---

# SLICE 1 — Admin List + Edit Non-File Fields

## Tujuan Slice 1

Setelah Slice 1 selesai:
1. Backend endpoint `PUT /products/{id}` accessible dengan JWT + whitelist enforcement
2. Backend endpoint `GET /products/admin` return semua produk (termasuk `is_active = false`)
3. Route `/admin/products` list 5 produk dengan tombol Edit
4. Route `/admin/products/[id]/edit` form lengkap semua field kecuali foto/PDF
5. Komponen kompleks berfungsi:
   - `SpecJSONBEditor` — add/edit/remove field dari registry + custom
   - `IndustriesEditor` — chip-based array editor dengan autocomplete
6. Server Action `revalidateProductRoutes` invalidate cache setelah submit
7. Demoable: klien edit teks produk → refresh public site → perubahan reflect

---

## Layer 1 — UX Tasks (Slice 1)

### E3B-S1-UX-01 — Wireframe `/admin/products` List Page

**Priority:** P0 · **Tags:** `wireframe` `admin`

**Deliverable:** `docs/wireframes/Epic3B_slice1_admin-products-list.md`

**Struktur wireframe:**
```
┌─────────────────────────────────────────────────────────┐
│  <AdminLayout (existing Epic 1)>                        │
│  ┌──────────┬─────────────────────────────────────────┐│
│  │ Sidebar  │  Header: "Katalog Produk"               ││
│  │ (nav)    │                                         ││
│  │          │  [Search bar...........] [+ Filter]     ││ ← Search + filter opsional
│  │          │                                         ││
│  │          │  ┌───────────────────────────────────┐  ││
│  │          │  │ Foto │ Nama       │ Code │ Kat │  │  ││
│  │          │  ├──────┼────────────┼──────┼─────┤  ││
│  │          │  │ [📷] │ Garam Halus│ PRO..│Halus│[✏]│  ││
│  │          │  │      │ Yodium     │  YD  │     │Edit│  ││
│  │          │  ├──────┼────────────┼──────┼─────┤  ││
│  │          │  │ ...  │ ...        │ ...  │ ... │... │  ││
│  │          │  └───────────────────────────────────┘  ││
│  │          │                                         ││
│  │          │  Total: 5 produk (5 aktif, 0 nonaktif)  ││
│  └──────────┴─────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

**Kolom tabel:**
- Foto (thumbnail 60×60)
- Nama produk
- Code
- Kategori (chip)
- Status (badge: Aktif/Nonaktif)
- Sort Order
- Aksi (tombol Edit)

**Behavior:**
- Search bar (opsional Slice 1, defer kalau tight) — filter by name/code
- Row disabled visual (opacity 60%) untuk produk `is_active = false`
- Sort default: `sort_order ASC`

**Verifikasi:** Wireframe committed.

---

### E3B-S1-UX-02 — Wireframe `/admin/products/[id]/edit` Form Page

**Priority:** P0 · **Tags:** `wireframe` `admin`

**Deliverable:** `docs/wireframes/Epic3B_slice1_admin-product-edit.md`

**Struktur wireframe:**
```
┌─────────────────────────────────────────────────────────┐
│  <AdminLayout>                                          │
│  ┌──────────┬─────────────────────────────────────────┐│
│  │ Sidebar  │  Breadcrumb: Katalog / Edit Produk      ││
│  │          │  Header: "Edit: Garam Halus Yodium"     ││
│  │          │                                         ││
│  │          │  ┌─────────────────────────────────────┐││
│  │          │  │ [Info Block — Read Only]            │││
│  │          │  │ Slug: garam-halus-yodium            │││
│  │          │  │ Kode: PRO YD                        │││
│  │          │  │ Kategori: Halus                     │││
│  │          │  │ Dibuat: 3 Januari 2026              │││
│  │          │  └─────────────────────────────────────┘││
│  │          │                                         ││
│  │          │  <section>                              ││
│  │          │  Informasi Dasar                        ││
│  │          │  [Nama Produk        ]                  ││
│  │          │  [Tagline (max 300)  ]                  ││
│  │          │  [Deskripsi textarea ]                  ││
│  │          │  </section>                             ││
│  │          │                                         ││
│  │          │  <section>                              ││
│  │          │  Spesifikasi Teknis                     ││
│  │          │  <SpecJSONBEditor />                    ││
│  │          │  </section>                             ││
│  │          │                                         ││
│  │          │  <section>                              ││
│  │          │  Industri yang Dilayani                 ││
│  │          │  <IndustriesEditor />                   ││
│  │          │  </section>                             ││
│  │          │                                         ││
│  │          │  <section>                              ││
│  │          │  Pengaturan Tampilan                    ││
│  │          │  ☐ Bersertifikat SNI                    ││
│  │          │  ☐ Tampilkan di katalog                 ││
│  │          │  [Urutan Tampil: 1]                     ││
│  │          │  </section>                             ││
│  │          │                                         ││
│  │          │  [Batal]  [Simpan Perubahan]            ││
│  └──────────┴─────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

**Edge behaviors:**
- Unsaved changes warning (browser `beforeunload`) kalau user navigate away
- Submit button disabled sampai form dirty
- Loading spinner di submit button saat mutation in-flight
- Toast success/error setelah submit

**Verifikasi:** Wireframe committed.

---

### E3B-S1-UX-03 — Spec Component `ProductAdminRow`

**Priority:** P1 · **Tags:** `component-spec`

**Deliverable:** Section spec di wireframe file.

**Anatomi row:**
- Cell foto: `<Image>` 60×60 dengan fallback placeholder
- Cell nama: link ke `/admin/products/{id}/edit`
- Cell status: badge dengan color coding (green Aktif, gray Nonaktif)
- Cell aksi: tombol Edit (icon `Pencil` dari `lucide-react`)

**Style:**
- Border-bottom antar row
- Hover state row: `bg-slate-50`
- Focus state: `ring-2 ring-brand-teal-600`

---

### E3B-S1-UX-04 — Spec Component `SpecJSONBEditor`

**Priority:** P0 · **Tags:** `component-spec` `complex` `interactive`

**Deliverable:** Section detail di wireframe.

**Anatomi editor:**
```
┌───────────────────────────────────────────────────────┐
│ Spesifikasi Teknis                                    │
│                                                       │
│  Parameter          Nilai        Satuan     Aksi      │
│  ┌────────────────┬──────────┬───────────┬───────┐   │
│  │ Kadar NaCl (%) │ [97.5  ] │ % (auto)  │ [🗑]  │   │
│  │ Kadar Air (%)  │ [0.5   ] │ % (auto)  │ [🗑]  │   │
│  │ Kandungan KIO3 │ [30    ] │ ppm (auto)│ [🗑]  │   │
│  │ ...            │ [...]    │ ...       │ [🗑]  │   │
│  └────────────────┴──────────┴───────────┴───────┘   │
│                                                       │
│  [+ Tambah Field ▾]  [+ Custom Field]                 │
│                                                       │
│  Dropdown "+ Tambah Field" saat diklik:               │
│  ┌────────────────────────────────────────┐          │
│  │ Field yang belum ada:                   │          │
│  │ ☐ Kadar NaCl (%)                        │          │
│  │ ☐ Kadar Air (%)                         │          │
│  │ ☐ Kandungan KIO3 (ppm)                  │          │
│  │ ☐ Warna                                 │          │
│  │ ...                                     │          │
│  └────────────────────────────────────────┘          │
└───────────────────────────────────────────────────────┘
```

**State management:**
- Internal state array `Array<{ key: string; value: string | number; isCustom: boolean }>`
- Convert to `Record<string, string | number>` saat submit
- Validation: value non-empty, key format valid (SQL identifier)

**Custom field dialog:**
```
┌─────────────────────────────┐
│ Tambah Custom Field         │
│                             │
│ Kunci (key):                │
│ [nacl_prcnt_dry           ] │
│ Format: huruf_kecil_underscore │
│                             │
│ Label untuk Ditampilkan:    │
│ [Kadar NaCl Kering        ] │
│                             │
│ Satuan:                     │
│ [%                        ] │
│                             │
│ [Batal]  [Tambah]           │
└─────────────────────────────┘
```

**Note:** Custom field label & unit hanya untuk display di form editor sendiri. Tidak masuk ke `SPEC_LABEL_REGISTRY` (registry statis at build-time). Di halaman public detail, custom key akan pakai fallback rendering (key raw jika tidak di registry).

**Ini komponen paling kompleks di Slice 1.** Estimasi effort: 1-2 hari kerja untuk implementation + testing.

---

### E3B-S1-UX-05 — Spec Component `IndustriesEditor`

**Priority:** P0 · **Tags:** `component-spec` `interactive`

**Anatomi editor:**
```
┌─────────────────────────────────────────────────┐
│ Industri yang Dilayani                          │
│                                                 │
│ [Makanan & Minuman ×] [Farmasi ×] [Rumah T. ×] │
│                                                 │
│ Tambah industri:                                │
│ [Ketik nama industri...          ] [Tambah]    │
│                                                 │
│ Suggestion (autocomplete):                      │
│ • Kimia                                         │
│ • Tekstil                                       │
│ • Pengolahan Ikan                               │
└─────────────────────────────────────────────────┘
```

**Behavior:**
- Chip dengan tombol X untuk remove
- Input dengan autocomplete populated dari list unique industri di semua produk lain
- Enter di input trigger add
- Free-text allowed (tidak restrict ke suggestion)
- Duplicate detection: kalau industri sudah ada, tolak dengan feedback visual

**Validasi:** Minimal 1 industri (Zod schema).

---

### E3B-S1-UX-06 — Edge States Edit Form

**Priority:** P1 · **Tags:** `edge-case` `ux`

**Skenario:**

1. **Loading initial data** — skeleton form dengan input outline abu-abu, no interaction
2. **Submit in-flight** — button "Simpan Perubahan" disabled + spinner + text "Menyimpan..."
3. **Success** — toast top-right hijau "Produk berhasil diperbarui" + form kembali ke pristine state (dirty flag false)
4. **Validation error** — inline error message di bawah field yang invalid (merah), toast singkat "Ada input yang tidak valid"
5. **Backend error 500** — toast merah "Gagal menyimpan. Silakan coba lagi." + button tetap enabled untuk retry
6. **Backend error 401** — redirect ke `/admin/login` (JWT expired) + toast "Session berakhir, silakan login ulang"
7. **Backend error 422 whitelist violation** — technical error yang seharusnya tidak muncul di UI (frontend sudah filter), tapi kalau muncul → log ke Sentry + toast generik
8. **Unsaved changes navigate away** — `beforeunload` event confirm dialog

---

## Layer 2 — User Stories (Slice 1)

### E3B-S1-US-01 — Admin Edit Deskripsi Marketing

**As** Manager Pemasaran (Irwan Sugianto),
**I want** edit deskripsi produk PRO YD dari admin panel,
**So that** saya bisa update copy marketing tanpa perlu tanya developer.

**Acceptance:**
- Login sebagai admin
- Navigate ke `/admin/products`
- Klik Edit pada baris PRO YD
- Update field "Deskripsi" dengan konten baru
- Klik "Simpan Perubahan"
- Toast success muncul dalam < 2 detik
- Buka public `/produk/garam-halus-yodium` di tab baru → deskripsi baru muncul

---

### E3B-S1-US-02 — Admin Update Spec Teknis

**As** Manager Pemasaran yang baru menerima hasil uji lab terbaru,
**I want** update nilai `nacl_pct` PRO YD dari 97.5 ke 97.8,
**So that** informasi produk di website selalu match data lab terkini.

**Acceptance:**
- Buka edit page PRO YD
- Di section Spesifikasi Teknis, edit nilai row "Kadar NaCl (%)" dari 97.5 ke 97.8
- Submit form
- Public detail page menampilkan nilai baru setelah revalidation

---

### E3B-S1-US-03 — Admin Toggle Produk Nonaktif

**As** Manager Pemasaran yang temporary kehabisan stok GHPT,
**I want** disable GHPT dari katalog publik tanpa hapus dari database,
**So that** klien tidak inquiry produk yang tidak bisa dilayani, dan produk mudah reaktivasi saat stok tersedia lagi.

**Acceptance:**
- Buka edit GHPT
- Uncheck "Tampilkan di katalog" (`is_active = false`)
- Submit
- Public `/produk` grid tidak menampilkan GHPT
- Public `/produk/garam-ghpt` return 404 (via `notFound()` di detail page)
- Sitemap.xml tidak lagi include `/produk/garam-ghpt`
- Admin list tetap menampilkan GHPT dengan badge "Nonaktif"

---

### E3B-S1-US-04 — Admin Re-order Produk

**As** Manager Pemasaran yang ingin highlight produk kasar untuk musim tertentu,
**I want** ubah urutan produk di grid publik,
**So that** produk prioritas muncul di posisi atas grid.

**Acceptance:**
- Edit produk, ubah `sort_order` dari 3 ke 1
- Submit
- Refresh public `/produk` → produk berubah posisi

**Note UX opsional:** Drag-drop re-order di list page — defer sebagai enhancement. MVP: manual input `sort_order` di edit form.

---

## Layer 3 — Engineering (Slice 1)

### 3a. Backend

#### E3B-S1-BE-01 — Pydantic Schema `ProductUpdateRequest`

**Priority:** P0 · **Tags:** `backend` `schema`

**File:** `backend/schemas/product.py` (extend existing)

**Konten tambahan:**
```python
from typing import Any

class ProductUpdateRequest(BaseModel):
    """
    Whitelist fields yang bisa di-update via PUT /products/{id}.
    Field non-whitelisted (slug, code, category, id, created_at) TIDAK ada di sini —
    kalau frontend accidentally kirim, Pydantic reject dengan 422.
    """
    model_config = ConfigDict(extra='forbid')  # STRICT: reject unknown fields

    name: str = Field(min_length=3, max_length=255)
    tagline: str | None = Field(default=None, max_length=300)
    description: str | None = Field(default=None, max_length=5000)
    specs: dict[str, Any] = Field(default_factory=dict)
    industries: list[str] = Field(min_length=1)
    is_sni: bool
    is_active: bool
    sort_order: int = Field(ge=0)


class ProductAdminListResponse(BaseModel):
    """Response untuk GET /products/admin — include all products (even inactive)."""
    products: list[Product]
    total: int
    active_count: int
    inactive_count: int
```

**Key detail:** `extra='forbid'` di `ConfigDict` — WAJIB. Ini yang enforce whitelist. Kalau `extra='allow'` (default Pydantic v2), Silent accept unknown fields dan validation gagal cover.

**Verifikasi:** Test dengan payload extra field (mis. `slug`) — must return 422.

---

#### E3B-S1-BE-02 — Router Endpoint `PUT /products/{id}`

**Priority:** P0 · **Tags:** `backend` `router` `auth`

**File:** `backend/routers/products.py` (extend existing)

**Konten tambahan:**
```python
from fastapi import Depends, HTTPException
from backend.dependencies.auth import get_current_user  # Existing Epic 1

@router.put(
    "/{product_id}",
    response_model=ProductDetailResponse,
    summary="Update product (admin only)",
    dependencies=[Depends(get_current_user)],
)
async def update_product(
    product_id: str,
    payload: ProductUpdateRequest,
) -> ProductDetailResponse:
    """Update product fields. JWT required. Whitelist enforced via Pydantic."""
    supabase = get_supabase_service()

    # Verify product exists
    existing = (
        supabase.table("products")
        .select("*")
        .eq("id", product_id)
        .limit(1)
        .execute()
    )
    if not existing.data:
        raise HTTPException(status_code=404, detail="Product not found")

    # Update
    result = (
        supabase.table("products")
        .update(payload.model_dump())
        .eq("id", product_id)
        .execute()
    )

    updated_product = Product(**result.data[0])
    return ProductDetailResponse(product=updated_product)
```

**Verifikasi:**
- Test dengan JWT valid → 200 + updated product
- Test tanpa JWT → 401
- Test dengan payload `{"slug": "new-slug", ...}` → 422 (extra forbidden)
- Test dengan ID invalid → 404

---

#### E3B-S1-BE-03 — Router Endpoint `GET /products/admin`

**Priority:** P0 · **Tags:** `backend` `router` `auth`

**File:** `backend/routers/products.py` (extend)

**Konten:**
```python
@router.get(
    "/admin",
    response_model=ProductAdminListResponse,
    summary="List all products (admin only, including inactive)",
    dependencies=[Depends(get_current_user)],
)
async def list_products_admin() -> ProductAdminListResponse:
    """List all products regardless of is_active. JWT required."""
    supabase = get_supabase_service()
    result = (
        supabase.table("products")
        .select("*")
        .order("sort_order", desc=False)
        .execute()
    )
    products = [Product(**row) for row in result.data]
    active = sum(1 for p in products if p.is_active)
    inactive = len(products) - active
    return ProductAdminListResponse(
        products=products,
        total=len(products),
        active_count=active,
        inactive_count=inactive,
    )
```

**Verifikasi:** Test dengan salah satu produk `is_active = false` → tetap muncul di response. Test tanpa JWT → 401.

---

#### E3B-S1-BE-04 — Register Route Order

**Priority:** P0 · **Tags:** `backend` `wiring`

**Penting:** Order matters di FastAPI routing. `GET /products/admin` HARUS di-declare **SEBELUM** `GET /products/{slug}` — kalau tidak, FastAPI akan interpret "admin" sebagai slug value.

**Verifikasi:** Test `GET /products/admin` return list, bukan 404 "Product with slug 'admin' not found".

---

#### E3B-S1-BE-05 — Manual Test dengan JWT

**Priority:** P0 · **Tags:** `testing` `manual`

**Aksi:**

Ambil JWT dari admin login (via browser DevTools → Application → Cookies), lalu:

```bash
JWT="eyJ..."

# List admin
curl -H "Authorization: Bearer $JWT" http://localhost:8000/products/admin | jq

# Update product
curl -X PUT -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Garam Halus Yodium",
    "tagline": "New tagline for testing",
    "description": "Updated description",
    "specs": {"nacl_pct": 97.8, "water_pct": 0.5},
    "industries": ["Makanan & Minuman", "Farmasi"],
    "is_sni": true,
    "is_active": true,
    "sort_order": 1
  }' \
  http://localhost:8000/products/{ID_PRO_YD} | jq

# Test whitelist violation
curl -X PUT -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"slug": "hacked-slug", "name": "test", ...}' \
  http://localhost:8000/products/{ID} | jq
# Expected: 422
```

---

### 3b. Contract (Types + lib/api)

#### E3B-S1-CT-01 — Update `types/api.ts` + `lib/api.ts`

**Priority:** P0 · **Tags:** `contract`

**File 1:** `types/api.ts` (extend)

```typescript
// Epic 3B Slice 1
export interface ProductUpdateRequest {
  name: string;
  tagline: string | null;
  description: string | null;
  specs: ProductSpecs;
  industries: string[];
  is_sni: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface ProductAdminListResponse {
  products: Product[];
  total: number;
  active_count: number;
  inactive_count: number;
}
```

**File 2:** `lib/api.ts` (extend)

```typescript
export async function getProductsAdmin(): Promise<ProductAdminListResponse> {
  return apiFetch<ProductAdminListResponse>('/products/admin', { auth: true });
}

export async function updateProduct(
  id: string,
  payload: ProductUpdateRequest
): Promise<ProductDetailResponse> {
  return apiFetch<ProductDetailResponse>(`/products/${id}`, {
    method: 'PUT',
    auth: true,
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  });
}
```

**Verifikasi:** `pnpm tsc --noEmit` pass.

---

### 3c. Frontend Admin List

#### E3B-S1-FE-01 — Route `app/admin/products/page.tsx`

**Priority:** P0 · **Tags:** `frontend` `server-component`

**File:** `app/admin/products/page.tsx`

**Struktur:**
```typescript
// Server Component wrapper
import { getProductsAdmin } from '@/lib/api';
import { ProductsAdminList } from '@/components/admin/product/ProductsAdminList';

export const dynamic = 'force-dynamic'; // admin page, always fresh
export const metadata = { title: 'Katalog Produk - Admin' };

export default async function AdminProductsPage() {
  const data = await getProductsAdmin();

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Katalog Produk</h1>
        <p className="text-sm text-ink-muted">
          {data.total} produk ({data.active_count} aktif, {data.inactive_count} nonaktif)
        </p>
      </header>
      <ProductsAdminList products={data.products} />
    </div>
  );
}
```

**Verifikasi:** Halaman render di `/admin/products` setelah admin login.

---

#### E3B-S1-FE-02 — Component `ProductsAdminList` (Server Component OK)

**Priority:** P0 · **Tags:** `frontend` `component`

**File:** `components/admin/product/ProductsAdminList.tsx`

Table dengan 5 kolom (foto, nama, code, kategori, status, aksi). Iterate `products` dan render `ProductAdminRow` per baris.

**Struktur:** Bisa Server Component karena tidak butuh interactivity (Edit button navigate ke route, bukan mutation inline).

---

#### E3B-S1-FE-03 — Component `ProductAdminRow`

**Priority:** P1 · **Tags:** `frontend` `component`

**File:** `components/admin/product/ProductAdminRow.tsx`

Row dengan:
- `<Image>` thumbnail 60×60
- Text nama + code
- Chip kategori
- Badge status (`bg-green-100 text-green-800` untuk aktif, gray untuk nonaktif)
- `<Link href="/admin/products/{id}/edit">` dengan icon Pencil sebagai tombol

**Style row inactive:** `opacity-60 grayscale`.

---

### 3d. Frontend Admin Edit

#### E3B-S1-FE-04 — Route `app/admin/products/[id]/edit/page.tsx`

**Priority:** P0 · **Tags:** `frontend` `server-component` `route`

**File:** `app/admin/products/[id]/edit/page.tsx`

**Struktur:**
```typescript
// Server Component: fetch product data + list untuk industry autocomplete
import { notFound } from 'next/navigation';
import { getSupabaseAdmin } from '@/lib/supabase/admin'; // atau via lib/api dengan service role
import { ProductEditForm } from '@/components/admin/product/ProductEditForm';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await fetchProductById(id);
  if (!product) notFound();

  // Fetch semua produk untuk autocomplete industries
  const allProducts = await fetchAllProducts();
  const allIndustries = [
    ...new Set(allProducts.flatMap(p => p.industries))
  ].sort();

  return (
    <div className="max-w-3xl">
      <ProductEditForm
        product={product}
        availableIndustries={allIndustries}
      />
    </div>
  );
}
```

**Catatan:** Fetch via helper yang gunakan Supabase service role di server (mirip pattern Admin Settings). Alternatif: pakai `apiFetch` ke backend GET admin — trade-off extra hop tapi konsisten.

---

#### E3B-S1-FE-05 — Component `ProductEditForm` (Client Component, react-hook-form + Zod)

**Priority:** P0 · **Tags:** `frontend` `client-component` `form` `complex`

**File:** `components/admin/product/ProductEditForm.tsx`

**Struktur high-level:**
```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productUpdateSchema } from '@/lib/validation/product-schema';
import { updateProduct } from '@/lib/api';
import { revalidateProductRoutes } from '@/app/actions/products';
import { toast } from 'sonner';

interface Props {
  product: Product;
  availableIndustries: string[];
}

export function ProductEditForm({ product, availableIndustries }: Props) {
  const form = useForm({
    resolver: zodResolver(productUpdateSchema),
    defaultValues: {
      name: product.name,
      tagline: product.tagline,
      description: product.description,
      specs: product.specs,
      industries: product.industries,
      is_sni: product.is_sni,
      is_active: product.is_active,
      sort_order: product.sort_order,
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(data: ProductUpdateRequest) {
    setIsSubmitting(true);
    try {
      await updateProduct(product.id, data);
      await revalidateProductRoutes(product.slug);
      toast.success('Produk berhasil diperbarui');
      form.reset(data); // reset dirty state to new values
    } catch (err) {
      toast.error('Gagal menyimpan. Silakan coba lagi.');
      // Log to Sentry
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <ReadOnlyInfoBlock product={product} />

      <section>
        <h2>Informasi Dasar</h2>
        <Input {...form.register('name')} label="Nama Produk" />
        <Input {...form.register('tagline')} label="Tagline" />
        <Textarea {...form.register('description')} label="Deskripsi" />
      </section>

      <section>
        <h2>Spesifikasi Teknis</h2>
        <Controller
          name="specs"
          control={form.control}
          render={({ field }) => (
            <SpecJSONBEditor value={field.value} onChange={field.onChange} />
          )}
        />
      </section>

      <section>
        <h2>Industri yang Dilayani</h2>
        <Controller
          name="industries"
          control={form.control}
          render={({ field }) => (
            <IndustriesEditor
              value={field.value}
              onChange={field.onChange}
              suggestions={availableIndustries}
            />
          )}
        />
      </section>

      <section>
        <h2>Pengaturan Tampilan</h2>
        <Checkbox {...form.register('is_sni')} label="Bersertifikat SNI" />
        <Checkbox {...form.register('is_active')} label="Tampilkan di katalog" />
        <Input
          type="number"
          {...form.register('sort_order', { valueAsNumber: true })}
          label="Urutan Tampil"
        />
      </section>

      <div className="flex gap-3 mt-8">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/products')}
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !form.formState.isDirty}
        >
          {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </div>
    </form>
  );
}
```

**Verifikasi:** Form functional, submit ke backend, toast muncul, cache ter-revalidate.

---

#### E3B-S1-FE-06 — Component `SpecJSONBEditor`

**Priority:** P0 · **Tags:** `frontend` `component` `complex`

**File:** `components/admin/product/SpecJSONBEditor.tsx`

**Interface:**
```typescript
interface Props {
  value: Record<string, string | number>;
  onChange: (value: Record<string, string | number>) => void;
}
```

**Behavior:**
- Convert `value` prop → internal state `Array<{ key, value, isCustom }>` on mount
- Convert internal state → object on any change → call `onChange`
- Dropdown "+ Tambah Field" populated dari `SPEC_LABEL_REGISTRY`, exclude keys yang sudah dipakai
- Dialog "+ Custom Field" untuk input key manual dengan validasi format (`/^[a-z][a-z0-9_]*$/`)
- Setiap row: input for value, display unit dari registry (kalau ada), tombol delete

**Validasi row-level:**
- Value non-empty
- Kalau field di registry punya unit `%` atau `ppm`, cast value ke number
- Kalau field type text (color, smell), keep as string

**Ini komponen kompleks — expect 1-1.5 hari kerja implementation + edge case handling.**

---

#### E3B-S1-FE-07 — Component `IndustriesEditor`

**Priority:** P0 · **Tags:** `frontend` `component`

**File:** `components/admin/product/IndustriesEditor.tsx`

**Interface:**
```typescript
interface Props {
  value: string[];
  onChange: (value: string[]) => void;
  suggestions: string[];
}
```

**Behavior:**
- Render chips untuk `value`
- Input field dengan autocomplete dari `suggestions` (filter out yang sudah dipakai)
- Enter atau klik "Tambah" → add ke value
- Klik X di chip → remove
- Duplicate detection dengan feedback visual (input flash merah)

---

#### E3B-S1-FE-08 — Component `ReadOnlyInfoBlock`

**Priority:** P1 · **Tags:** `frontend` `component`

**File:** `components/admin/product/ReadOnlyInfoBlock.tsx`

Info block yang display 5 field: slug, code, category, id, created_at (formatted date). Style: monospace, muted, tidak interactive.

Include tooltip atau icon info: "Kolom ini tidak bisa diubah dari panel admin. Kalau butuh perubahan, hubungi developer."

---

### 3e. Cache Invalidation (Server Action)

#### E3B-S1-FE-09 — Server Action `revalidateProductRoutes`

**Priority:** P0 · **Tags:** `frontend` `server-action`

**File:** `app/actions/products.ts`

```typescript
'use server';

import { revalidatePath } from 'next/cache';

export async function revalidateProductRoutes(slug: string) {
  revalidatePath('/produk');
  revalidatePath(`/produk/${slug}`);
  revalidatePath('/sitemap.xml');
}
```

**Konsumsi:** Di `ProductEditForm.onSubmit` setelah `updateProduct` sukses.

**Verifikasi:** Edit produk, submit, refresh public `/produk` di tab lain — perubahan reflect dalam < 1 detik.

---

#### E3B-S1-FE-10 — Integrasi Server Action ke Submit Flow

**Priority:** P0 · **Tags:** `frontend` `integration`

**Aksi:** Sudah tercakup di E3B-S1-FE-05 (submit handler). Task ini adalah verifikasi eksplisit bahwa Server Action jalan tanpa error dan cache benar-benar invalidated.

**Test manual:**
1. Buka `/produk` di Tab A
2. Buka `/admin/products/PRO-YD/edit` di Tab B
3. Edit tagline di Tab B, submit
4. Refresh Tab A — tagline baru muncul

Kalau tagline tidak muncul, investigate Server Action call chain.

---

## Layer 4 — QA Tasks (Slice 1)

### E3B-S1-QA-01 — E2E Test Edit Flow (Manual)

**Priority:** P0 · **Tags:** `qa` `e2e`

**Test scenario:**
1. Login admin
2. Buka `/admin/products`, verify 5 produk render dengan status badge
3. Klik Edit PRO YD
4. Ubah 5 field (name, tagline, spec value, tambah industri, toggle sort_order)
5. Submit
6. Verifikasi toast success
7. Verifikasi public `/produk/garam-halus-yodium` reflect perubahan

---

### E3B-S1-QA-02 — Test Cache Invalidation

**Priority:** P0 · **Tags:** `qa` `caching`

**Test:**
- Buka 2 tab: `/produk` di Tab A, `/admin/products/[id]/edit` di Tab B
- Edit di Tab B, submit
- Refresh Tab A → perubahan muncul dalam < 1 detik (bukan 3600s ISR wait)

**Kalau gagal:** Log Server Action call di browser DevTools, verify `revalidatePath` execute.

---

### E3B-S1-QA-03 — Test Whitelist Enforcement Backend

**Priority:** P0 · **Tags:** `qa` `security`

**Test dengan curl:**
```bash
# Coba ubah slug (harus ditolak)
curl -X PUT -H "Authorization: Bearer $JWT" \
  -d '{"slug": "new-slug", "name": "test", ...}' \
  http://localhost:8000/products/{id}
# Expected: 422 dengan pesan mengandung "slug"

# Coba ubah code
curl -X PUT -H "Authorization: Bearer $JWT" \
  -d '{"code": "NEW", "name": "test", ...}' \
  http://localhost:8000/products/{id}
# Expected: 422

# Kirim payload valid (semua whitelisted field)
curl -X PUT -H "Authorization: Bearer $JWT" \
  -d '{"name": "test", "tagline": null, "description": null, "specs": {}, "industries": ["Test"], "is_sni": false, "is_active": true, "sort_order": 1}' \
  http://localhost:8000/products/{id}
# Expected: 200
```

---

### E3B-S1-QA-04 — Test Auth Guard

**Priority:** P0 · **Tags:** `qa` `security`

**Test:**
- Request `PUT /products/{id}` tanpa JWT → 401
- Request dengan JWT expired → 401
- Request dengan JWT valid → 200
- Frontend: akses `/admin/products` tanpa login → redirect ke `/admin/login`

---

### E3B-S1-QA-05 — Client Demo Script Slice 1

**Priority:** P0 · **Tags:** `demo`

**File:** `docs/demos/epic3B_slice1_demo_script.md`

**Struktur demo (~10 menit):**
1. **Konteks (1 menit)** — "Panel admin ini menggantikan proses developer yang selama ini kita lakukan. Tim marketing sekarang bisa update produk sendiri."
2. **Login flow (1 menit)** — demo login sebagai admin
3. **List page walkthrough (2 menit)** — tunjukkan 5 produk, status, kategori
4. **Edit flow lengkap (5 menit)** — edit PRO YD:
   - Ubah tagline
   - Ubah 1 nilai spec (mis. `nacl_pct`)
   - Tambah 1 industri baru
   - Submit → toast success
   - Buka public detail page di tab baru → tunjukkan perubahan reflect
5. **Toggle is_active demo (1 menit)** — set GHPT nonaktif, tunjukkan public grid tidak lagi tampilkan GHPT
6. **Roadmap Slice 2 (1 menit)** — "Slice 2 melengkapi ini dengan kemampuan upload foto dan PDF asli — sekarang masih placeholder."

**Sign-off:** Klien setuju alur, siap lanjut Slice 2 upload.

---

## Definition of Done — Slice 1

**Backend:**
- [ ] `PUT /products/{id}` accessible dengan JWT, whitelist enforced (422 untuk extra field)
- [ ] `GET /products/admin` return semua produk termasuk `is_active = false`
- [ ] Route order benar (`/admin` sebelum `/{slug}`)
- [ ] Deploy Railway production

**Frontend:**
- [ ] `/admin/products` render list 5 produk dengan status badge
- [ ] `/admin/products/[id]/edit` render form lengkap
- [ ] `SpecJSONBEditor` functional (add/edit/remove field, custom key allowed)
- [ ] `IndustriesEditor` functional (chip + autocomplete)
- [ ] Read-only info block visible dengan 5 field locked
- [ ] Submit flow: mutation → Server Action revalidate → toast success
- [ ] Unsaved changes warning aktif
- [ ] Validation errors inline visible

**Integration:**
- [ ] Cache invalidation verified: edit → public reflect dalam < 1 detik
- [ ] Auth guard: unauth request return 401 (backend), redirect ke login (frontend)

**Kualitas kode:**
- [ ] `pnpm tsc --noEmit` pass
- [ ] `pnpm lint` pass
- [ ] Tidak modifikasi `globals.css`
- [ ] Tidak ada import `@radix-ui/*`
- [ ] Pattern konsisten dengan Epic 2 Slice 3 (admin settings)

**QA:**
- [ ] E2E test 4 skenario pass (edit teks, edit spec, toggle inactive, re-order)
- [ ] Whitelist test 3 skenario pass
- [ ] Auth test pass

**Demo:**
- [ ] Client demo dilakukan
- [ ] Sign-off tercatat untuk lanjut Slice 2

---

# SLICE 2 — File Uploads (Foto + PDF)

## Tujuan Slice 2

Setelah Slice 2 selesai:
1. Backend endpoint `POST /products/{id}/upload-photo` accessible dengan JWT + validasi MIME/size
2. Backend endpoint `POST /products/{id}/upload-lab-doc` accessible dengan JWT
3. Backend delete old file di Storage sebelum upload baru (no orphan)
4. Frontend upload components integrated ke edit form: `PhotoUploader`, `PDFUploader`
5. Client-side validation (MIME, size) sebelum upload
6. Progress indicator saat upload
7. Preview foto immediately setelah upload sukses (tanpa full refetch)
8. Cache invalidation setelah upload sukses
9. Demoable: klien upload foto & PDF asli untuk 5 produk → public site menampilkan asset baru

---

## Layer 1 — UX Tasks (Slice 2)

### E3B-S2-UX-01 — Spec Component `PhotoUploader`

**Priority:** P0 · **Tags:** `component-spec` `complex`

**Anatomi:**
```
┌──────────────────────────────────────────┐
│ Foto Produk                              │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │                                    │  │
│ │      [Current Photo Preview]       │  │
│ │       aspect-ratio 4:3             │  │
│ │                                    │  │
│ └────────────────────────────────────┘  │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │  📤 Drag & drop foto atau [pilih]  │  │
│ │  JPG/PNG/WebP, maks 5 MB           │  │
│ └────────────────────────────────────┘  │
│                                          │
│ Upload progress bar (saat uploading):    │
│ ▓▓▓▓▓▓▓░░░░ 67%                          │
└──────────────────────────────────────────┘
```

**States:**
- **Idle:** current photo preview + drag-drop area
- **Dragging:** area highlighted dengan border dashed teal
- **Uploading:** progress bar + button disabled
- **Success:** preview updated dengan foto baru + toast
- **Error:** feedback merah + retry button

**Behavior:**
- Drag file over area → visual feedback
- Drop file → validate → upload
- Klik "pilih" → open file picker
- Validasi client-side: MIME type dan size sebelum submit
- Kalau invalid: feedback inline (tidak submit)

---

### E3B-S2-UX-02 — Spec Component `PDFUploader`

**Priority:** P0 · **Tags:** `component-spec`

**Anatomi:**
```
┌──────────────────────────────────────────┐
│ Dokumen Uji Laboratorium (PDF)           │
│                                          │
│ Current: 📄 lab-pro-yd.pdf [Preview ↗]   │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │  📤 Drag PDF atau [pilih file]     │  │
│ │  PDF only, maks 10 MB              │  │
│ └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

Behavior serupa PhotoUploader tapi tanpa image preview (link ke PDF di tab baru).

---

### E3B-S2-UX-03 — Loading & Error States Upload

**Priority:** P1 · **Tags:** `edge-case`

**Skenario:**

1. **Network error saat upload** — toast merah "Upload gagal, cek koneksi" + retry button
2. **File terlalu besar** — validation error inline "File terlalu besar, maks 5 MB" (client-side, tidak submit)
3. **MIME salah** — validation error inline "Format tidak didukung, pakai JPG/PNG/WebP"
4. **Server error 500** — toast merah + Sentry log
5. **JWT expired mid-upload** — redirect ke `/admin/login`
6. **Upload sukses tapi revalidation gagal** — toast success dengan warning "Foto berhasil, tapi cache belum ter-refresh. Refresh halaman public manual."

---

## Layer 2 — User Stories (Slice 2)

### E3B-S2-US-01 — Admin Replace Foto Produk

**As** Manager Pemasaran yang sudah dapat foto profesional PRO YD dari fotografer,
**I want** replace foto placeholder dengan foto asli,
**So that** katalog publik menampilkan produk kami yang sesungguhnya.

**Acceptance:**
- Buka edit PRO YD
- Di section Foto Produk, drag-drop foto baru (atau klik pilih)
- Progress bar muncul
- Setelah sukses, preview update ke foto baru
- Buka public `/produk` → kartu PRO YD tampil dengan foto baru
- File placeholder lama dihapus dari Storage (verify di Dashboard)

---

### E3B-S2-US-02 — Admin Upload PDF Lab

**As** Manager Pemasaran yang menerima PDF hasil uji lab terbaru,
**I want** replace PDF placeholder dengan dokumen asli,
**So that** calon buyer bisa download data lab valid untuk evaluasi teknis.

**Acceptance:**
- Buka edit PRO YD
- Upload PDF baru
- Setelah sukses, link PDF di edit form updated
- Buka public detail PRO YD → klik "Unduh PDF" → file baru download

---

### E3B-S2-US-03 — Admin Retry Upload Setelah Network Error

**As** Manager Pemasaran dengan koneksi tidak stabil,
**I want** retry upload kalau network gagal di tengah,
**So that** saya tidak kehilangan progress dan tidak perlu full re-fill form.

**Acceptance:**
- Saat upload gagal, error message muncul
- Button "Coba lagi" visible
- Klik retry → upload ulang file yang sama tanpa perlu pilih ulang
- Form field lain (nama, deskripsi, spec) tidak ter-reset

---

## Layer 3 — Engineering (Slice 2)

### 3a. Backend Upload Endpoints

#### E3B-S2-BE-01 — Router `POST /products/{id}/upload-photo`

**Priority:** P0 · **Tags:** `backend` `router` `upload`

**File:** `backend/routers/products.py` (extend)

**Konten high-level:**
```python
from fastapi import UploadFile, File, HTTPException, Depends
from backend.services.storage_service import upload_to_storage, delete_from_storage

ALLOWED_PHOTO_MIME = {'image/jpeg', 'image/png', 'image/webp'}
MAX_PHOTO_SIZE = 5 * 1024 * 1024  # 5 MB

@router.post(
    "/{product_id}/upload-photo",
    response_model=ProductDetailResponse,
    dependencies=[Depends(get_current_user)],
)
async def upload_product_photo(
    product_id: str,
    file: UploadFile = File(...),
):
    # 1. Validate MIME
    if file.content_type not in ALLOWED_PHOTO_MIME:
        raise HTTPException(422, f"MIME not allowed: {file.content_type}")

    # 2. Read file + validate size
    contents = await file.read()
    if len(contents) > MAX_PHOTO_SIZE:
        raise HTTPException(422, f"File too large: {len(contents)} bytes")

    # 3. Fetch existing product to get old photo_url
    supabase = get_supabase_service()
    existing = supabase.table("products").select("code, photo_url").eq("id", product_id).limit(1).execute()
    if not existing.data:
        raise HTTPException(404, "Product not found")

    product_code = existing.data[0]['code']
    old_photo_url = existing.data[0]['photo_url']

    # 4. Generate new filename
    ext = file.filename.split('.')[-1].lower()
    timestamp = int(time.time())
    new_filename = f"{product_code.lower().replace(' ', '-').replace('/', '-')}-{timestamp}.{ext}"

    # 5. Upload to Storage
    new_url = upload_to_storage(
        bucket='product-photos',
        filename=new_filename,
        file_bytes=contents,
        content_type=file.content_type,
    )

    # 6. Update DB
    supabase.table("products").update({"photo_url": new_url}).eq("id", product_id).execute()

    # 7. Delete old file (best effort, log error kalau gagal, tidak rollback)
    if old_photo_url:
        try:
            delete_from_storage(bucket='product-photos', url=old_photo_url)
        except Exception as e:
            # Log to Sentry, don't fail request
            logger.warning(f"Failed to delete old photo: {e}")

    # 8. Return updated product
    updated = supabase.table("products").select("*").eq("id", product_id).limit(1).execute()
    return ProductDetailResponse(product=Product(**updated.data[0]))
```

**Verifikasi:** Test upload dengan curl multipart, verify DB updated, old file tidak lagi di bucket.

---

#### E3B-S2-BE-02 — Router `POST /products/{id}/upload-lab-doc`

**Priority:** P0 · **Tags:** `backend` `router` `upload`

Serupa dengan `upload-photo` tapi:
- MIME whitelist: `{'application/pdf'}`
- Max size: `10 * 1024 * 1024` (10 MB)
- Bucket target: `lab-docs`
- Field target: `lab_doc_url`

---

#### E3B-S2-BE-03 — Storage Service Helper

**Priority:** P0 · **Tags:** `backend` `service`

**File:** `backend/services/storage_service.py`

**Fungsi:**
```python
def upload_to_storage(bucket: str, filename: str, file_bytes: bytes, content_type: str) -> str:
    """Upload file to Supabase Storage bucket, return public URL."""
    supabase = get_supabase_service()
    result = supabase.storage.from_(bucket).upload(
        path=filename,
        file=file_bytes,
        file_options={"content-type": content_type, "upsert": "true"},
    )
    public_url = supabase.storage.from_(bucket).get_public_url(filename)
    return public_url

def delete_from_storage(bucket: str, url: str) -> None:
    """Delete file from Supabase Storage by public URL."""
    # Extract filename from public URL
    filename = url.split(f"/{bucket}/")[-1]
    supabase = get_supabase_service()
    supabase.storage.from_(bucket).remove([filename])
```

---

#### E3B-S2-BE-04 — Manual Testing Upload

**Priority:** P0 · **Tags:** `qa` `manual`

**Test dengan curl:**
```bash
JWT="eyJ..."

# Upload photo
curl -X POST -H "Authorization: Bearer $JWT" \
  -F "file=@/path/to/pro-yd-real.jpg" \
  http://localhost:8000/products/{PRO_YD_ID}/upload-photo | jq

# Expected: 200 dengan product.photo_url yang updated

# Upload dengan file salah MIME
curl -X POST -H "Authorization: Bearer $JWT" \
  -F "file=@/path/to/document.docx" \
  http://localhost:8000/products/{PRO_YD_ID}/upload-photo
# Expected: 422

# Upload PDF
curl -X POST -H "Authorization: Bearer $JWT" \
  -F "file=@/path/to/lab-report.pdf" \
  http://localhost:8000/products/{PRO_YD_ID}/upload-lab-doc | jq
```

**Verifikasi:**
- File masuk bucket
- DB `photo_url` updated
- File lama terhapus dari bucket

---

### 3b. Contract

#### E3B-S2-BE-05 — Update `lib/api.ts`

**Priority:** P0 · **Tags:** `contract`

**File:** `lib/api.ts` (extend)

```typescript
export async function uploadProductPhoto(
  id: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<ProductDetailResponse> {
  const formData = new FormData();
  formData.append('file', file);

  return apiFetchMultipart<ProductDetailResponse>(
    `/products/${id}/upload-photo`,
    formData,
    { onProgress }
  );
}

export async function uploadProductLabDoc(
  id: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<ProductDetailResponse> {
  const formData = new FormData();
  formData.append('file', file);

  return apiFetchMultipart<ProductDetailResponse>(
    `/products/${id}/upload-lab-doc`,
    formData,
    { onProgress }
  );
}
```

**Note:** Butuh helper baru `apiFetchMultipart` yang handle FormData + progress callback via `XMLHttpRequest` (fetch tidak native support upload progress).

---

### 3c. Frontend Upload Components

#### E3B-S2-FE-01 — Component `PhotoUploader`

**Priority:** P0 · **Tags:** `frontend` `component` `complex`

**File:** `components/admin/product/PhotoUploader.tsx`

**Interface:**
```typescript
interface Props {
  productId: string;
  currentPhotoUrl: string | null;
  productSlug: string; // untuk revalidate
  onUploadSuccess: (newUrl: string) => void;
}
```

**Behavior high-level:**
- State: `idle | dragging | validating | uploading | success | error`
- Drag-drop area dengan drop handler
- Client-side validation: MIME + size (constants dari config)
- Kalau valid → call `uploadProductPhoto(productId, file, onProgress)`
- Progress bar berdasarkan percentage
- Success: toast + call `revalidateProductRoutes(productSlug)` + call `onUploadSuccess(newUrl)`
- Error: toast + retry button

**Verifikasi:** Upload 5 foto real untuk 5 produk, semua sukses.

---

#### E3B-S2-FE-02 — Component `PDFUploader`

**Priority:** P0 · **Tags:** `frontend` `component`

Serupa dengan `PhotoUploader` tapi:
- Preview: link ke PDF (bukan image thumbnail)
- MIME: `application/pdf` only
- Size: 10 MB
- Call `uploadProductLabDoc` instead

---

#### E3B-S2-FE-03 — Optional Client-Side Image Compression

**Priority:** P2 · **Tags:** `frontend` `optimization`

**Deliverable:** Integrasi `browser-image-compression` library ke `PhotoUploader`.

**Behavior:**
- Sebelum upload, compress foto ke max 1 MB dengan quality 0.8
- Jika resulting size lebih kecil, gunakan compressed version
- Jika compression gagal, fallback ke original

**Trade-off:** Nice-to-have. Klien mungkin punya foto 3-4 MB dari kamera profesional — dengan compression turun ke 500 KB, page load lebih cepat. Kalau tight timeline, defer.

---

#### E3B-S2-FE-04 — Integration ke `ProductEditForm`

**Priority:** P0 · **Tags:** `frontend` `integration`

**Aksi:** Update `ProductEditForm.tsx` (Slice 1) untuk include 2 uploader di section terpisah:

```typescript
<section>
  <h2>Foto Produk</h2>
  <PhotoUploader
    productId={product.id}
    currentPhotoUrl={currentPhoto}
    productSlug={product.slug}
    onUploadSuccess={(newUrl) => setCurrentPhoto(newUrl)}
  />
</section>

<section>
  <h2>Dokumen Uji Lab</h2>
  <PDFUploader
    productId={product.id}
    currentPdfUrl={currentPdf}
    productSlug={product.slug}
    onUploadSuccess={(newUrl) => setCurrentPdf(newUrl)}
  />
</section>
```

**Penting:** Upload adalah **operasi terpisah** dari form submit. Klien bisa upload foto tanpa harus submit form utama, atau sebaliknya. Ini karena upload butuh mutation langsung + revalidate langsung (tidak bisa "batch" bareng form submit).

---

#### E3B-S2-FE-05 — Helper `apiFetchMultipart` di `lib/api.ts`

**Priority:** P0 · **Tags:** `frontend` `utility`

**File:** `lib/api.ts`

Pakai `XMLHttpRequest` (bukan `fetch`) karena butuh upload progress event:

```typescript
export async function apiFetchMultipart<T>(
  path: string,
  formData: FormData,
  options: { onProgress?: (percent: number) => void } = {}
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}${path}`);
    xhr.setRequestHeader('Authorization', `Bearer ${getJwtFromSession()}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && options.onProgress) {
        options.onProgress((e.loaded / e.total) * 100);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.response));
      } else {
        reject(new Error(xhr.responseText || 'Upload failed'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(formData);
  });
}
```

**Verifikasi:** Progress callback dipanggil dengan value 0-100 selama upload.

---

#### E3B-S2-FE-06 — Server Action Revalidate Setelah Upload

**Priority:** P0 · **Tags:** `frontend` `integration`

**Aksi:** Sudah tercakup di `PhotoUploader.onUploadSuccess` (call `revalidateProductRoutes(productSlug)`). Task ini adalah verifikasi eksplisit test flow lengkap.

---

## Layer 4 — QA Tasks (Slice 2)

### E3B-S2-QA-01 — E2E Upload Test Semua Produk

**Priority:** P0 · **Tags:** `qa` `e2e`

Upload foto real dari klien untuk 5 produk:
- [ ] PRO YD
- [ ] PRO L
- [ ] SPO/M
- [ ] Petani Premium
- [ ] GHPT

Verify:
- Preview update di edit form
- Public grid & detail page tampilkan foto baru dalam < 1 detik
- Old placeholder file terhapus dari Storage (verify manual di Dashboard)

---

### E3B-S2-QA-02 — E2E Upload PDF Semua Produk

**Priority:** P0 · **Tags:** `qa` `e2e`

Sama seperti QA-01 tapi untuk PDF lab (5 produk).

---

### E3B-S2-QA-03 — Test Error Handling

**Priority:** P0 · **Tags:** `qa`

Test skenario error:
- [ ] Upload file > 5 MB untuk foto → validation error inline, no submit
- [ ] Upload .docx untuk photo endpoint → validation error inline
- [ ] Upload PDF ke photo endpoint → validation error
- [ ] Simulasi network kill di tengah upload → retry button appear
- [ ] Retry setelah error → upload sukses

---

### E3B-S2-QA-04 — Test Old File Cleanup

**Priority:** P0 · **Tags:** `qa` `data-integrity`

**Test:**
1. Sebelum upload, cek Supabase Dashboard → Storage → product-photos, catat count file
2. Upload foto baru untuk PRO YD
3. Setelah upload, cek Storage lagi — count sama (file lama diganti file baru, bukan tambah)
4. Verify old public URL return 404

**Kalau file lama masih ada:** cleanup logic tidak jalan, investigate `delete_from_storage` function.

---

### E3B-S2-QA-05 — Client Demo Script Slice 2

**Priority:** P0 · **Tags:** `demo` `sign-off`

**File:** `docs/demos/epic3B_slice2_demo_script.md`

**Struktur demo (~10 menit):**
1. **Recap (30 detik)** — "Slice 1 kita bisa edit teks. Sekarang lengkap dengan upload foto & PDF."
2. **Live upload PRO YD (3 menit)** — klien sendiri upload foto asli PRO YD (bukan Anda), tunjukkan preview + refresh public → foto muncul
3. **Live upload PDF (2 menit)** — klien upload PDF lab asli PRO YD
4. **Retry demo (1 menit)** — simulasi drag file .docx → error inline muncul, tunjukkan validation working
5. **Batch demo (2 menit)** — upload 2 produk lagi cepat
6. **Handover keys (1 menit)** — "Sekarang panel admin Anda sudah lengkap. Untuk edit produk atau upload asset, cukup akses `/admin/products` dengan kredensial yang sudah dibuat."
7. **Roadmap Epic 4 (30 detik)** — "Selanjutnya kita bangun sistem RFQ dengan AI proposal generator."

**Sign-off:** Klien setuju panel admin fully functional, siap untuk operasi mandiri.

---

## Definition of Done — Slice 2

**Backend:**
- [ ] `POST /products/{id}/upload-photo` accessible, MIME + size validation
- [ ] `POST /products/{id}/upload-lab-doc` accessible, PDF only, 10 MB
- [ ] Old file cleanup jalan (verified di Storage)
- [ ] Auth guard aktif (401 tanpa JWT)
- [ ] Deploy Railway production

**Frontend:**
- [ ] `PhotoUploader` component: drag-drop, preview, progress, error handling
- [ ] `PDFUploader` component: PDF-specific with link preview
- [ ] Client-side validation MIME + size
- [ ] `apiFetchMultipart` helper dengan progress callback
- [ ] Integration ke `ProductEditForm` (2 section terpisah)
- [ ] Cache invalidation setelah upload sukses

**Integration:**
- [ ] Upload 5 foto + 5 PDF real dari klien sukses (via demo)
- [ ] Preview update immediately
- [ ] Public reflect < 1 detik
- [ ] Old file terhapus dari Storage

**Kualitas kode:**
- [ ] `pnpm tsc --noEmit` pass
- [ ] `pnpm lint` pass
- [ ] Error boundary handle upload failure gracefully

**QA:**
- [ ] E2E test 5 foto + 5 PDF pass
- [ ] Error handling test 5 skenario pass
- [ ] Cleanup verified untuk 5 produk

**Demo:**
- [ ] Client demo dilakukan — **klien sendiri yang operate upload** (bukan Anda)
- [ ] Sign-off Epic 3B complete
- [ ] Handover kredensial admin ke klien

---

# Handover ke Epic 4 (RFQ System) — Preview

Setelah Epic 3B selesai, Epic 3 fully closed (customer-facing + admin panel). Selanjutnya **Epic 4 — RFQ System dengan AI Proposal Generator**:

- Tabel baru `rfq_submissions` referencing `products` (foreign key)
- CTA di detail produk (Slice 2 Epic 3 customer-facing) yang saat ini link ke `/kontak?produk=...&intent=...` akan **repurposed** — CTA utama link ke `/rfq/new?produk={slug}`, `/kontak` jadi fallback secondary
- Form RFQ dengan input volume, timeline, industry
- Backend service Anthropic API untuk generate proposal draft
- Admin panel `/admin/rfq` untuk manage submitted RFQ
- Email notification ke sales team

**Epic 4 akan ada task breakdown terpisah.**

---

## Catatan Penutup

**Yang perlu Anda evaluasi ulang sebelum eksekusi:**

**1. Custom Field di SpecJSONBEditor — apakah benar-benar butuh?**

Trade-off:
- **Kalau iya:** UX lebih fleksibel, klien tidak stuck kalau ada spec baru
- **Kalau tidak:** UX lebih guided, klien tidak bisa introduce typo di key (mis. `nacl_prcnt` alih-alih `nacl_pct`)

Rekomendasi: **Iya, tapi dengan validation ketat** (regex `/^[a-z][a-z0-9_]*$/`). Kalau Anda prefer simpler UX (drop custom field, hanya registry), tinggal remove dari spec.

**2. Backend upload endpoint validation kedalaman**

Slice 2 basic validation adalah MIME + size. Belum ada:
- Virus scan (bisa integrate ClamAV, tapi berat untuk internal admin panel dengan 1-2 user trusted)
- Image dimension validation (foto minimum 800×600 untuk quality)
- PDF text extraction untuk verify bukan corrupt

Untuk MVP internal admin, current validation cukup. Kalau nanti scale up ke multi-tenant atau external user, tambah layer validation.

**3. Optimistic UI vs Refetch (AR-09)**

Kalau klien komplain "kok save butuh 2 detik", pertimbangkan optimistic UI di edit form. Tapi trade-off code complexity — untuk internal tool, refetch acceptable.

**4. Drag-drop reorder di list page**

Saya defer sebagai enhancement. Kalau klien sering re-order produk (mis. musiman), drag-drop bakal lebih nyaman dari edit `sort_order` manual. Tambah di enhancement backlog kalau demand tinggi.

---

**File:** `docs/epic-breakdown/epic3B_task_breakdown_admin-panel.md`
**Version:** 1.0 — 2026-07-05
