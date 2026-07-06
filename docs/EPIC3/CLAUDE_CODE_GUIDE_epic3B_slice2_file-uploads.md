# Claude Code Execution Guide — Epic 3B Slice 2 (File Uploads: Foto + PDF)

**Project:** reka-cipta-platform
**Slice:** Epic 3B Slice 2 — Upload Foto (`product-photos`) + Upload PDF (`lab-docs`)
**Task Breakdown Reference:** `epic3B_task_breakdown_admin-panel.md` (WAJIB dibaca sebelum eksekusi)
**Prasyarat:** Epic 3B Slice 1 sudah merged ke `main`, live di production, dan sign-off klien
**Prasyarat External:** Klien (Irwan Sugianto) sudah menyiapkan 5 foto profesional + 5 PDF lab asli
**Version:** 1.0
**Author:** Ach. Jazilul Qutbi
**Total Phase:** 14 | **STOP Gates:** 2

---

## Cara Pakai Guide Ini

Sama seperti guide sebelumnya. Namun Slice 2 ini punya karakter yang berbeda:

**Perbedaan risk profile:**

| Aspek | Slice 1 Epic 3B | Slice 2 Epic 3B (ini) |
|---|---|---|
| Primary risk | Security bypass + state complexity | **Regression Slice 1** + **File handling edge cases** |
| Backend focus | JSON payload validation | Multipart form data + Storage API + cleanup atomicity |
| Frontend focus | Form composition | XHR-based progress + drag-drop UX |
| Cross-slice touches | Tidak ada | **Slice 1 `ProductEditForm` di-touch** (integrate uploaders) |
| External blocker | Tidak ada | **Asset real klien** (kalau belum ada, QA tidak bisa complete) |

**Yang paling risky:**
1. `apiFetchMultipart` dengan XHR — fetch API tidak native support upload progress, XHR wrapper kompleks
2. Old file cleanup best-effort — kalau tidak atomic, orphan file di Storage
3. Touch `ProductEditForm` untuk integrate uploader section — regression risk ke form utama Slice 1
4. Klien akan operate upload sendiri di demo — UX harus solid, tidak boleh confusing

---

## Operating Rules — Delta dari Guide Sebelumnya

Semua Operating Rules R-01 sampai R-15 dari guide sebelumnya tetap berlaku. Rules tambahan spesifik Slice 2:

### R-16 — Regression Test Slice 1 Setelah Touch `ProductEditForm`

Setelah integrate `PhotoUploader` dan `PDFUploader` ke `ProductEditForm`:
- **Test path Slice 1 lama dulu** (edit tagline, submit) sebelum test upload
- Kalau edit form path lama break, revert dulu, redesign integration approach
- Log manual test di PR description

### R-17 — Old File Cleanup: Best-Effort, Tidak Atomic

Backend endpoint upload melakukan operasi berurutan:
1. Validate file
2. Upload file baru ke Storage
3. Update DB dengan URL baru
4. Delete file lama dari Storage (best-effort)

**Step 4 WAJIB dalam try-except tanpa rollback:**

```python
# BENAR
try:
    delete_from_storage(bucket='product-photos', url=old_photo_url)
except Exception as e:
    logger.warning(f"Failed to delete old photo {old_photo_url}: {e}")
    # DO NOT re-raise — response tetap 200 karena upload berhasil
```

**JANGAN** rollback DB update kalau delete gagal — user experience: upload success, tapi orphan file remain (acceptable trade-off).

**JANGAN** panggil delete SEBELUM upload success — kalau upload fail setelah delete, klien kehilangan foto lama tanpa gantinya.

### R-18 — Client-Side Validation adalah UX Layer, Bukan Security Layer

Frontend validasi MIME + size sebelum kirim ke backend — ini untuk UX (feedback cepat, tidak buang bandwidth).

- **JANGAN** skip validasi backend hanya karena client sudah validate — user bisa bypass via curl.
- Backend validation adalah source of truth. Client validation adalah convenience.

### R-19 — XHR Wrapper untuk Progress: Isolate Ke `lib/api.ts`

Progress bar butuh XHR (fetch tidak support). Wrapper ini di-isolate ke `apiFetchMultipart` di `lib/api.ts`.

- **JANGAN** import XHR pattern di komponen — abstract via helper.
- **JANGAN** re-invent wheel dengan library baru (axios, ky) — small wrapper cukup untuk case ini.

---

# PHASE 1 — Preflight & Branch Setup

**Tujuan:** Verify Slice 1 live production, klien asset available, buat feature branch.

## Kerjakan

1. `git status` — bersih.
2. `git checkout main && git pull origin main`.
3. Verify Slice 1 artifacts di `main`:
   ```bash
   ls app/admin/products/page.tsx
   ls app/admin/products/[id]/edit/page.tsx
   ls components/admin/product/ProductEditForm.tsx
   ls components/admin/product/SpecJSONBEditor.tsx
   grep -l "revalidateProductRoutes" app/actions/products.ts
   ```
4. Verify production admin panel healthy:
   - Login ke `/admin/login`
   - Navigate ke `/admin/products` — 5 produk render
   - Edit 1 produk (change tagline sementara) — submit works, public reflect
   - Revert tagline
5. **Konfirmasi asset klien:**
   - Tanya Jazil: apakah 5 foto real dan 5 PDF real dari klien sudah tersedia untuk QA?
   - Kalau belum: STOP di sini. Slice 2 QA tidak bisa complete tanpa asset real. Alternatif: mulai eksekusi dengan sample assets (mis. 2 foto), tapi jangan finalize sign-off demo sampai klien deliver 5 asset lengkap.
6. `git checkout -b feature/epic3B-slice2-file-uploads`

## Jangan

- Jangan skip step 4 — kalau Slice 1 tidak healthy di production, Slice 2 akan compound issue.
- Jangan proceed step 5 tanpa jawaban tegas dari Jazil.

## Verifikasi

- [ ] Branch aktif
- [ ] Slice 1 artifacts exist
- [ ] Slice 1 flow works di production
- [ ] Asset klien status confirmed

---

# PHASE 2 — Backend Storage Service Helper

**Tujuan:** Buat helper functions untuk upload & delete di Supabase Storage. Isolate storage logic dari router untuk testability.

## Kerjakan

1. Buat direktori `backend/services/` (kalau belum ada dari Epic 2 Slice 3 email service).
2. Buat file `backend/services/storage_service.py` sesuai spec task `E3B-S2-BE-03`:
   ```python
   from supabase import Client
   from backend.dependencies.supabase_client import get_supabase_service
   import logging

   logger = logging.getLogger(__name__)

   def upload_to_storage(
       bucket: str,
       filename: str,
       file_bytes: bytes,
       content_type: str
   ) -> str:
       """Upload file to Supabase Storage. Returns public URL."""
       supabase: Client = get_supabase_service()
       supabase.storage.from_(bucket).upload(
           path=filename,
           file=file_bytes,
           file_options={
               "content-type": content_type,
               "upsert": "true",
           },
       )
       return supabase.storage.from_(bucket).get_public_url(filename)

   def delete_from_storage(bucket: str, url: str) -> None:
       """Delete file from Storage by public URL. Raises on error."""
       # Extract filename from URL
       # URL format: https://xxx.supabase.co/storage/v1/object/public/{bucket}/{filename}
       marker = f"/{bucket}/"
       if marker not in url:
           raise ValueError(f"URL does not contain bucket path: {url}")
       filename = url.split(marker, 1)[1]
       supabase: Client = get_supabase_service()
       supabase.storage.from_(bucket).remove([filename])
   ```
3. Test manual dengan Python REPL:
   ```python
   from backend.services.storage_service import upload_to_storage, delete_from_storage

   # Upload test
   with open('/tmp/test.jpg', 'rb') as f:
       url = upload_to_storage('product-photos', 'test-upload.jpg', f.read(), 'image/jpeg')
   print(f"URL: {url}")

   # Verify di Supabase Dashboard Storage

   # Delete test
   delete_from_storage('product-photos', url)
   print("Deleted")
   ```

## Jangan

- **JANGAN** hardcode Supabase project ref di URL parsing — pakai marker `/{bucket}/`.
- **JANGAN** raise dari `delete_from_storage` untuk file yang tidak ada — Storage API kemungkinan silently succeed (test dulu behavior actual).
- **JANGAN** pakai anon key untuk Storage ops — service role karena bypass RLS untuk cleanup.

## Verifikasi

- [ ] Upload REPL test success
- [ ] Public URL accessible di browser (kalau bucket public per Epic 3 CF setup)
- [ ] Delete REPL test success, file hilang dari Dashboard

---

# PHASE 3 — Backend Endpoint `POST /products/{id}/upload-photo`

**Tujuan:** Implement upload endpoint untuk foto dengan validation MIME + size + old file cleanup.

## Kerjakan

1. Buka `backend/routers/products.py`.
2. Import dependencies:
   ```python
   from fastapi import UploadFile, File
   from backend.services.storage_service import upload_to_storage, delete_from_storage
   import time
   ```
3. Tambah constants di file:
   ```python
   ALLOWED_PHOTO_MIME = {'image/jpeg', 'image/png', 'image/webp'}
   MAX_PHOTO_SIZE = 5 * 1024 * 1024  # 5 MB
   ```
4. Implement endpoint sesuai spec task `E3B-S2-BE-01`:
   - Validation MIME + size (step 1-2)
   - Fetch existing product untuk get `code` dan `old_photo_url` (step 3)
   - Generate filename dengan pattern `{code-lowercase-slug}-{timestamp}.{ext}` (step 4)
   - Upload ke bucket (step 5)
   - Update DB `photo_url` (step 6)
   - Delete old file **best-effort dengan try-except** (step 7, R-17)
   - Return updated product (step 8)
5. Test dengan curl multipart:
   ```bash
   JWT="eyJ..."
   PRO_YD_ID="<uuid>"

   # Prepare small test image
   curl -o /tmp/test.jpg https://placehold.co/400x300/jpg

   # Upload
   curl -X POST -H "Authorization: Bearer $JWT" \
     -F "file=@/tmp/test.jpg" \
     http://localhost:8000/products/$PRO_YD_ID/upload-photo | jq '.product.photo_url'
   # Expected: URL baru dengan pattern pro-yd-1720xxxxxxx.jpg
   ```
6. Verify di Supabase Dashboard:
   - File baru ada di bucket `product-photos`
   - File lama (placeholder Slice 1 Epic 3 CF) sudah terhapus

## Jangan

- **JANGAN** pakai `file.read()` tanpa await — `UploadFile.read()` async.
- **JANGAN** hardcode filename `{code}.jpg` tanpa timestamp — CDN cache stale, browser tidak refresh.
- **JANGAN** delete OLD file sebelum upload NEW file success — kalau NEW upload fail, client kehilangan photo tanpa replacement.

## Verifikasi

- [ ] Upload valid MIME + size → 200 dengan photo_url baru
- [ ] Upload wrong MIME (mis. .docx) → 422
- [ ] Upload > 5 MB → 422
- [ ] Upload tanpa JWT → 401
- [ ] Old file terhapus dari bucket (verify Dashboard)

---

# PHASE 4 — Backend Endpoint `POST /products/{id}/upload-lab-doc`

**Tujuan:** Implement upload endpoint untuk PDF. Copy pattern dari Phase 3 dengan config berbeda.

## Kerjakan

1. Tambah constants:
   ```python
   ALLOWED_PDF_MIME = {'application/pdf'}
   MAX_PDF_SIZE = 10 * 1024 * 1024  # 10 MB
   ```
2. Implement endpoint dengan pattern serupa `upload-photo` tapi:
   - MIME whitelist berbeda
   - Size limit berbeda
   - Bucket target `lab-docs`
   - Field DB target `lab_doc_url`
3. Test dengan curl multipart:
   ```bash
   # Prepare test PDF (bisa apapun, minimal valid PDF)
   curl -o /tmp/test.pdf https://www.africau.edu/images/default/sample.pdf

   curl -X POST -H "Authorization: Bearer $JWT" \
     -F "file=@/tmp/test.pdf" \
     http://localhost:8000/products/$PRO_YD_ID/upload-lab-doc | jq '.product.lab_doc_url'
   ```

## Jangan

- **JANGAN** duplicate 100% code dari `upload-photo` — refactor common logic (validation flow, DB update, cleanup) ke helper function kalau memungkinkan. Tapi hati-hati: kalau abstraction membuat kode susah dibaca, keep duplicate lebih baik. Rule of thumb: refactor kalau > 20 LOC duplikasi.
- **JANGAN** pakai MIME whitelist untuk image di endpoint ini — must be PDF only.

## Verifikasi

- [ ] Upload valid PDF → 200
- [ ] Upload image ke endpoint ini → 422
- [ ] Old PDF terhapus

---

# PHASE 5 — Backend Deploy Railway + Curl Test Production

**Tujuan:** Deploy ke Railway staging, verify upload endpoints accessible di production.

## Kerjakan

1. Commit backend changes:
   ```bash
   git add backend/
   git commit -m "feat(api): add product upload endpoints for photo and lab doc [Epic 3B Slice 2]"
   git push -u origin feature/epic3B-slice2-file-uploads
   ```
2. Tunggu Railway deploy.
3. Repeat curl test dari Phase 3 & 4 di production URL.
4. **Cleanup test files** — hapus test upload yang bukan asset real dari Storage (via Dashboard).

## Jangan

- **JANGAN** deploy tanpa fix curl test yang gagal di local — production akan lebih parah.
- **JANGAN** biarkan test upload files akumulasi di Storage — cleanup manual.

## Verifikasi

- [ ] Production endpoints accessible
- [ ] Curl test pass 5 skenario (valid, wrong MIME, oversize, no JWT, invalid ID)

---

# PHASE 6 — Contract Layer: `apiFetchMultipart` Helper

**Tujuan:** Buat XHR-based wrapper untuk upload dengan progress callback.

## Kerjakan

1. Buka `lib/api.ts`.
2. Tambah helper `apiFetchMultipart` sesuai spec task `E3B-S2-FE-05`:
   ```typescript
   export function apiFetchMultipart<T>(
     path: string,
     formData: FormData,
     options: { onProgress?: (percent: number) => void } = {}
   ): Promise<T> {
     return new Promise((resolve, reject) => {
       const xhr = new XMLHttpRequest();
       const url = `${API_BASE_URL}${path}`;

       xhr.open('POST', url);

       // Auth header — cari fungsi getSessionToken atau setara dari Epic 2
       const token = getSessionToken(); // sesuaikan dengan pattern existing
       if (token) {
         xhr.setRequestHeader('Authorization', `Bearer ${token}`);
       }

       xhr.upload.onprogress = (event) => {
         if (event.lengthComputable && options.onProgress) {
           const percent = (event.loaded / event.total) * 100;
           options.onProgress(Math.round(percent));
         }
       };

       xhr.onload = () => {
         if (xhr.status >= 200 && xhr.status < 300) {
           try {
             resolve(JSON.parse(xhr.responseText) as T);
           } catch (e) {
             reject(new Error('Invalid JSON response'));
           }
         } else {
           reject(new Error(`Upload failed: ${xhr.status} ${xhr.responseText}`));
         }
       };

       xhr.onerror = () => reject(new Error('Network error during upload'));
       xhr.ontimeout = () => reject(new Error('Upload timeout'));

       xhr.send(formData);
     });
   }
   ```
3. Tambah 2 typed fetcher:
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
4. **Verify `getSessionToken` pattern** — di Epic 2 Slice 3, JWT diambil dari session. Cari implementasi existing di `lib/api.ts` `apiFetch` function. Kalau JWT diambil dari cookie, XHR akan otomatis include cookie kalau `xhr.withCredentials = true` — tambah kalau applicable.
5. Type check: `pnpm tsc --noEmit`.

## Jangan

- **JANGAN** pakai `fetch()` untuk endpoint upload — tidak native support progress (tanpa ReadableStream tricks yang browser-specific).
- **JANGAN** lupa handle onerror & ontimeout — tanpa ini, request stuck kalau network fail.
- **JANGAN** re-implement JWT extraction — pakai pattern existing dari `apiFetch`.

## Verifikasi

- [ ] Type check pass
- [ ] Manual test dengan HTML file iseng — verify progress callback fired dengan value 0-100

---

# PHASE 7 — Component `PhotoUploader`

**Tujuan:** Bikin komponen upload foto dengan drag-drop, preview, progress bar, error handling.

## Kerjakan

1. Buat `components/admin/product/PhotoUploader.tsx` sesuai spec task `E3B-S2-FE-01`:
   - Client Component
   - Props:
     ```typescript
     interface Props {
       productId: string;
       productSlug: string; // untuk revalidate
       currentPhotoUrl: string | null;
       onUploadSuccess: (newUrl: string) => void;
     }
     ```
   - State machine:
     ```typescript
     type UploadState =
       | { status: 'idle' }
       | { status: 'validating' }
       | { status: 'uploading'; percent: number }
       | { status: 'success' }
       | { status: 'error'; message: string; retryFile?: File };
     ```
2. Implement drag-drop area:
   - `onDragOver` prevent default + visual feedback
   - `onDragLeave` reset visual
   - `onDrop` handle file
   - Klik area juga trigger `<input type="file" hidden>`
3. Client-side validation sebelum upload (R-18):
   - MIME: check `file.type` in whitelist
   - Size: check `file.size <= 5 MB`
   - Kalau invalid: set state error dengan message, JANGAN submit
4. Upload flow:
   ```typescript
   async function handleUpload(file: File) {
     setState({ status: 'validating' });

     // Client validation
     if (!ALLOWED_MIME.includes(file.type)) {
       setState({ status: 'error', message: 'Format tidak didukung. Pakai JPG/PNG/WebP.', retryFile: file });
       return;
     }
     if (file.size > MAX_SIZE) {
       setState({ status: 'error', message: 'File terlalu besar. Maks 5 MB.', retryFile: file });
       return;
     }

     setState({ status: 'uploading', percent: 0 });

     try {
       const response = await uploadProductPhoto(productId, file, (percent) => {
         setState({ status: 'uploading', percent });
       });
       await revalidateProductRoutes(productSlug);
       onUploadSuccess(response.product.photo_url!);
       setState({ status: 'success' });
       toast.success('Foto berhasil diperbarui');
     } catch (err) {
       setState({
         status: 'error',
         message: err instanceof Error ? err.message : 'Upload gagal',
         retryFile: file
       });
       toast.error('Upload gagal. Coba lagi.');
     }
   }
   ```
5. Render logic:
   - Preview current photo (`<Image>` dari currentPhotoUrl kalau ada)
   - Drop area dengan text instruksi
   - Progress bar saat uploading
   - Error message + retry button kalau error state
6. Retry button: `onClick={() => handleUpload(state.retryFile)}` — reuse file yang gagal, no picker lagi.

## Jangan

- **JANGAN** allow multiple file selection — `<input>` tanpa `multiple` attribute.
- **JANGAN** skip client-side validation — bandwidth waste kalau invalid file lolos.
- **JANGAN** show progress dalam bytes — user tidak paham. Show percent + spinner.
- **JANGAN** call `revalidateProductRoutes` di dalam try-catch upload — kalau upload success tapi revalidate fail, user tidak tahu upload sudah berhasil. Split: revalidate di try, tapi kalau throw, toast warning "berhasil, tapi cache tidak refresh" (bukan error).

## Verifikasi

- [ ] Drag-drop works
- [ ] Klik area trigger file picker
- [ ] Client validation MIME + size works
- [ ] Progress bar animate 0-100
- [ ] Error state show retry button
- [ ] Preview update setelah success

---

# PHASE 8 — Component `PDFUploader`

**Tujuan:** Bikin komponen upload PDF. Copy pattern dari `PhotoUploader` dengan variasi.

## Kerjakan

1. Buat `components/admin/product/PDFUploader.tsx` sesuai spec task `E3B-S2-FE-02`.
2. Perbedaan dari `PhotoUploader`:
   - Constants: `ALLOWED_MIME = ['application/pdf']`, `MAX_SIZE = 10 * 1024 * 1024`
   - Preview: link `<a href={currentPdfUrl} target="_blank">` dengan icon `FileText`, BUKAN image thumbnail
   - Call `uploadProductLabDoc` (bukan photo)
3. Consider abstraction — kalau > 70% code sama, refactor jadi generic `<FileUploader>` dengan config props. Tapi kalau UX materially berbeda (foto punya preview thumbnail, PDF punya link), keep separate.

## Jangan

- **JANGAN** allow image upload ke PDF endpoint — client validation reject.
- **JANGAN** show PDF preview inline dengan iframe — resource-heavy, defer sebagai enhancement.

## Verifikasi

- [ ] PDF upload works
- [ ] Link ke current PDF works (open tab baru)
- [ ] Non-PDF file → validation error

---

# PHASE 9 — Integration ke `ProductEditForm` (SLICE 1 TOUCH — HIGH REGRESSION RISK)

**Tujuan:** Add 2 section uploader ke form edit dari Slice 1. **Ini phase paling risky.**

## Prep Sebelum Kerjakan

1. Baca ulang implementasi `ProductEditForm.tsx` dari Slice 1.
2. Pahami struktur:
   - Sections apa saja yang ada?
   - Bagaimana state form dikelola?
   - Bagaimana submit handler bekerja?
3. Kalau struktur unclear, jangan langsung modifikasi — sketch dulu di komentar.

## Kerjakan

1. Update `app/admin/products/[id]/edit/page.tsx` — pass `product.photo_url` dan `product.lab_doc_url` sebagai prop terpisah (kalau belum).
2. Update `components/admin/product/ProductEditForm.tsx`:
   - Tambah 2 useState untuk track current URL:
     ```typescript
     const [currentPhotoUrl, setCurrentPhotoUrl] = useState(product.photo_url);
     const [currentPdfUrl, setCurrentPdfUrl] = useState(product.lab_doc_url);
     ```
   - Tambah 2 section di form (bisa di atas atau di bawah sections existing, konsultasi UX):
     ```tsx
     <section>
       <h2>Foto Produk</h2>
       <PhotoUploader
         productId={product.id}
         productSlug={product.slug}
         currentPhotoUrl={currentPhotoUrl}
         onUploadSuccess={(newUrl) => setCurrentPhotoUrl(newUrl)}
       />
     </section>

     <section>
       <h2>Dokumen Uji Lab</h2>
       <PDFUploader
         productId={product.id}
         productSlug={product.slug}
         currentPdfUrl={currentPdfUrl}
         onUploadSuccess={(newUrl) => setCurrentPdfUrl(newUrl)}
       />
     </section>
     ```
   - **CRITICAL:** Upload adalah operasi terpisah dari form submit. `photo_url` dan `lab_doc_url` **TIDAK** included di `productUpdateSchema` submit — mereka di-update via dedicated upload endpoints.
3. **Regression test path Slice 1 lama (R-16):**
   - Buka edit page PRO YD
   - Edit tagline (JANGAN touch uploader)
   - Submit form → toast success, tagline update di public
   - Kalau ini break, revert integration approach — mungkin state clash atau prop conflict
4. **Test path baru:**
   - Buka edit page PRO YD
   - Upload foto baru → preview update, public reflect
   - Upload PDF baru → link update, public reflect
   - Edit tagline BERSAMAAN dengan upload foto (upload foto dulu, lalu edit tagline, submit form)
     - Verify: upload foto berhasil, DAN submit form berhasil (independent operations)

## Jangan

- **JANGAN** add `photo_url` / `lab_doc_url` ke Zod schema `productUpdateSchema` — mereka tidak ter-submit via form utama.
- **JANGAN** panggil `updateProduct()` dari dalam uploader — uploader punya endpoint sendiri.
- **JANGAN** integrate uploader dalam Controller wrapper react-hook-form — bukan form field, standalone widget.
- **JANGAN** skip regression test path lama — kalau langsung test path baru dan pass, path lama mungkin diam-diam broken.

## Verifikasi

- [ ] Path Slice 1 lama (edit tagline saja) tetap berfungsi identik
- [ ] Upload foto works, preview update, public reflect
- [ ] Upload PDF works, link update, public reflect
- [ ] Edit form + upload independent — submit form tidak require upload atau sebaliknya
- [ ] Screenshot 3 skenario ambil untuk PR

---

# PHASE 10 — Optional: Client-Side Image Compression

**Tujuan:** Tambah compression sebelum upload untuk foto besar (> 1 MB). **Optional — skip kalau tight timeline.**

## Kerjakan (Kalau Diputuskan Include)

1. Install `browser-image-compression`:
   ```bash
   pnpm add browser-image-compression
   ```
2. Update `PhotoUploader.handleUpload`:
   ```typescript
   import imageCompression from 'browser-image-compression';

   async function handleUpload(file: File) {
     setState({ status: 'validating' });

     // ... validation ...

     let uploadFile = file;
     if (file.size > 1024 * 1024) { // > 1 MB
       try {
         uploadFile = await imageCompression(file, {
           maxSizeMB: 1,
           maxWidthOrHeight: 1920,
           useWebWorker: true,
         });
       } catch (e) {
         console.warn('Compression failed, using original', e);
         // Fallback ke original
       }
     }

     setState({ status: 'uploading', percent: 0 });
     // ... upload uploadFile ...
   }
   ```
3. Test dengan foto besar (mis. 3 MB) — verify di server-side size sudah reduce.

## Jangan (Kalau Skip)

- Skip semua step di atas. Add note di enhancement backlog: "Client-side compression untuk foto > 1 MB".

## Verifikasi (Kalau Include)

- [ ] Foto 3 MB terupload dengan size < 1 MB di server
- [ ] Fallback ke original kalau compression fail
- [ ] Progress bar tetap works

---

# PHASE 11 — Build Verification & Local E2E Test

**Tujuan:** Verify no regression, E2E flow lengkap.

## Kerjakan

1. `pnpm build`:
   - Verify `/produk` masih `○` (Static)
   - Verify `/produk/[slug]` masih `○`
   - Verify `/admin/products/[id]/edit` `ƒ` (Dynamic — expected)
2. `pnpm lint` — 0 error.
3. E2E test dengan sample assets:
   - Upload sample foto untuk 1 produk
   - Upload sample PDF untuk 1 produk
   - Refresh public → asset baru muncul
   - Verify old placeholder terhapus dari Storage Dashboard
4. Test error paths:
   - Drag file .docx ke PhotoUploader → inline error
   - Drag file 6 MB ke PhotoUploader → inline error
   - Simulate network error (DevTools → Network throttle offline) mid-upload → error state + retry button
5. Commit:
   ```bash
   git add .
   git commit -m "feat(admin): add file uploaders integrated to product edit form [Epic 3B Slice 2]"
   ```

## Jangan

- **JANGAN** commit sample test uploads yang mengganti asset produk asli. Revert semua ke placeholder sebelum commit (upload placeholder original kembali).
- **JANGAN** skip regression build check — Slice 1 changes tidak boleh downgrade rendering strategy.

## Verifikasi

- [ ] Build success, rendering strategy preserved
- [ ] Lint pass
- [ ] E2E flow 4 skenario pass
- [ ] Error paths handled correctly
- [ ] Commit masuk

---

# PHASE 12 — Deploy Vercel Preview

**Tujuan:** Push branch, Vercel preview deploy, smoke test.

## Kerjakan

1. `git push`.
2. Tunggu Vercel deploy.
3. Smoke test di preview URL:
   - Login admin
   - Buka edit page 1 produk
   - Upload sample foto → success
   - Upload sample PDF → success
   - Public reflect
4. Report preview URL ke Jazil.

## Jangan

- **JANGAN** upload asset real klien di preview (mungkin bocor domain URL). Simpan untuk demo di production.

## Verifikasi

- [ ] Preview deploy sukses
- [ ] Smoke upload works di preview
- [ ] Preview URL diberitahukan

---

# 🛑 STOP GATE 1 — Upload E2E + Cleanup + Error Handling

**Status:** Menunggu Jazil melakukan QA komprehensif dengan asset real (kalau tersedia) atau sample assets.

## Aksi Manual yang Jazil Lakukan

### 1. E2E Upload — 5 Foto (Idealnya Asset Real)

Upload foto untuk masing-masing 5 produk:
- [ ] PRO YD
- [ ] PRO L
- [ ] SPO/M
- [ ] Petani Premium
- [ ] GHPT

Untuk setiap upload:
- Preview update di form
- Refresh public `/produk` → thumbnail baru
- Refresh public `/produk/{slug}` → hero foto baru

### 2. E2E Upload — 5 PDF

Sama seperti foto. Verify klik "Unduh PDF" di public detail → PDF real download.

### 3. Old File Cleanup Verification

Setelah semua upload:
- [ ] Buka Supabase Dashboard → Storage → `product-photos`
- [ ] Count file: harus tepat 5 (satu per produk)
- [ ] Tidak ada placeholder atau file test yang lingering
- [ ] Sama untuk `lab-docs` bucket

Kalau ada orphan file, investigate — kemungkinan `delete_from_storage` gagal, cek Sentry log.

### 4. Error Handling Test

- [ ] Upload .docx ke Photo endpoint → inline error, no submit
- [ ] Upload > 5 MB foto → inline error
- [ ] Upload > 10 MB PDF → inline error
- [ ] Network error mid-upload (kill wifi) → error state + retry works

### 5. Regression Test Slice 1

- [ ] Edit tagline tanpa touch uploader → submit works, public reflect
- [ ] Edit spec + industri tanpa upload → submit works
- [ ] Toggle is_active → works
- [ ] SpecJSONBEditor tetap functional

### 6. Regression Test Epic 3 CF

- [ ] `/produk` list render dengan foto baru
- [ ] `/produk/{slug}` detail render dengan foto + PDF baru
- [ ] Filter kategori works
- [ ] Contact form CTA prefill works

## Setelah Gate Ini Clear

Jazil bilang "Gate 1 clear". Kalau ada issue:
- **Orphan file:** cleanup manual sekarang + investigate delete function
- **Regression Slice 1:** revert Phase 9 integration, redesign approach
- **Progress bar tidak update:** cek XHR pattern, verify `xhr.upload.onprogress` handler attached

---

# PHASE 13 — Merge ke `dev` + Production Deploy

**Tujuan:** Merge PR, production release.

## Kerjakan

1. Buat/update PR ke `dev`.
2. PR description include:
   - Ringkasan Slice 2 scope
   - Screenshot upload flow
   - Screenshot Storage bucket (before/after cleanup verification)
   - Screenshot error handling states
   - DoD checklist
3. Jazil approve → merge ke `dev`.
4. Vercel auto-deploy `dev` → staging.
5. Jazil manual merge `dev` → `main` → production.

## Jangan

- **JANGAN** merge dengan orphan file di Storage.
- **JANGAN** merge tanpa regression test Slice 1 done.

## Verifikasi

- [ ] PR merged
- [ ] Production deploy sukses

---

# 🛑 STOP GATE 2 — Client Demo + Handover Credentials + Client Uploads Own Assets

**Status:** Menunggu Jazil demo ke klien. **PENTING: klien akan operate upload sendiri.**

## Aksi Manual yang Jazil Lakukan

Follow demo script `docs/demos/epic3B_slice2_demo_script.md`:

1. **Recap Slice 1** — panel admin sudah bisa edit teks
2. **LIVE UPLOAD BY KLIEN** — Jazil pass control ke Irwan Sugianto:
   - Klien login sendiri
   - Klien upload foto asli PRO YD → tunjukkan preview update + public reflect
   - Klien upload PDF asli PRO YD
3. **Retry demo** — drag file .docx, tunjukkan error inline (validation works)
4. **Batch upload 2 produk lain** — klien operate sendiri
5. **Handover credentials** — pastikan klien punya:
   - Admin login URL
   - Kredensial admin (username + password, atau instruksi reset password pertama kali)
   - Dokumen ringkas cara pakai (opsional tapi recommended — screencast 3 menit)
6. **Roadmap Epic 4 (RFQ)** — apa yang akan dibangun selanjutnya

**Kritis:** Klien sendiri yang operate upload di demo. Kalau klien struggle dengan UX (drag-drop tidak intuitive, error message ambiguous), tidak siap sign-off. Iterate UX kalau perlu.

## Setelah Gate Ini Clear

Klien sign-off Epic 3B complete. Klien punya kontrol penuh atas katalog produk. **Epic 3 FULLY CLOSED.**

## Sinyal Masalah

- **Klien butuh tutorial berulang** untuk drag-drop → UX tidak intuitif. Consider tambah tooltip atau onboarding modal.
- **Klien accidentally upload PDF ke photo section** → validation catch, tapi klien confused. Perjelas labeling section.
- **Klien lupa password admin** → setup password reset flow (mungkin belum ada di Epic 1). Follow-up dengan Epic 1 team.

---

# PHASE 14 — Cleanup & Epic 3B Handover Complete

**Tujuan:** Cleanup, dokumentasi, prepare Epic 4.

## Kerjakan

1. Setelah production stable 24-48 jam, hapus feature branch:
   ```bash
   git branch -d feature/epic3B-slice2-file-uploads
   git push origin --delete feature/epic3B-slice2-file-uploads
   ```
2. Update project tracker: Epic 3B ✅ COMPLETE.
3. Update `README.md` atau `docs/CHANGELOG.md` dengan release notes.
4. Documentasi user manual klien (kalau belum ada di Gate 2):
   - Screencast 3-5 menit cara pakai admin panel
   - Written guide 1-2 halaman dengan screenshot
5. Handover note ke Epic 4:
   - Products table sudah stable + admin panel live
   - Epic 4 (RFQ) bisa reference products via foreign key
   - CTA di detail produk saat ini link ke `/kontak?produk=...` — Epic 4 akan repurpose ke `/rfq/new?produk=...`

## Jangan

- **JANGAN** hapus feature branch tanpa observation period.
- **JANGAN** anggap Epic 3B closed tanpa user documentation untuk klien.

## Verifikasi

- [ ] Branch cleaned
- [ ] Documentation created
- [ ] Klien confirm bisa operate mandiri
- [ ] Handover ke Epic 4 clear

---

# Kontingensi & Troubleshooting

## Situasi: Progress bar stuck di 100% tapi request tidak return

**Symptom:** Upload progress reach 100%, tapi state tetap uploading (tidak transition ke success).

**Root cause biasa:**
- `xhr.onload` tidak fire karena server tidak return proper response
- Backend timeout > 30 detik (default browser timeout)

**Fix:**
1. Cek Network tab — apakah request status 200 atau still pending
2. Kalau backend slow, tambah `xhr.timeout = 60000` (60 detik)
3. Cek backend log — apakah endpoint stuck di Storage upload atau DB update

## Situasi: File terupload tapi DB tidak update

**Symptom:** Storage bucket ada file baru, tapi `photo_url` di DB masih lama.

**Root cause biasa:**
- Backend endpoint order salah: upload → DB update → **cleanup fail** → return 500 → tapi upload sudah terjadi
- Kalau retry, file duplicate di Storage

**Fix:**
1. Verify endpoint code: DB update SEBELUM cleanup, cleanup dalam try-except tanpa re-raise
2. Kalau sudah duplicate, cleanup manual di Dashboard

## Situasi: Old file tidak terhapus

**Symptom:** Setelah upload baru, file lama masih ada di bucket.

**Root cause biasa:**
- `delete_from_storage` throw exception tapi ter-swallow di try-except (correct behavior tapi user tidak sadar)
- URL parsing untuk extract filename salah
- RLS policy tidak allow delete

**Fix:**
1. Cek server log untuk warning message dari `delete_from_storage`
2. Manual test dengan REPL: `delete_from_storage('product-photos', '<old-url>')`
3. Verify RLS policy authenticated allow DELETE di Storage

## Situasi: Frontend integration break Slice 1 form

**Symptom:** Setelah tambah uploader di `ProductEditForm`, edit tagline lalu submit → error atau data tidak save.

**Root cause biasa:**
- `photo_url` masuk Zod schema padahal seharusnya tidak
- State clash antara form state (react-hook-form) dan upload state (useState)

**Fix:**
1. Verify `productUpdateSchema` TIDAK punya `photo_url` atau `lab_doc_url`
2. Verify uploader komponen STANDALONE — tidak wrap dalam Controller
3. Revert commit Phase 9, redo integration lebih hati-hati

## Situasi: Klien komplain upload lambat

**Symptom:** Klien bilang "upload lama sekali" (> 30 detik untuk foto 3 MB).

**Root cause biasa:**
- Klien di jaringan lambat
- Backend proxy upload jadi bottleneck (Railway single instance)

**Fix jangka pendek:**
- Implement Phase 10 (client-side compression) kalau belum

**Fix jangka panjang:**
- Migrate ke Signed URL approach (client upload direct ke Storage, backend hanya sign URL + update DB)
- Ini scope enhancement, bukan blocker.

---

# Ringkasan File yang Dibuat/Modifikasi di Slice 2

**Backend:**
- Baru: `backend/services/storage_service.py`
- Modifikasi: `backend/routers/products.py`

**Frontend Contract:**
- Modifikasi: `lib/api.ts`

**Components:**
- Baru: `components/admin/product/PhotoUploader.tsx`
- Baru: `components/admin/product/PDFUploader.tsx`
- Modifikasi: `components/admin/product/ProductEditForm.tsx` (Slice 1 touch)

**Optional:**
- Modifikasi: `package.json` (kalau include browser-image-compression)

**Dokumentasi:**
- `docs/demos/epic3B_slice2_demo_script.md`
- User manual klien (screencast + written guide)

---

## Catatan Penutup

Slice 2 ini adalah **closure** untuk Epic 3 complete. Setelah sign-off, klien punya kontrol penuh atas katalog produk — tim marketing bisa update konten kapan saja tanpa developer intervention.

**Prinsip yang saya encode di guide ini:**

1. **Regression test dulu, feature test kemudian** (R-16). Phase 9 punya rule eksplisit test path lama sebelum path baru. Kalau Claude Code langsung test path baru dan pass, path lama mungkin diam-diam broken.

2. **Cleanup best-effort, bukan atomic** (R-17). Trade-off: upload success meskipun cleanup fail. Consequence: orphan file possible. Monitor via Sentry log untuk detect pattern kalau orphan sering.

3. **Klien operate sendiri di demo** (Gate 2). Ini test paling brutal untuk UX. Kalau klien struggle, UX perlu iterate. Ini bukan opsional — kalau klien tidak bisa operate mandiri, tujuan Epic 3B tidak tercapai.

**Post-Epic 3B:** Epic 4 (RFQ System dengan AI Proposal Generator via Anthropic API) adalah next big scope. RFQ akan reference products dan repurpose CTA. Task breakdown terpisah.

**File:** `docs/execution-guides/CLAUDE_CODE_GUIDE_epic3B_slice2_file-uploads.md`
**Version:** 1.0 — 2026-07-05
