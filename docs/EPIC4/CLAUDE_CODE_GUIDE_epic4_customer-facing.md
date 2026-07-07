# Claude Code Execution Guide — Epic 4 Customer-Facing (Form RFQ + Konfirmasi)

**Project:** reka-cipta-platform
**Slice:** Epic 4 Slice CF — `/minta-penawaran` form + `/minta-penawaran/terima-kasih` confirmation
**Task Breakdown Reference:** `epic4_task_breakdown_customer-facing.md` (WAJIB dibaca sebelum eksekusi)
**Prasyarat:** Epic 1 + Epic 2 (semua) + Epic 3 Customer-Facing (Slice 1 & 2) sudah live production
**Version:** 1.0
**Author:** Ach. Jazilul Qutbi
**Total Phase:** 15 | **STOP Gates:** 3

---

## Cara Pakai Guide Ini

Format sama dengan guide sebelumnya. Setiap phase punya section **Kerjakan** / **Jangan** / **Verifikasi**. STOP Gate berhenti sampai Jazil clear.

**Perbedaan karakter dari slice sebelumnya:**

| Aspek | Slice Ini (Epic 4 CF) | Slice Sebelumnya (Epic 3B S1) |
|---|---|---|
| Primary risk | **Cross-slice touch ke Epic 3 CTA** + rate limit correctness + email delivery reliability | Whitelist security + SpecJSONBEditor state complexity |
| Backend complexity | Simple insert + 2 emails + rate limit (pola Epic 2 Slice 3) | PUT dengan whitelist strict |
| Frontend complexity | Form single-page dengan prefill dari query param | Form CRUD dengan dynamic JSONB editor |
| Cross-slice touches | **Epic 3 detail page CTA** (`ProductCTA.tsx`) — regression risk MEDIUM | Tidak ada |
| STOP gates | 3 (Supabase setup + Visual QA/Regression + Client Demo) | 2 |
| External dependencies | Resend API + slowapi middleware + `company_settings.email` populated | Supabase Storage |

**Yang paling risky di slice ini:**
1. **Silent email failure** — BackgroundTasks fire-and-forget bikin submit success walau email gagal. Klien customer tidak tahu, admin tidak dapat notif.
2. **Rate limit misconfiguration** — kalau slowapi middleware tidak proper attach, endpoint tidak rate-limited (bukan 429, tapi 200 untuk 100+ request/menit).
3. **Cross-slice regression Epic 3** — CTA `<Link>` di `ProductCTA.tsx` di-update. Kalau salah, 2 tombol di 5 detail page break.
4. **Zod ↔ Pydantic enum drift** — kalau `industry_type` value beda antara frontend dan backend, form submit valid dari frontend tapi backend 422.

---

## Operating Rules — Delta dari Guide Sebelumnya

Semua Operating Rules R-01 sampai R-15 dari guide sebelumnya tetap berlaku (Supabase CLI broken, `public.ts` vs `server.ts`, Base UI vs Radix, `globals.css` frozen, Next.js 15 async params, static env access, TS↔Pydantic sync, Bahasa Indonesia, reuse components, branch strategy, Pydantic `extra='forbid'`, route order matters, auth guard, cache invalidation via Server Action, SpecJSONBEditor state pattern). Rules tambahan spesifik Epic 4 CF:

### R-16 — TIDAK Ada LLM Integration di Slice Ini

Ini per AR-01 di task breakdown. Endpoint `POST /rfq/submit` **hanya** insert ke DB + kirim 2 email. Tidak call Anthropic API.

- **JANGAN** import `anthropic` di router ini.
- **JANGAN** set env variable `ANTHROPIC_API_KEY` di deployment ini (reduce leak surface).
- Kalau lihat referensi "AI Proposal Generator" di Epic Doc, ingat: itu untuk Admin Panel Slice 2, bukan customer-facing.

### R-17 — Rate Limit Setup Pattern (slowapi)

slowapi butuh 3 komponen:
1. **Limiter instance** di router file
2. **Limiter attached ke app.state** di main.py
3. **Exception handler** untuk `RateLimitExceeded` di main.py

**Pattern yang benar** (di `backend/main.py`):
```python
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from backend.routers import rfq

app.state.limiter = rfq.limiter  # attach limiter ke app.state
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.include_router(rfq.router)
```

**Konsekuensi kalau salah:**
- Skip `app.state.limiter = ...` → `@limiter.limit()` decorator error saat handle request
- Skip exception handler → RateLimitExceeded jadi 500 Internal Server Error (bukan 429)
- Pattern ini sudah ada di Epic 2 Slice 3 (`/contact/send`). Kalau sudah ada di `main.py`, **jangan duplicate** — cek dulu.

### R-18 — Zod ↔ Pydantic Enum Values EXACTLY Match

Tiga enum di slice ini WAJIB match char-per-char:

| Field | Values |
|---|---|
| `industry_type` | `'makanan-minuman', 'farmasi', 'kimia', 'peternakan', 'tekstil', 'pengolahan-ikan', 'lainnya'` |
| `delivery_frequency` | `'weekly', 'biweekly', 'monthly'` |
| `status` (di DB, tidak ekspos ke frontend) | `'new', 'contacted', 'sample_sent', 'negotiation', 'deal', 'lost'` |

**Anti-pattern yang WAJIB dihindari:**
```python
# Backend Pydantic
INDUSTRY_TYPES = {'makanan-minuman', 'farmasi', ...}

# Zod (di TypeScript)
industry_type: z.enum(['makanan_minuman', 'farmasi', ...])  # SALAH: underscore vs hyphen
```

Frontend submit dengan value `makanan_minuman` → backend Pydantic reject → 422. Klien lihat error generic tanpa tahu penyebab.

**Enforcement:** Copy-paste values dari satu file ke file lain saat implementasi. Jangan retype dari memory.

### R-19 — Cross-Slice Touch Discipline (Epic 3 CTA Repurpose)

Update `components/product/ProductCTA.tsx` di Phase 11. **HIGH regression risk** karena file ini live production di 5 detail page.

**Pattern:**
1. **Baca file existing dulu**, pahami current implementation
2. **Backup mental atau file copy** — kalau salah, revert cepat
3. **Test path lama** (Minta Sampel → `/kontak`) sebelum test path baru (Dapatkan Penawaran → `/minta-penawaran`)
4. **Test di 5 detail page** — tidak hanya 1

**JANGAN** refactor ProductCTA untuk clean up hal lain yang "kelihatan bisa diperbaiki" — scope creep, potential regression. Ubah cuma tombol Dapatkan Penawaran.

### R-20 — Email Delivery via BackgroundTasks (Fire-and-Forget)

Router `submit_rfq` pakai `BackgroundTasks` untuk 2 email delivery. Ini async — response return 201 sebelum email actually delivered.

**Implikasi silent failure:**
- Kalau Resend API down, submit tetap 201 → customer thinks OK
- Kalau `company_settings.email` empty, admin notif tidak terkirim → tidak ada indikator error di UI

**Mitigasi:**
- Log setiap send attempt via `logger.info` sebelum panggil `_send_email`
- Log exception di `_send_email` internal (bukan raise) — supaya customer email delivery gagal tidak block admin email
- Sentry integration untuk email failures (kalau Sentry sudah setup di Epic 1) — akan raise notification ke Jazil kalau failure rate spike

**JANGAN** convert email delivery jadi synchronous (dalam handler, bukan BackgroundTasks) untuk "guarantee delivery" — akan bikin submit response 5-10 detik, poor UX.

### R-21 — Halaman Konfirmasi Accept Direct URL Access

Per AR-04 di task breakdown. **JANGAN** implement access control (sessionStorage flag, cookie, referrer check) untuk `/minta-penawaran/terima-kasih`.

Rasional:
- Not a security concern (halaman tidak leak data)
- Over-engineering untuk MVP
- Kalau nanti butuh conversion tracking, tambah query param `?ref=submit-{lead_id}` — enhancement, not blocker

---

# PHASE 1 — Preflight & Branch Setup

**Tujuan:** Verify semua prasyarat exist, buat feature branch.

## Kerjakan

1. `git status` — working directory bersih.
2. `git checkout main && git pull origin main` — sync latest.
3. Verify Epic 3 CF artifacts (yang akan di-touch):
   ```bash
   ls components/product/ProductCTA.tsx
   ls app/produk/[slug]/page.tsx
   ls types/api.ts
   ```
4. Verify Epic 2 Slice 3 pattern reference (yang akan direplikasi untuk rate limit + email):
   ```bash
   ls backend/routers/contact.py
   grep -l "slowapi\|Limiter" backend/routers/
   grep -l "BackgroundTasks" backend/routers/
   ```
   Kalau file `contact.py` tidak ada, cek path exact router Epic 2 Slice 3.
5. Verify email service existing:
   ```bash
   ls backend/services/email_service.py
   grep -l "_send_email\|resend" backend/services/email_service.py
   ```
6. Verify `company_settings` table punya `email` value (untuk destination admin notif):
   - Buka Supabase Dashboard → SQL Editor
   - `SELECT key, value FROM company_settings WHERE key = 'email';`
   - Kalau empty, **STOP** dan tanya Jazil untuk set value dulu
7. Verify production frontend healthy:
   - Buka `/produk/garam-halus-yodium`, klik "Dapatkan Penawaran" → landing di `/kontak?produk=...&intent=quotation`
   - Ini adalah current flow yang akan di-repurpose. Screenshot untuk baseline regression test nanti.
8. Buat feature branch: `git checkout -b feature/epic4-cf-rfq-form`

## Jangan

- Jangan proceed kalau `ProductCTA.tsx` tidak ada — Epic 3 CTA repurpose butuh file ini.
- Jangan proceed kalau `company_settings.email` empty — admin akan tidak dapat notif RFQ.
- Jangan skip screenshot baseline — regression comparison di Phase 11 butuh ini.

## Verifikasi

- [ ] Branch aktif: `feature/epic4-cf-rfq-form`
- [ ] Epic 3 CF & Epic 2 Slice 3 artifacts confirmed
- [ ] `company_settings.email` populated
- [ ] Screenshot current Epic 3 CTA flow tersimpan

---

# PHASE 2 — Database Migration Files

**Tujuan:** Bikin 2 `.sql` file untuk create table `rfq_leads` + RLS policies. **File hanya di-commit, belum di-apply.**

## Kerjakan

1. Generate timestamp UTC (`YYYYMMDDHHMMSS`) untuk penamaan.
2. Buat `supabase/migrations/{ts}_create_rfq_leads_table.sql` sesuai spec task `E4-CF-DB-01`:
   - CREATE TABLE dengan 18 field
   - 2 CHECK constraint (`status`, `delivery_frequency`)
   - 4 index (`status`, `created_at`, `email`, `industry_type`)
   - Trigger auto-update `updated_at` (reuse function `set_updated_at` dari Epic 3 kalau sudah ada)
3. **PENTING — Verify function `set_updated_at` sudah ada di DB:**
   - Cek migration Epic 3 (`create_products_table.sql`) — function harusnya sudah di-declare di sana.
   - Kalau function belum ada (mis. drop accidentally), tambah `CREATE OR REPLACE FUNCTION` di file migration ini.
4. Buat `supabase/migrations/{ts+1}_rfq_leads_rls.sql` sesuai spec task `E4-CF-DB-02`:
   - `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
   - Public INSERT policy dengan `WITH CHECK` constraint (enforce initial state)
   - Admin SELECT/UPDATE/DELETE policies
5. **PENTING — RLS INSERT policy detail:**
   ```sql
   CREATE POLICY "Public can submit RFQ"
       ON public.rfq_leads FOR INSERT TO anon, authenticated
       WITH CHECK (
           status = 'new'
           AND proposal_generated = FALSE
           AND admin_notes IS NULL
           AND proposal_html IS NULL
       );
   ```
   Ini mencegah anonymous accidentally bypass status atau prefill admin fields via direct Supabase call. Backend legitimate pakai service_role (bypass RLS), tidak affected.
6. Commit:
   ```bash
   git add supabase/
   git commit -m "chore(db): add rfq_leads table migration and RLS [Epic 4 CF]"
   ```

## Jangan

- **JANGAN** eksekusi `supabase db push` atau perintah apa pun yang apply migration ke DB (R-01 dari operating rules global).
- **JANGAN** tambah field `proposal_generated_at` sebagai `TIMESTAMPTZ NOT NULL` — nullable karena belum di-generate saat customer submit.
- **JANGAN** skip CHECK constraint — data integrity di DB level.
- **JANGAN** hapus WITH CHECK di RLS INSERT policy — critical untuk mencegah anon bypass.

## Verifikasi

- [ ] 2 file `.sql` created di path benar
- [ ] Migration file include trigger + function reference
- [ ] RLS file include 4 policies (1 INSERT + 3 admin)
- [ ] Commit sudah masuk branch

---

# 🛑 STOP GATE 1 — Manual Supabase Setup

**Status:** Menunggu Jazil apply migration di Supabase Dashboard.

## Aksi Manual yang Jazil Lakukan

1. **Buka Supabase Dashboard → SQL Editor**
2. **Verify function `set_updated_at` exists:**
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'set_updated_at';
   ```
   Kalau kosong, execute function creation dulu (dari Epic 3 migration atau dari migration ini).
3. **Apply migration file 1** — copy-paste isi `{ts}_create_rfq_leads_table.sql`, execute
4. **Apply migration file 2** — copy-paste isi `{ts+1}_rfq_leads_rls.sql`, execute
5. **Verifikasi:**
   ```sql
   -- Verify table
   SELECT column_name, data_type FROM information_schema.columns
   WHERE table_name = 'rfq_leads' ORDER BY ordinal_position;
   -- Expected: 18 rows

   -- Verify constraints
   SELECT conname, contype FROM pg_constraint
   WHERE conrelid = 'public.rfq_leads'::regclass;
   -- Expected: 2 CHECK + 1 PRIMARY KEY

   -- Verify RLS enabled
   SELECT relname, relrowsecurity FROM pg_class
   WHERE relname = 'rfq_leads';
   -- Expected: relrowsecurity = true

   -- Verify policies
   SELECT policyname, cmd, roles FROM pg_policies
   WHERE tablename = 'rfq_leads';
   -- Expected: 4 rows

   -- Test insert dari anon (harus sukses dengan valid data)
   SET ROLE anon;
   INSERT INTO rfq_leads (
       full_name, company_name, industry_type, salt_types,
       volume_per_month, delivery_frequency, delivery_city,
       email, whatsapp
   ) VALUES (
       'Test', 'Test Co', 'makanan-minuman', ARRAY['garam-halus-yodium'],
       10, 'monthly', 'Jakarta',
       'test@example.com', '081234567890'
   ) RETURNING id, status, created_at;
   -- Expected: 1 row inserted, status='new'

   -- Test insert dari anon dengan status='deal' (harus gagal karena WITH CHECK)
   INSERT INTO rfq_leads (..., status) VALUES (..., 'deal');
   -- Expected: policy violation error

   RESET ROLE;

   -- Cleanup test row
   DELETE FROM rfq_leads WHERE full_name = 'Test' AND company_name = 'Test Co';
   ```

## Setelah Gate Ini Clear

Jazil bilang "Gate 1 clear" atau "supabase applied". Lanjut Phase 3.

## Sinyal Masalah

- **Migration gagal apply karena function tidak ada:** cek Epic 3 migration file. Kalau function memang tidak ada di prod (drop accidentally), execute function creation dulu.
- **Test insert dari anon gagal walau data valid:** cek RLS policy INSERT — kemungkinan constraint WITH CHECK terlalu strict.
- **Test insert dari anon dengan `status='deal'` SUKSES:** RLS policy tidak ter-enforce — investigate `ENABLE ROW LEVEL SECURITY` statement.

---

# PHASE 3 — Backend Pydantic Schema + Email Service Extend

**Tujuan:** Buat Pydantic schemas untuk RFQ + extend email service dengan 2 fungsi.

## Kerjakan

1. Buat file `backend/schemas/rfq.py` sesuai spec task `E4-CF-BE-01`:
   - Constants `INDUSTRY_TYPES` dan `DELIVERY_FREQUENCIES` sebagai `set[str]`
   - Class `RFQSubmitRequest` dengan `model_config = ConfigDict(extra='forbid')` (R-11 dari operating rules global)
   - 4 field validator (`industry_type`, `delivery_frequency`, `whatsapp`, `salt_types`)
   - Class `RFQSubmitResponse` — simple response schema
2. Test whitelist + validators dengan REPL:
   ```bash
   cd backend && source .venv/bin/activate
   python -c "
   from backend.schemas.rfq import RFQSubmitRequest

   # Valid
   RFQSubmitRequest(
       full_name='Test User', company_name='Test Co',
       position=None, industry_type='makanan-minuman',
       salt_types=['garam-halus-yodium'], volume_per_month=10.0,
       delivery_frequency='monthly', delivery_city='Jakarta',
       email='test@example.com', whatsapp='081234567890', notes=None
   )
   print('Valid payload: PASS')

   # Extra field
   try:
       RFQSubmitRequest(
           full_name='Test User', company_name='Test Co',
           position=None, industry_type='makanan-minuman',
           salt_types=['garam-halus-yodium'], volume_per_month=10.0,
           delivery_frequency='monthly', delivery_city='Jakarta',
           email='test@example.com', whatsapp='081234567890', notes=None,
           status='deal'  # extra
       )
       print('FAIL: extra field allowed')
   except Exception:
       print('Extra field rejected: PASS')

   # Invalid whatsapp
   try:
       RFQSubmitRequest(
           full_name='Test User', company_name='Test Co',
           position=None, industry_type='makanan-minuman',
           salt_types=['garam-halus-yodium'], volume_per_month=10.0,
           delivery_frequency='monthly', delivery_city='Jakarta',
           email='test@example.com', whatsapp='123', notes=None
       )
       print('FAIL: invalid WA allowed')
   except Exception:
       print('Invalid WA rejected: PASS')
   "
   ```
3. Buka `backend/services/email_service.py` (existing dari Epic 2 Slice 3), tambah 2 fungsi sesuai spec task `E4-CF-BE-03`:
   - `send_rfq_customer_confirmation(to_email, lead_data, products)` — email personalized
   - `send_rfq_admin_notification(to_email, lead_data, products)` — notif admin
   - Helper `_mask_whatsapp(wa)` untuk mask 4 digit tengah
4. **PENTING — Konsisten frequency label:**
   ```python
   frequency_label = {
       'weekly': 'mingguan',
       'biweekly': 'dua minggu sekali',
       'monthly': 'bulanan',
   }[lead_data['delivery_frequency']]
   ```
   Kalau `delivery_frequency` value tidak ada di dict, akan `KeyError`. Wrap dengan `.get()` sebagai fallback: `.get(freq, freq)` — display raw value kalau unknown.

## Jangan

- **JANGAN** pakai `extra='ignore'` (default Pydantic v2) — akan silent accept unknown fields.
- **JANGAN** hardcode admin email di email service — akan di-fetch dari `company_settings.email` di router (Phase 4).
- **JANGAN** raise exception di email functions untuk validation — validation sudah di Pydantic layer sebelum email dipanggil.
- **JANGAN** commit dulu — akan commit bareng router di Phase 4.

## Verifikasi

- [ ] REPL test 3/3 pass (valid, extra field, invalid whatsapp)
- [ ] Email service 2 fungsi + helper mask_whatsapp exists
- [ ] Type hint semua field resolve

---

# PHASE 4 — Backend Router POST /rfq/submit + Rate Limit + Register

**Tujuan:** Implementasi endpoint + rate limit setup + register di main.py.

## Kerjakan

1. Buat file `backend/routers/rfq.py` sesuai spec task `E4-CF-BE-02`:
   - Router dengan `prefix="/rfq"`, `tags=["rfq"]`
   - Import `Limiter` dari `slowapi`, instantiate dengan `key_func=get_remote_address`
   - Endpoint `POST /submit` dengan decorator `@limiter.limit("5/hour")`
   - `BackgroundTasks` untuk 2 email delivery
   - Fetch product names dari DB untuk email personalization
   - Fetch admin email dari `company_settings`
   - Fail-open: kalau admin email tidak ada, tetap return 201 (log warning)
2. **PENTING — Signature router harus include `request: Request` sebagai first arg** (untuk slowapi bisa extract IP):
   ```python
   @router.post("/submit", ...)
   @limiter.limit("5/hour")
   async def submit_rfq(
       request: Request,  # <-- WAJIB, untuk slowapi
       payload: RFQSubmitRequest,
       background_tasks: BackgroundTasks,
   ) -> RFQSubmitResponse:
   ```
   Kalau lupa `request: Request`, slowapi akan silent fail atau raise cryptic error.
3. Update `backend/main.py`:
   ```python
   from backend.routers import rfq
   from slowapi import _rate_limit_exceeded_handler
   from slowapi.errors import RateLimitExceeded

   # Cek apakah setup limiter sudah ada dari Epic 2 Slice 3
   # Kalau sudah, JANGAN duplicate
   if not hasattr(app.state, 'limiter'):
       app.state.limiter = rfq.limiter
       app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
   else:
       # Reuse existing limiter — merge kalau perlu
       pass

   app.include_router(rfq.router)
   ```
   **Kalau Epic 2 Slice 3 sudah setup limiter di main.py**, tinggal `include_router(rfq.router)`. Cek dulu.
4. Start FastAPI dev server: `uvicorn backend.main:app --reload --port 8000`
5. Buka `http://localhost:8000/docs` — verify endpoint `POST /rfq/submit` muncul.
6. Manual test:
   ```bash
   # 1. Submit valid
   curl -X POST http://localhost:8000/rfq/submit \
     -H "Content-Type: application/json" \
     -d '{
       "full_name": "Test User",
       "company_name": "Test Co",
       "position": null,
       "industry_type": "makanan-minuman",
       "salt_types": ["garam-halus-yodium"],
       "volume_per_month": 10.0,
       "delivery_frequency": "monthly",
       "delivery_city": "Jakarta",
       "email": "your-test-inbox@example.com",
       "whatsapp": "081234567890",
       "notes": null
     }' | jq
   # Expected: 201 dengan {success: true, lead_id: "..."}

   # 2. Query DB — row inserted
   # (via Supabase Dashboard)

   # 3. Cek inbox — customer confirmation email + admin notif email delivered

   # 4. Submit dengan extra field (should reject)
   curl -X POST http://localhost:8000/rfq/submit \
     -H "Content-Type: application/json" \
     -d '{..., "status": "deal"}' -i | head -5
   # Expected: 422

   # 5. Submit invalid whatsapp
   curl -X POST http://localhost:8000/rfq/submit \
     -H "Content-Type: application/json" \
     -d '{..., "whatsapp": "123"}' -i | head -5
   # Expected: 422

   # 6. Rate limit test — submit 6x cepat
   for i in {1..6}; do
     curl -X POST http://localhost:8000/rfq/submit \
       -H "Content-Type: application/json" \
       -d '{...valid payload...}' \
       -w "\nAttempt $i: HTTP %{http_code}\n" -o /dev/null -s
   done
   # Expected: 5x 201, then 429
   ```
7. Commit:
   ```bash
   git add backend/
   git commit -m "feat(api): add POST /rfq/submit with rate limit and email delivery [Epic 4 CF]"
   ```

## Jangan

- **JANGAN** lupa `request: Request` di signature — slowapi butuh ini.
- **JANGAN** duplicate `app.state.limiter = ...` kalau Epic 2 Slice 3 sudah setup — akan overwrite existing limiter.
- **JANGAN** panggil email function langsung dalam handler (bukan via BackgroundTasks) — akan block response 5-10 detik.
- **JANGAN** call `raise HTTPException` kalau admin email tidak ada — fail-open per AR-05 (customer bisa submit walau notif admin gagal).
- **JANGAN** deploy dulu ke Railway — akan di Phase 5 setelah local verified.

## Verifikasi

- [ ] `/docs` menampilkan endpoint dengan rate limit info
- [ ] Curl test 6 skenario pass (valid, extra field, invalid whatsapp, rate limit hit)
- [ ] DB row inserted dengan status='new'
- [ ] Email delivered ke customer & admin inbox
- [ ] Commit masuk

---

# PHASE 5 — Deploy Backend Railway + Production Curl Test

**Tujuan:** Deploy, verify production endpoint healthy + email delivery works di production.

## Kerjakan

1. `git push -u origin feature/epic4-cf-rfq-form`
2. Tunggu Railway deploy (2-4 menit).
3. Verify Railway env vars set:
   - `RESEND_API_KEY` (dari Epic 2 Slice 3)
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - `FRONTEND_URL` (untuk link ke admin panel di email notif — kalau belum set, hardcode URL production Vercel)
4. Test production endpoint dengan curl (sama pattern Phase 4 step 6, ganti URL).
5. **PENTING — Test rate limit di production butuh trick:**
   - Rate limit berbasis IP. Kalau semua request dari IP Anda, ke-6 akan 429.
   - Untuk test dari IP berbeda (mis. mobile hotspot vs wifi), gunakan proxy atau VPN.
   - Atau reset limiter state — restart Railway container.

## Jangan

- **JANGAN** submit RFQ dengan email real klien saat testing production — pakai email test sendiri.
- **JANGAN** biarkan test rows akumulasi di production `rfq_leads` — cleanup manual via Dashboard setelah verify.

## Verifikasi

- [ ] Railway deploy sukses
- [ ] Production `POST /rfq/submit` return 201 untuk valid payload
- [ ] Rate limit hit di production
- [ ] Email delivery works via Resend production
- [ ] Test rows cleaned up

---

# PHASE 6 — Contract Layer (Types + Zod + lib/api)

**Tujuan:** Sync frontend types dengan Pydantic + tambah fetcher + Zod schema.

## Kerjakan

1. Update `types/api.ts` sesuai spec task `E4-CF-CT-01`:
   - Type aliases `DeliveryFrequency`, `IndustryType`
   - Interfaces `RFQSubmitRequest`, `RFQSubmitResponse`
2. **CRITICAL — Enum values must match Pydantic (R-18):**
   - Copy `INDUSTRY_TYPES` values dari `backend/schemas/rfq.py`
   - Paste ke `IndustryType` di TS **char-per-char**
   - Verify: kalau backend `'makanan-minuman'` (hyphen), TS juga `'makanan-minuman'` (hyphen), bukan `'makanan_minuman'` (underscore)
3. Update `lib/api.ts` tambah `submitRFQ(payload)`:
   ```typescript
   export async function submitRFQ(
     payload: RFQSubmitRequest
   ): Promise<RFQSubmitResponse> {
     return apiFetch<RFQSubmitResponse>('/rfq/submit', {
       method: 'POST',
       auth: false,  // public endpoint, no JWT
       body: JSON.stringify(payload),
       headers: { 'Content-Type': 'application/json' },
     });
   }
   ```
4. Buat `lib/validation/rfq-schema.ts` sesuai spec task `E4-CF-FE-01`:
   - Zod schema `rfqSubmitSchema`
   - Enum values EXACTLY match Pydantic + TS types
   - Export TypeScript type `RFQSubmitFormData = z.infer<typeof rfqSubmitSchema>`
5. **Verifikasi enum match dengan grep:**
   ```bash
   grep "makanan-minuman\|farmasi\|kimia" backend/schemas/rfq.py types/api.ts lib/validation/rfq-schema.ts
   ```
   Kalau ada file yang value beda (underscore vs hyphen), fix sekarang.
6. Type check: `pnpm tsc --noEmit`. Pass tanpa error.
7. Commit:
   ```bash
   git add types/ lib/
   git commit -m "feat(contract): add RFQ types, Zod schema, and API fetcher [Epic 4 CF]"
   ```

## Jangan

- **JANGAN** retype enum values dari memory — copy-paste dari source of truth (Pydantic).
- **JANGAN** pakai `z.string()` untuk field yang enum — pakai `z.enum([...])`. Sync ke Pydantic Set constants.
- **JANGAN** lupa `auth: false` di `submitRFQ` — endpoint public, kalau `auth: true` akan attach JWT unnecessarily.

## Verifikasi

- [ ] Enum grep menunjukkan 3 file dengan values identical
- [ ] `pnpm tsc --noEmit` pass
- [ ] Import `submitRFQ` from `@/lib/api` tidak error
- [ ] Commit masuk

---

# PHASE 7 — Route `/minta-penawaran/page.tsx` (Server Component)

**Tujuan:** Buat halaman utama dengan fetch products untuk populate checkbox.

## Kerjakan

1. Buat direktori `app/minta-penawaran/`.
2. Buat file `app/minta-penawaran/page.tsx` sesuai spec task `E4-CF-FE-02`:
   - Server Component
   - `export const revalidate = 3600` (Static + ISR 1 jam)
   - Metadata dengan title + description
   - Fetch products via `createPublicSupabaseClient()` — **WAJIB `public.ts`, bukan `server.ts`** (R-02 dari operating rules global)
   - Order by `sort_order`, filter `is_active = true`
   - Render `<InnerPageHero>` + `<RFQForm availableProducts={products ?? []} />`
3. Sementara `RFQForm` belum ada, render placeholder untuk test route:
   ```tsx
   <div>Placeholder — {products?.length ?? 0} produk tersedia</div>
   ```
4. Jalankan `pnpm dev`, buka `http://localhost:3000/minta-penawaran`. Halaman render dengan hero + placeholder "5 produk tersedia".

## Jangan

- **JANGAN** import `createServerClient` dari `lib/supabase/server.ts` — akan bikin route Dynamic.
- **JANGAN** pakai `'use client'` di file ini — Server Component.
- **JANGAN** fetch products via `apiFetch` ke backend — pakai Supabase langsung (konsisten dengan pattern Epic 3 CF).

## Verifikasi

- [ ] Route render tanpa error di dev server
- [ ] Placeholder menunjukkan "5 produk tersedia"
- [ ] Hero konsisten style dengan `/tentang-kami`, `/produk`

---

# PHASE 8 — Component `RFQForm` (Client Component Complex)

**Tujuan:** Bikin form utama dengan react-hook-form + Zod + prefill dari searchParams + submit flow.

## Kerjakan

1. Buat `components/rfq/RFQForm.tsx` sesuai spec task `E4-CF-FE-03`:
   - Client Component (`'use client'`)
   - Import `useForm`, `Controller`, `zodResolver`, `useSearchParams`, `useRouter`
   - Props: `availableProducts: Array<{ slug, name, code }>`
2. **Prefill logic:**
   ```typescript
   const searchParams = useSearchParams();
   const prefilledSlug = searchParams.get('produk');
   const prefilledSaltTypes = prefilledSlug
     && availableProducts.some(p => p.slug === prefilledSlug)
       ? [prefilledSlug]
       : [];
   ```
3. **`useForm` config:**
   ```typescript
   const form = useForm<RFQSubmitFormData>({
     resolver: zodResolver(rfqSubmitSchema),
     mode: 'onBlur',  // validate on blur, bukan onChange (mengurangi noise saat typing)
     defaultValues: {
       // ... include prefilledSaltTypes untuk salt_types
     },
   });
   ```
4. **Submit handler:**
   ```typescript
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
   ```
   **PENTING:** `setIsSubmitting(false)` HANYA di catch block, bukan di finally. Kalau success, redirect terjadi — state tidak perlu reset.
5. Layout 3 section dengan `<FormSection>`:
   - Informasi Perusahaan: `full_name`, `company_name`, `position`, `industry_type`
   - Kebutuhan Produk: `<Controller name="salt_types">` wrap `<SaltTypeCheckboxGroup>` (Phase 9), lalu `volume_per_month`, `delivery_frequency`, `delivery_city`
   - Kontak: `email`, `whatsapp`, `notes`
6. Info block di atas submit button + submit button (disabled state + spinner).
7. Test di dev server dengan URL:
   - `/minta-penawaran` (no prefill) — form empty
   - `/minta-penawaran?produk=garam-halus-yodium` (prefill valid) — checkbox pre-selected (setelah Phase 9)
   - `/minta-penawaran?produk=slug-invalid` (prefill invalid) — silent ignore, form empty

## Jangan

- **JANGAN** panggil `router.push` di catch block — akan bikin user tidak lihat error message.
- **JANGAN** `mode: 'onChange'` di useForm — akan spam validation feedback saat user typing.
- **JANGAN** lupa `setIsSubmitting(false)` di catch — button stuck disabled.
- **JANGAN** hardcode label frequency di Indonesian di form — pakai enum values yang match backend (`'weekly'` bukan `'mingguan'`). Label Indonesian hanya di display option `<option>` element.

## Verifikasi

- [ ] Form render dengan 3 section
- [ ] Prefill test 3 skenario works
- [ ] Validation muncul on blur (bukan on change)
- [ ] Submit success redirect ke `/terima-kasih` (yang belum ada — will 404, OK untuk sekarang)
- [ ] Submit error toast muncul

---

# PHASE 9 — Component `SaltTypeCheckboxGroup` + Field Sub-Components

**Tujuan:** Bikin komponen checkbox group + field sub-components (Input, Textarea, Select) yang reusable.

## Kerjakan

1. Buat `components/rfq/SaltTypeCheckboxGroup.tsx` sesuai spec task `E4-CF-FE-04`:
   - Client Component
   - Props: `products`, `value: string[]`, `onChange: (string[]) => void`, `error?: string`
   - Empty state kalau `products.length === 0`
   - Render checkbox per produk dengan `<label>` wrap `<input type="checkbox">`
   - Multi-select toggle logic
2. Sub-components untuk field standard (kalau belum ada dari Epic 2/3):
   - `<FormSection title, children />` — wrapper heading + section styling
   - `<InfoBlock children />` — info panel dengan icon
   - Reuse existing `<Input>`, `<Textarea>`, `<Select>` dari shadcn (yang mungkin di-config ke Base UI)
3. **Field 7 industry:** Hardcode di komponen `<IndustrySelect>` atau langsung di `RFQForm`:
   ```tsx
   <select {...form.register('industry_type')}>
     <option value="makanan-minuman">Makanan & Minuman</option>
     <option value="farmasi">Farmasi</option>
     <option value="kimia">Kimia</option>
     <option value="peternakan">Peternakan</option>
     <option value="tekstil">Tekstil</option>
     <option value="pengolahan-ikan">Pengolahan Ikan</option>
     <option value="lainnya">Lainnya</option>
   </select>
   ```
4. **Field frequency:**
   ```tsx
   <select {...form.register('delivery_frequency')}>
     <option value="weekly">Mingguan</option>
     <option value="biweekly">Dua Minggu Sekali</option>
     <option value="monthly">Bulanan</option>
   </select>
   ```
5. Test di dev server: semua field render, validation on blur, submit end-to-end works.

## Jangan

- **JANGAN** hardcode Indonesian value di `<option value="...">` — value pakai enum (English/hyphenated), label pakai Indonesian.
- **JANGAN** pakai library heavy seperti `react-select` — native `<select>` sudah cukup + accessible + no extra bundle.
- **JANGAN** lupa `Controller` wrapper untuk `SaltTypeCheckboxGroup` di parent `RFQForm` — react-hook-form butuh Controller untuk custom components yang tidak forward ref.

## Verifikasi

- [ ] SaltTypeCheckboxGroup multi-select works
- [ ] Prefill dari parent form works
- [ ] Empty state visible saat `products = []`
- [ ] Industry & frequency dropdown label Indonesian, value English/hyphenated
- [ ] End-to-end submit flow works di local

---

# PHASE 10 — Route `/minta-penawaran/terima-kasih` + Polish

**Tujuan:** Bikin halaman konfirmasi + update sitemap + verify navbar link.

## Kerjakan

1. Buat direktori `app/minta-penawaran/terima-kasih/`.
2. Buat file `app/minta-penawaran/terima-kasih/page.tsx` sesuai spec task `E4-CF-FE-05`:
   - Server Component (static, no data fetch)
   - `metadata` dengan `robots: { index: false, follow: false }` (halaman internal flow, jangan index Google)
   - Icon check + heading + 2 message + 2 CTA (Beranda + Katalog)
3. Update `app/sitemap.ts` — tambah `/minta-penawaran` (JANGAN tambah `/terima-kasih`):
   ```typescript
   {
     url: `${baseUrl}/minta-penawaran`,
     priority: 0.9,
     changeFrequency: 'monthly',
   }
   ```
4. Verify Navbar link "Minta Penawaran":
   - Cek file Navbar (`components/layout/Navbar.tsx` atau path serupa)
   - Kalau link belum ada atau menunjuk ke `#`, update ke `/minta-penawaran`
5. Test di dev server:
   - Submit form → redirect ke `/terima-kasih` → halaman render dengan icon + message + CTA
   - Klik CTA Beranda → land di `/`
   - Klik CTA Katalog → land di `/produk`
6. Buka `/sitemap.xml`:
   - `/minta-penawaran` muncul
   - `/terima-kasih` **tidak** muncul

## Jangan

- **JANGAN** implement access control di `/terima-kasih` (per R-21) — accept direct URL access.
- **JANGAN** tambah `/terima-kasih` ke sitemap — halaman internal flow, tidak untuk SEO.
- **JANGAN** lupa `robots: noindex` di metadata — kalau accidentally ter-index, orang bisa land di halaman ini via search "terima kasih reka cipta" tanpa submit form.

## Verifikasi

- [ ] `/terima-kasih` render dengan icon + CTA
- [ ] Sitemap include `/minta-penawaran`, exclude `/terima-kasih`
- [ ] Navbar link aktif
- [ ] View source `/terima-kasih` → meta robots="noindex, nofollow"

---

# PHASE 11 — Cross-Slice Touch: Epic 3 CTA Repurpose (HIGH REGRESSION RISK)

**Tujuan:** Update `ProductCTA.tsx` dari Epic 3 Slice 2 — "Dapatkan Penawaran" link ke `/minta-penawaran`, "Minta Sampel" tetap ke `/kontak`.

## Prep Sebelum Kerjakan

1. Baca file existing:
   ```bash
   cat components/product/ProductCTA.tsx
   ```
2. Understand current implementation:
   - Berapa tombol? Apa target URL masing-masing?
   - Bagaimana `product.slug` di-pass?
3. Take backup screenshot dari Phase 1 baseline (Epic 3 detail page dengan 2 tombol CTA).

## Kerjakan

1. Buka `components/product/ProductCTA.tsx`.
2. Cari 2 URL construction:
   ```typescript
   const sampleHref = `/kontak?produk=${product.slug}&intent=sample`;
   const quotationHref = `/kontak?produk=${product.slug}&intent=quotation`;
   ```
3. Update `quotationHref` ke `/minta-penawaran`, **BIARKAN** `sampleHref` unchanged:
   ```typescript
   const sampleHref = `/kontak?produk=${product.slug}&intent=sample`;
   const quotationHref = `/minta-penawaran?produk=${product.slug}`;
   ```
4. **JANGAN refactor** hal lain di file ini — scope creep bikin regression risk naik.
5. **CRITICAL — Regression test path lama DULU:**
   - Buka `/produk/garam-halus-yodium` di dev
   - Klik **"Minta Sampel"** — verify landing di `/kontak?produk=garam-halus-yodium&intent=sample`
   - Verify contact form prefill (dari Epic 3 Slice 2 previous work) still works
   - Kalau path lama break, revert changes dan investigate — ada issue lain sebelum lanjut.
6. **Test path baru:**
   - Klik **"Dapatkan Penawaran"** — verify landing di `/minta-penawaran?produk=garam-halus-yodium`
   - Verify checkbox `garam-halus-yodium` pre-selected di form
7. Test 5 produk detail page:
   ```bash
   # Buka masing-masing di browser:
   # /produk/garam-halus-yodium
   # /produk/garam-halus-non-yodium
   # /produk/garam-kasar-industri
   # /produk/garam-kasar-petani
   # /produk/garam-ghpt
   ```
   Klik "Dapatkan Penawaran" di setiap — verify prefill correct.
8. Commit progress:
   ```bash
   git add app/ components/ types/ lib/
   git commit -m "feat(rfq): add RFQ form page and repurpose Epic 3 CTA [Epic 4 CF]"
   ```

## Jangan

- **JANGAN** skip regression test path lama — kalau langsung test path baru dan pass, "Minta Sampel" mungkin diam-diam broken.
- **JANGAN** ubah struktur tombol lain (mis. text, order) — cuma URL yang berubah.
- **JANGAN** hapus `sampleHref` — trade-off keputusan di AR-05 task breakdown: sample tetap ke `/kontak`.
- **JANGAN** test cuma 1 produk — 5 produk berbeda, verify semua.

## Verifikasi

- [ ] Path lama "Minta Sampel" → `/kontak` masih works
- [ ] Contact form prefill dari intent=sample masih works
- [ ] Path baru "Dapatkan Penawaran" → `/minta-penawaran?produk=X` works
- [ ] RFQ form prefill checkbox works untuk 5 produk
- [ ] Commit masuk

---

# PHASE 12 — Build Verification + Local E2E

**Tujuan:** Verify build no regression, E2E flow end-to-end works.

## Kerjakan

1. `pnpm build` di root project.
2. Verify build output:
   ```
   ○ /
   ○ /tentang-kami
   ○ /kontak                            <-- masih Static
   ○ /produk                            <-- masih Static
   ○ /produk/garam-halus-yodium         <-- masih Static
   ○ ... (5 detail)
   ○ /minta-penawaran                   <-- baru, harus Static
   ○ /minta-penawaran/terima-kasih      <-- baru, harus Static
   ```
   Semua harus `○` (Static). Kalau ada yang `ƒ`, investigate.
3. `pnpm lint` — 0 error.
4. **E2E test manual (full flow):**
   1. Buka `/produk` → klik "Lihat Detail" PRO YD
   2. Di detail page, klik "Dapatkan Penawaran"
   3. Landing di `/minta-penawaran?produk=garam-halus-yodium`
   4. Verify checkbox PRO YD pre-selected
   5. Isi form semua field (pakai email test Anda sendiri)
   6. Klik "Kirim & Dapatkan Penawaran"
   7. Landing di `/terima-kasih`
   8. Cek inbox email — customer confirmation delivered
   9. Cek email admin (dari `company_settings.email`) — notif delivered
   10. Query DB via Supabase Dashboard:
       ```sql
       SELECT * FROM rfq_leads ORDER BY created_at DESC LIMIT 1;
       ```
       Row inserted dengan data correct
5. **Regression test Epic 2/3:**
   - `/kontak` submit form biasa (tanpa query param) → still works, email delivered
   - `/produk` filter tab kategori → still works
   - `/produk/garam-halus-yodium` klik "Minta Sampel" → `/kontak?produk=...&intent=sample` → form prefill message works
6. **Cleanup test data:**
   - Delete test rows dari `rfq_leads` (via Dashboard atau SQL)
7. Commit:
   ```bash
   git add .
   git commit -m "feat(rfq): complete Epic 4 customer-facing MVP [Epic 4 CF]"
   ```

## Jangan

- **JANGAN** commit dengan test rows di DB — akan pollute production data.
- **JANGAN** skip regression test Epic 2/3 — cross-slice touch di Phase 11 potential break.
- **JANGAN** proceed ke deploy kalau ada route jadi `ƒ` — fix dulu.

## Verifikasi

- [ ] Build sukses, rendering strategy semua route preserved
- [ ] `pnpm lint` pass
- [ ] E2E flow 10 step pass
- [ ] Regression Epic 2/3 pass
- [ ] DB cleaned up
- [ ] Commit masuk

---

# PHASE 13 — Deploy Vercel Preview

**Tujuan:** Push branch, Vercel preview deploy, smoke test.

## Kerjakan

1. `git push` (upstream sudah set dari Phase 5).
2. Tunggu Vercel deploy.
3. Get preview URL.
4. Smoke test 5 skenario:
   - `/minta-penawaran` render dengan hero + form
   - Prefill via `?produk=garam-halus-yodium` works
   - Submit form → redirect + email delivery
   - `/terima-kasih` accessible via direct URL (no error)
   - Epic 3 detail page CTA "Dapatkan Penawaran" repurpose works
5. Report preview URL ke Jazil.

## Jangan

- **JANGAN** submit RFQ dengan email real klien di preview — pakai email test.
- **JANGAN** demo ke klien di preview URL — production URL dulu.

## Verifikasi

- [ ] Vercel preview deploy sukses
- [ ] Smoke test 5/5 pass
- [ ] Preview URL diberitahukan

---

# 🛑 STOP GATE 2 — Visual QA + E2E + Rate Limit + Regression

**Status:** Menunggu Jazil QA komprehensif di preview URL.

## Aksi Manual yang Jazil Lakukan

### 1. Visual QA `/minta-penawaran`

- [ ] Layout 3 section rapi
- [ ] Form field readable di mobile 375px
- [ ] Checkbox tap target ≥ 44×44px
- [ ] Info block visible sebelum submit button
- [ ] Loading state di submit button visible
- [ ] Error message inline muncul saat validation fail

### 2. Visual QA `/terima-kasih`

- [ ] Icon check besar visible
- [ ] 2 CTA button aktif
- [ ] Mobile responsive

### 3. E2E Flow Test

Repeat E2E test 10 step dari Phase 12 di preview URL. Screenshot untuk documentation.

### 4. Rate Limit Test

Submit 6x cepat dari 1 IP:
- Attempt 1-5: success, redirect
- Attempt 6: toast "Terlalu banyak permintaan. Coba lagi dalam 1 jam."

### 5. Regression Test Epic 3

- [ ] `/produk` list render 5 produk
- [ ] Filter tab kategori works
- [ ] `/produk/garam-halus-yodium` detail render
- [ ] "Minta Sampel" → `/kontak?produk=...&intent=sample` → contact form prefill message works
- [ ] Klik "Dapatkan Penawaran" → `/minta-penawaran?produk=...` → checkbox pre-selected

### 6. Regression Test Epic 2

- [ ] `/kontak` submit form biasa works
- [ ] Contact form validation works
- [ ] Email delivery `/contact/send` works

### 7. SEO Check

- [ ] `/sitemap.xml` include `/minta-penawaran`, exclude `/terima-kasih`
- [ ] `/terima-kasih` view source: `<meta name="robots" content="noindex, nofollow">`
- [ ] Meta description `/minta-penawaran` informative

### 8. Lighthouse Mobile

- Performance ≥ 90 (form page tidak boleh slow)
- Accessibility ≥ 95
- SEO ≥ 95

## Setelah Gate Ini Clear

Jazil bilang "Gate 2 clear". Kalau ada issue:
- **Email tidak terkirim di production:** cek Resend dashboard logs, verify `RESEND_API_KEY` set di Vercel/Railway
- **Rate limit tidak fire:** cek slowapi config di `main.py`, verify `app.state.limiter` attached
- **Regression Epic 3 CTA break:** revert Phase 11 changes, redesign approach
- **Prefill tidak works:** cek `useSearchParams` handling di `RFQForm`, verify `availableProducts.some(p => p.slug === prefilledSlug)`

---

# PHASE 14 — Merge ke `dev` + Production Deploy

**Tujuan:** Merge PR, production release.

## Kerjakan

1. Buat/update PR ke `dev`.
2. PR description include:
   - Ringkasan Epic 4 CF scope
   - Screenshot build output (semua route Static)
   - Screenshot E2E flow (10 step)
   - Screenshot regression tests (Epic 2/3)
   - Screenshot rate limit test
   - DoD checklist tercentang
3. Jazil review + approve → merge ke `dev`.
4. Vercel auto-deploy `dev` → staging.
5. Smoke test staging (sama pattern Phase 13).
6. Jazil manual merge `dev` → `main` → production.
7. Verify production:
   - `https://rekaciptaindonesia.com/minta-penawaran` accessible
   - CTA dari `/produk/{slug}` repurpose works
   - Email delivery works di production
   - Rate limit works di production

## Jangan

- **JANGAN** merge `dev` → `main` sendiri — itu tindakan Jazil.
- **JANGAN** submit test RFQ dengan email klien real di production — cleanup akan complex.

## Verifikasi

- [ ] PR merged ke `dev`
- [ ] Staging deploy sukses
- [ ] Production deploy sukses (setelah Jazil merge)
- [ ] Production smoke test pass

---

# 🛑 STOP GATE 3 — Client Demo & Sign-Off

**Status:** Menunggu Jazil demo ke klien.

## Aksi Manual yang Jazil Lakukan

Follow demo script `docs/demos/epic4_slice_cf_demo_script.md`:

1. **Konteks (30 detik)** — "Ini channel utama collect RFQ dengan data terstruktur. Berbeda dari `/kontak` yang generic — RFQ punya field spesifik yang siap untuk pipeline sales."
2. **Demo alur user (3 menit):**
   - Dari `/produk/garam-halus-yodium` → klik "Dapatkan Penawaran"
   - Landing di form dengan PRO YD pre-selected
   - Isi form (klien sendiri yang isi untuk verify UX intuitive)
   - Submit → redirect ke terima-kasih
3. **Demo email delivery (1 menit):**
   - Buka inbox customer test → tunjukkan email konfirmasi personalized
   - Buka inbox admin (klien punya inbox) → tunjukkan notif RFQ baru dengan detail
4. **Demo query database (1 menit):**
   - Buka Supabase Dashboard → SQL Editor
   - `SELECT company_name, industry_type, status, created_at FROM rfq_leads ORDER BY created_at DESC LIMIT 5;`
   - Tunjukkan struktur data yang siap untuk admin panel
5. **Demo rate limit (30 detik):**
   - Submit 6x cepat, tunjukkan attempt 6 di-block
   - Framing: "ini proteksi dari spam"
6. **Roadmap Admin Panel (1 menit):**
   - "Sekarang klien dapat notif email. Belum ada UI admin untuk manage — itu next slice."
   - "Setelah admin panel Slice 1: Kanban pipeline, klien bisa drag-drop status."
   - "Setelah admin panel Slice 2: generate proposal AI via satu klik."

## Setelah Gate Ini Clear

Klien sign-off Epic 4 CF complete. Ready untuk admin panel Slice 1 execution.

**Blocker klien setelah CF live:** klien akan spam refresh Supabase Dashboard manual untuk cek RFQ baru. Ini bad UX yang perlu di-solve di admin Slice 1 ASAP.

## Sinyal Masalah

- **Klien confused dengan form field:** simplify labels, tambah placeholder examples
- **Klien tanya kapan proposal auto:** jawab jujur — di admin Slice 2 (post admin Slice 1). Timeline ~3-5 minggu total.
- **Klien tidak dapat notif email:** cek `company_settings.email` — kemungkinan email address salah atau spam folder

---

# PHASE 15 — Cleanup & Handover ke Admin Panel

**Tujuan:** Cleanup post-merge, prepare admin panel Slice 1.

## Kerjakan

1. Setelah production stable 24-48 jam, hapus feature branch:
   ```bash
   git branch -d feature/epic4-cf-rfq-form
   git push origin --delete feature/epic4-cf-rfq-form
   ```
2. Update progress tracker: Epic 4 Customer-Facing ✅.
3. Update `README.md` atau `docs/CHANGELOG.md` dengan release notes.
4. **Klien education note:** Kirim message ke Irwan Sugianto:
   - "RFQ form sudah live. Anda akan dapat notif email setiap ada RFQ baru."
   - "Untuk sementara, cek detail RFQ via Supabase Dashboard. Admin panel dengan Kanban akan live dalam 2 minggu."
   - "Kalau ada RFQ yang urgent follow-up, cukup contact customer via WhatsApp yang tercantum di email notif."
5. Handover note ke admin panel Slice 1:
   - `rfq_leads` table sudah populated dengan data real (dari test + demo)
   - Backend `POST /rfq/submit` public endpoint accessible
   - Admin belum ada UI — Slice 1 admin akan bikin Kanban pipeline
   - `lead_status_history` table BELUM ada — akan dibuat di Slice 1 admin migration

## Jangan

- **JANGAN** hapus branch sebelum observation period.
- **JANGAN** delay klien education — kalau klien tidak paham workflow interim, akan frustrasi.

## Verifikasi

- [ ] Branch dihapus
- [ ] Progress tracker updated
- [ ] Klien education note dikirim
- [ ] Handover note ready untuk admin Slice 1

---

# Kontingensi & Troubleshooting

## Situasi: Email tidak terkirim di production tapi works di local

**Symptom:** Submit RFQ 201 di production, tapi customer + admin tidak dapat email.

**Root cause biasa:**
- `RESEND_API_KEY` tidak set di Railway env vars
- Resend domain belum verified (sender email domain harus match verified domain)
- BackgroundTasks silently swallow exception

**Fix:**
1. Cek Railway logs: search "email" atau "resend" atau exception traces
2. Verify env var: Railway dashboard → Settings → Variables
3. Verify Resend dashboard → Domain verification status
4. Test manual: `curl -X POST https://api.resend.com/emails` dengan API key production

## Situasi: Rate limit tidak fire (submit 100x return 201)

**Symptom:** slowapi decorator tidak enforce, endpoint jadi vulnerable spam.

**Root cause biasa:**
- `app.state.limiter = ...` tidak di-set di `main.py`
- `request: Request` tidak ada di signature router
- Exception handler tidak di-register

**Fix:**
1. Cek `main.py` — verify 3 komponen slowapi (limiter attach + exception handler + include_router)
2. Cek router signature — first arg harus `request: Request`
3. Test dengan curl direct — pastikan bukan client-side caching yang bikin illusion

## Situasi: Prefill dari `?produk=X` tidak works

**Symptom:** Landing di form dengan `?produk=garam-halus-yodium`, checkbox tidak pre-selected.

**Root cause biasa:**
- `useSearchParams` di-consume di Server Component (harus di Client Component)
- Slug value tidak match `availableProducts[].slug` (typo atau slug baru yang belum di seed)
- `defaultValues` di `useForm` di-set setelah initial render → prefill di-override

**Fix:**
1. Verify `'use client'` di top file `RFQForm.tsx`
2. Console.log `prefilledSlug` dan `availableProducts.map(p => p.slug)` — compare
3. Verify `useForm({ defaultValues: {...} })` include prefilled state — bukan `useEffect` sync

## Situasi: Cross-slice regression — "Minta Sampel" break

**Symptom:** Klik "Minta Sampel" di Epic 3 detail page → error atau salah destination.

**Root cause biasa:**
- Phase 11 accidentally modify `sampleHref` juga (bukan cuma `quotationHref`)
- Contact form (Epic 3 Slice 2) tidak lagi handle `intent=sample` (Phase 10 Slice 2 Epic 3 CF simplify — kalau di-execute)

**Fix:**
1. `git diff main..HEAD -- components/product/ProductCTA.tsx` — verify cuma `quotationHref` yang berubah
2. Test contact form dengan `intent=sample` — verify handling still exists
3. Kalau perlu, revert Phase 11 dan redo dengan lebih hati-hati

## Situasi: Enum drift Zod ↔ Pydantic

**Symptom:** Frontend submit valid, backend return 422 "Invalid industry type" atau "Invalid frequency".

**Root cause biasa:**
- Value TS berbeda dengan value Pydantic (mis. underscore vs hyphen)
- Enum di Zod tidak update saat Pydantic ditambah opsi

**Fix:**
1. `grep -r "makanan" backend/schemas types/ lib/validation/` — visual inspection semua occurrences
2. Copy-paste dari source of truth (backend Pydantic)
3. Untuk future, tambah unit test di CI yang parse Pydantic Set constants dan verify match dengan TS enum

## Situasi: `/minta-penawaran` build jadi `ƒ` (Dynamic)

**Symptom:** Build output menunjukkan Dynamic rendering untuk route yang seharusnya Static.

**Root cause biasa:**
- Accidentally import `lib/supabase/server.ts` (mengandung `cookies()`)
- `useSearchParams` dipakai di Server Component

**Fix:**
1. `grep -rn "supabase/server" app/minta-penawaran/`
2. `grep -rn "cookies()" app/minta-penawaran/`
3. Verify `RFQForm.tsx` punya `'use client'` (bukan Server Component)

---

# Ringkasan File yang Dibuat/Modifikasi di Slice Ini

**Database:**
- Baru: `supabase/migrations/{ts}_create_rfq_leads_table.sql`
- Baru: `supabase/migrations/{ts+1}_rfq_leads_rls.sql`

**Backend:**
- Baru: `backend/schemas/rfq.py`
- Baru: `backend/routers/rfq.py`
- Modifikasi: `backend/services/email_service.py` (extend dengan 2 fungsi + helper)
- Modifikasi: `backend/main.py` (include rfq router + verify slowapi setup)

**Frontend Contract:**
- Modifikasi: `types/api.ts`
- Modifikasi: `lib/api.ts`
- Baru: `lib/validation/rfq-schema.ts`

**Routes:**
- Baru: `app/minta-penawaran/page.tsx`
- Baru: `app/minta-penawaran/terima-kasih/page.tsx`

**Components:**
- Baru: `components/rfq/RFQForm.tsx`
- Baru: `components/rfq/SaltTypeCheckboxGroup.tsx`
- Baru: `components/rfq/FormSection.tsx` (kalau belum ada dari Epic 2/3)
- Baru: `components/rfq/InfoBlock.tsx` (kalau belum ada)

**Cross-Slice Touch:**
- Modifikasi: `components/product/ProductCTA.tsx` (repurpose quotation CTA)

**Config:**
- Modifikasi: `app/sitemap.ts`

**Dokumentasi:**
- `docs/wireframes/Epic4_slice1_rfq-form.md`
- `docs/demos/epic4_slice_cf_demo_script.md`

---

## Catatan Penutup

Slice ini punya karakter yang berbeda dari admin-focused slice sebelumnya. **3 area risk utama:**

**1. Silent email failure via BackgroundTasks (R-20)**

Klien customer submit → 201 success → tapi kalau Resend down atau `company_settings.email` empty, admin tidak dapat notif. Klien customer thinks "sudah submit, tinggal tunggu" — no signal untuk mereka retry.

Mitigation: Sentry monitoring untuk email failures + weekly manual check di Resend dashboard untuk verify delivery rate stable.

**2. Cross-slice regression (R-19)**

Phase 11 touch file Epic 3 yang live production di 5 detail page. Regression risk sedang tapi impact tinggi kalau miss. Wajib test path lama sebelum path baru.

**3. Enum sync (R-18)**

Zod ↔ Pydantic ↔ TS type — tiga tempat harus match char-per-char. Silent bug: frontend submit "valid" tapi backend 422 dengan pesan generic.

Mitigation: copy-paste dari source of truth, jangan retype. Consider add unit test di CI untuk parse Pydantic Set + Zod enum + compare.

**Yang perlu Anda observe di production setelah launch:**

1. Email delivery rate: > 95% dalam 1 minggu pertama
2. Rate limit hit rate: < 1% (kalau > 5%, threshold 5/hour mungkin terlalu ketat)
3. Prefill usage: berapa % submission datang dengan `?produk=X` — indikator apakah CTA Epic 3 effective driver
4. Field drop-off analysis: mana field yang paling sering trigger validation error (indikator UX issue)

Data ini akan inform decision di admin panel Slice 1 dan optimization future.

**File:** `docs/execution-guides/CLAUDE_CODE_GUIDE_epic4_slice_cf_rfq-form.md`
**Version:** 1.0 — 2026-07-05
