# Claude Code Execution Guide — Epic 4B Slice 2 (Basic Proposal Generator dengan Anthropic Haiku)

**Project:** reka-cipta-platform
**Slice:** Epic 4B Slice 2 — Quick Mode Proposal Generator (Anthropic Haiku + WeasyPrint HTML→PDF)
**Task Breakdown Reference:** `epic4B_task_breakdown_admin-panel.md` (Slice 2 section — WAJIB dibaca sebelum eksekusi)
**Prasyarat:** Epic 4B Slice 1 sudah merged ke `main`, live production, sign-off klien + Anthropic API key ready + budget disepakati
**Version:** 1.0
**Author:** Ach. Jazilul Qutbi
**Total Phase:** 17 | **STOP Gates:** 4

---

## Cara Pakai Guide Ini

Format sama dengan guide sebelumnya. **Perbedaan besar dari semua slice sebelumnya:** guide ini punya **STOP Gate untuk Prompt Quality Sign-Off** (Gate 2) — dedicated phase untuk iterate prompt dengan real data sebelum build UI. Ini bukan optional.

**Kenapa 4 STOP Gates?**

Slice ini punya 3 area yang butuh manual verification eksplisit + 1 client demo:
1. **Gate 1 (Docker deploy)** — WeasyPrint butuh system libraries. Kalau Docker config salah, deploy Railway gagal — bukan bug frontend, tapi infrastructure.
2. **Gate 2 (Prompt Quality)** — Prompt engineering menentukan **quality output**. Bahkan model terbaik dengan prompt buruk = proposal buruk. Iterate dengan Jazil review 5 real proposal SEBELUM build UI.
3. **Gate 3 (Visual QA + Full Flow)** — Preview iframe rendering, PDF download, email delivery — semua harus works E2E.
4. **Gate 4 (Client Demo)** — Klien operate sendiri, verify UX intuitif.

**Perbedaan risk profile dari slice sebelumnya:**

| Aspek | Slice Ini (Epic 4B S2) | Slice Sebelumnya (Epic 4B S1) |
|---|---|---|
| Primary risk | **Prompt quality** (proposal isi buruk) + **Docker deps** (WeasyPrint deploy fail) + **Blocking 10-30s request** UX | @dnd-kit + optimistic UI + auto-save race |
| External dependencies | **Anthropic API** + **Railway system libraries** (Cairo, Pango, GDK) + Resend attachment | Supabase Storage |
| Cost implication | **~$0.02 per generation** — cost monitoring critical | Zero external cost |
| Cross-slice touches | **LeadDetailView (Slice 1)** — regression risk | Tidak ada |
| Highest-ROI activity | **Prompt iteration dengan real data** (bukan code) | Component implementation |

**Yang paling risky di slice ini (urutan severity):**

1. **Prompt engineering quality (Gate 2)** — Kalau prompt buruk, feature launched dengan output yang klien tidak mau kirim ke customer. Feature effectively broken walau code works.
2. **WeasyPrint Docker deps** — Cairo, Pango, GDK libraries butuh apt-get install di image. Kalau slim image tidak accommodate, build fail atau runtime crash.
3. **Anthropic API cost spike** — Kalau ada bug retry infinite loop, potential $100+ bill dalam beberapa jam. Cost monitoring wajib.
4. **PDF download dengan JWT** — Fetch API tidak bisa attach Authorization ke `<a href>` download link. Butuh XHR/Fetch workaround dengan blob URL.
5. **Cross-slice touch LeadDetailView** — Integrate ProposalGeneratorPanel butuh careful state management supaya notes/status Slice 1 tidak break.

---

## Operating Rules — Delta dari Guide Sebelumnya

Semua Operating Rules R-01 sampai R-28 dari guide sebelumnya tetap berlaku. Rules tambahan spesifik Slice 2:

### R-29 — WeasyPrint Docker System Deps

WeasyPrint butuh:
- `libcairo2` — 2D graphics
- `libpango-1.0-0`, `libpangocairo-1.0-0` — text layout
- `libgdk-pixbuf-2.0-0` — image loading
- `libffi-dev` — foreign function interface
- `shared-mime-info` — MIME type detection

**Kalau backend Dockerfile pakai `python:3.13-slim` (minimalist):**
```dockerfile
FROM python:3.13-slim

RUN apt-get update && apt-get install -y \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

# ... rest of Dockerfile
```

**Kalau pakai `python:3.13` (bukan slim):** kemungkinan besar libs sudah include, tapi tetap verify.

**Kalau pakai buildpack Railway tanpa custom Dockerfile:** Railway `nixpacks` mungkin auto-detect atau butuh explicit config di `railway.json` / `nixpacks.toml`.

- **JANGAN** skip `rm -rf /var/lib/apt/lists/*` — bikin image size besar.
- **JANGAN** install `weasyprint` via pip tanpa system libs — pip install akan sukses tapi runtime `ImportError` atau crash saat first PDF generation.

### R-30 — Anthropic API Error Handling: 3 Failure Modes

Anthropic API bisa fail dengan 3 exception:
1. **`APITimeoutError`** — request > 30 detik (Haiku biasanya 5-15s, tapi network glitch bisa timeout)
2. **`RateLimitError`** — quota exceeded (Anthropic rate limit per tier)
3. **`APIError`** — generic (auth error, invalid model, etc)

Semua WAJIB handled:
```python
try:
    message = self.client.messages.create(...)
except APITimeoutError:
    logger.error("Anthropic API timeout")
    raise ProposalGeneratorError("AI timeout. Coba lagi dalam beberapa menit.")
except RateLimitError:
    logger.error("Anthropic API rate limit")
    raise ProposalGeneratorError("Batas AI tercapai. Hubungi admin.")
except APIError as e:
    logger.error(f"Anthropic API error: {e}")
    raise ProposalGeneratorError(f"AI service error: {str(e)[:100]}")
```

- **JANGAN** catch `Exception` generic — akan swallow bugs yang seharusnya raise (mis. import error).
- **JANGAN** retry di service layer tanpa exponential backoff — bisa infinite loop kalau timeout persistent.
- **JANGAN** expose raw exception message ke frontend — bocor internal info.

### R-31 — Blocking Request Pattern (10-30 detik)

Endpoint `POST /rfq/leads/{id}/generate-proposal` sengaja blocking. Client wait 10-30 detik.

**Frontend implication:**
- Timeout `fetch` default browser adalah 300+ detik — cukup untuk blocking backend
- Loading state harus **very obvious** (spinner + text "AI sedang menulis proposal... 5-15 detik")
- **JANGAN** implement client-side timeout < 60 detik — akan cancel request yang legitimate

**Alternative future:** Background task + polling. **Bukan MVP.** Kalau klien komplain latency, migrate. Untuk sekarang, blocking simpler.

### R-32 — PDF Download dengan JWT Workaround

`<a href="/rfq/leads/{id}/proposal.pdf" download>` tidak akan attach `Authorization` header. Butuh workaround:

```typescript
async function handleDownload() {
  const token = getSessionToken(); // sesuaikan dengan pattern existing
  try {
    const response = await fetch(getProposalPDFUrl(lead.id), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Download failed');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    // Programmatic download
    const a = document.createElement('a');
    a.href = url;
    a.download = `proposal-${sanitizeFilename(lead.company_name)}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Cleanup
    URL.revokeObjectURL(url);
  } catch {
    toast.error('Gagal download PDF');
  }
}
```

- **JANGAN** pakai `<a href>` langsung — akan return 401 tanpa header.
- **JANGAN** lupa `URL.revokeObjectURL(url)` — memory leak kalau download banyak.
- **JANGAN** lupa `document.body.appendChild(a)` — beberapa browser (Firefox) tidak trigger click kalau element tidak in DOM.

### R-33 — Iframe Sandbox untuk Preview HTML

Preview proposal HTML via iframe dengan sandbox:
```tsx
<iframe
  srcDoc={lead.proposal_html}
  sandbox="allow-same-origin"
  className="w-full h-96 border rounded"
/>
```

- **`allow-same-origin`** — allow CSS internal reference
- **JANGAN** tambah `allow-scripts` — proposal HTML dari LLM, potential XSS kalau adversarial prompt injection
- **JANGAN** pakai `dangerouslySetInnerHTML` sebagai alternative — CSS bleed ke main app + XSS surface

### R-34 — Cross-Slice Touch Discipline (LeadDetailView Slice 1)

Modifikasi `LeadDetailView.tsx` untuk integrate `ProposalGeneratorPanel`. **Regression risk MEDIUM.**

Pattern:
1. Baca file existing dulu
2. Identify section untuk insert `<ProposalGeneratorPanel />`
3. Pass `lead` sebagai prop
4. `onLeadUpdated` callback untuk refresh state setelah generate/send

**Test regression:**
- Auto-save notes (Slice 1) — masih works
- Status update dropdown (Slice 1) — masih works
- WA template modal (Slice 1) — masih works
- Baru: proposal generate → preview → download → send

Kalau salah satu Slice 1 flow break, revert Phase 13 dan redesign integration.

### R-35 — Anthropic Cost Monitoring

Setiap `generate-proposal` call = ~$0.02. Kalau bug retry infinite loop = potential $100+ dalam jam.

**Mitigations wajib:**
1. **Anthropic Console spending limit** — set hard limit $50/bulan sebelum first API call
2. **Sentry alert** untuk generate endpoint error rate spike
3. **Logging setiap call** dengan `lead_id` — audit trail
4. **JANGAN** implement client-side retry loop tanpa max attempts (max 2)

### R-36 — Prompt Sebagai IP Kritis

`backend/prompts/proposal_prompt.py` **menentukan quality output**. Model terbaik + prompt buruk = proposal buruk.

**Dedicate Phase 10 untuk prompt iteration.** JANGAN skip. Klien akan spot proposal buruk dalam 3 detik saat demo. Better invest 4-8 jam iterasi prompt sekarang daripada rebuild trust setelah demo gagal.

---

# PHASE 1 — Preflight & Branch Setup

**Tujuan:** Verify Slice 1 stable, Anthropic key ready, cost expectations set, buat branch.

## Kerjakan

1. `git status` bersih, `git checkout main && git pull`.
2. Verify Slice 1 artifacts:
   ```bash
   ls components/admin/lead/LeadDetailView.tsx
   ls components/admin/lead/AdminNotesEditor.tsx
   ls app/actions/leads.ts
   ```
3. Verify Slice 1 live production:
   - Login admin, buka `/admin/leads/{some-id}`
   - Test auto-save notes → works
   - Test status update → works
   - Test WA modal → works
   - Screenshot untuk baseline (regression test di Gate 3)
4. **CRITICAL — Anthropic API preparation:**
   - Verify Anthropic API key sudah ada. Kalau belum, register di https://console.anthropic.com dan create key.
   - **Set spending limit $50/bulan** di Anthropic Console → Settings → Billing → Limits (R-35)
   - Cek current tier — free tier bisa hit rate limit dengan volume rendah, tier 1+ ($5 minimum credit) recommended
5. Verify env vars ready untuk Railway:
   - `ANTHROPIC_API_KEY` = key baru
   - Existing: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`
6. Verify Docker/Railway config:
   ```bash
   cat backend/Dockerfile  # atau railway.json / nixpacks.toml
   ```
   Note base image untuk decide WeasyPrint deps di Phase 2.
7. Buat branch: `git checkout -b feature/epic4B-slice2-proposal-generator`

## Jangan

- Jangan proceed tanpa spending limit Anthropic set — cost risk terlalu tinggi.
- Jangan proceed kalau Slice 1 tidak stable — Slice 2 touch Slice 1 code, kalau baseline broken sulit distinguish issue.

## Verifikasi

- [ ] Branch aktif
- [ ] Slice 1 flow works baseline confirmed
- [ ] Anthropic API key + spending limit configured
- [ ] Docker/Railway config identified

---

# PHASE 2 — Backend Dockerfile Update (WeasyPrint Deps)

**Tujuan:** Update Docker config untuk include WeasyPrint system libraries (R-29).

## Kerjakan

1. Buka `backend/Dockerfile` (atau `railway.json` / `nixpacks.toml` kalau pakai buildpack).
2. **Kalau pakai custom Dockerfile:**
   Add apt-get install sebelum pip install:
   ```dockerfile
   FROM python:3.13-slim

   # WeasyPrint system dependencies
   RUN apt-get update && apt-get install -y --no-install-recommends \
       libcairo2 \
       libpango-1.0-0 \
       libpangocairo-1.0-0 \
       libgdk-pixbuf-2.0-0 \
       libffi-dev \
       shared-mime-info \
       fonts-liberation \
       && rm -rf /var/lib/apt/lists/*

   # ... existing setup ...
   ```
   **`fonts-liberation`** untuk sans-serif fonts default (tanpa ini, PDF render dengan default fonts yang aneh).
3. **Kalau pakai Railway Nixpacks (no custom Dockerfile):**
   Buat `nixpacks.toml` di root project:
   ```toml
   [phases.setup]
   aptPkgs = ["libcairo2", "libpango-1.0-0", "libpangocairo-1.0-0", "libgdk-pixbuf-2.0-0", "libffi-dev", "shared-mime-info", "fonts-liberation"]
   ```
4. Verify local build (kalau punya Docker installed):
   ```bash
   cd backend
   docker build -t reka-cipta-backend .
   ```
   Kalau build sukses, WeasyPrint deps installed. Kalau fail, cek error dan adjust.
5. **JANGAN commit dulu.** Wait until Phase 3 (pip install) done, commit combined.

## Jangan

- **JANGAN** skip `fonts-liberation` — proposal PDF akan render tanpa fonts yang benar.
- **JANGAN** pakai `--yes` tanpa `-y` di apt-get — inconsistent syntax.
- **JANGAN** lupa `rm -rf /var/lib/apt/lists/*` — image size bloat 50-100 MB.

## Verifikasi

- [ ] Dockerfile/nixpacks.toml updated dengan system deps
- [ ] Local Docker build sukses (kalau applicable)

---

# PHASE 3 — Backend Install Python Packages + DB Migration

**Tujuan:** Install `anthropic` + `weasyprint` di Python + tambah field `proposal_sent_at` di DB.

## Kerjakan

1. Install packages:
   ```bash
   cd backend
   source .venv/bin/activate
   pip install anthropic weasyprint
   pip freeze > requirements.txt
   ```
2. Verify install:
   ```bash
   python -c "import anthropic; print(anthropic.__version__)"
   python -c "from weasyprint import HTML; print('WeasyPrint OK')"
   ```
   Kalau WeasyPrint gagal, local system tidak punya libs — install:
   - macOS: `brew install cairo pango gdk-pixbuf libffi`
   - Ubuntu: `sudo apt-get install libcairo2 libpango-1.0-0 libpangocairo-1.0-0 libgdk-pixbuf-2.0-0 libffi-dev`
3. Test WeasyPrint local:
   ```bash
   python -c "
   from weasyprint import HTML
   html = '<html><body><h1>Test</h1><p>Hello</p></body></html>'
   HTML(string=html).write_pdf('/tmp/test.pdf')
   print('PDF generated')
   "
   ls -lh /tmp/test.pdf
   # Expected: PDF file 5-15 KB
   ```
4. Migration `proposal_sent_at`:
   ```bash
   # Generate timestamp
   TS=$(date -u +%Y%m%d%H%M%S)
   ```
   Buat `supabase/migrations/{ts}_add_proposal_sent_at.sql`:
   ```sql
   ALTER TABLE public.rfq_leads
   ADD COLUMN IF NOT EXISTS proposal_sent_at TIMESTAMPTZ;
   ```
5. Commit progress:
   ```bash
   git add backend/ supabase/
   git commit -m "chore(deps): install anthropic and weasyprint + proposal_sent_at migration [Epic 4B Slice 2]"
   ```

## Jangan

- **JANGAN** skip local WeasyPrint test — kalau tidak works local, tidak akan works production.
- **JANGAN** lupa `pip freeze > requirements.txt` — Railway deploy butuh ini.
- **JANGAN** commit `test.pdf` accidentally.

## Verifikasi

- [ ] `anthropic` + `weasyprint` importable
- [ ] Local PDF generation test pass
- [ ] Migration file created
- [ ] `requirements.txt` updated

---

# 🛑 STOP GATE 1 — Docker Deploy Verification + DB Migration Apply

**Status:** Menunggu Jazil verify Docker deploy + apply migration.

## Aksi Manual yang Jazil Lakukan

### 1. Push branch untuk trigger Railway build test

```bash
git push -u origin feature/epic4B-slice2-proposal-generator
```

Wait Railway build. **Cek build logs:**
- Apakah apt-get install sukses (untuk custom Dockerfile)?
- Apakah pip install `weasyprint` sukses tanpa error?
- Image size wajar (< 500 MB target)?

Kalau build fail, investigate log — kemungkinan system libs typo atau version conflict.

### 2. Apply migration `proposal_sent_at`

Via Supabase Dashboard → SQL Editor.

Verify:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'rfq_leads' AND column_name = 'proposal_sent_at';
-- Expected: 1 row
```

### 3. Test WeasyPrint di Railway container

Setelah deploy sukses, SSH atau exec ke Railway container:
```bash
railway run python -c "
from weasyprint import HTML
HTML(string='<h1>Test</h1>').write_pdf('/tmp/test.pdf')
print('OK')
"
```

Kalau error "font not found" atau library missing, adjust Dockerfile dan redeploy.

## Setelah Gate Ini Clear

Jazil bilang "Gate 1 clear". Lanjut Phase 4.

## Sinyal Masalah

- **Docker build fail apt-get:** Ubuntu package name berubah antar version. Cek release note base image.
- **WeasyPrint import fail runtime:** system libs mismatch. Kadang butuh version specific (`libcairo2` vs `libcairo2-dev`).
- **PDF generate tapi tanpa font:** `fonts-liberation` tidak installed. Tambah di Dockerfile.

---

# PHASE 4 — Backend Prompt Module (Initial Version)

**Tujuan:** Buat prompt module dengan SYSTEM_PROMPT + `build_user_prompt` function. Prompt akan di-iterate di Phase 10.

## Kerjakan

1. Buat direktori `backend/prompts/`.
2. Buat `backend/prompts/__init__.py` (empty).
3. Buat `backend/prompts/proposal_prompt.py` sesuai spec task `E4B-S2-BE-03`:
   - `SYSTEM_PROMPT` constant dengan 5 section (Role, Task, Structure, Constraints, Output format)
   - `build_user_prompt(lead_data, products, company_settings)` function
4. **CRITICAL — Test prompt structure lokal (sanity check):**
   ```bash
   cd backend && source .venv/bin/activate
   python -c "
   from backend.prompts.proposal_prompt import SYSTEM_PROMPT, build_user_prompt

   # Sanity
   assert 'ROLE' in SYSTEM_PROMPT.upper() or 'Anda adalah' in SYSTEM_PROMPT
   assert 'STRUKTUR' in SYSTEM_PROMPT.upper() or 'STRUCTURE' in SYSTEM_PROMPT.upper()
   assert 'CONSTRAINT' in SYSTEM_PROMPT.upper() or 'JANGAN' in SYSTEM_PROMPT

   # Test build_user_prompt
   dummy_lead = {
       'full_name': 'Test User', 'company_name': 'PT XYZ',
       'position': 'Manager', 'industry_type': 'makanan-minuman',
       'volume_per_month': 50, 'delivery_frequency': 'monthly',
       'delivery_city': 'Jakarta', 'notes': 'Butuh sertifikasi halal'
   }
   dummy_products = [
       {'name': 'Garam Halus Yodium', 'code': 'PRO YD', 'tagline': 'Untuk industri makanan', 'specs': {'nacl_pct': 97.5}}
   ]
   dummy_settings = {
       'full_company_name': 'CV Reka Cipta Indonesia',
       'address': 'Surabaya',
       'founding_year': '2015',
       'partner_count': '50',
   }

   result = build_user_prompt(dummy_lead, dummy_products, dummy_settings)
   assert 'PT XYZ' in result
   assert 'PRO YD' in result
   assert 'Surabaya' in result
   print('Prompt structure OK')
   "
   ```

## Jangan

- **JANGAN** langsung iterate prompt di Phase ini — pertama build "workable version 1", iterate di Phase 10 dengan real data.
- **JANGAN** hardcode nama admin atau data specific — pakai template dengan `{placeholder}` yang di-fill dari context.
- **JANGAN** minta LLM output selain HTML — akan sulit convert ke PDF.

## Verifikasi

- [ ] Prompt module importable
- [ ] Structure sanity check pass
- [ ] `build_user_prompt` render dummy data ke string

---

# PHASE 5 — Backend Anthropic Service (dengan Error Handling)

**Tujuan:** Buat `ProposalGeneratorService` dengan 3 error mode handling (R-30).

## Kerjakan

1. Buat file `backend/services/proposal_generator.py` sesuai spec task `E4B-S2-BE-04`:
   - Class `ProposalGeneratorService` dengan `MODEL = "claude-haiku-4-5-20251001"`
   - `async def generate(lead_data, products, company_settings) -> str` — return HTML string
   - Try/except 3 error mode: `APITimeoutError`, `RateLimitError`, `APIError`
   - Custom exception `ProposalGeneratorError`
   - Singleton pattern via `get_proposal_service()` factory
2. **Sanity check HTML output:**
   ```python
   html = message.content[0].text.strip()
   # Kalau LLM tidak wrap dengan <html>, wrap manual
   if "<html" not in html.lower():
       logger.warning("LLM output missing <html> tag, wrapping manually")
       html = f"<html><body>{html}</body></html>"
   ```
3. **PENTING — Config di `backend/config.py`:**
   ```python
   class Settings(BaseSettings):
       ANTHROPIC_API_KEY: str
       # ...
   ```
4. Test manual (butuh Anthropic key set):
   ```bash
   export ANTHROPIC_API_KEY="sk-ant-..."
   python -c "
   import asyncio
   from backend.services.proposal_generator import get_proposal_service

   service = get_proposal_service()
   dummy_lead = {...}  # dari Phase 4 sanity check
   dummy_products = [...]
   dummy_settings = {...}

   html = asyncio.run(service.generate(dummy_lead, dummy_products, dummy_settings))
   print(f'Generated: {len(html)} chars')
   print(html[:500])  # preview
   "
   ```

## Jangan

- **JANGAN** catch `Exception` generic — akan mask bugs.
- **JANGAN** implement retry di service — biarkan router yang decide (kalau perlu).
- **JANGAN** lupa `client.messages.create` sync — `async def` tapi Anthropic SDK sync di endpoint ini OK. Async penting untuk FastAPI concurrency, tapi single API call bisa sync.
- **JANGAN** log full API key di error message.

## Verifikasi

- [ ] Manual test generate 1 proposal — return HTML valid
- [ ] Error paths tested (invalid API key → APIError caught)
- [ ] Log entry per call visible

---

# PHASE 6 — Backend PDF Service (WeasyPrint)

**Tujuan:** Simple wrapper untuk HTML → PDF bytes.

## Kerjakan

1. Buat file `backend/services/pdf_service.py`:
   ```python
   from weasyprint import HTML
   import io
   import logging

   logger = logging.getLogger(__name__)

   def html_to_pdf(html_string: str) -> bytes:
       """Convert HTML string to PDF bytes. Raises Exception on invalid HTML."""
       try:
           pdf_buffer = io.BytesIO()
           HTML(string=html_string).write_pdf(target=pdf_buffer)
           return pdf_buffer.getvalue()
       except Exception as e:
           logger.error(f"PDF generation failed: {e}")
           raise
   ```
2. Test:
   ```bash
   python -c "
   from backend.services.pdf_service import html_to_pdf

   html = '<html><head><style>h1 { color: #0B7D6E; }</style></head><body><h1>Test</h1><p>Content</p></body></html>'
   pdf_bytes = html_to_pdf(html)
   print(f'PDF size: {len(pdf_bytes)} bytes')

   with open('/tmp/test-pdf.pdf', 'wb') as f:
       f.write(pdf_bytes)
   print('Saved to /tmp/test-pdf.pdf')
   "
   ```
   Open `/tmp/test-pdf.pdf` — verify styling (h1 teal color) preserved.

## Jangan

- **JANGAN** raise sanitized exception — biarkan native error bubble up, router handle.
- **JANGAN** cache PDF di module level — memory bloat untuk high-concurrency (walau untuk MVP admin panel unlikely).

## Verifikasi

- [ ] PDF generate dari HTML string
- [ ] Styling preserved di PDF output
- [ ] File size reasonable (5-50 KB untuk 400-800 word HTML)

---

# PHASE 7 — Backend Endpoints (Generate + Send + Download PDF)

**Tujuan:** Implementasi 3 endpoints dengan auth + proper error handling.

## Kerjakan

1. Extend `backend/routers/rfq.py` dengan 3 endpoint sesuai spec task `E4B-S2-BE-06`, `E4B-S2-BE-07`:
   - `POST /rfq/leads/{lead_id}/generate-proposal` — call Anthropic, save HTML
   - `POST /rfq/leads/{lead_id}/send-proposal` — generate PDF + send email
   - `GET /rfq/leads/{lead_id}/proposal.pdf` — download PDF
2. **Generate endpoint pattern:**
   ```python
   @router.post(
       "/leads/{lead_id}/generate-proposal",
       response_model=RFQLeadDetailResponse,
       dependencies=[Depends(get_current_user)],
   )
   async def generate_proposal(lead_id: str) -> RFQLeadDetailResponse:
       supabase = get_supabase_service()

       # 1. Fetch lead
       lead_result = supabase.table("rfq_leads").select("*").eq("id", lead_id).limit(1).execute()
       if not lead_result.data:
           raise HTTPException(404, "Lead not found")
       lead = lead_result.data[0]

       # 2. Fetch products
       products_result = supabase.table("products").select("*").in_("slug", lead['salt_types']).execute()
       products = products_result.data or []

       # 3. Fetch company settings
       settings_result = supabase.table("company_settings").select("key,value").execute()
       company_settings = {row['key']: row['value'] for row in settings_result.data or []}

       # 4. Generate via Anthropic (blocking)
       service = get_proposal_service()
       try:
           proposal_html = await service.generate(lead, products, company_settings)
       except ProposalGeneratorError as e:
           raise HTTPException(503, str(e))

       # 5. Save to DB
       from datetime import datetime, timezone
       supabase.table("rfq_leads").update({
           "proposal_html": proposal_html,
           "proposal_generated": True,
           "proposal_generated_at": datetime.now(timezone.utc).isoformat(),
       }).eq("id", lead_id).execute()

       # 6. Return updated detail
       return await get_lead_detail(lead_id)
   ```
3. **Send proposal endpoint:**
   ```python
   @router.post(
       "/leads/{lead_id}/send-proposal",
       response_model=RFQLeadDetailResponse,
       dependencies=[Depends(get_current_user)],
   )
   async def send_proposal_endpoint(
       lead_id: str,
       background_tasks: BackgroundTasks,
   ) -> RFQLeadDetailResponse:
       supabase = get_supabase_service()

       lead_result = supabase.table("rfq_leads").select("*").eq("id", lead_id).limit(1).execute()
       if not lead_result.data:
           raise HTTPException(404, "Lead not found")
       lead = lead_result.data[0]

       if not lead['proposal_html']:
           raise HTTPException(422, "Proposal belum di-generate")

       # Generate PDF (sync, cheap)
       pdf_bytes = html_to_pdf(lead['proposal_html'])

       # Send email background
       background_tasks.add_task(
           send_proposal_email,
           to_email=lead['email'],
           lead_data=lead,
           pdf_attachment=pdf_bytes,
       )

       # Update sent_at
       supabase.table("rfq_leads").update({
           "proposal_sent_at": datetime.now(timezone.utc).isoformat(),
       }).eq("id", lead_id).execute()

       return await get_lead_detail(lead_id)
   ```
4. **Download PDF endpoint** dengan Response custom:
   ```python
   from fastapi.responses import Response
   import re

   def _slugify(text: str) -> str:
       return re.sub(r'[^a-z0-9-]', '-', text.lower()).strip('-')

   @router.get(
       "/leads/{lead_id}/proposal.pdf",
       dependencies=[Depends(get_current_user)],
   )
   async def download_proposal_pdf(lead_id: str):
       supabase = get_supabase_service()
       result = supabase.table("rfq_leads").select("proposal_html,company_name").eq("id", lead_id).limit(1).execute()
       if not result.data or not result.data[0]['proposal_html']:
           raise HTTPException(404)

       pdf_bytes = html_to_pdf(result.data[0]['proposal_html'])
       filename = f"proposal-{_slugify(result.data[0]['company_name'])}.pdf"

       return Response(
           content=pdf_bytes,
           media_type="application/pdf",
           headers={
               "Content-Disposition": f'attachment; filename="{filename}"'
           }
       )
   ```
5. Extend `backend/services/email_service.py` — add `send_proposal_email` sesuai spec task `E4B-S2-BE-08`.
   - Support attachment via Resend SDK (`base64` encode)
   - Cek dokumentasi Resend Python SDK untuk exact syntax

## Jangan

- **JANGAN** generate PDF sync dalam send endpoint — cepat (~1-2 detik), OK. Kalau slow (> 5 detik), pindah ke background task.
- **JANGAN** cache PDF di memory global — regenerate on-demand per AR-03.
- **JANGAN** lupa `Content-Disposition` header — tanpa ini browser open inline, tidak trigger download.

## Verifikasi

- [ ] 3 endpoint accessible via `/docs`
- [ ] Endpoints protected (auth)
- [ ] Response types correct

---

# PHASE 8 — Deploy Backend + Curl Test dengan Real Lead Data

**Tujuan:** Deploy Railway + smoke test dengan real production data.

## Kerjakan

1. Commit:
   ```bash
   git add backend/
   git commit -m "feat(api): add proposal generator endpoints [Epic 4B Slice 2]"
   git push
   ```
2. Wait Railway deploy. **Verify env `ANTHROPIC_API_KEY` set di Railway dashboard.**
3. Smoke test dengan **1 real lead** dari production:
   ```bash
   JWT="eyJ..."
   BASE="https://<railway-prod>"
   LEAD_ID="<uuid dari 1 lead real>"

   # 1. Generate (wait 10-30 detik)
   time curl -X POST -H "Authorization: Bearer $JWT" \
     $BASE/rfq/leads/$LEAD_ID/generate-proposal | jq '.lead.proposal_generated'
   # Expected: true, waktu 5-15 detik

   # 2. Verify HTML di DB
   # (via Supabase Dashboard)
   # SELECT proposal_html FROM rfq_leads WHERE id = '{LEAD_ID}';

   # 3. Download PDF
   curl -H "Authorization: Bearer $JWT" \
     -o /tmp/proposal.pdf \
     $BASE/rfq/leads/$LEAD_ID/proposal.pdf
   file /tmp/proposal.pdf  # Expected: PDF document
   open /tmp/proposal.pdf  # macOS, visual inspection

   # 4. Test error path — invalid lead
   curl -X POST -H "Authorization: Bearer $JWT" \
     -i $BASE/rfq/leads/invalid-uuid/generate-proposal | head -5
   # Expected: 404 atau 500
   ```
4. **Cost check:** Buka Anthropic Console → Usage → verify 1 request logged (~$0.02).

## Jangan

- **JANGAN** generate 10+ proposal untuk testing — cost meaningful.
- **JANGAN** send proposal ke customer real saat testing.

## Verifikasi

- [ ] Generate response < 30 detik
- [ ] PDF download works
- [ ] Anthropic Console log request

---

# PHASE 9 — Preparation untuk Prompt Iteration

**Tujuan:** Pick 5 diverse real leads untuk prompt iteration di Gate 2.

## Kerjakan

1. Query 5 diverse leads dari production DB:
   ```sql
   -- Kriteria: industri berbeda, volume berbeda, produk berbeda
   SELECT id, company_name, industry_type,
          array_length(salt_types, 1) AS num_products,
          volume_per_month
   FROM rfq_leads
   WHERE status IN ('new', 'contacted')  -- exclude closed leads
   ORDER BY created_at DESC
   LIMIT 20;
   ```
   Pick 5 dengan diversity:
   - 1 industri makanan, 1 industri farmasi, 1 industri kimia, 1 peternakan, 1 lainnya
   - Range volume: rendah (< 10 ton), medium (50-100 ton), tinggi (> 200 ton)
   - Single product vs multi-product
2. Catat lead IDs untuk Phase 10 iteration.
3. Buat file `docs/prompts/proposal_prompt_v1.md` — snapshot prompt current + note "iteration in progress".

## Jangan

- Jangan pick 5 lead dengan profil sangat mirip — akan kelewatan edge cases.
- Jangan pakai lead yang sudah closed (`deal` / `lost`) — data mungkin sensitive.

## Verifikasi

- [ ] 5 lead IDs terpilih, diversity confirmed
- [ ] Prompt v1 snapshot committed

---

# PHASE 10 — 🔥 PROMPT ITERATION dengan Jazil (Highest ROI Activity)

**Tujuan:** Iterate prompt sampai output quality acceptable per Jazil review. **INI PHASE PALING PENTING DI SLICE 2.**

## Framing

**Ini bukan coding phase — ini design phase.** Anda + Jazil review 5 proposal, identify weakness, adjust SYSTEM_PROMPT, regenerate, review lagi. Loop sampai Jazil bilang "OK, layak kirim ke klien beneran."

Estimasi effort: **4-8 jam actual work.** Kalau lebih cepat, kemungkinan Anda skip nuance yang seharusnya di-catch.

## Kerjakan

### Iteration Round 1 (Baseline)

1. Generate 5 proposal untuk 5 lead pilihan Phase 9:
   ```bash
   for LEAD_ID in "id1" "id2" "id3" "id4" "id5"; do
     echo "=== $LEAD_ID ==="
     time curl -X POST -H "Authorization: Bearer $JWT" \
       $BASE/rfq/leads/$LEAD_ID/generate-proposal > /dev/null

     # Download PDF
     curl -s -H "Authorization: Bearer $JWT" \
       -o "/tmp/proposal-$LEAD_ID.pdf" \
       $BASE/rfq/leads/$LEAD_ID/proposal.pdf
   done
   ```
2. Buka 5 PDF, share screen dengan Jazil. Review together:
   - **Bahasa:** formal bisnis? Slang tidak sengaja?
   - **Struktur:** 5 section clear? Section flow logical?
   - **Personalisasi:** nama PIC + perusahaan mention correct? Bukan generic?
   - **Product knowledge:** spec produk accurate? Tidak hallucinate?
   - **Tone:** professional tapi warm? Atau robotic?
   - **Length:** 400-800 kata OK? Atau terlalu pendek/panjang?
   - **CTA:** clear next step untuk customer?

### Iteration Round 2+ (Refine)

3. Berdasarkan review, adjust `SYSTEM_PROMPT`:
   - Contoh: kalau proposal terlalu generic → tambah instruksi "Mention 2-3 kekhawatiran spesifik industri {industry_type} yang bisa di-address oleh produk kami"
   - Kalau length terlalu panjang → adjust "400-800 kata" ke "400-600 kata"
   - Kalau spec accuracy issue → strengthen "JANGAN mengarang spec produk"
4. Commit prompt version dengan changelog:
   ```bash
   git add backend/prompts/proposal_prompt.py docs/prompts/
   git commit -m "prompt: iterate v2 - improve industry-specific messaging [Epic 4B S2]"
   ```
5. Regenerate 5 proposal (cost ~$0.10 per round).
6. Review dengan Jazil. Iterate lagi.

### Convergence Criteria

Stop iteration kalau Jazil bilang: **"5 dari 5 proposal layak kirim ke klien beneran tanpa edit."**

Kalau Jazil bilang "OK tapi masih perlu edit minor," iterate 1 round lagi.

Kalau setelah 5 round Jazil masih tidak puas, consider:
- Upgrade model ke Claude Sonnet 4.6 (temporary, untuk baseline quality)
- Regenerate dengan Jazil manual write ideal proposal, compare deltas
- Bring in domain expert (Irwan) untuk validate industry-specific content

### Documentation

7. Simpan snapshot final prompt di `docs/prompts/proposal_prompt_final_v{N}.md` dengan:
   - Prompt content
   - Changelog (v1 → v2 → ... → vN)
   - Sample output PDF references
   - Jazil sign-off note

## Jangan

- **JANGAN** iterate solo tanpa Jazil — bias risk (Anda mungkin OK dengan output yang Jazil tidak OK).
- **JANGAN** hardcode "escape valve" seperti "Kalau tidak yakin, tulis: [MOHON KONFIRMASI TIM SALES]" — LLM akan overuse ini.
- **JANGAN** cut corner "prompt seems OK, ship it." Klien akan spot proposal buruk dalam 3 detik.

## Verifikasi

- [ ] 5 proposal Round Final semua Jazil approve "layak kirim"
- [ ] Prompt final snapshot committed di `docs/prompts/`
- [ ] Anthropic cost tracked (~$0.10-$0.50 total untuk iteration)

---

# 🛑 STOP GATE 2 — Prompt Quality Sign-Off

**Status:** Menunggu Jazil eksplisit konfirmasi prompt final acceptable.

## Aksi Manual yang Jazil Lakukan

1. Review dokumentasi `docs/prompts/proposal_prompt_final_v{N}.md`
2. Manually review 5 PDF sample dari iteration final
3. Konfirmasi: **"Prompt ini production-ready. Kalau klien lihat 5 sample ini, saya percaya diri klien approve."**
4. Kalau ada concern tersisa, iterate 1 round lagi (kembali ke Phase 10).

## Setelah Gate Ini Clear

Prompt LOCKED. Selanjutnya build UI dengan confidence output quality sudah di-validate.

## Sinyal Masalah

- **Setelah 5+ round Jazil masih tidak puas:** Consider Sonnet upgrade atau escalate ke Irwan untuk validasi domain expertise.
- **Jazil approve tapi ragu-ragu:** iterate 1 round lagi. Better safe than launched bad.

---

# PHASE 11 — Contract Layer (Types + lib/api)

**Tujuan:** Sync types + tambah 3 fetcher.

## Kerjakan

1. Update `types/api.ts` — extend `RFQLead` dengan `proposal_sent_at: string | null` kalau belum.
2. Update `lib/api.ts`:
   ```typescript
   export async function generateProposal(leadId: string): Promise<RFQLeadDetailResponse> {
     return apiFetch<RFQLeadDetailResponse>(`/rfq/leads/${leadId}/generate-proposal`, {
       method: 'POST',
       auth: true,
     });
   }

   export async function sendProposal(leadId: string): Promise<RFQLeadDetailResponse> {
     return apiFetch<RFQLeadDetailResponse>(`/rfq/leads/${leadId}/send-proposal`, {
       method: 'POST',
       auth: true,
     });
   }

   export function getProposalPDFUrl(leadId: string): string {
     return `${API_BASE_URL}/rfq/leads/${leadId}/proposal.pdf`;
   }
   ```
3. Type check pass. Commit.

## Jangan

- **JANGAN** implement download helper di lib/api — biarkan komponen handle karena butuh state management.

## Verifikasi

- [ ] Type check pass
- [ ] Import functions works

---

# PHASE 12 — Component `ProposalGeneratorPanel`

**Tujuan:** Bikin component state machine dengan generate → preview → download → send flow.

## Kerjakan

1. Buat `components/admin/lead/ProposalGeneratorPanel.tsx` sesuai spec task `E4B-S2-FE-01`:
   - Client Component
   - State machine (idle, generating, ready, sending, sent, error)
   - Preview via iframe dengan sandbox (R-33)
   - PDF download workaround dengan blob URL (R-32)
   - Send confirmation dialog
2. **Generate button pattern:**
   ```typescript
   async function handleGenerate() {
     setIsGenerating(true);
     try {
       const data = await generateProposal(lead.id);
       onLeadUpdated(data.lead);
       toast.success('Proposal berhasil digenerate');
     } catch (err) {
       const msg = err instanceof Error ? err.message : 'Gagal generate';
       toast.error(msg);
     } finally {
       setIsGenerating(false);
     }
   }
   ```
3. **Download button dengan JWT workaround** (R-32):
   ```typescript
   async function handleDownload() {
     try {
       const token = getSessionToken();
       const response = await fetch(getProposalPDFUrl(lead.id), {
         headers: { Authorization: `Bearer ${token}` },
       });
       if (!response.ok) throw new Error('Download failed');
       const blob = await response.blob();
       const url = URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = `proposal-${sanitize(lead.company_name)}.pdf`;
       document.body.appendChild(a);
       a.click();
       document.body.removeChild(a);
       URL.revokeObjectURL(url);
     } catch {
       toast.error('Gagal download PDF');
     }
   }
   ```
4. **Send confirmation dialog** — Base UI Dialog dengan "Kirim proposal ke {email}?"
5. Loading state saat generating:
   ```tsx
   {isGenerating && (
     <div className="flex items-center gap-3 py-8">
       <Spinner />
       <p>AI sedang menulis proposal... biasanya 5-15 detik</p>
     </div>
   )}
   ```
6. Test standalone (tanpa integrate ke LeadDetailView dulu):
   - Buat test route sementara `/admin/leads/[id]/proposal-test` untuk isolated testing
   - Test generate → preview → download → send flow

## Jangan

- **JANGAN** implement client-side timeout < 60 detik — akan cancel legitimate request (R-31).
- **JANGAN** allow "Send" tanpa confirmation dialog — irreversible action.
- **JANGAN** trigger regenerate saat panel mount kalau proposal sudah ada — biarkan admin explicit klik.

## Verifikasi

- [ ] Generate flow works isolated
- [ ] Preview iframe render HTML
- [ ] Download PDF works dengan filename correct
- [ ] Send confirmation → email delivery

---

# PHASE 13 — Integration ke `LeadDetailView` (Slice 1 Touch, HIGH REGRESSION RISK)

**Tujuan:** Integrate `ProposalGeneratorPanel` ke Slice 1's `LeadDetailView`.

## Prep

1. Baca file existing:
   ```bash
   cat components/admin/lead/LeadDetailView.tsx
   ```
2. Identify:
   - Berapa section di layout sekarang?
   - Bagaimana `lead` state di-manage?
   - Ada `onLeadUpdated` callback existing?

## Kerjakan

1. Update `LeadDetailView.tsx`:
   - Import `ProposalGeneratorPanel`
   - Tambah section (di kanan atau bawah, konsultasi UX):
     ```tsx
     <ProposalGeneratorPanel
       lead={lead}
       onLeadUpdated={(updated) => setLead(updated)}
     />
     ```
   - Verify `setLead` callback update state — pattern konsisten dengan Slice 1 existing updates
2. **CRITICAL — Regression test path lama DULU (R-34):**
   - Auto-save notes (Slice 1): type + blur → "✓ Tersimpan"
   - Status update dropdown (Slice 1): change status → history table update
   - WA template modal (Slice 1): open, edit, klik WhatsApp
3. **Test path baru:**
   - Generate proposal → preview muncul
   - Download PDF
   - Send email → confirmation, delivery
4. Commit:
   ```bash
   git add app/ components/
   git commit -m "feat(admin): integrate proposal generator panel [Epic 4B Slice 2]"
   ```

## Jangan

- **JANGAN** refactor `LeadDetailView` untuk hal lain — scope creep bikin regression risk naik.
- **JANGAN** skip regression test path lama — Slice 1 flow live production, kalau break akan surface saat klien pakai.

## Verifikasi

- [ ] Path Slice 1 lama semua works
- [ ] Path baru generate + download + send works
- [ ] Screenshot integration untuk PR

---

# PHASE 14 — Build + Local E2E Test

**Tujuan:** Verify build no regression + E2E flow lengkap.

## Kerjakan

1. `pnpm build` — verify rendering strategy preserved.
2. `pnpm lint` — pass.
3. **Full E2E test dengan 1 real lead:**
   - Login admin
   - `/admin/leads` Kanban render
   - Klik lead → detail
   - Notes auto-save works
   - Status update works
   - **Klik "Generate Proposal"** → wait 15 detik → preview muncul
   - Verify preview readable (styling teal color, structure clear)
   - **Klik "Download PDF"** → PDF download ke local
   - Open PDF → verify content match preview
   - **Klik "Kirim ke Customer"** → confirmation → confirm
   - Verify email delivered ke test inbox dengan PDF attachment
4. Cost check: Anthropic Console → verify 1-2 request logged for this test.
5. Cleanup test data (revert proposal_html kalau perlu untuk demo clean).

## Jangan

- **JANGAN** commit dengan test proposal HTML di production data — akan tampil di demo klien.
- **JANGAN** skip email delivery test — Resend attachment syntax subtle, mungkin salah.

## Verifikasi

- [ ] E2E full pass
- [ ] Email dengan PDF attachment delivered
- [ ] Cost tracked

---

# PHASE 15 — Deploy Vercel Preview

**Tujuan:** Preview deploy + smoke test.

## Kerjakan

1. `git push`.
2. Wait Vercel deploy.
3. Smoke test preview URL:
   - Login admin
   - Generate proposal untuk 1 lead
   - Download PDF, verify
   - Send test email (ke inbox Anda), verify delivery
4. Report ke Jazil.

## Verifikasi

- [ ] Preview deploy sukses
- [ ] Smoke test 4/4 pass

---

# 🛑 STOP GATE 3 — Visual QA + Full Flow + Regression + Klien Prompt Review

**Status:** Menunggu Jazil comprehensive QA + final prompt review dengan klien (opsional pre-demo).

## Aksi Manual yang Jazil Lakukan

### 1. Visual QA Preview iframe
- HTML render sesuai styling brand (teal color, formal layout)
- Iframe scrollable kalau content panjang
- Mobile: iframe responsive

### 2. E2E Test Full Flow
- Generate → preview → regenerate → download → send
- Verify all 5 test leads dari Phase 10 generate acceptable output

### 3. PDF Download Test
- Download works
- Filename correct (`proposal-{company-slug}.pdf`)
- PDF opens di viewer, content match preview

### 4. Email Delivery Test
- Send ke test inbox
- Verify subject, body, PDF attachment
- Reply-to correct

### 5. Regression Test Slice 1
- Notes auto-save (R-34)
- Status update
- WA template modal
- Kanban drag-drop dari list

### 6. Regression Test Epic 4 CF
- `/minta-penawaran` submit RFQ works
- Email confirmation delivery works

### 7. Cost Verification
- Anthropic Console: usage sesuai jumlah generation
- Rate: ~$0.02 per proposal

### 8. Optional: Klien Preview
- Kalau feel confident, share 1 preview PDF ke Irwan (informal, bukan demo formal)
- Feedback: "Apakah ini yang mau Anda kirim ke calon partner?"
- Kalau ada concerns, iterate prompt sekali lagi sebelum demo formal

## Setelah Gate Ini Clear

Jazil bilang "Gate 3 clear, ready for production."

## Sinyal Masalah

- **Preview render kacau:** cek prompt output — LLM mungkin tidak return `<html>` wrapper, sanity check di service (R-30) tidak fire.
- **PDF font aneh:** system libs Docker missing font. Redeploy dengan `fonts-liberation` added.
- **Email PDF attachment corrupt:** cek Resend SDK base64 encoding syntax.
- **Cost spike:** cek retry logic — kemungkinan client-side accidental double-click bikin duplicate request.

---

# PHASE 16 — Merge ke `dev` + Production Deploy

**Tujuan:** Merge PR, production release.

## Kerjakan

1. Buat/update PR ke `dev`.
2. PR description include:
   - Ringkasan Slice 2 scope
   - Screenshot 5 sample proposals dari Phase 10
   - Screenshot email dengan PDF attachment
   - Cost estimate per 100 proposal
   - Regression test proof
   - Prompt final snapshot reference
3. Merge ke `dev` → staging deploy → smoke test.
4. Jazil manual merge `dev` → `main` → production.
5. **PENTING — Verify env `ANTHROPIC_API_KEY` di production Railway before generate at prod:**
   ```bash
   # Test 1 generate di production dengan lead real yang sudah closed atau test lead
   curl -X POST -H "Authorization: Bearer $PROD_JWT" \
     $PROD_BASE/rfq/leads/$TEST_LEAD_ID/generate-proposal | jq
   ```
6. Cost check: Anthropic Console production usage.

## Verifikasi

- [ ] PR merged
- [ ] Production deploy sukses
- [ ] Production generate test works
- [ ] Cost monitoring active

---

# 🛑 STOP GATE 4 — Client Demo (Klien Operate Sendiri)

**Status:** Menunggu Jazil demo ke Irwan Sugianto. **KRITIS: klien harus operate sendiri.**

## Aksi Manual yang Jazil Lakukan

Follow demo script `docs/demos/epic4B_slice2_demo_script.md`:

### 1. Konteks (1 menit)
- "Ini fitur AI Proposal Generator. Klien bisa generate proposal untuk lead dalam 15 detik."
- **Set expectation cost:** "Setiap generation cost ~$0.02. Untuk 100 proposal/bulan = $2. Kalau perlu regenerate, cost ~sama."

### 2. Live Generate — Klien Sendiri (5 menit)
- Passcontrol ke Irwan
- Klien buka detail lead PT XYZ
- Klien klik **"Generate Proposal"** sendiri
- Wait 10-15 detik dengan Anda dan klien watching preview muncul
- Klien review — verify klien impression positif

### 3. Preview + Download + Send (3 menit)
- Klien scroll preview iframe, baca content
- Klien klik "Download PDF" — cek file di download folder
- **Kalau klien approve content:** klien klik "Kirim ke Customer"
  - Confirmation dialog muncul
  - Klien confirm
  - Verify email delivery ke inbox test

### 4. Regenerate Demo (1 menit)
- "Kalau tidak puas versi 1, klik Regenerate — dapat versi baru dalam 15 detik"
- Klien regenerate
- Compare v1 vs v2

### 5. Handover & Cost Reminder
- Dokumentasi cara pakai (kalau ada screencast/written guide)
- Reminder cost: "Rekomendasi: review preview dulu sebelum kirim. Regenerate cost sama seperti generate."
- **Set spending expectation:** "Kalau bulanan usage naik > $10, review setup budget."

## Setelah Gate Ini Clear

Klien sign-off Epic 4 MVP complete. **Epic 4 FULLY CLOSED.**

Klien punya kontrol penuh:
- Manage leads (Slice 1)
- Generate proposal AI (Slice 2)
- Send ke customer

## Sinyal Masalah

- **Klien komplain quality proposal:** iterate prompt sekali lagi post-demo. Klien punya real domain feedback, valuable.
- **Klien struggle UX generate/preview/send:** consider onboarding tooltip atau screencast tutorial (post-MVP enhancement).
- **Klien tanya customization prompt:** confirm Slice 3 (Advanced Customization) sebagai roadmap, tapi frame sebagai "kalau memang butuh setelah 1-2 bulan usage."

---

# PHASE 17 — Cleanup & Epic 4 MVP Complete

## Kerjakan

1. Setelah 24-48 jam observation stable, hapus feature branch:
   ```bash
   git branch -d feature/epic4B-slice2-proposal-generator
   git push origin --delete feature/epic4B-slice2-proposal-generator
   ```
2. Update tracker: Epic 4 MVP ✅ COMPLETE
3. Cost monitoring setup:
   - Enable Anthropic billing alert (email at $10, $25 threshold)
   - Weekly manual check untuk 1 bulan pertama
4. Documentation:
   - Update `README.md` dengan Epic 4 MVP completion
   - Archive prompt versions di `docs/prompts/`
5. Handover ke Epic 4B Slice 3 (Post-MVP):
   - **JANGAN mulai Slice 3 langsung.** Wait 1-2 bulan usage data.
   - Track: berapa kali klien regenerate (indikator prompt quality issue), berapa kali klien complain tentang missing feature, apa customization actual yang klien minta.
   - Data ini akan inform Slice 3 scope refinement.

## Verifikasi

- [ ] Branch cleaned
- [ ] Cost alerts enabled
- [ ] Documentation updated
- [ ] Handover to Slice 3 planning ready

---

# Kontingensi & Troubleshooting

## Situasi: Anthropic API return 401 di production

**Symptom:** Generate return "AI service error: 401 Unauthorized"

**Root cause biasa:**
- `ANTHROPIC_API_KEY` tidak set di Railway env
- API key invalid/revoked
- Typo di env value

**Fix:**
1. Railway dashboard → Settings → Variables → verify `ANTHROPIC_API_KEY` exact value
2. Anthropic Console → verify key active
3. Test API key manual:
   ```bash
   curl https://api.anthropic.com/v1/messages \
     -H "x-api-key: $ANTHROPIC_API_KEY" \
     -H "anthropic-version: 2023-06-01" \
     -H "content-type: application/json" \
     -d '{"model":"claude-haiku-4-5-20251001","max_tokens":100,"messages":[{"role":"user","content":"Hi"}]}'
   ```

## Situasi: Generate timeout terus (> 60 detik)

**Symptom:** Semua generate timeout, tidak pernah return.

**Root cause biasa:**
- Anthropic API region issue
- Backend `TIMEOUT_SECONDS = 30` terlalu ketat untuk latency spike
- Network Railway → Anthropic slow

**Fix:**
1. Cek Anthropic status page: https://status.anthropic.com
2. Increase `TIMEOUT_SECONDS = 60` di service (temporary)
3. Kalau persistent, contact Anthropic support

## Situasi: PDF download return 401

**Symptom:** Download works di dev tapi 401 di production.

**Root cause biasa:**
- Fetch tidak attach Authorization header
- Token expired antar tab

**Fix:**
1. Verify workaround pattern (R-32) implemented — bukan `<a href>` langsung
2. Console.log `getSessionToken()` return value — verify valid JWT

## Situasi: PDF render tanpa font atau font aneh

**Symptom:** PDF ok tapi text pakai default browser font, atau Chinese-looking char.

**Root cause biasa:**
- Docker missing `fonts-liberation`
- CSS `font-family` reference font tidak tersedia

**Fix:**
1. Redeploy dengan `fonts-liberation` di Dockerfile
2. Update prompt untuk `font-family: 'Liberation Sans', sans-serif`
3. Test regenerate + download

## Situasi: Email attachment corrupt / tidak muncul

**Symptom:** Email received tapi PDF attachment 0 KB atau missing.

**Root cause biasa:**
- Resend Python SDK butuh base64 encoded content
- MIME type salah
- Attachment size limit exceeded

**Fix:**
1. Cek Resend SDK docs:
   ```python
   resend.Emails.send({
     "from": "sender@example.com",
     "to": "recipient@example.com",
     "subject": "Proposal",
     "html": body,
     "attachments": [{
       "filename": "proposal.pdf",
       "content": base64.b64encode(pdf_bytes).decode('utf-8'),
     }]
   })
   ```
2. Verify PDF size < 10 MB (Resend limit)
3. Test dengan minimal PDF dulu untuk isolate issue

## Situasi: Cost spike unexpected

**Symptom:** Anthropic Console menunjukkan usage > 10× expected.

**Root cause biasa:**
- Client-side accidental double-click → duplicate request
- Retry loop di frontend (kalau ada)
- Bug regenerate on component mount

**Fix:**
1. Add debounce di generate button (min 3 detik antar klik)
2. Audit code untuk retry logic — remove infinite loop
3. Verify `useEffect` dependencies benar (tidak trigger regenerate on random re-render)
4. **Immediate mitigation:** disable Anthropic key temporarily di Console → fix bug → re-enable

---

# Ringkasan File Slice 2

**Database:**
- Baru: `supabase/migrations/{ts}_add_proposal_sent_at.sql`

**Backend:**
- Modifikasi: `backend/Dockerfile` atau `nixpacks.toml` (WeasyPrint deps)
- Modifikasi: `requirements.txt` (add anthropic + weasyprint)
- Baru: `backend/prompts/__init__.py`
- Baru: `backend/prompts/proposal_prompt.py`
- Baru: `backend/services/proposal_generator.py`
- Baru: `backend/services/pdf_service.py`
- Modifikasi: `backend/services/email_service.py` (add send_proposal_email)
- Modifikasi: `backend/routers/rfq.py` (add 3 endpoints)

**Frontend Contract:**
- Modifikasi: `types/api.ts` (proposal_sent_at)
- Modifikasi: `lib/api.ts` (3 new functions)

**Components:**
- Baru: `components/admin/lead/ProposalGeneratorPanel.tsx`
- Baru: `components/admin/lead/ConfirmSendDialog.tsx` (sub-component)
- Modifikasi: `components/admin/lead/LeadDetailView.tsx` (Slice 1 touch)

**Dokumentasi:**
- `docs/prompts/proposal_prompt_v1.md` … `proposal_prompt_final_v{N}.md`
- `docs/demos/epic4B_slice2_demo_script.md`

---

## Catatan Penutup

Slice 2 ini adalah **capstone Epic 4 MVP**. Setelah selesai, klien punya sistem RFQ end-to-end:
- Customer submit RFQ (Epic 4 CF)
- Admin manage leads via Kanban (Epic 4B S1)
- Admin generate proposal AI + kirim ke customer (Epic 4B S2)

**Prinsip yang saya encode di guide ini:**

### 1. Gate 2 (Prompt Quality) adalah gate paling kritis

Ini pushback terbesar saya. Anda mungkin tempted skip untuk save waktu — jangan. Bad prompt = bad output = broken feature dari perspective klien.

**Konkret:** 4-8 jam iterasi prompt = highest ROI activity di seluruh Epic 4. Klien menilai fitur ini dari quality output, bukan technical elegance.

### 2. Docker deps adalah silent risk

WeasyPrint deploy fail Railway = feature dead. Gate 1 dedicated untuk verify infrastructure. Kalau di-skip, akan surface saat Gate 3 dengan cost lebih besar (backtrack investigation).

### 3. Cost monitoring bukan afterthought

$0.02 per generation kelihatan negligible, tapi bug retry infinite = potential $100+ dalam jam. R-35 sengaja aggressive — spending limit + Sentry alert + logging semua wajib sebelum first production API call.

### 4. Blocking generation dengan proper UX

Klien butuh visual feedback selama 10-30 detik. Loading state harus **very obvious**. Kalau klien tidak yakin request masih berjalan, akan double-click → duplicate cost + confusion.

### 5. Slice 1 touch discipline (R-34)

Test path lama sebelum path baru. Auto-save notes + status update + WA modal — semua harus works setelah integrate ProposalGeneratorPanel. Kalau break silent, klien akan discover saat pakai production.

**Post-MVP consideration:**

Setelah 1-2 bulan usage, evaluate:
- Rate klien regenerate (indikator prompt quality issue)
- Cost bulanan actual vs projection
- Klien feedback tentang missing customization

Data ini akan inform:
- Slice 3 execute atau tidak (my recommendation: defer sampai ada strong signal)
- Prompt iteration lanjutan
- Feature enhancement priority

**Epic 4 MVP = milestone bisnis.** Klien Reka Cipta sekarang punya AI-powered sales pipeline yang bikin mereka differentiator vs kompetitor distributor garam tradisional. Ini value proposition yang concrete.

**File:** `docs/execution-guides/CLAUDE_CODE_GUIDE_epic4B_slice2_proposal-generator.md`
**Version:** 1.0 — 2026-07-05
