# Epic 5 Task Breakdown — Pendaftaran Supplier (Customer-Facing)

**Project:** reka-cipta-platform
**Epic:** Epic 5 — Pendaftaran Supplier
**Scope Dokumen:** Bagian **A. Customer-Facing Web** saja
**Version:** 1.0
**Author:** Ach. Jazilul Qutbi
**Status:** Draft — menunggu review sebelum eksekusi
**Depends on:** Epic 1, Epic 2 (semua — pattern email service via Resend, pattern rate limiting via slowapi, pattern InnerPageHero, `company_settings` untuk email admin destination)
**Blocks:** Epic 5 Admin Panel (list + detail supplier)

---

## Konteks Slice

Setelah Epic 4 (RFQ + Proposal) live, sisi **buyer** end-to-end sudah lengkap: calon partner bisa submit RFQ, admin generate proposal, kirim ke customer. Epic 5 melengkapi sisi **supplier** — jalur formal bagi petani dan produsen garam untuk mendaftar sebagai supplier via website.

Alur end-to-end user setelah Slice ini selesai:
1. Petani/produsen garam masuk ke website via navbar link "Jadi Supplier" atau URL direct (dari SEO / marketing offline)
2. Baca section penjelasan manfaat kemitraan
3. Isi form pendaftaran (10 field)
4. Submit → data tersimpan di `supplier_registrations` dengan `status = 'new'`
5. Admin (Irwan Sugianto) dapat notifikasi email real-time
6. Supplier di-redirect ke halaman `/jadi-supplier/terima-kasih`
7. Supplier expect follow-up via WhatsApp dalam 2-3 hari kerja (dari copy halaman konfirmasi)

**Admin flow-nya (Epic 5 Admin Panel — dokumen terpisah)** kick in dari step 5 onwards: supplier baru muncul di `/admin/suppliers`, admin bisa update status → verified → active → inactive, generate WA template follow-up.

**Slice tunggal untuk customer-facing karena:**
- Cuma 2 halaman baru (`/jadi-supplier` + `/jadi-supplier/terima-kasih`)
- 1 backend endpoint public (no AI complexity)
- 1 tabel baru (`supplier_registrations`)
- Tidak ada cross-slice touch (Epic 5 CF fully independent dari Epic 3, Epic 4)

Kalau di-split lebih lanjut, effort split lebih besar dari effort execute — sama dengan alasan Epic 4 CF single-slice.

---

## Prasyarat Teknis

- [ ] Epic 1 selesai: middleware, Navbar/Footer, Sentry, `lib/env.ts`, `lib/supabase/public.ts`
- [ ] Epic 2 Slice 3 selesai: pattern email service via Resend + pattern rate limiting via slowapi (dari `/contact/send` endpoint)
- [ ] Epic 4 CF selesai: pattern `set_updated_at()` trigger sudah ada di DB (reuse untuk `supplier_registrations`); pattern rate limit + email extension sudah live di production
- [ ] `company_settings` table punya field `email` (untuk admin notification destination)
- [ ] Resend domain verified, API key set di env production
- [ ] Navbar (Epic 1 UX-02) sudah punya slot untuk tambah link "Jadi Supplier" (verify existing struktur)

---

## Keputusan Arsitektur Slice

### AR-01 — Tidak Ada Cross-Slice Prefill (Independent dari Epic 3/4)

Berbeda dengan Epic 4 CF yang di-redirect dari Epic 3 detail produk (CTA "Dapatkan Penawaran"), Epic 5 CF **tidak ada** cross-slice redirect. Entry point pendaftaran supplier:
1. Navbar link "Jadi Supplier"
2. Direct URL (dari SEO, offline marketing, atau word-of-mouth klien)

**Konsekuensi:** tidak ada query param prefill logic. Form selalu start dari state kosong. Simpler than Epic 4 CF.

**Enhancement future (skip MVP):** CTA di halaman "Tentang Kami" section jaringan supplier untuk drive traffic — enhancement setelah Epic 5 live dan validated demand.

### AR-02 — Rate Limiting: 5 per IP per Jam (Konsisten Epic 4 CF)

Threshold sama dengan `POST /rfq/submit` (Epic 4 CF AR-02). Rasional:
- Legitimate supplier registration volume rendah (expected 5-20 supplier per bulan awal)
- Bot spam ter-throttle
- Pattern `@limiter.limit("5/hour")` sudah proven di Epic 4 CF

**Konsekuensi env vars:** `slowapi` sudah installed dari Epic 2 Slice 3, tidak butuh install ulang.

### AR-03 — Email Notification Template Hardcoded

Content email notifikasi ke admin: personalized dengan nama usaha supplier, lokasi, jenis garam, kapasitas, kontak. Template **hardcoded** di backend `backend/services/email_service.py` untuk Slice ini.

Template content (contoh):
```
Subject: [CV Reka Cipta] Supplier Baru Mendaftar — {business_name}

Halo Tim CV Reka Cipta,

Ada pendaftaran supplier baru yang perlu ditindaklanjuti:

Nama Usaha    : {business_name}
Lokasi        : {location_city}, {location_province}
Jenis Garam   : {salt_types_readable}
Kapasitas     : {capacity_per_month} {capacity_unit}/bulan
WhatsApp      : {whatsapp}
Email         : {email_or_dash}

Keterangan tambahan:
{additional_notes_or_dash}

Segera hubungi supplier dalam 2-3 hari kerja untuk verifikasi.

Link ke admin panel: {admin_panel_url_placeholder}
```

`{admin_panel_url_placeholder}` = URL ke `/admin/suppliers/{id}` — link work saat Epic 5 Admin Panel live. Untuk Slice CF ini, generate URL sesuai konvensi (walaupun halaman belum ada, URL structure sudah fixed).

**Editability via admin settings di-defer ke Post-MVP** (mengikuti pola Epic 4 CF AR-03 → Slice 3 Post-MVP). Konsisten dengan MVP philosophy — jangan build customization tanpa validated demand.

**TIDAK ada email confirmation ke supplier.** Justifikasi:
- Field `email` di form supplier adalah **opsional** (per spec Epic Doc)
- Kalau supplier tidak isi email, tidak ada tujuan kirim confirmation
- Confirmation happens via WhatsApp follow-up admin (2-3 hari kerja)
- Kalau di future klien mau supplier confirmation email juga → enhancement, cukup add optional email send di endpoint

### AR-04 — Halaman Konfirmasi: Accept Direct URL Access

Konsisten dengan Epic 4 CF AR-04. Alternatif access control (sessionStorage flag, cookie, referrer check) semua punya trade-off UX vs security. Untuk MVP, **accept direct URL access** ke `/jadi-supplier/terima-kasih`.

Konsekuensi: user yang share URL, atau bookmark, bisa akses halaman ini tanpa submit. **Not a security issue** — halaman tidak leak data.

### AR-05 — Rendering Strategy

- `/jadi-supplier` — **Static full** (form structure statis, jenis garam checkbox hardcoded konstanta bukan dari DB — lihat AR-07). Konsekuensi: rebuild time zero fetch.
- `/jadi-supplier/terima-kasih` — **Static full** (no data fetch).

Berbeda dengan Epic 4 CF di mana `/minta-penawaran` = static + revalidate 3600 karena fetch produk dari DB. Epic 5 CF tidak butuh fetch apa pun untuk render form.

### AR-06 — Field Validation Boundary: Server-Side Authoritative

Konsisten dengan Epic 4 CF AR-07. Frontend validation via Zod = UX layer (feedback cepat). Backend validation via Pydantic = security layer (source of truth).

Zod schema di `lib/validation/supplier-schema.ts` dan Pydantic schema di `backend/schemas/supplier.py` **wajib manual sync**.

### AR-07 — Jenis Garam: Hardcoded Konstanta, Bukan DB Reference

Field "Jenis Garam Tersedia" di form supplier adalah taxonomy **internal supplier** (kategori raw material), berbeda dengan tabel `products` (product end-user yang di-jual Reka Cipta ke buyer).

Value hardcoded di 1 tempat untuk sync antara frontend & backend:

```typescript
// lib/constants/supplier-salt-types.ts
export const SUPPLIER_SALT_TYPES = [
  { value: 'kasar_petani', label: 'Kasar Petani' },
  { value: 'halus_yodium', label: 'Halus Yodium' },
  { value: 'halus_non_yodium', label: 'Halus Non-Yodium' },
  { value: 'industri_spo_m', label: 'Industri (SPO/M)' },
  { value: 'ghpt', label: 'GHPT' },
] as const;

export type SupplierSaltTypeValue = typeof SUPPLIER_SALT_TYPES[number]['value'];
```

Backend mirror ke `backend/constants/supplier.py`:
```python
SUPPLIER_SALT_TYPES = {
    'kasar_petani', 'halus_yodium', 'halus_non_yodium',
    'industri_spo_m', 'ghpt',
}
```

**Justifikasi hardcoded:**
- 5 opsi ini stable — tidak akan sering berubah
- Overhead DB table + admin CRUD untuk 5 baris = premature complexity
- Kalau nanti klien mau tambah/edit → migration 5 menit, more time-efficient than admin CRUD MVP

**Konsekuensi:** kalau klien minta tambah opsi baru saat MVP, treat sebagai code change + deploy, bukan config change. Manage expectation upfront.

### AR-08 — WhatsApp Format: Store Cleaned, Display Original

Whatsapp number di-cleaned di backend sebelum insert (strip spaces, dashes, parentheses; normalize ke `+62` prefix atau `08` prefix — belum diputuskan format canonical mana). Konsisten dengan Epic 4 CF pattern.

**Decision:** normalize ke format `+62xxx` di database. Rasional:
- Konsisten dengan format international
- Reversible ke `08xxx` display kalau perlu di UI
- Match dengan `wa.me/{62xxx}` URL format (tanpa `+`)

Contoh: input `081234567890` → stored `+6281234567890` → display di admin panel `+62 812-3456-7890` (formatter di admin panel).

### AR-09 — Field `additional_notes`: Max 500 karakter

Konsisten dengan `notes` field di Epic 4 CF (`max_length=500`). Batas ini prevent supplier menulis novel di textarea.

### AR-10 — Kapasitas Unit: Enum Strict, Bukan Free Text

Field `capacity_unit` = enum `{'ton', 'kwintal', 'kg'}`. Berbeda dengan Epic 4 CF yang `delivery_frequency` juga enum. Alternatif free text = klien nanti bingung karena data inconsistent (`ton`, `Ton`, `TONs`, `T`).

**JANGAN** auto-convert antar unit di backend saat insert. Store apa adanya. Konversi (untuk analytics kalau perlu) di layer application.

### AR-11 — Status Default `'new'`, Enum Fixed 4 Values

Enum status: `{'new', 'verified', 'active', 'inactive'}`. Berbeda dengan Epic 4 CF lead status yang 6 value (`new, contacted, sample_sent, negotiation, deal, lost`) — konteks supplier lifecycle lebih pendek.

Public endpoint HANYA insert dengan `status = 'new'`. Field `status` di RLS INSERT policy enforce ini (defense in depth).

---

## Ringkasan Task per Layer

| Layer | Task Count | Fokus |
|---|---|---|
| UX | 5 | Wireframe form + konfirmasi + spec komponen kompleks |
| US | 4 | 4 user story utama |
| Backend | 5 | Migration + endpoint + email extend + rate limit + deploy test |
| Contract | 1 | Types + lib/api |
| Frontend | 7 | Route + form + salt checkbox + navbar update + error boundary |
| QA | 4 | E2E + rate limit + validation + demo |

**Total: 26 task.** Estimasi effort: 3-4 hari kerja (lebih ringan dari Epic 4 CF yang 32 task karena tidak ada prefill cross-slice + tidak ada fetch produk dari DB).

---

## Layer 1 — UX Tasks

### E5-CF-UX-01 — Wireframe `/jadi-supplier`

**Priority:** P0 · **Tags:** `wireframe` `public`

**Deliverable:** `docs/wireframes/Epic5_slice1_supplier-form.md`

**Struktur wireframe:**
```
┌─────────────────────────────────────────────────┐
│  <Navbar />                                     │
├─────────────────────────────────────────────────┤
│  <InnerPageHero                                 │  ← reuse Epic 2 Slice 2
│    title="Jadi Supplier Reka Cipta"             │
│    subtitle="Bermitra dengan distributor..."    │
│    breadcrumb=[Beranda / Jadi Supplier]         │
│  />                                             │
├─────────────────────────────────────────────────┤
│  <BenefitsSection>                              │
│    3-column grid (desktop) / stacked (mobile):  │
│    [Distribusi Luas] [Pembelian Rutin] [Harga Adil] │
│    Each with icon + heading + 1-2 sentences     │
│  </BenefitsSection>                             │
├─────────────────────────────────────────────────┤
│  <SupplierRegistrationForm>                     │
│    <FormSection title="Informasi Usaha">        │
│      [Nama / Nama Usaha*  ]                     │
│      [Kota*               ]                     │
│      [Provinsi*           ]                     │
│    </FormSection>                               │
│                                                 │
│    <FormSection title="Produk Garam">           │
│      Jenis Garam Tersedia* (min 1):             │
│      ☐ Kasar Petani                             │
│      ☐ Halus Yodium                             │
│      ☐ Halus Non-Yodium                         │
│      ☐ Industri (SPO/M)                         │
│      ☐ GHPT                                     │
│      [Kapasitas per Bulan*] [Satuan▼*]          │
│    </FormSection>                               │
│                                                 │
│    <FormSection title="Kontak">                 │
│      [WhatsApp*           ]                     │
│      [Email               ] (opsional)          │
│      [Keterangan Tambahan ] (textarea, opsional)│
│    </FormSection>                               │
│                                                 │
│    <Info block>                                 │
│      Setelah submit, tim kami akan menghubungi  │
│      via WhatsApp dalam 2-3 hari kerja.         │
│    </Info>                                      │
│                                                 │
│    [Daftar Sebagai Supplier]                    │
│  </SupplierRegistrationForm>                    │
├─────────────────────────────────────────────────┤
│  <Footer />                                     │
└─────────────────────────────────────────────────┘
```

**Copy `<BenefitsSection>`:**

| Icon | Heading | Body |
|---|---|---|
| 🌐 | Distribusi Luas | Produkmu terhubung ke jaringan buyer industri di seluruh Indonesia melalui CV Reka Cipta. |
| 🔁 | Pembelian Rutin | Kontrak jangka panjang dengan volume pembelian tetap setiap bulan. |
| ⚖️ | Harga Adil | Harga negosiasi transparan berbasis kualitas dan kapasitas produksi. |

Copy final wajib finalize dengan klien saat demo.

**Responsive:**
- Desktop: form max-width 720px, centered
- Mobile: full-width dengan padding horizontal 16px
- BenefitsSection: 3-col desktop, single-col stack mobile

**Verifikasi:** Wireframe committed.

---

### E5-CF-UX-02 — Wireframe `/jadi-supplier/terima-kasih`

**Priority:** P0 · **Tags:** `wireframe` `public`

**Deliverable:** Section di file wireframe yang sama.

**Struktur:**
```
┌─────────────────────────────────────────────────┐
│  <Navbar />                                     │
├─────────────────────────────────────────────────┤
│  <ConfirmationHero centered>                    │
│    [✓ Success Icon]                             │
│                                                 │
│    Pendaftaran Berhasil Dikirim!                │
│                                                 │
│    Terima kasih atas ketertarikan Anda menjadi  │
│    mitra supplier CV Reka Cipta.                │
│                                                 │
│    Tim kami akan menghubungi via WhatsApp       │
│    dalam 2-3 hari kerja untuk proses            │
│    verifikasi selanjutnya.                      │
│                                                 │
│    [Kembali ke Beranda] [Lihat Tentang Kami]    │
│  </ConfirmationHero>                            │
├─────────────────────────────────────────────────┤
│  <Footer />                                     │
└─────────────────────────────────────────────────┘
```

Pattern layout **konsisten** dengan `/minta-penawaran/terima-kasih` (Epic 4 CF UX-02) supaya UX predictable across form-submit flows.

**Verifikasi:** Wireframe committed.

---

### E5-CF-UX-03 — Spec Component `SupplierRegistrationForm` (Client Component)

**Priority:** P0 · **Tags:** `component-spec` `client-component` `complex`

**Deliverable:** Section detail di wireframe.

**Behavior:**
- Client Component (`'use client'`) — pakai `react-hook-form` + Zod
- 3 section grouped: Informasi Usaha, Produk Garam, Kontak
- Field validation inline (on blur, tidak on change — konsisten Epic 4 CF UX-03)
- Submit button:
  - Default: enabled, label "Daftar Sebagai Supplier"
  - Loading: disabled, spinner + label "Mengirim..."
  - Success: redirect (button state irrelevant)
  - Error: enabled, toast merah + inline error kalau applicable

**States:**
1. **Idle** — form pristine
2. **Filling** — user typing, submit enabled
3. **Validating (blur)** — inline error muncul untuk field invalid
4. **Submitting** — button disabled + spinner
5. **Success** — redirect ke `/jadi-supplier/terima-kasih`
6. **Error (network/server)** — toast merah + button re-enabled + form data preserved
7. **Error (rate limit 429)** — toast merah "Terlalu banyak permintaan. Coba lagi dalam 1 jam." + button disabled 60 detik dengan countdown

**Tidak ada prefill logic** (AR-01) — form selalu start kosong.

**Verifikasi:** Section spec committed.

---

### E5-CF-UX-04 — Spec Component `SupplierSaltTypesCheckboxGroup`

**Priority:** P0 · **Tags:** `component-spec` `static`

**Deliverable:** Section spec.

**Behavior:**
- Terima props: `value: string[]`, `onChange: (value: string[]) => void`
- Render checkbox per opsi dari konstanta `SUPPLIER_SALT_TYPES` (AR-07) — 5 rows
- Label format: `{label}` — contoh "Kasar Petani"
- Vertical stack (bukan grid) untuk readability, konsisten dengan Epic 4 CF UX-04

**Design:**
- Focus visible ring untuk keyboard navigation
- Label clickable (semantic `<label htmlFor>`)
- Spacing antar checkbox 12px

**Validation:**
- Minimal 1 checkbox tercentang
- Kalau 0, inline error "Pilih minimal 1 jenis garam"

**Perbedaan dari Epic 4 CF `SaltTypeCheckboxGroup`:**
- Epic 4 CF fetch produk dari DB (5 produk end-user)
- Epic 5 CF pakai konstanta hardcoded (5 kategori supplier taxonomy)
- **Nama component berbeda** untuk avoid confusion: `SupplierSaltTypesCheckboxGroup`

Jangan reuse component Epic 4 CF — konteks bisnis beda, coupling bikin fragile.

---

### E5-CF-UX-05 — Edge States Form

**Priority:** P1 · **Tags:** `edge-case`

**Deliverable:** Section di wireframe.

**Skenario:**

1. **Validation error single field** — inline error muncul, form scroll ke field pertama yang error
2. **Validation error salt_types = 0** — inline error di checkbox group section, submit blocked
3. **Rate limit hit (429)** — toast + button disabled 60 detik dengan countdown ("Coba lagi dalam 58 detik...")
4. **Network error** — toast merah + button re-enabled + form data preserved (jangan reset)
5. **Server 500** — sama seperti network error + log ke Sentry via `Sentry.captureException`
6. **Success** — redirect ke `/jadi-supplier/terima-kasih`
7. **User isi email tidak valid tapi email = opsional** — kalau field kosong, skip validation. Kalau field ada isinya tapi format salah, tampilkan inline error "Format email tidak valid"
8. **WhatsApp format salah** — inline error "Format WhatsApp: 08xxx atau +62xxx"
9. **Kapasitas number negatif atau 0** — inline error "Kapasitas harus lebih dari 0"

**Verifikasi:** Section committed.

---

## Layer 2 — User Stories

### E5-CF-US-01 — Petani/Produsen Submit Pendaftaran Supplier

**As** petani garam / produsen garam yang cari buyer stable,
**I want** mengisi form pendaftaran supplier dengan minimum friction,
**So that** saya bisa cepat masuk pipeline supplier CV Reka Cipta tanpa harus telpon manual.

**Acceptance:**
- Form single-page (no multi-step wizard)
- Field mandatory jelas (asterisk merah)
- Field opsional label eksplisit "(opsional)"
- Validation feedback muncul saat blur, bukan saat typing
- Submit < 5 detik return response
- Setelah submit sukses, redirect ke halaman konfirmasi yang clear

---

### E5-CF-US-02 — Admin Dapat Notifikasi Real-Time

**As** admin (Irwan Sugianto) yang tanggung jawab supplier onboarding,
**I want** dapat email notifikasi setiap supplier baru mendaftar,
**So that** saya tidak perlu manual cek database dan bisa follow-up dalam 2-3 hari kerja.

**Acceptance:**
- Email delivered ke admin address dalam < 30 detik setelah supplier submit
- Subject: "Supplier Baru Mendaftar — {business_name}"
- Body: summary field utama (nama usaha, lokasi, jenis garam, kapasitas, WhatsApp, email, keterangan)
- Link ke admin panel supplier detail (URL structure fixed, walaupun page belum live saat Slice CF ini — link akan work saat Epic 5 Admin Panel live)

---

### E5-CF-US-03 — Konfirmasi Pendaftaran Jelas

**As** supplier yang baru submit form,
**I want** landing di halaman konfirmasi yang jelas (pendaftaran berhasil, expected next steps),
**So that** saya yakin submit sukses dan tahu kapan expect follow-up.

**Acceptance:**
- Setelah submit sukses, redirect otomatis ke `/jadi-supplier/terima-kasih`
- Halaman menampilkan visual success (icon check)
- Message jelas: "Tim akan hubungi via WhatsApp dalam 2-3 hari kerja"
- 2 CTA untuk navigate: Beranda + Tentang Kami
- Kalau user refresh atau share URL halaman ini, tetap render tanpa error

---

### E5-CF-US-04 — Anti-Spam via Rate Limit

**As** admin (sekaligus product owner),
**I want** endpoint pendaftaran supplier terproteksi dari spam,
**So that** admin tidak flood dengan pendaftaran fake dan email notification tidak overwhelmed.

**Acceptance:**
- Maksimum 5 pendaftaran per IP per jam
- Attempt ke-6 return 429 dengan message clear
- Legitimate user tidak accidentally hit limit (5 retry masih cukup untuk kasus wajar)
- Log rate limit hit ke Sentry untuk monitoring

---

## Layer 3 — Engineering

### 3a. Database

#### E5-CF-DB-01 — Migration Create Table `supplier_registrations`

**Priority:** P0 · **Tags:** `migration` `database`

**File:** `supabase/migrations/{ts}_create_supplier_registrations_table.sql`

**Schema:**
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

-- Reuse function set_updated_at() dari Epic 3 / Epic 4
CREATE TRIGGER trigger_supplier_set_updated_at
    BEFORE UPDATE ON public.supplier_registrations
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

**Catatan penting:**
- `email` NULLABLE (per spec Epic Doc — opsional)
- `admin_notes` di-include walaupun tidak di-use di customer-facing — schema stability, jangan alter table saat Admin Panel slice
- `salt_types_available` type `TEXT[]` konsisten dengan `salt_types` di `rfq_leads` (Epic 4 CF)
- `CHECK array_length >= 1` di schema level = defense in depth (Pydantic + Zod juga validate, tapi DB constraint = last line)
- Function `set_updated_at()` reuse dari Epic 3. Kalau belum ada di project (extreme edge case), create di migration ini.

**Verifikasi:**
```sql
INSERT INTO public.supplier_registrations
  (business_name, location_city, location_province, salt_types_available,
   capacity_per_month, capacity_unit, whatsapp)
VALUES
  ('Petani Garam Jaya', 'Pamekasan', 'Jawa Timur', ARRAY['kasar_petani'],
   50, 'ton', '+628123456789');

SELECT * FROM supplier_registrations LIMIT 1;
-- Expected: 1 row dengan status = 'new', created_at + updated_at populated
```

---

#### E5-CF-DB-02 — Migration RLS Policies

**Priority:** P0 · **Tags:** `migration` `security` `rls`

**File:** `supabase/migrations/{ts}_supplier_registrations_rls.sql`

**Konten:**
```sql
ALTER TABLE public.supplier_registrations ENABLE ROW LEVEL SECURITY;

-- Public bisa INSERT (untuk pendaftaran dari form public)
-- Backend legitimate pakai service_role (bypass RLS), tapi tetap declare untuk defense in depth
CREATE POLICY "Public can submit supplier registration"
    ON public.supplier_registrations
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        status = 'new'
        AND admin_notes IS NULL
    );

-- Authenticated (admin) bisa SELECT/UPDATE/DELETE
CREATE POLICY "Admin can read all suppliers"
    ON public.supplier_registrations FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Admin can update suppliers"
    ON public.supplier_registrations FOR UPDATE TO authenticated
    USING (TRUE) WITH CHECK (TRUE);

CREATE POLICY "Admin can delete suppliers"
    ON public.supplier_registrations FOR DELETE TO authenticated USING (TRUE);
```

**Catatan RLS INSERT (konsisten dengan Epic 4 CF DB-02):** Public policy enforce state initial — mencegah anon accidentally bypass status atau prefill `admin_notes` via direct Supabase call. Backend endpoint yang legitimate pakai service_role → RLS bypass, jadi tidak affected.

**Verifikasi manual di Supabase Dashboard SQL Editor:**
```sql
SET ROLE anon;
-- Valid insert
INSERT INTO public.supplier_registrations
  (business_name, location_city, location_province, salt_types_available,
   capacity_per_month, capacity_unit, whatsapp)
VALUES
  ('Test Anon', 'X', 'Y', ARRAY['kasar_petani'], 10, 'ton', '+628111');
-- Expected: SUCCESS

-- Invalid insert (preset admin_notes)
INSERT INTO public.supplier_registrations
  (business_name, location_city, location_province, salt_types_available,
   capacity_per_month, capacity_unit, whatsapp, admin_notes)
VALUES
  ('Test Anon 2', 'X', 'Y', ARRAY['kasar_petani'], 10, 'ton', '+628111', 'hack');
-- Expected: FAIL (RLS reject)

RESET ROLE;
DELETE FROM public.supplier_registrations WHERE business_name LIKE 'Test Anon%';
```

---

### 3b. Backend

#### E5-CF-BE-01 — Pydantic Schemas

**Priority:** P0 · **Tags:** `backend` `schema`

**File:** `backend/schemas/supplier.py`

**Konten:**
```python
from pydantic import BaseModel, ConfigDict, Field, EmailStr, field_validator
import re

# AR-07: hardcoded konstanta, mirror dari lib/constants/supplier-salt-types.ts
SUPPLIER_SALT_TYPES = {
    'kasar_petani', 'halus_yodium', 'halus_non_yodium',
    'industri_spo_m', 'ghpt',
}

CAPACITY_UNITS = {'ton', 'kwintal', 'kg'}


class SupplierRegisterRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')  # security: reject unknown fields

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
        # Dedup + strip
        cleaned = [s.strip() for s in v if s.strip()]
        if not cleaned:
            raise ValueError("At least one salt type required")
        # Validate each value
        invalid = [s for s in cleaned if s not in SUPPLIER_SALT_TYPES]
        if invalid:
            raise ValueError(f"Invalid salt types: {invalid}")
        return list(dict.fromkeys(cleaned))  # preserve order, remove dup

    @field_validator('whatsapp')
    def validate_whatsapp(cls, v: str) -> str:
        # Accept: 08xxx, +62xxx, 62xxx → normalize ke +62xxx
        cleaned = re.sub(r'[\s\-()]', '', v)
        if not re.match(r'^(\+62|62|0)8\d{7,12}$', cleaned):
            raise ValueError("Invalid WhatsApp number format")
        # Normalize ke +62 prefix (AR-08)
        if cleaned.startswith('0'):
            cleaned = '+62' + cleaned[1:]
        elif cleaned.startswith('62'):
            cleaned = '+' + cleaned
        return cleaned


class SupplierRegisterResponse(BaseModel):
    success: bool
    supplier_id: str
    message: str = "Pendaftaran supplier berhasil"
```

**Verifikasi:**
- Test valid payload → validate pass, `whatsapp` normalized ke `+62xxx`
- Test payload dengan `capacity_unit: "TON"` → 422 (case-sensitive strict)
- Test payload dengan `salt_types_available: []` → 422
- Test payload dengan `salt_types_available: ["unknown"]` → 422
- Test payload dengan `email: "not-an-email"` → 422 (via EmailStr)
- Test payload tanpa `email` → 200 (opsional)

---

#### E5-CF-BE-02 — Router `POST /supplier/register`

**Priority:** P0 · **Tags:** `backend` `router` `public` `rate-limit`

**File:** `backend/routers/supplier.py`

**Konten:**
```python
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
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
@limiter.limit("5/hour")  # AR-02
async def register_supplier(
    request: Request,  # WAJIB untuk slowapi
    payload: SupplierRegisterRequest,
) -> SupplierRegisterResponse:
    supabase = get_supabase_service()

    # Insert supplier registration
    result = supabase.table("supplier_registrations").insert({
        "business_name": payload.business_name,
        "location_city": payload.location_city,
        "location_province": payload.location_province,
        "salt_types_available": payload.salt_types_available,
        "capacity_per_month": payload.capacity_per_month,
        "capacity_unit": payload.capacity_unit,
        "whatsapp": payload.whatsapp,
        "email": payload.email,
        "additional_notes": payload.additional_notes,
        # status default 'new' dari schema DB
    }).execute()

    if not result.data:
        logger.error("Failed insert supplier_registrations")
        raise HTTPException(500, "Gagal menyimpan pendaftaran")

    supplier_row = result.data[0]
    supplier_id = supplier_row["id"]

    # Fire email notification ke admin (non-blocking best-effort)
    try:
        await send_supplier_notification_to_admin(
            supplier=supplier_row,
        )
    except Exception as e:
        # Log tapi jangan gagalkan submit — data sudah tersimpan
        logger.warning(f"Email notification failed for supplier {supplier_id}: {e}")

    return SupplierRegisterResponse(
        success=True,
        supplier_id=supplier_id,
    )
```

**Catatan pattern:**
- **Rate limit decorator `@limiter.limit("5/hour")`** membutuhkan `request: Request` parameter — konsisten dengan Epic 4 CF pattern
- **Email failure tidak gagalkan submit** — data sudah tersimpan di DB. Admin bisa cek DB kalau email delayed
- **Tidak async DB call** karena `supabase-py` sync client (konsisten dengan Epic 4 CF)
- **Tidak ada email confirmation ke supplier** (AR-03)

---

#### E5-CF-BE-03 — Email Service Extend

**Priority:** P0 · **Tags:** `backend` `email` `resend`

**File:** `backend/services/email_service.py` (extend, jangan replace pattern Epic 4 CF)

**Add function:**
```python
async def send_supplier_notification_to_admin(supplier: dict) -> None:
    """
    Kirim email notifikasi ke admin (dari company_settings.email) bahwa
    ada supplier baru mendaftar.
    """
    admin_email = get_admin_email()  # dari company_settings, reuse dari Epic 4 CF
    if not admin_email:
        logger.warning("No admin email configured, skip supplier notification")
        return

    # Readable label untuk salt types (mirror dari frontend konstanta)
    salt_types_label_map = {
        'kasar_petani': 'Kasar Petani',
        'halus_yodium': 'Halus Yodium',
        'halus_non_yodium': 'Halus Non-Yodium',
        'industri_spo_m': 'Industri (SPO/M)',
        'ghpt': 'GHPT',
    }
    salt_types_readable = ", ".join(
        salt_types_label_map.get(t, t) for t in supplier['salt_types_available']
    )

    # Admin panel URL (page belum live saat Slice CF, tapi URL structure fixed)
    admin_panel_url = f"{FRONTEND_URL}/admin/suppliers/{supplier['id']}"

    subject = f"[CV Reka Cipta] Supplier Baru Mendaftar — {supplier['business_name']}"

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

    body_html = _wrap_supplier_email_html(
        business_name=supplier['business_name'],
        location=f"{supplier['location_city']}, {supplier['location_province']}",
        salt_types=salt_types_readable,
        capacity=f"{supplier['capacity_per_month']} {supplier['capacity_unit']}/bulan",
        whatsapp=supplier['whatsapp'],
        email=supplier.get('email') or '-',
        notes=supplier.get('additional_notes') or '-',
        admin_url=admin_panel_url,
    )

    resend.emails.send({
        "from": EMAIL_FROM_ADDRESS,  # reuse dari Epic 4 CF config
        "to": admin_email,
        "subject": subject,
        "text": body_text,
        "html": body_html,
    })
```

Helper `_wrap_supplier_email_html` = HTML template minimal (headings + table) — konsisten style dengan email admin di Epic 4 CF.

**Verifikasi:**
- Kirim test dari local: `python -c "asyncio.run(send_supplier_notification_to_admin({...mock data...}))"`
- Verify email delivered ke admin address dalam < 30 detik

---

#### E5-CF-BE-04 — Register Router di Main

**Priority:** P0 · **Tags:** `backend` `routing`

**File:** `backend/main.py` (extend)

**Konten:**
```python
from .routers import supplier  # tambah import

# ... existing setup ...

app.include_router(supplier.router)
```

**JANGAN** perlu ubah rate limit middleware setup — sudah configured dari Epic 2 Slice 3.

**Verifikasi:** `curl http://localhost:8000/openapi.json | jq '.paths | keys'` → include `/supplier/register`.

---

#### E5-CF-BE-05 — Deploy Backend + Production Curl Test

**Priority:** P0 · **Tags:** `deploy` `smoke-test`

**Kerjakan:**
1. Push branch → Railway auto-deploy
2. Wait build sukses
3. Smoke test production:
   ```bash
   # Valid payload
   curl -X POST "${API_URL}/supplier/register" \
     -H "Content-Type: application/json" \
     -d '{
       "business_name": "Petani Garam Test",
       "location_city": "Pamekasan",
       "location_province": "Jawa Timur",
       "salt_types_available": ["kasar_petani"],
       "capacity_per_month": 50,
       "capacity_unit": "ton",
       "whatsapp": "08123456789"
     }'
   # Expected: 201, {success: true, supplier_id: "..."}

   # Invalid: no salt types
   curl -X POST "${API_URL}/supplier/register" \
     -H "Content-Type: application/json" \
     -d '{"business_name": "X", "location_city": "Y", ...(no salt_types)...}'
   # Expected: 422

   # Rate limit: submit 6x dalam 5 menit dari same IP
   for i in {1..6}; do
     curl -X POST "${API_URL}/supplier/register" ... ;
   done
   # Expected: attempt 1-5 → 201, attempt 6 → 429
   ```
4. Verify email delivered ke admin address
5. Cleanup test rows: `DELETE FROM supplier_registrations WHERE business_name LIKE '%Test%';`

**Verifikasi:** semua smoke test pass.

---

### 3c. Contract

#### E5-CF-CT-01 — Types + `lib/api`

**Priority:** P0 · **Tags:** `contract` `types`

**File:** `types/supplier.ts`

```typescript
export interface SupplierRegisterInput {
  business_name: string;
  location_city: string;
  location_province: string;
  salt_types_available: string[];
  capacity_per_month: number;
  capacity_unit: 'ton' | 'kwintal' | 'kg';
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

**File:** `lib/api/supplier.ts`

```typescript
import { SupplierRegisterInput, SupplierRegisterResponse } from '@/types/supplier';
import { apiFetch } from './client';

export async function registerSupplier(
  input: SupplierRegisterInput
): Promise<SupplierRegisterResponse> {
  return apiFetch<SupplierRegisterResponse>('/supplier/register', {
    method: 'POST',
    body: input,
    // auth: false (public endpoint)
  });
}
```

Pattern `apiFetch` reuse dari Epic 3B / Epic 4 CF — dengan `auth: false` untuk public endpoint.

**Verifikasi:** TypeScript compile pass, no `any` types.

---

### 3d. Frontend Public

#### E5-CF-FE-01 — Zod Schema

**Priority:** P0 · **Tags:** `frontend` `validation`

**File:** `lib/validation/supplier-schema.ts`

```typescript
import { z } from 'zod';
import { SUPPLIER_SALT_TYPES } from '@/lib/constants/supplier-salt-types';

const SALT_TYPE_VALUES = SUPPLIER_SALT_TYPES.map(t => t.value) as [string, ...string[]];

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
  capacity_unit: z.enum(['ton', 'kwintal', 'kg']),
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
    .or(z.literal('')),
  additional_notes: z.string().max(500, 'Maksimal 500 karakter').optional(),
});

export type SupplierRegisterFormData = z.infer<typeof supplierRegisterSchema>;
```

**Catatan sync dengan Pydantic (AR-06):** Enum, min/max length, regex pattern semua manual sync antara Zod ini dan Pydantic BE-01. Kalau salah satu berubah, update dua-duanya.

---

#### E5-CF-FE-02 — Constants `supplier-salt-types.ts`

**Priority:** P0 · **Tags:** `frontend` `constants`

**File:** `lib/constants/supplier-salt-types.ts`

```typescript
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
```

**Verifikasi:** Import di form component & Zod schema tanpa TypeScript error.

---

#### E5-CF-FE-03 — Route `/jadi-supplier/page.tsx`

**Priority:** P0 · **Tags:** `frontend` `page` `static`

**File:** `app/jadi-supplier/page.tsx`

```tsx
import { Metadata } from 'next';
import { InnerPageHero } from '@/components/layout/InnerPageHero';
import { BenefitsSection } from '@/components/supplier/BenefitsSection';
import { SupplierRegistrationForm } from '@/components/supplier/SupplierRegistrationForm';

export const dynamic = 'force-static';  // AR-05

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

**Verifikasi:**
- `next build` — page marked static
- `next dev` local — page render dengan hero + benefits + form

---

#### E5-CF-FE-04 — Component `SupplierRegistrationForm` (Client)

**Priority:** P0 · **Tags:** `frontend` `client-component` `form`

**File:** `components/supplier/SupplierRegistrationForm.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  supplierRegisterSchema,
  SupplierRegisterFormData,
} from '@/lib/validation/supplier-schema';
import { registerSupplier } from '@/lib/api/supplier';
import { CAPACITY_UNITS } from '@/lib/constants/supplier-salt-types';
import { SupplierSaltTypesCheckboxGroup } from './SupplierSaltTypesCheckboxGroup';
import { FormSection } from '@/components/ui/FormSection';
import { Button } from '@/components/ui/button';
import * as Sentry from '@sentry/nextjs';

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
    mode: 'onBlur',  // konsisten dengan Epic 4 CF UX-03
    defaultValues: {
      salt_types_available: [],
      capacity_unit: 'ton',
    },
  });

  const saltTypes = watch('salt_types_available');

  async function onSubmit(data: SupplierRegisterFormData) {
    setSubmitting(true);
    try {
      // Empty email → send as undefined
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
          <input {...register('business_name')} type="text" />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Kota" required error={errors.location_city?.message}>
            <input {...register('location_city')} type="text" />
          </Field>
          <Field label="Provinsi" required error={errors.location_province?.message}>
            <input {...register('location_province')} type="text" />
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
              type="number"
              min={0}
              step={0.01}
            />
          </Field>
          <Field label="Satuan" required error={errors.capacity_unit?.message}>
            <select {...register('capacity_unit')}>
              {CAPACITY_UNITS.map((u) => (
                <option key={u.value} value={u.value}>{u.label}</option>
              ))}
            </select>
          </Field>
        </div>
      </FormSection>

      <FormSection title="Kontak">
        <Field label="Nomor WhatsApp" required error={errors.whatsapp?.message} hint="Contoh: 081234567890">
          <input {...register('whatsapp')} type="tel" />
        </Field>
        <Field label="Email" error={errors.email?.message} hint="Opsional">
          <input {...register('email')} type="email" />
        </Field>
        <Field label="Keterangan Tambahan" error={errors.additional_notes?.message} hint="Opsional, maks. 500 karakter">
          <textarea {...register('additional_notes')} rows={4} />
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

// Helper Field component — reuse dari Epic 4 CF kalau sudah ada, atau extract
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

**Verifikasi:**
- Manual test semua field state (idle, filling, error, submitting, rate limit)
- Test dengan slow-3G throttling — button state benar
- Test refresh page saat rate-limited → countdown reset (acceptable UX; server tetap block)

---

#### E5-CF-FE-05 — Component `SupplierSaltTypesCheckboxGroup`

**Priority:** P0 · **Tags:** `frontend` `component`

**File:** `components/supplier/SupplierSaltTypesCheckboxGroup.tsx`

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

**Verifikasi:**
- Keyboard nav: Tab → checkbox → Space toggle → Tab ke next
- Screen reader: label announced correctly

---

#### E5-CF-FE-06 — Route `/jadi-supplier/terima-kasih/page.tsx`

**Priority:** P0 · **Tags:** `frontend` `page` `static`

**File:** `app/jadi-supplier/terima-kasih/page.tsx`

```tsx
import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Pendaftaran Berhasil — CV Reka Cipta Indonesia',
  robots: 'noindex',  // halaman konfirmasi, tidak perlu di-index
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

**Catatan pattern Base UI (memori project):**
- `<Link className={cn(buttonVariants(...))}>` — bukan `<Button asChild><Link>` (yang Radix pattern).

**Verifikasi:**
- Page render dengan icon + heading + CTA
- Direct URL access works (AR-04)
- `robots: noindex` verified di build output

---

#### E5-CF-FE-07 — Update Navbar Link "Jadi Supplier" + Sitemap

**Priority:** P0 · **Tags:** `frontend` `navigation`

**File-file:**
- `components/layout/Navbar.tsx` (extend nav items array)
- `app/sitemap.ts` (add entry)

**Navbar:**
```tsx
// Tambah entry di nav items:
{ label: 'Jadi Supplier', href: '/jadi-supplier' }
```

Posisi: setelah "Minta Penawaran" atau di dropdown "Untuk Bisnis" — finalize dengan klien.

**Sitemap:**
```typescript
// app/sitemap.ts (extend)
{
  url: `${baseUrl}/jadi-supplier`,
  lastModified: new Date(),
  changeFrequency: 'monthly',
  priority: 0.7,
},
```

**JANGAN** add `/jadi-supplier/terima-kasih` ke sitemap — halaman konfirmasi tidak relevan untuk SEO (`noindex`).

**Verifikasi:**
- Navbar render link baru
- `curl ${SITE_URL}/sitemap.xml` include `/jadi-supplier`

---

#### E5-CF-FE-08 — Error Boundary `/jadi-supplier/error.tsx`

**Priority:** P1 · **Tags:** `frontend` `error-handling`

**File:** `app/jadi-supplier/error.tsx`

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

Pattern konsisten dengan `error.tsx` Epic 4 CF.

---

## Layer 4 — QA Tasks

### E5-CF-QA-01 — E2E Submission Flow

**Priority:** P0 · **Tags:** `qa` `e2e`

**Steps:**
1. Buka `/jadi-supplier`
2. Isi form lengkap (semua wajib + optional email + notes)
3. Klik "Daftar Sebagai Supplier"
4. Verify: redirect ke `/jadi-supplier/terima-kasih`
5. Verify email admin delivered dalam < 30 detik (cek Resend dashboard atau inbox)
6. Verify row muncul di `supplier_registrations` dengan `status = 'new'`
7. Verify `whatsapp` di DB ter-normalize ke format `+62xxx`

**Verifikasi:** Semua step pass. Screenshot record.

---

### E5-CF-QA-02 — Rate Limit Test

**Priority:** P0 · **Tags:** `qa` `rate-limit`

**Steps:**
```bash
# Submit 6x cepat dari same IP
for i in {1..6}; do
  curl -X POST "${API_URL}/supplier/register" \
    -H "Content-Type: application/json" \
    -d "{\"business_name\":\"Test $i\", ...valid payload...}"
  echo ""
done
```

**Expected:**
- Attempt 1–5: `201 Created`
- Attempt 6: `429 Too Many Requests`

Cleanup: `DELETE FROM supplier_registrations WHERE business_name LIKE 'Test %';`

---

### E5-CF-QA-03 — Validation Test

**Priority:** P0 · **Tags:** `qa` `validation`

**Skenario:**

| Payload | Expected |
|---|---|
| `salt_types_available: []` | 422 |
| `salt_types_available: ["unknown"]` | 422 |
| `capacity_per_month: -1` | 422 |
| `capacity_per_month: 0` | 422 |
| `capacity_unit: "TON"` | 422 (case-sensitive) |
| `whatsapp: "abc"` | 422 |
| `whatsapp: "081234567890"` | 201 (normalized to `+6281234567890`) |
| `email: "not-an-email"` | 422 |
| `email` omit | 201 |
| `additional_notes` length > 500 | 422 |
| extra field `hack: true` | 422 (extra='forbid') |

Test frontend Zod → inline error muncul.
Test backend Pydantic → API return 422 dengan detail per field.

---

### E5-CF-QA-04 — Client Demo Script

**Priority:** P0 · **Tags:** `qa` `demo`

**Script (5 menit):**

1. **Intro (30 detik):** "Sekarang saya tunjukkan form pendaftaran supplier baru — jalur bagi petani atau produsen garam untuk mendaftar sebagai mitra CV Reka Cipta."
2. **Buka `/jadi-supplier` dari navbar (30 detik):** tunjukkan section manfaat + form.
3. **Isi form (2 menit):** pakai data realistic supplier (mis. "Petani Garam Mandiri, Sumenep, Jawa Timur, Kasar Petani, 100 ton/bulan").
4. **Submit + redirect (30 detik):** tunjukkan halaman konfirmasi.
5. **Buka inbox admin (1 menit):** tunjukkan email notifikasi masuk dengan detail supplier.
6. **Tunjukkan DB row (30 detik):** buka Supabase Dashboard, `SELECT * FROM supplier_registrations ORDER BY created_at DESC LIMIT 1;` — tunjukkan data tersimpan dengan `status = 'new'`.
7. **Handover ke Epic 5 Admin Panel:** "Di slice berikutnya, data ini akan muncul di `/admin/suppliers` yang bisa Anda kelola."

**Verifikasi:** Klien sign-off untuk Epic 5 CF.

---

## Definition of Done

**Backend:**
- [ ] `supplier_registrations` table + RLS active
- [ ] Endpoint `POST /supplier/register` public, rate-limited 5/hour
- [ ] Email notification service extended (`send_supplier_notification_to_admin`)
- [ ] Whitelist enforcement `extra='forbid'` di Pydantic schema
- [ ] Manual smoke test production pass

**Frontend:**
- [ ] Route `/jadi-supplier` static, form fully functional
- [ ] Route `/jadi-supplier/terima-kasih` static, direct URL access works
- [ ] Zod schema sync dengan Pydantic (5 constraint utama match)
- [ ] Rate limit UI (countdown 60 detik) works
- [ ] Sentry integration untuk unexpected error
- [ ] Navbar link "Jadi Supplier" active
- [ ] Sitemap include `/jadi-supplier`, exclude `/jadi-supplier/terima-kasih`
- [ ] Error boundary `error.tsx` active

**QA:**
- [ ] E2E flow pass (submit → email → DB row)
- [ ] Rate limit test pass
- [ ] Validation test semua case pass
- [ ] WhatsApp normalization verified (`08xxx` → `+62xxx`)

**Demo:** Sign-off from klien.

---

## Handover ke Epic 5 Admin Panel

Setelah Epic 5 CF live:
- Table `supplier_registrations` populated dengan supplier real (minimal 1-2 dari testing)
- Admin sudah dapat email notifikasi flow verified
- Admin masih **manual query DB** untuk lihat detail supplier — ini anti-pattern operasional yang sama dengan post-Epic 4 CF sebelum Epic 4B Slice 1 live
- **Epic 5 Admin Panel slice** akan build UI list + detail + update status + WA template supaya admin bisa manage suppliers via `/admin/suppliers`

Prasyarat untuk Epic 5 Admin Panel:
- [ ] Minimum 3-5 dummy supplier tersimpan (dari testing atau seed) untuk populate list view saat dev
- [ ] Klien konfirmasi WA template content untuk 3 status (new, verified, active)
- [ ] Klien konfirmasi status transition semantics (walaupun MVP free transitions per pattern Epic 4B AR-08)

---

## Catatan Penutup

**Pushback yang saya highlight dari spec Epic Doc:**

**1. Field `email` supplier = opsional, tapi ada implikasi UX**

Kalau supplier tidak isi email, satu-satunya jalur komunikasi confirmation = WhatsApp (yang admin lakukan manual dalam 2-3 hari). **Tidak ada auto-confirmation** ke supplier setelah submit. Ini decision yang mungkin bikin supplier khawatir "apakah submit saya sukses atau tidak?" — mitigasi via halaman konfirmasi yang jelas.

Kalau nanti klien mau add auto-confirmation email ke supplier (kalau email diisi), enhancement 1 hari — tambah conditional send di endpoint.

**2. Jenis garam supplier ≠ produk end-user**

Saya split taxonomy jadi 2 konteks:
- `products` table (Epic 3) = 5 produk end-user (PRO YD, PRO L, SPO/M, PTN PREMIUM, GHPT) yang di-jual ke buyer
- `SUPPLIER_SALT_TYPES` konstanta = 5 kategori raw material supplier (Kasar Petani, Halus Yodium, dst)

Walaupun ada overlap semantic (mis. "Halus Yodium" di supplier ~ "PRO YD" di products), **jangan reuse `products` table untuk field supplier**. Konteks bisnis beda, coupling bikin fragile — kalau klien future ganti product line, form supplier tidak boleh ikut break.

**3. Tidak ada CTA redirect dari halaman lain**

Berbeda dengan Epic 4 CF yang punya CTA dari Epic 3 product detail. Epic 5 CF entry point cuma navbar + direct URL. Kalau klien nanti mau tambah CTA dari halaman "Tentang Kami" section jaringan supplier → enhancement, bukan MVP.

**4. Tidak ada email confirmation ke supplier (AR-03)**

Justifikasi sudah di AR-03. Kalau klien merasa kurang UX, ini easy add di Slice future.

**5. Rate limit 5/hour bisa terasa kurang restriktif**

5/jam per IP kelihatan longgar, tapi konsisten dengan Epic 4 CF pattern. Adjust ke 3/hour atau 5/day kalau nanti terlihat abuse pattern setelah launch. MVP: consistent pattern > premature optimization.

Kalau ada pertanyaan atau ada bagian yang perlu di-clarify sebelum eksekusi, bilang sekarang.

**File:** `docs/epic-breakdown/epic5_task_breakdown_customer-facing.md`
**Version:** 1.0 — {tanggal generate}
