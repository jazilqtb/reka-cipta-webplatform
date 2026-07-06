# Claude Code Execution Guide — Epic 3B Slice 1 (Admin List + Edit Non-File Fields)

**Project:** reka-cipta-platform
**Slice:** Epic 3B Slice 1 — Admin `/admin/products` List + Edit Form (semua field kecuali foto/PDF)
**Task Breakdown Reference:** `epic3B_task_breakdown_admin-panel.md` (WAJIB dibaca sebelum eksekusi)
**Prasyarat:** Epic 1 + Epic 2 (semua slice) + Epic 3 Customer-Facing (Slice 1 & 2) sudah merged ke `main` dan sign-off klien
**Version:** 1.0
**Author:** Ach. Jazilul Qutbi
**Total Phase:** 16 | **STOP Gates:** 2

---

## Cara Pakai Guide Ini

Sama seperti guide sebelumnya: setiap phase punya section **Kerjakan** / **Jangan** / **Verifikasi**. STOP Gate berhenti sampai Jazil clear.

**Perbedaan risk profile dari slice sebelumnya:**

| Aspek | Slice Sebelumnya (Epic 3 CF) | Slice Ini (Epic 3B S1) |
|---|---|---|
| Primary risk | Static rendering downgrade | **Security bypass** (whitelist) + **state complexity** (SpecJSONBEditor) |
| Backend complexity | Simple GET endpoints | PUT dengan strict whitelist + auth |
| Frontend complexity | Presentation components | Form dengan Controller wrappers + 2 komponen kompleks (SpecJSONBEditor, IndustriesEditor) |
| Cross-slice touches | Contact form (Epic 2) | **Tidak ada** — Slice ini murni add-on, tidak touch Slice sebelumnya |
| STOP gates | 2 (Visual QA + Demo) | 2 (E2E + Security Test + Demo) |

**Yang berbeda mekanikanya:**
- Test whitelist enforcement WAJIB — kalau kelewat, security hole
- SpecJSONBEditor punya state pattern yang mudah bikin infinite loop kalau tidak hati-hati — dedicate 1 phase khusus
- Server Action untuk cache invalidation harus di-verify end-to-end (bukan just "no error di console")

---

## Operating Rules — Delta dari Guide Sebelumnya

Semua Operating Rules R-01 sampai R-10 dari **Slice 1 Epic 3 customer-facing guide** tetap berlaku (Supabase CLI broken, `public.ts` vs `server.ts`, Base UI vs Radix, globals.css frozen, Next.js 15 async params, static env access, TS↔Pydantic sync, Bahasa Indonesia, reuse components, branch strategy). Rules tambahan spesifik Epic 3B Slice 1:

### R-11 — Pydantic `extra='forbid'` WAJIB di ProductUpdateRequest

Ini bukan optional. Ini enforcement layer utama untuk whitelist.

```python
class ProductUpdateRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')  # <-- WAJIB, jangan hapus
    # ... fields ...
```

- **JANGAN** pakai `extra='ignore'` (default Pydantic v2) — akan silent accept unknown fields, whitelist tidak ter-enforce.
- **JANGAN** hapus config ini "sementara" untuk debugging — kalau perlu debug, pakai print di router, jangan compromise schema.
- Kalau frontend accidentally kirim field `slug`, request harus return 422 dengan error message yang jelas.

### R-12 — Route Order di FastAPI: `/admin` SEBELUM `/{slug}`

FastAPI match route by declaration order. Kalau declare `GET /products/{slug}` sebelum `GET /products/admin`, request ke `/products/admin` akan interpret "admin" sebagai slug → 404 "Product with slug 'admin' not found".

**Urutan yang benar di router:**
```python
@router.get("")                    # GET /products
@router.get("/admin")              # GET /products/admin  <-- SEBELUM /{slug}
@router.get("/{slug}")             # GET /products/{slug}
@router.put("/{product_id}")       # PUT /products/{product_id}
```

**JANGAN** urut alphabetical. **JANGAN** urut by HTTP method. Urut **by specificity** (path lebih specific dulu).

### R-13 — `Depends(get_current_user)` di SEMUA Admin Endpoint

Tidak ada exception. `PUT /products/{id}`, `GET /products/admin`, upload endpoints (Slice 2) — semua WAJIB auth.

- **JANGAN** skip auth untuk "testing" atau "convenience" — kalau accidentally di-commit, security hole.
- **JANGAN** implement auth check manual di dalam handler (mis. `if not user: raise 401`) — pakai `Depends` pattern konsisten dengan Epic 2 Slice 3.

### R-14 — Cache Invalidation via Server Action, BUKAN Fetch dari Client

Setelah `updateProduct()` sukses di client, panggil Server Action `revalidateProductRoutes(slug)`:

```typescript
'use client';
import { revalidateProductRoutes } from '@/app/actions/products';

// ... di onSubmit:
await updateProduct(product.id, data);
await revalidateProductRoutes(product.slug); // <-- Server Action, bukan fetch
```

- **JANGAN** panggil endpoint HTTP untuk revalidation (mis. `fetch('/api/revalidate')`) — pattern yang di-Epic-2-Slice-3 pakai Server Action, konsisten.
- **JANGAN** panggil `revalidatePath` di client component — itu server-only API.

### R-15 — SpecJSONBEditor State Pattern (Avoid Infinite Loop)

`SpecJSONBEditor` menerima `value: Record<string, string | number>` sebagai prop dan `onChange` callback. Internal state adalah array `Array<{ key, value, isCustom }>` untuk kemudahan iteration + delete + reorder.

**Anti-pattern yang WAJIB dihindari:**
```typescript
// SALAH: useEffect sync ini akan infinite loop
useEffect(() => {
  onChange(arrayToObject(internalArray));
}, [internalArray, onChange]);
```

Setiap kali `onChange` dipanggil, parent re-render, prop `value` berubah reference (walaupun content sama), yang trigger sync balik ke internal state, yang trigger useEffect lagi, dst.

**Pattern yang benar:**
```typescript
// BENAR: onChange dipanggil eksplisit dari event handler
function handleAddField(key: string, value: string) {
  const newArray = [...internalArray, { key, value, isCustom: false }];
  setInternalArray(newArray);
  onChange(arrayToObject(newArray)); // <-- panggil eksplisit di sini
}

// useEffect hanya untuk INITIAL sync (mount), tidak untuk ongoing sync
useEffect(() => {
  setInternalArray(objectToArray(value));
}, []); // <-- empty deps, run once
```

Kalau butuh two-way sync yang lebih kompleks, pertimbangkan `useMemo` untuk derive display state dari controlled prop, jangan `useState + useEffect`.

---

# PHASE 1 — Preflight & Branch Setup

**Tujuan:** Verify semua prasyarat exist di `main`, buat feature branch.

## Kerjakan

1. `git status` — bersih.
2. `git checkout main && git pull origin main`.
3. Verify Epic 3 customer-facing artifacts:
   ```bash
   ls app/produk/page.tsx
   ls app/produk/[slug]/page.tsx
   ls lib/product-spec-labels.ts
   ls lib/product-industry-icons.ts
   grep -l "getProducts\|getProductBySlug" lib/api.ts
   ```
4. Verify Epic 2 Slice 3 admin pattern reference:
   ```bash
   ls app/admin/settings/page.tsx    # akan direplikasi pattern-nya
   grep -r "revalidatePath" app/actions/
   ```
5. Verify production backend healthy:
   ```bash
   curl -s https://<railway-prod>/products | jq '.total'  # harus 5
   ```
6. Buat branch: `git checkout -b feature/epic3B-slice1-admin-products`

## Jangan

- Jangan proceed kalau `lib/product-spec-labels.ts` tidak ada — SpecJSONBEditor bergantung pada registry ini.
- Jangan proceed kalau `app/admin/settings/` pattern tidak ada — Anda akan replicate pattern ini, harus ada reference.

## Verifikasi

- [ ] Branch aktif
- [ ] File Epic 3 CF exist
- [ ] Pattern Epic 2 Slice 3 exist
- [ ] Production backend healthy

---

# PHASE 2 — Backend Pydantic Schema (ProductUpdateRequest + Admin Response)

**Tujuan:** Extend `backend/schemas/product.py` dengan schema untuk update dan admin list.

## Kerjakan

1. Buka `backend/schemas/product.py`.
2. Tambahkan dua schema baru sesuai spec task `E3B-S1-BE-01`:
   - `ProductUpdateRequest` dengan **`model_config = ConfigDict(extra='forbid')`** (R-11)
   - `ProductAdminListResponse` dengan field `products`, `total`, `active_count`, `inactive_count`
3. Aktifkan venv: `cd backend && source .venv/bin/activate`
4. Test whitelist enforcement dengan Python REPL:
   ```python
   from backend.schemas.product import ProductUpdateRequest

   # Valid payload
   ProductUpdateRequest(
       name="Test", tagline=None, description=None,
       specs={}, industries=["Test"],
       is_sni=False, is_active=True, sort_order=1
   )  # Should succeed

   # Extra field payload
   try:
       ProductUpdateRequest(
           name="Test", tagline=None, description=None,
           specs={}, industries=["Test"],
           is_sni=False, is_active=True, sort_order=1,
           slug="hacked-slug"  # Extra field
       )
       print("FAIL: Should have raised ValidationError")
   except Exception as e:
       print(f"PASS: {e}")
   ```
5. Kalau `PASS` tidak muncul → `extra='forbid'` tidak jalan, investigate Pydantic version atau typo.

## Jangan

- **JANGAN** pakai `class Config: extra = 'forbid'` (Pydantic v1 syntax) — project pakai v2, gunakan `model_config = ConfigDict(...)`.
- **JANGAN** tambah field `slug`, `code`, `category`, `id`, `created_at`, `updated_at` di `ProductUpdateRequest` — locked per AR-01.
- **JANGAN** commit dulu — akan commit bareng router di Phase 3.

## Verifikasi

- [ ] REPL test whitelist enforcement `PASS`
- [ ] Semua 8 whitelisted field ada di schema (name, tagline, description, specs, industries, is_sni, is_active, sort_order)
- [ ] Semua 6 locked field TIDAK ada di schema

---

# PHASE 3 — Backend Router (PUT + GET Admin) + Route Order

**Tujuan:** Extend `backend/routers/products.py` dengan `PUT /{id}` dan `GET /admin`. **Route order kritis (R-12).**

## Kerjakan

1. Buka `backend/routers/products.py`.
2. Import dependencies auth: `from backend.dependencies.auth import get_current_user` (cek path exact di project — kemungkinan `backend/auth/dependencies.py`).
3. Tambah endpoint sesuai spec task `E3B-S1-BE-02` dan `E3B-S1-BE-03`.
4. **PENTING — Verify route order** di file setelah edit:
   ```python
   @router.get("")                    # 1. List public
   @router.get("/admin")              # 2. Admin list — HARUS SEBELUM /{slug}
   @router.get("/{slug}")             # 3. Detail public by slug
   @router.put("/{product_id}")       # 4. Update by ID
   ```
5. Kalau order salah, restructure — jangan skip step ini walaupun kelihatan "code masih jalan".
6. Run FastAPI local: `uvicorn backend.main:app --reload`.
7. Buka `/docs`, verify 4 endpoint products muncul.

## Jangan

- **JANGAN** deklarasi `/admin` di router terpisah — sama file, urutan berdasarkan declaration order matters.
- **JANGAN** skip dependency `Depends(get_current_user)` di `PUT` dan `GET /admin` (R-13).
- **JANGAN** hardcode `is_active` filter di `GET /admin` — admin harus lihat semua termasuk yang nonaktif.
- **JANGAN** return `Product` langsung dari `PUT` — pakai `ProductDetailResponse` konsisten dengan `GET /{slug}`.

## Verifikasi

- [ ] `/docs` menampilkan 4 endpoint products
- [ ] Curl `GET /products/admin` tanpa JWT → 401
- [ ] Curl `GET /products/admin` dengan header `Authorization: Bearer invalid` → 401
- [ ] Route order verified secara visual di file

---

# PHASE 4 — Deploy Backend Railway + Curl Test dengan JWT

**Tujuan:** Deploy ke Railway staging, verify endpoint accessible di production URL dengan JWT valid.

## Kerjakan

1. Commit backend changes:
   ```bash
   git add backend/
   git commit -m "feat(api): add product admin endpoints with whitelist [Epic 3B Slice 1]"
   ```
2. `git push -u origin feature/epic3B-slice1-admin-products`
3. Tunggu Railway deploy (2-4 menit).
4. **Get JWT untuk testing:**
   - Login ke `/admin/login` (production URL) via browser
   - Buka DevTools → Application → Cookies
   - Copy value dari cookie session (nama cookie mungkin `sb-access-token` atau `access_token` — cek di Epic 1 auth implementation)
5. Test 5 skenario dengan curl (lihat spec task `E3B-S1-BE-05`):
   ```bash
   JWT="eyJ..."
   BASE="https://<railway-staging>"
   PRO_YD_ID="<uuid PRO YD dari DB>"

   # 1. GET admin list (harus 200)
   curl -s -H "Authorization: Bearer $JWT" $BASE/products/admin | jq '.total'
   # Expected: 5

   # 2. PUT valid payload (harus 200)
   curl -X PUT -H "Authorization: Bearer $JWT" \
     -H "Content-Type: application/json" \
     -d '{"name":"Garam Halus Yodium TEST","tagline":null,"description":null,"specs":{},"industries":["Test"],"is_sni":true,"is_active":true,"sort_order":1}' \
     $BASE/products/$PRO_YD_ID | jq '.product.name'
   # Expected: "Garam Halus Yodium TEST"

   # 3. PUT dengan slug (harus 422)
   curl -X PUT -H "Authorization: Bearer $JWT" \
     -H "Content-Type: application/json" \
     -d '{"slug":"hacked","name":"test","tagline":null,"description":null,"specs":{},"industries":["Test"],"is_sni":false,"is_active":true,"sort_order":1}' \
     -i $BASE/products/$PRO_YD_ID | head -5
   # Expected: HTTP/1.1 422

   # 4. PUT tanpa JWT (harus 401)
   curl -X PUT -H "Content-Type: application/json" \
     -d '{...}' \
     -i $BASE/products/$PRO_YD_ID | head -5
   # Expected: HTTP/1.1 401

   # 5. GET admin tanpa JWT (harus 401)
   curl -i $BASE/products/admin | head -5
   # Expected: HTTP/1.1 401
   ```
6. **REVERT** perubahan test dari step 2 (name balik ke "Garam Halus Yodium"):
   ```bash
   curl -X PUT -H "Authorization: Bearer $JWT" \
     -d '<original payload>' \
     $BASE/products/$PRO_YD_ID
   ```

## Jangan

- **JANGAN** skip revert step 6 — nama produk yang berubah di DB akan mempengaruhi Slice 1 test frontend dan demo klien nanti.
- **JANGAN** simpan JWT di git (paste ke commit message atau .env yang di-commit).
- **JANGAN** lanjut ke Phase 5 kalau ada test yang gagal — fix dulu di backend.

## Verifikasi

- [ ] 5 curl test pass sesuai expected
- [ ] Data DB direvert ke state original
- [ ] Railway deployment log clean, no error

---

# PHASE 5 — Contract Update (types + lib/api)

**Tujuan:** Sync frontend types dengan Pydantic schemas + tambah 2 fetcher.

## Kerjakan

1. Update `types/api.ts` sesuai spec task `E3B-S1-CT-01`:
   - Interface `ProductUpdateRequest`
   - Interface `ProductAdminListResponse`
2. Update `lib/api.ts`:
   - `getProductsAdmin()` dengan `{ auth: true }`
   - `updateProduct(id, payload)` dengan `method: 'PUT'`, `auth: true`, body JSON
3. Type check: `pnpm tsc --noEmit`. Pass tanpa error.
4. Commit:
   ```bash
   git add types/ lib/
   git commit -m "feat(contract): add product admin types and fetchers [Epic 3B Slice 1]"
   ```

## Jangan

- **JANGAN** buat `ProductUpdateRequest.slug: string | null` "just in case" — schema strictly no slug, konsisten dengan backend Pydantic.
- **JANGAN** lupa flag `auth: true` di kedua fetcher — endpoint protected.

## Verifikasi

- [ ] Type check pass
- [ ] `types/api.ts` fields exactly match Pydantic `ProductUpdateRequest`
- [ ] Commit masuk

---

# PHASE 6 — Server Action `revalidateProductRoutes`

**Tujuan:** Buat Server Action untuk cache invalidation. Isolated dan simple, warm-up sebelum masuk komponen kompleks.

## Kerjakan

1. Cek apakah folder `app/actions/` sudah ada dari Epic 2 Slice 3. Kalau ya, tambah file baru di sana. Kalau tidak, buat folder.
2. Buat file `app/actions/products.ts` sesuai spec task `E3B-S1-FE-09`:
   ```typescript
   'use server';
   import { revalidatePath } from 'next/cache';

   export async function revalidateProductRoutes(slug: string) {
     revalidatePath('/produk');
     revalidatePath(`/produk/${slug}`);
     revalidatePath('/sitemap.xml');
   }
   ```
3. Type check: `pnpm tsc --noEmit`.

## Jangan

- **JANGAN** lupa `'use server'` directive di baris pertama.
- **JANGAN** tambah `revalidatePath('/')` — Beranda tidak reference produk spesifik (per AR-03).
- **JANGAN** wrap dalam try-catch di server action — kalau `revalidatePath` gagal, itu server-level issue yang perlu bubble up.

## Verifikasi

- [ ] File exists dengan directive `'use server'`
- [ ] Type check pass

---

# PHASE 7 — Frontend Route `/admin/products` + List Components

**Tujuan:** Buat halaman admin list produk.

## Kerjakan

1. Buat direktori `app/admin/products/` (bukan `app/(admin)/admin/products/` — cek pattern Epic 2 Slice 3 untuk konsistensi struktur route group).
2. Buat file `app/admin/products/page.tsx` sesuai spec task `E3B-S1-FE-01`:
   - Server Component
   - `export const dynamic = 'force-dynamic'`
   - Fetch via `getProductsAdmin()` dari `lib/api.ts`
   - Render `<ProductsAdminList products={data.products} />`
3. Buat `components/admin/product/ProductsAdminList.tsx`:
   - Server Component (tidak butuh interactivity)
   - Table dengan 6 kolom (foto, nama, code, kategori, status, aksi)
   - Iterate products render `<ProductAdminRow>`
4. Buat `components/admin/product/ProductAdminRow.tsx`:
   - Foto thumbnail 60×60 dengan Next.js `<Image>`
   - Link ke `/admin/products/{id}/edit`
   - Badge status dengan color coding
   - Row inactive: `opacity-60 grayscale`
5. Test di dev server:
   - Login sebagai admin
   - Navigate ke `/admin/products`
   - Verify 5 produk render dengan thumbnail
   - Verify link Edit navigate ke edit page (yang belum ada, will 404 — that's expected for now)

## Jangan

- **JANGAN** pakai Client Component untuk list — tidak butuh state. Server Component lebih efisien.
- **JANGAN** hardcode 5 produk — iterate dari `products` array (kalau nanti expand, tidak perlu refactor).
- **JANGAN** skip `dynamic = 'force-dynamic'` — admin page harus fresh, tidak boleh ISR.

## Verifikasi

- [ ] `/admin/products` render list 5 produk
- [ ] Middleware redirect ke `/admin/login` kalau tidak auth
- [ ] Status badge visible dengan color coding

---

# PHASE 8 — Route `/admin/products/[id]/edit` (Server Component Wrapper Only)

**Tujuan:** Buat route edit dengan Server Component wrapper yang fetch data. Form komponen belum di-implement — akan di Phase 9-12.

## Kerjakan

1. Buat file `app/admin/products/[id]/edit/page.tsx` sesuai spec task `E3B-S1-FE-04`:
   - Async signature `params: Promise<{ id: string }>` (R-05)
   - `export const dynamic = 'force-dynamic'`
   - Fetch product via helper (bisa via `apiFetch` ke `GET /products/admin` lalu find by ID, atau fetch langsung dari Supabase service role)
   - Fetch semua produk untuk collect unique industries list untuk autocomplete
   - `notFound()` kalau product tidak ada
   - Render placeholder `<div>ProductEditForm placeholder untuk {product.name}</div>` untuk sekarang
2. Test di dev server:
   - Navigate ke `/admin/products/{valid-id}/edit` — render placeholder dengan nama produk
   - Navigate ke `/admin/products/invalid-id/edit` — 404
3. Commit progress:
   ```bash
   git add app/actions/ app/admin/ components/admin/
   git commit -m "feat(admin): add products list and edit route scaffolding [Epic 3B Slice 1]"
   ```

## Jangan

- **JANGAN** langsung implement full form di sini — lakukan incremental (list → route → simple komponen → kompleks komponen → integration).
- **JANGAN** skip fetch `availableIndustries` — dibutuhkan Phase 10 untuk autocomplete.

## Verifikasi

- [ ] Edit route render placeholder dengan nama produk yang benar
- [ ] Invalid ID render 404
- [ ] `availableIndustries` array log-able (test dengan `console.log` sementara)

---

# PHASE 9 — Component `ReadOnlyInfoBlock` (Warm-up Sederhana)

**Tujuan:** Bikin komponen paling simple dari form. Warm-up sebelum masuk komponen kompleks.

## Kerjakan

1. Buat `components/admin/product/ReadOnlyInfoBlock.tsx`:
   - Server Component OK (tidak butuh state)
   - Props: `product: Product`
   - Render 5 field (slug, code, category, id, created_at) sebagai info block
   - Style: monospace text, muted color, background `bg-slate-50`, padding
   - Tooltip atau text kecil: "Kolom ini tidak bisa diubah dari panel admin"
   - Format `created_at`: gunakan `Intl.DateTimeFormat('id-ID')` atau library seperti `date-fns` dengan locale `id`
2. Update `app/admin/products/[id]/edit/page.tsx` — replace placeholder dengan `<ReadOnlyInfoBlock product={product} />` sementara.
3. Test di dev server — info block render dengan 5 field.

## Jangan

- **JANGAN** pakai `<input readOnly>` — bukan input, itu display info. Pakai `<dl>` atau `<div>` semantic.
- **JANGAN** format date manual (`.toISOString().slice(0, 10)`) — pakai locale-aware format supaya klien Indonesia lihat "3 Januari 2026" bukan "2026-01-03".

## Verifikasi

- [ ] 5 field render dengan format yang benar
- [ ] Locale Indonesian aktif untuk tanggal

---

# PHASE 10 — Component `IndustriesEditor` (Medium Complexity)

**Tujuan:** Bikin chip-based array editor dengan autocomplete. Medium complexity — build confidence sebelum SpecJSONBEditor.

## Kerjakan

1. Buat `components/admin/product/IndustriesEditor.tsx`:
   - Client Component (`'use client'`)
   - Props: `value: string[]`, `onChange: (value: string[]) => void`, `suggestions: string[]`
   - Internal state minimal — bisa hanya `inputValue: string` untuk input field
   - Chip display dengan tombol X
   - Input dengan autocomplete filtered dari `suggestions` (exclude yang sudah di `value`)
   - Enter atau klik "Tambah" trigger add
   - Duplicate detection: kalau input sama dengan existing chip, feedback visual (input flash merah 500ms)
2. **Pattern penting untuk avoid infinite loop** — sama seperti R-15 tapi lebih sederhana karena `value` langsung array of strings:
   ```typescript
   function handleAdd(newIndustry: string) {
     if (value.includes(newIndustry)) {
       // flash red feedback
       return;
     }
     onChange([...value, newIndustry]);
     setInputValue('');
   }

   function handleRemove(industry: string) {
     onChange(value.filter((i) => i !== industry));
   }
   ```
   **JANGAN** pakai `useEffect` yang sync internal state ke `onChange`.
3. Test standalone dengan wrapper test (buat file test.tsx sementara atau test di dev di route existing).

## Jangan

- **JANGAN** pakai library heavy seperti `react-select` untuk case ini — chip + input sederhana, over-engineer.
- **JANGAN** pass `suggestions` yang belum di-deduplicate — parent (Server Component) sudah `[...new Set(...)]`.
- **JANGAN** allow empty string add.

## Verifikasi

- [ ] Chip add & remove works
- [ ] Autocomplete filter berdasarkan input
- [ ] Duplicate feedback visible
- [ ] No infinite re-render (cek React DevTools Profiler)

---

# PHASE 11 — Component `SpecJSONBEditor` (HIGH Complexity, Dedicated Phase)

**Tujuan:** Bikin komponen paling kompleks di Slice 1. Dedicated phase karena state management-nya subtle dan error-prone.

## Kerjakan

1. Baca ulang **R-15** (state pattern) di section Operating Rules atas guide ini.
2. Baca spec task `E3B-S1-UX-04` dan `E3B-S1-FE-06` di task breakdown untuk full spec.
3. Buat `components/admin/product/SpecJSONBEditor.tsx`:
   - Client Component
   - Props: `value: Record<string, string | number>`, `onChange: (value: Record<string, string | number>) => void`
   - Internal state: `Array<{ key: string; value: string | number; isCustom: boolean }>`
   - **Initial sync only:** `useEffect(() => setInternalArray(objectToArray(value)), [])` — empty deps, run once
   - Setiap event handler (add, remove, edit) panggil `onChange` eksplisit dengan converted object
4. Buat helper functions di file yang sama (bukan di lib):
   ```typescript
   function objectToArray(obj: Record<string, string | number>): SpecRow[] {
     return Object.entries(obj).map(([key, value]) => ({
       key,
       value,
       isCustom: !SPEC_LABEL_REGISTRY[key], // dari lib/product-spec-labels.ts
     }));
   }

   function arrayToObject(arr: SpecRow[]): Record<string, string | number> {
     return arr.reduce((acc, { key, value }) => {
       if (key) acc[key] = value;
       return acc;
     }, {} as Record<string, string | number>);
   }
   ```
5. Implement UI:
   - Table dengan header Parameter | Nilai | Satuan | Aksi
   - Setiap row: label dari registry (kalau ada) atau key raw (kalau custom, dengan indikator `(Custom)`)
   - Input value
   - Unit display (dari registry) atau input (kalau custom)
   - Tombol delete per row
   - Dropdown "+ Tambah Field" populate dari registry, exclude keys yang sudah dipakai
   - Tombol "+ Custom Field" open dialog dengan input key + label + unit + validation regex `/^[a-z][a-z0-9_]*$/`
6. Custom Field dialog — bisa pakai Base UI Dialog primitive. Kalau Base UI Dialog complex, pakai simple conditional render dengan overlay.
7. Test dengan berbagai skenario:
   - Load produk dengan 5 field spec → render 5 rows
   - Delete 1 field → row hilang, `onChange` dipanggil dengan object minus key tersebut
   - Add dari dropdown → row muncul, dropdown update (field yang sudah dipakai hilang)
   - Add custom field → dialog muncul, validate regex, add row dengan `isCustom: true` indikator
   - Edit value → `onChange` dipanggil dengan value baru
   - No infinite re-render

## Jangan

- **JANGAN** sync internal ↔ external via `useEffect` — R-15 violation, akan infinite loop.
- **JANGAN** allow custom key yang tidak match regex — invalid SQL identifier bikin masalah di DB nanti.
- **JANGAN** allow duplicate key — kalau user coba tambah field yang sudah ada, block.
- **JANGAN** skip test dropdown filter logic — kalau dropdown menampilkan field yang sudah dipakai, UX buruk.

## Verifikasi

- [ ] Load & edit existing spec works
- [ ] Add dari registry works
- [ ] Add custom field dengan validation regex works
- [ ] Delete works
- [ ] React DevTools Profiler shows no infinite re-render loop
- [ ] `onChange` values match expected object structure

**Estimasi effort phase ini:** 1-1.5 hari kerja. Kalau stuck > 4 jam di satu bug, STOP dan konsultasi Jazil.

---

# PHASE 12 — Component `ProductEditForm` (Integration Hub)

**Tujuan:** Compose semua komponen (ReadOnlyInfoBlock, IndustriesEditor, SpecJSONBEditor, form fields) dalam form utama dengan react-hook-form + Zod.

## Kerjakan

1. Buat `lib/validation/product-schema.ts`:
   ```typescript
   import { z } from 'zod';

   export const productUpdateSchema = z.object({
     name: z.string().min(3, 'Minimal 3 karakter').max(255),
     tagline: z.string().max(300).nullable(),
     description: z.string().max(5000).nullable(),
     specs: z.record(z.string(), z.union([z.string(), z.number()])).default({}),
     industries: z.array(z.string().min(1)).min(1, 'Minimal 1 industri'),
     is_sni: z.boolean(),
     is_active: z.boolean(),
     sort_order: z.number().int().nonnegative(),
   });

   export type ProductUpdateFormData = z.infer<typeof productUpdateSchema>;
   ```
2. Buat `components/admin/product/ProductEditForm.tsx` sesuai spec task `E3B-S1-FE-05`:
   - Client Component
   - `useForm` dengan `zodResolver` dan `defaultValues` dari `product` prop
   - Sections: Info Dasar (name/tagline/description), Spesifikasi Teknis (SpecJSONBEditor via Controller), Industri (IndustriesEditor via Controller), Pengaturan Tampilan (is_sni/is_active/sort_order)
   - Submit handler:
     ```typescript
     async function onSubmit(data: ProductUpdateFormData) {
       setIsSubmitting(true);
       try {
         await updateProduct(product.id, data);
         await revalidateProductRoutes(product.slug);
         toast.success('Produk berhasil diperbarui');
         form.reset(data);
       } catch (err) {
         toast.error('Gagal menyimpan. Silakan coba lagi.');
         // TODO: Sentry log di Phase 13 kalau infra sudah ready
       } finally {
         setIsSubmitting(false);
       }
     }
     ```
   - Submit button disabled sampai `formState.isDirty`
   - `beforeunload` warning kalau dirty
3. Update `app/admin/products/[id]/edit/page.tsx` — replace placeholder dengan `<ProductEditForm product={product} availableIndustries={allIndustries} />`.
4. Test di dev server:
   - Buka edit page PRO YD
   - Edit tagline → submit → toast success
   - Refresh public `/produk/garam-halus-yodium` → tagline baru muncul

## Jangan

- **JANGAN** pakai `<Button asChild>` untuk cancel button — pattern Radix, tidak valid di Base UI (R-03).
- **JANGAN** panggil `revalidateProductRoutes` sebelum `updateProduct` — cache di-invalidate padahal data belum berubah, akan refetch data lama.
- **JANGAN** skip `form.reset(data)` setelah success — form akan tetap `dirty=true`, submit button stays enabled dengan data yang sudah sama.

## Verifikasi

- [ ] Edit + submit flow works
- [ ] Toast success muncul
- [ ] Public site reflect perubahan setelah revalidation
- [ ] Submit button disabled saat pristine
- [ ] `beforeunload` warning muncul kalau dirty

---

# PHASE 13 — Local E2E Test + Build Verification

**Tujuan:** Test end-to-end 4 skenario US, verify build no regression.

## Kerjakan

1. Jalankan 4 test skenario US:
   - **E3B-S1-US-01:** Edit deskripsi PRO YD → refresh public detail → deskripsi baru muncul
   - **E3B-S1-US-02:** Edit `nacl_pct` value → refresh public detail → spec table update
   - **E3B-S1-US-03:** Toggle GHPT `is_active = false` → refresh public `/produk` → GHPT hilang dari grid, `/produk/garam-ghpt` return 404
   - **E3B-S1-US-04:** Ubah `sort_order` produk → refresh public `/produk` → urutan berubah
2. **Regression test:** Verify no impact ke Slice 1 & 2 Epic 3 customer-facing:
   - `/produk` list tetap render 5 produk (semua aktif kalau US-03 sudah direvert)
   - Filter tab kategori tetap works
   - `/produk/garam-halus-yodium` detail render dengan spec table normal
3. `pnpm build`:
   - Verify `/produk` masih `○` (Static)
   - Verify `/produk/[slug]` × 5 masih `○`
   - Verify `/admin/products` dan `/admin/products/[id]/edit` muncul sebagai `ƒ` (Dynamic — expected untuk admin)
4. `pnpm lint` — 0 error.
5. Revert semua perubahan test (nama, tagline, is_active, sort_order kembali ke seed original).
6. Commit final:
   ```bash
   git add .
   git commit -m "feat(admin): complete product edit form with cache invalidation [Epic 3B Slice 1]"
   ```

## Jangan

- **JANGAN** commit dengan data test yang belum direvert (mis. "Garam Halus Yodium TEST" masih di DB).
- **JANGAN** skip regression test — Slice ini murni add, tapi tetap possible ada import chain yang tidak sengaja mempengaruhi rendering strategy.

## Verifikasi

- [ ] 4 US skenario pass
- [ ] Regression test Slice CF pass (rendering symbol tidak berubah)
- [ ] Build & lint pass
- [ ] Data DB direvert ke state clean
- [ ] Commit masuk

---

# PHASE 14 — Deploy Vercel Preview

**Tujuan:** Push branch, trigger Vercel preview deploy, smoke test.

## Kerjakan

1. `git push` (upstream sudah set dari Phase 4).
2. Tunggu Vercel preview build.
3. Get preview URL.
4. Smoke test:
   - Login admin
   - `/admin/products` render list
   - Edit 1 produk → submit → public reflect
   - Test whitelist violation via DevTools console (fetch dengan payload `slug`) → 422 response
5. Report preview URL ke Jazil.

## Jangan

- **JANGAN** submit form di preview dengan data destructive (nama produk berubah) tanpa direvert — kalau iya, ingat revert setelah test.

## Verifikasi

- [ ] Preview deploy sukses
- [ ] Smoke test pass
- [ ] Preview URL diberitahukan ke Jazil

---

# 🛑 STOP GATE 1 — E2E Test + Security Test + Auth Test

**Status:** Menunggu Jazil melakukan QA komprehensif.

## Aksi Manual yang Jazil Lakukan

### 1. E2E Test 4 US Skenario

Ulang test dari Phase 13 di preview URL. Verify semua pass di production-like environment.

### 2. Security Test (Whitelist Enforcement)

Wajib test:
- [ ] PUT dengan field `slug` → 422
- [ ] PUT dengan field `code` → 422
- [ ] PUT dengan field `category` → 422
- [ ] PUT dengan field `id` → 422
- [ ] PUT dengan field `created_at` → 422

Kalau ada yang lolos (return 200), STOP dan investigate — kemungkinan `extra='forbid'` tidak jalan.

### 3. Auth Test

- [ ] `GET /products/admin` tanpa JWT → 401
- [ ] `PUT /products/{id}` tanpa JWT → 401
- [ ] JWT expired → 401 → frontend redirect ke login
- [ ] Akses `/admin/products` tanpa login → redirect ke `/admin/login`

### 4. UI/UX Test

- [ ] SpecJSONBEditor: add/edit/delete field works
- [ ] SpecJSONBEditor: custom field validation regex works
- [ ] IndustriesEditor: chip add/remove works
- [ ] Autocomplete industries populate dari existing produk
- [ ] Read-only info block visible dan tidak editable
- [ ] Submit button disabled saat pristine
- [ ] `beforeunload` warning muncul kalau dirty
- [ ] Toast success muncul setelah save

### 5. Cache Invalidation Test

- [ ] Edit di admin → public reflect dalam < 2 detik
- [ ] Toggle `is_active = false` → public grid tidak lagi tampilkan produk tersebut
- [ ] Sitemap.xml update setelah toggle

### 6. Regression Test Epic 3 Customer-Facing

- [ ] Filter tab kategori masih works
- [ ] Detail page render normal
- [ ] Contact form prefill dari CTA masih works

## Setelah Gate Ini Clear

Jazil bilang "Gate 1 clear". Kalau ada issue:
- **Whitelist bypass:** critical — fix Pydantic config, redeploy backend, retest.
- **State infinite loop di SpecJSONBEditor:** cek Profiler, likely violation R-15.
- **Cache tidak invalidate:** cek Server Action call di Network tab, verify tidak throw error.

---

# PHASE 15 — Merge ke `dev` + Production Deploy

**Tujuan:** Merge PR, deploy staging, siapkan production.

## Kerjakan

1. Buat/update PR ke `dev`.
2. PR description include:
   - Ringkasan Slice 1 scope
   - Screenshot build output (`/admin/products` sebagai `ƒ`, public routes tetap `○`)
   - Screenshot security test (5 curl 422 responses)
   - Screenshot E2E test flow
   - DoD checklist tercentang
3. Jazil review + approve → merge ke `dev`.
4. Vercel auto-deploy `dev`. Smoke test staging.
5. Jazil manual merge `dev` → `main` untuk production release.
6. Verify production `/admin/products` accessible, login flow works, edit flow works.

## Jangan

- **JANGAN** merge `dev` → `main` sendiri.
- **JANGAN** hapus feature branch sebelum demo klien selesai.

## Verifikasi

- [ ] PR merged ke `dev`
- [ ] Staging deploy sukses
- [ ] Production deploy sukses

---

# 🛑 STOP GATE 2 — Client Demo & Sign-Off Slice 1

**Status:** Menunggu Jazil demo ke klien (Irwan Sugianto sebagai primary user).

## Aksi Manual yang Jazil Lakukan

Follow demo script `docs/demos/epic3B_slice1_demo_script.md`:

1. Konteks pembukaan — panel admin menggantikan proses developer
2. Login flow demo
3. List page walkthrough
4. Full edit flow: PRO YD → ubah tagline, spec value, tambah industri → submit → public reflect
5. Toggle `is_active` demo dengan GHPT
6. Roadmap Slice 2: "Sekarang belum bisa upload foto/PDF asli — itu Slice 2 next."

## Setelah Gate Ini Clear

Klien sign-off Slice 1. Siap untuk Slice 2 (butuh guide terpisah, dan **butuh asset real dari klien** untuk QA Slice 2).

## Sinyal Masalah

- **Klien confused dengan SpecJSONBEditor UX:** dokumentasi user manual untuk klien mungkin diperlukan. Screencast 3 menit yang jelaskan cara add/edit/delete spec field.
- **Klien butuh field yang tidak di whitelist:** kalau request masuk akal (mis. `category` karena marketing rebranding), evaluate impact SEO/filter tab. Ini bukan quick fix, defer sebagai enhancement backlog.

---

# PHASE 16 — Cleanup & Handover ke Slice 2

**Tujuan:** Cleanup post-merge, prepare Slice 2.

## Kerjakan

1. Setelah production stable 24 jam observasi, hapus feature branch:
   ```bash
   git branch -d feature/epic3B-slice1-admin-products
   git push origin --delete feature/epic3B-slice1-admin-products
   ```
2. Update progress tracker: Epic 3B Slice 1 ✅.
3. Handover note ke Slice 2:
   - Backend upload endpoints belum ada — akan di Slice 2
   - `ProductEditForm` akan di-touch di Slice 2 untuk integrate `PhotoUploader` dan `PDFUploader` sections
   - Klien perlu prepare 5 foto real + 5 PDF real sebelum Slice 2 QA

## Jangan

- **JANGAN** hapus branch sebelum stability observation.
- **JANGAN** start Slice 2 tanpa konfirmasi asset klien available.

## Verifikasi

- [ ] Branch cleaned
- [ ] Handover note clear
- [ ] Klien confirm asset available untuk Slice 2 QA

---

# Kontingensi & Troubleshooting

## Situasi: `extra='forbid'` tidak jalan (payload dengan `slug` return 200)

**Root cause biasa:**
- Pakai Pydantic v1 syntax (`class Config:`)
- Config di parent class `BaseModel` override child
- Pydantic version < 2.0

**Fix:**
1. `pip show pydantic` — verify version 2.x
2. Verify syntax `model_config = ConfigDict(extra='forbid')` (bukan `class Config:`)
3. Test dengan REPL (dari Phase 2)

## Situasi: SpecJSONBEditor infinite re-render

**Symptom:** React DevTools Profiler menunjukkan komponen render berulang tanpa stop. Browser lag.

**Root cause biasa:** `useEffect` sync `internalArray` → `onChange` yang bikin parent re-render → prop `value` update → `useEffect` fire lagi.

**Fix:**
1. Hapus `useEffect` yang sync arah `internal → external`
2. Panggil `onChange` eksplisit di event handler (add/remove/edit)
3. `useEffect` untuk initial sync HANYA, dengan empty deps `[]`

## Situasi: Cache tidak invalidate setelah edit

**Symptom:** Edit di admin → refresh public → data lama.

**Root cause biasa:**
- Server Action tidak dipanggil (verify di Network tab)
- Server Action call throw error (verify di server logs)
- `revalidatePath` path salah (typo `/produk/${slug}` vs `/produk/[slug]`)

**Fix:**
1. Console.log di `onSubmit` sebelum dan sesudah `revalidateProductRoutes` call.
2. Verify path exact match Next.js file structure (mis. `/produk/${product.slug}` bukan `/produk/[slug]`).
3. Test dengan `router.refresh()` sebagai fallback — kalau ini works, Server Action pattern-nya yang broken.

## Situasi: Admin routes tidak protected (bypass middleware)

**Symptom:** Anonymous user bisa akses `/admin/products`.

**Root cause biasa:** Middleware config di `middleware.ts` tidak include pattern `/admin/products`.

**Fix:**
1. Cek `middleware.ts` matcher config — pastikan `/admin/:path*` covered.
2. Verify Epic 1 middleware behavior tidak berubah — kalau middleware butuh update untuk pattern route baru, koordinasi dengan Jazil.

## Situasi: Type error saat pass `Product` ke `ProductEditForm` initial values

**Symptom:** TS error karena `Product.specs: ProductSpecs` vs Zod schema expect `Record<string, string | number>`.

**Root cause:** `ProductSpecs` punya specific fields (`nacl_pct?: number`, dll) yang di TypeScript ter-narrow.

**Fix:** Cast atau restructure. Kalau cast:
```typescript
defaultValues: {
  ...product,
  specs: product.specs as Record<string, string | number>,
}
```

Atau update `ProductSpecs` type dengan index signature yang looser di Slice 1 Epic 3 CF (kalau belum).

---

# Ringkasan File yang Dibuat/Modifikasi di Slice 1

**Backend:**
- Modifikasi: `backend/schemas/product.py`
- Modifikasi: `backend/routers/products.py`

**Frontend Contract:**
- Modifikasi: `types/api.ts`
- Modifikasi: `lib/api.ts`

**Validation:**
- Baru: `lib/validation/product-schema.ts`

**Server Actions:**
- Baru: `app/actions/products.ts`

**Routes:**
- Baru: `app/admin/products/page.tsx`
- Baru: `app/admin/products/[id]/edit/page.tsx`

**Components:**
- Baru: `components/admin/product/ProductsAdminList.tsx`
- Baru: `components/admin/product/ProductAdminRow.tsx`
- Baru: `components/admin/product/ReadOnlyInfoBlock.tsx`
- Baru: `components/admin/product/IndustriesEditor.tsx`
- Baru: `components/admin/product/SpecJSONBEditor.tsx`
- Baru: `components/admin/product/ProductEditForm.tsx`

**Dokumentasi:**
- `docs/wireframes/Epic3B_slice1_admin-products-list.md`
- `docs/wireframes/Epic3B_slice1_admin-product-edit.md`
- `docs/demos/epic3B_slice1_demo_script.md`

---

## Catatan Penutup

Slice 1 ini punya karakter **security-critical + state-complex** yang berbeda dari slice sebelumnya. Dua area risk utama:

1. **Whitelist enforcement backend** — kalau `extra='forbid'` typo atau lupa, Silent data corruption possible (klien accidentally ubah slug via DevTools).
2. **SpecJSONBEditor state pattern** — infinite loop bug yang subtle, sulit debug tanpa React DevTools.

**Rules R-11 sampai R-15 di guide ini adalah non-negotiable.** Kalau ada yang unclear di implementation, STOP dan tanya Jazil sebelum improvise.

Setelah Slice 1 sign-off, konfirmasi asset klien available sebelum start Slice 2.

**File:** `docs/execution-guides/CLAUDE_CODE_GUIDE_epic3B_slice1_admin-list-edit.md`
**Version:** 1.0 — 2026-07-05
