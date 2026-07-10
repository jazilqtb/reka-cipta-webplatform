# Claude Code Execution Guide — Epic 4B Slice 1 (CRM Pipeline & Lead Management)

**Project:** reka-cipta-platform
**Slice:** Epic 4B Slice 1 — Kanban `/admin/leads` + Detail `/admin/leads/[id]` + WA Template
**Task Breakdown Reference:** `epic4B_task_breakdown_admin-panel.md` (Slice 1 section — WAJIB dibaca sebelum eksekusi)
**Prasyarat:** Epic 4 Customer-Facing sudah live production, `rfq_leads` table populated dengan real data + Epic 1/2/3/3B sudah merged ke `main`
**Version:** 1.0
**Author:** Ach. Jazilul Qutbi
**Total Phase:** 18 | **STOP Gates:** 3

---

## Cara Pakai Guide Ini

Format sama dengan guide sebelumnya. Setiap phase punya **Kerjakan** / **Jangan** / **Verifikasi**. STOP Gate berhenti sampai Jazil clear.

**Perbedaan karakter dari slice sebelumnya:**

| Aspek | Slice Ini (Epic 4B S1) | Slice Sebelumnya (Epic 4 CF) |
|---|---|---|
| Primary risk | **@dnd-kit learning curve** + **optimistic UI rollback** + **auto-save race condition** + **DB trigger correctness** | Silent email failure + cross-slice regression + Zod/Pydantic enum drift |
| Backend complexity | 4 endpoints admin dengan auth + trigger-based history logging | Public endpoint dengan rate limit + email delivery |
| Frontend complexity | **Complex client-side state** (drag-drop + optimistic update + rollback) + auto-save with debounce | Form validation + prefill |
| Cross-slice touches | **Tidak ada** — Slice ini murni add-on ke admin sub-app | Epic 3 CTA repurpose |
| New library dependency | `@dnd-kit` (drag-drop) | Tidak ada |
| STOP gates | 3 (Supabase apply + Visual QA/E2E + Client Demo) | 3 (Supabase apply + Visual QA/E2E + Client Demo) |

**Yang paling risky di slice ini:**
1. **@dnd-kit adalah library baru** untuk project ini. Pattern setup + collision detection + drop event handler subtle — mudah salah.
2. **Optimistic UI + rollback** untuk drag-drop status update. Kalau backend fail, card harus revert ke column asal — logic race condition potential.
3. **DB trigger auto-log status history**. Kalau trigger salah (mis. `OLD.status IS DISTINCT FROM NEW.status` typo), history tidak ter-log atau ter-log duplicate.
4. **Auto-save admin notes dengan debounce**. Race condition: user blur, timeout set, langsung type lagi, blur lagi — dua save call parallel.
5. **Route order**: `GET /rfq/leads` vs `GET /rfq/leads/{id}` — sama trap seperti Epic 3B (R-12). `/leads` HARUS SEBELUM `/leads/{id}`.

---

## Operating Rules — Delta dari Guide Sebelumnya

Semua Operating Rules R-01 sampai R-21 dari guide sebelumnya tetap berlaku. Rules tambahan spesifik Epic 4B Slice 1:

### R-22 — `@dnd-kit` Import Structure

`@dnd-kit` split ke 3 sub-package. Import dari yang benar:

```typescript
// Untuk basic drag-drop:
import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';

// Untuk sortable list (kalau butuh reorder dalam column):
import { SortableContext, useSortable } from '@dnd-kit/sortable';

// Untuk utility (transform CSS):
import { CSS } from '@dnd-kit/utilities';
```

- **JANGAN** import dari `@dnd-kit/react` (tidak ada) atau `dnd-kit` (typo tanpa `@`).
- **JANGAN** pakai `useDraggable` untuk item yang butuh reorder — pakai `useSortable`. Untuk Slice 1, cukup `useDraggable` + `useDroppable` (no sortable needed karena tidak reorder within column).

### R-23 — Optimistic UI Pattern untuk Drag-Drop

Pattern yang benar untuk mutation dengan rollback:

```typescript
async function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (!over) return;

  const leadId = active.id as string;
  const newStatus = over.id as LeadStatus;

  // Capture original state BEFORE optimistic update (untuk rollback)
  const originalLead = leads.find(l => l.id === leadId);
  if (!originalLead || originalLead.status === newStatus) return;

  // Optimistic update
  setLeads(prev => prev.map(l =>
    l.id === leadId ? { ...l, status: newStatus } : l
  ));

  try {
    await updateLead(leadId, { status: newStatus });
    toast.success(`Status diubah ke ${LABEL_MAP[newStatus]}`);
  } catch (err) {
    // Rollback ke original state
    setLeads(prev => prev.map(l =>
      l.id === leadId ? { ...l, status: originalLead.status } : l
    ));
    toast.error('Gagal mengubah status. Coba lagi.');
  }
}
```

- **JANGAN** panggil `router.refresh()` di awal handler — akan trigger re-fetch yang override optimistic state.
- **JANGAN** rely pada `leads` state di rollback — capture original **sebelum** setState. React state batch update bikin closure baca nilai stale.

### R-24 — Auto-Save Debounce Pattern (Race-Safe)

Pattern race-safe untuk auto-save:

```typescript
const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
const lastSavedRef = useRef(initialNotes ?? '');
const pendingValueRef = useRef(initialNotes ?? '');

function handleBlur() {
  // Cancel pending save
  if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

  // Update pending value
  pendingValueRef.current = notes;

  // Schedule save
  saveTimeoutRef.current = setTimeout(async () => {
    // Skip kalau value sama dengan last saved
    if (pendingValueRef.current === lastSavedRef.current) return;

    setSaveStatus('saving');
    try {
      await updateLead(leadId, { admin_notes: pendingValueRef.current });
      lastSavedRef.current = pendingValueRef.current;
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
      toast.error('Gagal menyimpan catatan');
    }
  }, 500);
}
```

- **JANGAN** dependency `notes` state di `useEffect` untuk save — closure stale bikin save value lama.
- **JANGAN** save saat every `onChange` — network spam. Pakai `onBlur` + debounce sebagai safety net.
- **JANGAN** async setTimeout tanpa cancel — kalau user blur cepat 3x, akan ada 3 save call parallel.

### R-25 — DB Trigger Discipline: `IS DISTINCT FROM`

Trigger auto-log status change pakai:

```sql
IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.lead_status_history (...) VALUES (...);
END IF;
```

- **JANGAN** pakai `OLD.status <> NEW.status` — `<>` tidak handle NULL correctly. `NULL <> 'new'` return NULL (not TRUE), history tidak ter-insert.
- **JANGAN** pakai `OLD.status != NEW.status` — sama masalah dengan `<>`.
- **`IS DISTINCT FROM`** adalah NULL-safe comparison, treat NULL sebagai different value.

### R-26 — Mobile Fallback untuk Drag-Drop

Detect mobile viewport dan disable drag-drop:

```typescript
'use client';
import { useEffect, useState } from 'react';

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);

  return isMobile;
}
```

Kalau `isMobile`, render `LeadKanbanCard` tanpa `useDraggable` + tambah dropdown status untuk change status.

- **JANGAN** detect mobile via `window.innerWidth` di render tanpa `useEffect` — SSR mismatch (window undefined di server).
- **JANGAN** pakai `matchMedia('(hover: none)')` sebagai proxy untuk mobile — tablet with mouse akan mis-classified.

### R-27 — Route Order Reminder (Kembali)

Sama dengan R-12 dari Epic 3B. Di router `rfq.py`:

```python
@router.get("/leads")               # 1. List admin
@router.get("/leads/{lead_id}")     # 2. Detail (setelah /leads)
@router.patch("/leads/{lead_id}")   # 3. Update (setelah /leads)
@router.post("/wa-template")        # 4. WA template (separate)
```

Kalau `/leads/{lead_id}` di-declare sebelum `/leads`, request ke `/leads` akan interpret "" sebagai lead_id → 404 atau UUID validation error.

### R-28 — PATCH `updated_at` Trigger Interaction

DB trigger `set_updated_at` (dari Epic 3) auto-set `updated_at = NOW()` saat UPDATE.

Trigger `log_lead_status_change` (baru di Slice ini) auto-insert history saat status change.

**Interaction:** PATCH `admin_notes` saja → trigger `set_updated_at` fire (updated_at berubah), tapi trigger `log_lead_status_change` tidak fire (status tidak berubah). Perfect — tidak ada spurious history row.

**Verify di Phase 3 curl test:** PATCH `admin_notes` → `updated_at` update, tidak ada history row baru.

---

# PHASE 1 — Preflight & Branch Setup

**Tujuan:** Verify prasyarat, install `@dnd-kit`, buat feature branch.

## Kerjakan

1. `git status` — bersih.
2. `git checkout main && git pull origin main`.
3. Verify Epic 4 CF artifacts:
   ```bash
   ls app/minta-penawaran/page.tsx
   ls backend/routers/rfq.py
   ls backend/schemas/rfq.py
   ```
4. Verify DB state:
   - Buka Supabase Dashboard → SQL Editor
   - `SELECT COUNT(*) FROM rfq_leads;` — verify ada real data (dari customer submit + testing)
   - Kalau `COUNT = 0`, ini tidak blocking tapi worth flag — demo Slice 1 akan lebih tricky tanpa real data. Consider seed 3-5 test rows dulu untuk demo purpose.
5. Verify Epic 3B pattern reference (admin CRUD dengan auto-save + Server Action revalidate):
   ```bash
   ls components/admin/product/ProductEditForm.tsx
   ls app/actions/products.ts
   ```
6. Verify Epic 1 middleware protect `/admin/*`:
   ```bash
   cat middleware.ts | grep -A 3 "admin"
   ```
7. Verify admin sidebar nav ada dari Epic 1 (untuk tambah link "Leads & RFQ" di Phase 14):
   ```bash
   grep -r "Sidebar\|admin.*nav" components/layout/ components/admin/
   ```
8. Buat branch: `git checkout -b feature/epic4B-slice1-crm-pipeline`

## Jangan

- Jangan proceed kalau `rfq_leads` table tidak accessible.
- Jangan skip step 4 — kalau demo butuh data, seed test rows dulu (via Supabase Dashboard INSERT statement) supaya klien bisa lihat Kanban populated.

## Verifikasi

- [ ] Branch aktif: `feature/epic4B-slice1-crm-pipeline`
- [ ] Epic 4 CF + Epic 3B pattern references exist
- [ ] `rfq_leads` table accessible dari admin
- [ ] Admin middleware active

---

# PHASE 2 — Database Migration Files (`lead_status_history` + Trigger)

**Tujuan:** Bikin migration untuk `lead_status_history` table + trigger auto-log status change.

## Kerjakan

1. Generate timestamp `YYYYMMDDHHMMSS`.
2. Buat `supabase/migrations/{ts}_create_lead_status_history.sql`:
   - CREATE TABLE `lead_status_history` dengan foreign key `lead_id REFERENCES rfq_leads(id) ON DELETE CASCADE`
   - CHECK constraint untuk `to_status`
   - 2 index (`lead_id`, `changed_at DESC`)
3. **CRITICAL — Trigger function dengan `IS DISTINCT FROM`** (R-25):
   ```sql
   CREATE OR REPLACE FUNCTION public.log_lead_status_change()
   RETURNS TRIGGER AS $$
   BEGIN
       IF TG_OP = 'INSERT' THEN
           INSERT INTO public.lead_status_history (lead_id, from_status, to_status)
           VALUES (NEW.id, NULL, NEW.status);
       ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
           INSERT INTO public.lead_status_history (lead_id, from_status, to_status)
           VALUES (NEW.id, OLD.status, NEW.status);
       END IF;
       RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

   CREATE TRIGGER trigger_lead_status_change
       AFTER INSERT OR UPDATE OF status ON public.rfq_leads
       FOR EACH ROW EXECUTE FUNCTION public.log_lead_status_change();
   ```
4. Buat `supabase/migrations/{ts+1}_lead_status_history_rls.sql`:
   ```sql
   ALTER TABLE public.lead_status_history ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Admin can read history"
       ON public.lead_status_history FOR SELECT TO authenticated USING (TRUE);
   ```
   **JANGAN** tambah INSERT policy — hanya trigger yang boleh insert.
5. Commit:
   ```bash
   git add supabase/
   git commit -m "chore(db): add lead_status_history table with trigger [Epic 4B Slice 1]"
   ```

## Jangan

- **JANGAN** eksekusi `supabase db push` (R-01 global).
- **JANGAN** pakai `<>` atau `!=` di trigger — NULL comparison bug (R-25).
- **JANGAN** tambah policy INSERT/UPDATE/DELETE di history table — history diprotect via trigger only.
- **JANGAN** trigger `AFTER INSERT OR UPDATE` tanpa `OF status` — akan fire untuk update `admin_notes` juga (walaupun IF check akan skip, tetap overhead).

## Verifikasi

- [ ] 2 file `.sql` created
- [ ] Trigger function pakai `IS DISTINCT FROM`
- [ ] RLS hanya SELECT policy
- [ ] Commit masuk

---

# 🛑 STOP GATE 1 — Manual Supabase Apply + Trigger Test

**Status:** Menunggu Jazil apply migration + verify trigger works.

## Aksi Manual yang Jazil Lakukan

1. Apply 2 migration file via Supabase Dashboard → SQL Editor
2. Verify schema:
   ```sql
   SELECT column_name, data_type FROM information_schema.columns
   WHERE table_name = 'lead_status_history' ORDER BY ordinal_position;
   -- Expected: 5 rows (id, lead_id, from_status, to_status, changed_at)

   SELECT trigger_name, event_manipulation FROM information_schema.triggers
   WHERE event_object_table = 'rfq_leads' AND trigger_name = 'trigger_lead_status_change';
   -- Expected: 2 rows (INSERT, UPDATE)
   ```
3. **Trigger correctness test:**
   ```sql
   -- 1. Insert dummy lead — history harus auto-insert dengan from_status=NULL
   INSERT INTO rfq_leads (
       full_name, company_name, industry_type, salt_types,
       volume_per_month, delivery_frequency, delivery_city,
       email, whatsapp
   ) VALUES (
       'Test History', 'Test Co', 'makanan-minuman', ARRAY['garam-halus-yodium'],
       10, 'monthly', 'Jakarta', 'test@example.com', '081234567890'
   ) RETURNING id;

   -- 2. Verify history row created (dari trigger INSERT branch)
   SELECT * FROM lead_status_history WHERE lead_id = '{returned-id}';
   -- Expected: 1 row dengan from_status=NULL, to_status='new'

   -- 3. Update status → history row baru
   UPDATE rfq_leads SET status = 'contacted' WHERE id = '{returned-id}';
   SELECT * FROM lead_status_history WHERE lead_id = '{returned-id}' ORDER BY changed_at;
   -- Expected: 2 rows

   -- 4. Update admin_notes saja → NO history row baru (test IS DISTINCT FROM logic)
   UPDATE rfq_leads SET admin_notes = 'test note' WHERE id = '{returned-id}';
   SELECT COUNT(*) FROM lead_status_history WHERE lead_id = '{returned-id}';
   -- Expected: 2 (masih 2, tidak nambah)

   -- 5. Cleanup
   DELETE FROM rfq_leads WHERE id = '{returned-id}';
   -- history rows auto-delete via ON DELETE CASCADE
   ```

## Setelah Gate Ini Clear

Jazil bilang "Gate 1 clear". Lanjut Phase 3.

## Sinyal Masalah

- **History tidak ter-insert saat INSERT rfq_leads:** trigger function ada bug, cek `TG_OP = 'INSERT'` branch
- **History ter-insert saat UPDATE admin_notes saja:** `IS DISTINCT FROM` tidak works, atau trigger tidak `OF status`
- **Cascade delete tidak jalan:** cek `ON DELETE CASCADE` di foreign key constraint

---

# PHASE 3 — Backend Pydantic Schemas

**Tujuan:** Extend `backend/schemas/rfq.py` dengan 6 schema baru untuk admin operations.

## Kerjakan

1. Buka `backend/schemas/rfq.py`.
2. Tambah schemas sesuai spec task `E4B-S1-BE-01`:
   - `LeadStatusHistory` — 5 field
   - `RFQLead` — full lead data (18 field), `model_config = ConfigDict(from_attributes=True)`
   - `RFQLeadUpdateRequest` — whitelist ketat, `model_config = ConfigDict(extra='forbid')`, hanya `status` dan `admin_notes` optional
   - `RFQLeadListResponse`, `RFQLeadDetailResponse`
   - `WATemplateRequest`, `WATemplateResponse`
3. **CRITICAL — `extra='forbid'` di `RFQLeadUpdateRequest`** (R-11 global):
   ```python
   class RFQLeadUpdateRequest(BaseModel):
       model_config = ConfigDict(extra='forbid')

       status: str | None = None
       admin_notes: str | None = None

       @field_validator('status')
       def validate_status(cls, v: str | None) -> str | None:
           if v is not None and v not in {
               'new', 'contacted', 'sample_sent',
               'negotiation', 'deal', 'lost'
           }:
               raise ValueError(f"Invalid status: {v}")
           return v
   ```
4. Test whitelist di REPL:
   ```bash
   cd backend && source .venv/bin/activate
   python -c "
   from backend.schemas.rfq import RFQLeadUpdateRequest

   # Valid: partial update
   RFQLeadUpdateRequest(status='contacted')
   RFQLeadUpdateRequest(admin_notes='test')
   RFQLeadUpdateRequest(status='deal', admin_notes='test')
   print('Partial update: PASS')

   # Extra field rejected
   try:
       RFQLeadUpdateRequest(status='new', email='hacker@example.com')
       print('FAIL: extra allowed')
   except Exception:
       print('Extra rejected: PASS')

   # Invalid status
   try:
       RFQLeadUpdateRequest(status='hacked')
       print('FAIL: invalid status allowed')
   except Exception:
       print('Invalid status rejected: PASS')
   "
   ```

## Jangan

- **JANGAN** pakai `extra='ignore'` — akan silent accept unknown fields (security hole).
- **JANGAN** hardcode allowed status values di 2 tempat — kalau nanti ubah, drift risk. Consider extract ke module constants.

## Verifikasi

- [ ] REPL test 3/3 pass
- [ ] Import all schemas dari `rfq.py` tidak error

---

# PHASE 4 — Backend Router: 3 Admin Endpoints + Route Order

**Tujuan:** Implementasi `GET /rfq/leads` (list dengan filter), `GET /rfq/leads/{id}` (detail), `PATCH /rfq/leads/{id}` (update). Route order matters (R-27).

## Kerjakan

1. Buka `backend/routers/rfq.py`.
2. Import baru:
   ```python
   from fastapi import Depends, Query
   from datetime import datetime
   from backend.dependencies.auth import get_current_user  # sesuaikan path
   from backend.schemas.rfq import (
       RFQLead, RFQLeadUpdateRequest,
       RFQLeadListResponse, RFQLeadDetailResponse,
   )
   ```
3. **PENTING — Add endpoints di urutan yang benar** (R-27):
   ```python
   # 1. GET /leads (list)  <-- HARUS sebelum /leads/{lead_id}
   @router.get("/leads", ...)
   async def list_leads(...): ...

   # 2. GET /leads/{lead_id} (detail)
   @router.get("/leads/{lead_id}", ...)
   async def get_lead_detail(lead_id: str): ...

   # 3. PATCH /leads/{lead_id} (update)
   @router.patch("/leads/{lead_id}", ...)
   async def update_lead(lead_id: str, payload: RFQLeadUpdateRequest): ...
   ```
4. Implementasi sesuai spec task `E4B-S1-BE-02`, `E4B-S1-BE-03`, `E4B-S1-BE-04`.
5. **PATCH endpoint — exclude None dari update_data:**
   ```python
   update_data = payload.model_dump(exclude_none=True)
   if not update_data:
       raise HTTPException(422, "No fields to update")

   result = supabase.table("rfq_leads").update(update_data).eq("id", lead_id).execute()
   ```
   `exclude_none=True` critical — kalau tidak, `admin_notes=None` akan **overwrite** existing notes to NULL.
6. Test local:
   ```bash
   uvicorn backend.main:app --reload

   # Get JWT dari browser DevTools setelah login /admin/login
   JWT="eyJ..."

   # 1. GET list — 200
   curl -s -H "Authorization: Bearer $JWT" http://localhost:8000/rfq/leads | jq '.total'

   # 2. GET list dengan filter status
   curl -s -H "Authorization: Bearer $JWT" "http://localhost:8000/rfq/leads?status=new" | jq '.total'

   # 3. GET detail
   LEAD_ID="{uuid dari step 1}"
   curl -s -H "Authorization: Bearer $JWT" http://localhost:8000/rfq/leads/$LEAD_ID | jq '.lead.company_name, .history'

   # 4. PATCH status only
   curl -X PATCH -H "Authorization: Bearer $JWT" \
     -H "Content-Type: application/json" \
     -d '{"status":"contacted"}' \
     http://localhost:8000/rfq/leads/$LEAD_ID | jq '.lead.status, (.history | length)'
   # Expected: "contacted", 2 (history increased)

   # 5. PATCH admin_notes only (verify tidak insert history)
   curl -X PATCH -H "Authorization: Bearer $JWT" \
     -H "Content-Type: application/json" \
     -d '{"admin_notes":"test note"}' \
     http://localhost:8000/rfq/leads/$LEAD_ID | jq '.lead.admin_notes, (.history | length)'
   # Expected: "test note", 2 (masih 2, tidak nambah)

   # 6. PATCH dengan extra field (should reject)
   curl -X PATCH -H "Authorization: Bearer $JWT" \
     -H "Content-Type: application/json" \
     -d '{"email":"hacker@example.com"}' \
     -i http://localhost:8000/rfq/leads/$LEAD_ID | head -5
   # Expected: HTTP 422

   # 7. Route order test — /leads/admin harus 404 (bukan salah interpret sebagai slug)
   # Actually, tidak ada /leads/admin di router. Test yang relevant:
   curl -s -H "Authorization: Bearer $JWT" http://localhost:8000/rfq/leads | jq '.total'
   # Should return list, not 404 "Lead not found"

   # 8. Test tanpa JWT
   curl -i http://localhost:8000/rfq/leads | head -5
   # Expected: 401
   ```

## Jangan

- **JANGAN** deklarasi `/leads/{lead_id}` sebelum `/leads` — akan bikin route order bug.
- **JANGAN** lupa `exclude_none=True` di `payload.model_dump()` — akan overwrite existing values ke NULL saat partial update.
- **JANGAN** manual insert history row di router — DB trigger handle ini (R-28).
- **JANGAN** skip auth guard `Depends(get_current_user)` di 3 endpoint (R-13 global).

## Verifikasi

- [ ] 3 endpoint accessible via `/docs`
- [ ] Curl test 8 skenario pass
- [ ] Route order verified visual di file
- [ ] Auth guard verified

---

# PHASE 5 — Backend WA Template Service + Endpoint

**Tujuan:** Bikin service dengan 5 hardcoded template + endpoint `POST /rfq/wa-template`.

## Kerjakan

1. Buat file `backend/services/wa_template_service.py` sesuai spec task `E4B-S1-BE-06`:
   - `WA_TEMPLATES: dict[str, str]` — 5 template per status
   - Function `generate_wa_template(lead: dict, status: str) -> str`
   - Fallback template kalau `status` unknown
2. **PENTING — String formatting risk:**
   Template pakai `.format(**context)`. Kalau template hardcode punya string `{}` accidentally (mis. copy-paste code), akan `KeyError`. Test dulu dengan 5 status berbeda.
3. Tambah endpoint di `backend/routers/rfq.py`:
   ```python
   from backend.services.wa_template_service import generate_wa_template
   import re

   @router.post(
       "/wa-template",
       response_model=WATemplateResponse,
       dependencies=[Depends(get_current_user)],
   )
   async def generate_wa_template_endpoint(
       payload: WATemplateRequest,
   ) -> WATemplateResponse:
       supabase = get_supabase_service()
       lead_result = supabase.table("rfq_leads").select("*").eq("id", payload.lead_id).limit(1).execute()
       if not lead_result.data:
           raise HTTPException(404, "Lead not found")

       lead = lead_result.data[0]
       template = generate_wa_template(lead=lead, status=payload.status)

       # Clean WA number untuk wa.me link
       whatsapp_clean = re.sub(r'[\s\-+()]', '', lead['whatsapp'])
       if whatsapp_clean.startswith('0'):
           whatsapp_clean = '62' + whatsapp_clean[1:]

       return WATemplateResponse(
           template=template,
           whatsapp_number=whatsapp_clean,
       )
   ```
4. Test curl:
   ```bash
   curl -X POST -H "Authorization: Bearer $JWT" \
     -H "Content-Type: application/json" \
     -d '{"lead_id":"'$LEAD_ID'","status":"contacted"}' \
     http://localhost:8000/rfq/wa-template | jq
   # Expected: template with {full_name} filled + whatsapp_number cleaned
   ```

## Jangan

- **JANGAN** pakai `.format()` tanpa test 5 status — string escape issues bikin runtime error.
- **JANGAN** hardcode `62` prefix tanpa check — kalau WA sudah pakai `+62`, akan double.
- **JANGAN** URL-encode template di backend — frontend yang encode via `encodeURIComponent`.

## Verifikasi

- [ ] `.format()` test 5 status semua sukses (no KeyError)
- [ ] WA number clean correct (081... → 6281..., +6281... → 6281...)
- [ ] Endpoint accessible di `/docs`

---

# PHASE 6 — Deploy Backend Railway + Production Test

**Tujuan:** Deploy, verify production endpoints healthy.

## Kerjakan

1. Commit:
   ```bash
   git add backend/
   git commit -m "feat(api): add admin lead endpoints and WA template service [Epic 4B Slice 1]"
   git push -u origin feature/epic4B-slice1-crm-pipeline
   ```
2. Tunggu Railway deploy.
3. Repeat curl test 8 skenario dari Phase 4 di production URL.
4. Test WA template di production.
5. Cleanup: kalau ada test lead yang di-modify status/notes untuk testing, revert ke original state.

## Jangan

- **JANGAN** submit test data destructive ke production tanpa revert.
- **JANGAN** biarkan test admin_notes yang aneh terlihat di demo klien nanti.

## Verifikasi

- [ ] Railway deploy sukses
- [ ] Production 8 curl test pass
- [ ] Production data cleaned up

---

# PHASE 7 — Contract Layer (Types + lib/api)

**Tujuan:** Sync frontend types + tambah 4 fetcher.

## Kerjakan

1. Update `types/api.ts` sesuai spec task `E4B-S1-CT-01`:
   - Type alias `LeadStatus`
   - Interface `RFQLead`, `LeadStatusHistory`, `RFQLeadUpdateRequest`
   - Interface response types
2. Update `lib/api.ts` — tambah 4 fetcher:
   - `getLeads(filters?)` dengan query string builder
   - `getLeadDetail(id)`
   - `updateLead(id, payload)`
   - `getWATemplate(leadId, status)`
3. **Semua auth: true** — endpoints protected.
4. Type check: `pnpm tsc --noEmit`. Pass.
5. Commit:
   ```bash
   git add types/ lib/
   git commit -m "feat(contract): add lead admin types and fetchers [Epic 4B Slice 1]"
   ```

## Jangan

- **JANGAN** lupa `LeadStatus` union type — sync dengan Pydantic constants.
- **JANGAN** hardcode API base URL di `getWATemplate` — pakai existing `apiFetch` pattern.

## Verifikasi

- [ ] Type check pass
- [ ] Import from `@/lib/api` tidak error

---

# PHASE 8 — Install `@dnd-kit` + Basic Kanban Structure

**Tujuan:** Install library baru + bikin route `/admin/leads` + Board component shell (no drag-drop logic yet).

## Kerjakan

1. Install:
   ```bash
   pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
   ```
   **Slice 1 hanya butuh `@dnd-kit/core` + `@dnd-kit/utilities`.** `sortable` untuk future kalau butuh reorder within column. Include semua sekarang untuk avoid future install.
2. Buat direktori `app/admin/leads/` dan `components/admin/lead/`.
3. Buat `lib/constants/lead-status.ts` sesuai spec task `E4B-S1-FE-07`:
   - `LEAD_STATUSES` array
   - `LABEL_MAP` untuk Indonesian labels
   - `COLOR_MAP` untuk accent colors
4. Buat `app/admin/leads/page.tsx` sesuai spec task `E4B-S1-FE-02`:
   - Server Component
   - `dynamic = 'force-dynamic'` (admin page, always fresh)
   - Fetch via `getLeads(params)`
   - Render `<LeadsKanbanBoard initialLeads={} initialFilters={} />`
   - Placeholder untuk Board sementara belum ada Client Component
5. Buat `components/admin/lead/LeadsKanbanBoard.tsx` shell:
   - `'use client'`
   - State `[leads, setLeads]`
   - Render 6 column skeleton dulu (belum ada drag-drop)
   - Filter panel placeholder
6. Test di dev: `/admin/leads` render dengan 6 column layout (empty).

## Jangan

- **JANGAN** implement drag-drop di phase ini — dedicated di Phase 9.
- **JANGAN** skip `dynamic = 'force-dynamic'` — admin harus fresh data.
- **JANGAN** commit dulu — akan commit bareng drag-drop di Phase 10.

## Verifikasi

- [ ] `pnpm install` sukses, 3 package added
- [ ] Route `/admin/leads` accessible (setelah admin login)
- [ ] 6 column render dengan label Indonesian
- [ ] Filter panel placeholder visible

---

# PHASE 9 — Drag-Drop Logic + Optimistic UI + Mobile Fallback

**Tujuan:** Implement drag-drop dengan optimistic update + rollback + mobile detection.

## Kerjakan

1. Buat hook `hooks/useIsMobile.ts` sesuai R-26:
   ```typescript
   'use client';
   import { useEffect, useState } from 'react';

   export function useIsMobile(breakpoint = 768) {
     const [isMobile, setIsMobile] = useState(false);

     useEffect(() => {
       const check = () => setIsMobile(window.innerWidth < breakpoint);
       check();
       window.addEventListener('resize', check);
       return () => window.removeEventListener('resize', check);
     }, [breakpoint]);

     return isMobile;
   }
   ```
2. Update `LeadsKanbanBoard.tsx` dengan `DndContext`:
   ```typescript
   'use client';
   import { DndContext, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
   import { updateLead } from '@/lib/api';
   import { toast } from 'sonner';
   import { LABEL_MAP, LEAD_STATUSES } from '@/lib/constants/lead-status';
   import { useIsMobile } from '@/hooks/useIsMobile';

   export function LeadsKanbanBoard({ initialLeads, initialFilters }) {
     const isMobile = useIsMobile();
     const [leads, setLeads] = useState(initialLeads);
     const [activeLead, setActiveLead] = useState<RFQLead | null>(null);

     function handleDragStart(event: DragStartEvent) {
       const lead = leads.find(l => l.id === event.active.id);
       if (lead) setActiveLead(lead);
     }

     async function handleDragEnd(event: DragEndEvent) {
       setActiveLead(null);
       const { active, over } = event;
       if (!over) return;

       const leadId = active.id as string;
       const newStatus = over.id as LeadStatus;

       // Capture original SEBELUM setState (R-23)
       const originalLead = leads.find(l => l.id === leadId);
       if (!originalLead || originalLead.status === newStatus) return;

       // Optimistic update
       setLeads(prev => prev.map(l =>
         l.id === leadId ? { ...l, status: newStatus } : l
       ));

       try {
         await updateLead(leadId, { status: newStatus });
         toast.success(`Status diubah ke ${LABEL_MAP[newStatus]}`);
       } catch {
         // Rollback
         setLeads(prev => prev.map(l =>
           l.id === leadId ? { ...l, status: originalLead.status } : l
         ));
         toast.error('Gagal mengubah status. Coba lagi.');
       }
     }

     // Kalau mobile, render dropdown fallback (tidak DndContext)
     if (isMobile) {
       return (
         <MobileLeadsView leads={leads} onStatusChange={handleMobileStatusChange} />
       );
     }

     return (
       <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
         <div className="flex gap-4 overflow-x-auto pb-4">
           {LEAD_STATUSES.map(status => (
             <KanbanColumn
               key={status}
               status={status}
               leads={leads.filter(l => l.status === status)}
             />
           ))}
         </div>
         <DragOverlay>
           {activeLead && <LeadKanbanCard lead={activeLead} isDragging />}
         </DragOverlay>
       </DndContext>
     );
   }
   ```
3. Handle mobile status change:
   ```typescript
   async function handleMobileStatusChange(leadId: string, newStatus: LeadStatus) {
     // Sama pattern optimistic + rollback
     const originalLead = leads.find(l => l.id === leadId);
     if (!originalLead) return;
     setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
     try {
       await updateLead(leadId, { status: newStatus });
       toast.success(`Status diubah ke ${LABEL_MAP[newStatus]}`);
     } catch {
       setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: originalLead.status } : l));
       toast.error('Gagal mengubah status');
     }
   }
   ```
4. `MobileLeadsView` component: single column list dengan dropdown status per card.

## Jangan

- **JANGAN** call `router.refresh()` setelah drag-drop — akan replace optimistic state.
- **JANGAN** dependency `leads` dalam closure rollback — capture via `originalLead` ref sebelum setState.
- **JANGAN** pakai `window.innerWidth` langsung dalam render — SSR mismatch.

## Verifikasi

- [ ] Desktop: drag-drop bekerja, status update via backend
- [ ] Backend fail simulasi (network off) → card revert + toast error
- [ ] Mobile: dropdown fallback muncul, status change tetap works
- [ ] `DragOverlay` menunjukkan card floating saat drag

---

# PHASE 10 — Component `KanbanColumn` + `LeadKanbanCard`

**Tujuan:** Bikin 2 visual component untuk column + card. Include filter integration.

## Kerjakan

1. Buat `components/admin/lead/KanbanColumn.tsx` sesuai spec `E4B-S1-FE-04`:
   - `'use client'`, use `useDroppable` dari `@dnd-kit/core`
   - Header dengan label + count badge
   - Empty state: "Belum ada lead"
   - Border highlight saat `isOver`
2. Buat `components/admin/lead/LeadKanbanCard.tsx` sesuai spec `E4B-S1-FE-05`:
   - `'use client'`, use `useDraggable`
   - Props: `lead`, `isDragging?` (untuk overlay rendering)
   - Anatomi: company_name, industry chip, volume + city, WA masked, relative time
   - Stale badge kalau `daysSince(updated_at) > 3` — orange border-left
   - Link ke `/admin/leads/{id}` wrap dengan child element yang bukan `<a>` (Next.js Link + drag interaction bisa clash)
3. **PENTING — Link vs Draggable interaction:**
   ```tsx
   <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
     <Link href={`/admin/leads/${lead.id}`}>
       {/* content */}
     </Link>
   </div>
   ```
   Click (tanpa drag) → Link navigate. Drag → dnd-kit intercept. `useDraggable` handle distinction dengan `activationConstraint` (default: 5px movement).
4. Install `date-fns` untuk relative time (kalau belum):
   ```bash
   pnpm add date-fns
   ```
5. Format relative time in Indonesian:
   ```typescript
   import { formatDistanceToNow } from 'date-fns';
   import { id as idLocale } from 'date-fns/locale';

   formatDistanceToNow(new Date(lead.created_at), {
     locale: idLocale,
     addSuffix: true,
   })
   // Result: "3 hari yang lalu"
   ```
6. Test manual di dev:
   - Card render dengan foto avatar dummy atau initial letters
   - Click card → navigate ke detail (yang belum ada — 404 OK for now)
   - Drag card → column detect

## Jangan

- **JANGAN** wrap seluruh card dengan `<Link>` di luar draggable div — Link click akan intercept mouse events sebelum dnd-kit detect.
- **JANGAN** pakai relative time format tanpa locale Indonesia — English "3 days ago" tidak konsisten dengan UI Indonesian.
- **JANGAN** skip stale badge — indikator visual untuk klien prioritize follow-up.

## Verifikasi

- [ ] Card visual sesuai wireframe
- [ ] Click card → navigate (walau detail belum ada)
- [ ] Drag card → dnd context detect
- [ ] Stale badge muncul untuk card > 3 hari

---

# PHASE 11 — Component `FilterPanel` + Search

**Tujuan:** Filter industri + date range + search real-time.

## Kerjakan

1. Buat `components/admin/lead/FilterPanel.tsx`:
   - Client Component
   - Props: `filters: initial filter state`, `onFilterChange: callback`
   - Fields: industri dropdown (7 opsi + Semua), date from/to, search input
   - Sync URL via `router.replace(url, { scroll: false })` saat filter change
2. Search filter **client-side** (dari fetched leads):
   ```typescript
   const filteredLeads = useMemo(() => {
     if (!search) return leads;
     const lower = search.toLowerCase();
     return leads.filter(l =>
       l.company_name.toLowerCase().includes(lower)
       || l.full_name.toLowerCase().includes(lower)
     );
   }, [leads, search]);
   ```
3. Industri + date filter → refetch backend via router.refresh atau navigate.

## Jangan

- **JANGAN** search backend-side — untuk MVP, client-side cukup (data set kecil, < 100 leads).
- **JANGAN** implement date picker library yang heavy — pakai native `<input type="date">`.

## Verifikasi

- [ ] Filter industri works, URL update
- [ ] Date range works
- [ ] Search real-time client-side

---

# PHASE 12 — Route `/admin/leads/[id]` + `LeadDetailView` Shell

**Tujuan:** Buat route detail dengan Server Component wrapper + LeadDetailView shell (belum ada auto-save notes).

## Kerjakan

1. Buat `app/admin/leads/[id]/page.tsx` sesuai spec task `E4B-S1-FE-08`:
   - Async params (R-05 global)
   - `dynamic = 'force-dynamic'`
   - Fetch via `getLeadDetail(id)`
   - `notFound()` kalau tidak ada
2. Buat `components/admin/lead/LeadDetailView.tsx` shell:
   - `'use client'`
   - State `[lead, setLead]` (untuk update after PATCH)
   - Layout: breadcrumb, header, 2-column info, notes editor placeholder, history table placeholder
   - Info column: nama, perusahaan, jabatan, email, WA, industri, produk (list), volume, kota, keterangan
3. Test di dev — buka `/admin/leads/{valid-id}` → render dengan lead info.

## Jangan

- **JANGAN** implement auto-save di phase ini — dedicated di Phase 13.
- **JANGAN** skip `notFound()` — invalid ID akan render error.

## Verifikasi

- [ ] Valid ID render lengkap
- [ ] Invalid ID render 404
- [ ] Header status badge visible

---

# PHASE 13 — Component `AdminNotesEditor` (Dedicated Phase)

**Tujuan:** Implement auto-save textarea dengan debounce, race-safe (R-24).

## Kerjakan

1. Baca ulang **R-24** di section Operating Rules atas guide ini.
2. Buat `components/admin/lead/AdminNotesEditor.tsx`:
   - `'use client'`
   - Props: `leadId`, `initialNotes`
   - State: `notes`, `saveStatus: 'idle' | 'saving' | 'saved' | 'error'`
   - Refs: `saveTimeoutRef`, `lastSavedRef`, `pendingValueRef`
   - Debounce 500ms on blur
   - Skip save kalau `pendingValueRef.current === lastSavedRef.current`
3. Setelah save success:
   - Update `lastSavedRef.current`
   - `setSaveStatus('saved')`
   - Auto-reset ke `'idle'` setelah 3 detik (via setTimeout):
     ```typescript
     setTimeout(() => setSaveStatus('idle'), 3000);
     ```
4. Display indicator:
   - `'saving'` → "Menyimpan..."
   - `'saved'` → "✓ Tersimpan"
   - `'error'` → "⚠ Gagal menyimpan"
5. Test race condition:
   - Type "abc", blur, cepat type "def", blur — verify final saved value = "def"
   - Type, blur, langsung network off, tunggu 500ms → toast error muncul
   - Type dengan network on → indicator "Menyimpan..." → "✓ Tersimpan"

## Jangan

- **JANGAN** pakai `useEffect([notes])` untuk trigger save — closure stale.
- **JANGAN** dependency `notes` state di setTimeout callback — pakai `pendingValueRef.current`.
- **JANGAN** setState di setTimeout tanpa cleanup di useEffect return — memory leak.

## Verifikasi

- [ ] Auto-save works on blur
- [ ] Race condition test pass (final value correct)
- [ ] Indicator states works
- [ ] Refresh page — notes persist

---

# PHASE 14 — Components `StatusPanel` + `StatusHistoryTable`

**Tujuan:** Bikin komponen status update dropdown + history table.

## Kerjakan

1. Buat `components/admin/lead/StatusPanel.tsx`:
   - Dropdown 6 status
   - Button "Buat Pesan WA" (open modal — Phase 15)
   - `onStatusChange` panggil `updateLead(id, { status })` + `router.refresh()`
2. Buat `components/admin/lead/StatusHistoryTable.tsx`:
   - Simple table dengan 3 kolom: Waktu | Dari | Ke
   - Format tanggal Indonesian
   - Empty state kalau `history.length === 0` (theoretically tidak terjadi karena trigger auto-insert saat lead create)
3. Integrate ke `LeadDetailView`.

## Jangan

- **JANGAN** manual manage history state — refetch dari backend setelah update.
- **JANGAN** skip empty state.

## Verifikasi

- [ ] Status dropdown update backend + refresh
- [ ] History table render dengan format tanggal Indonesian

---

# PHASE 15 — Component `WATemplateModal`

**Tujuan:** Modal dengan template preview + editable + open wa.me.

## Kerjakan

1. Buat `components/admin/lead/WATemplateModal.tsx` sesuai spec task `E4B-S1-FE-13`:
   - Base UI Dialog primitive
   - Fetch template dari `getWATemplate(leadId, status)` on open
   - Editable textarea
   - Button "Buka di WhatsApp"
2. **URL encoding untuk wa.me:**
   ```typescript
   function openWhatsApp() {
     const url = `https://wa.me/${whatsappClean}?text=${encodeURIComponent(template)}`;
     window.open(url, '_blank', 'noopener,noreferrer');
     onOpenChange(false);
   }
   ```
3. Integrate ke `StatusPanel` — button "Buat Pesan WA" trigger modal.

## Jangan

- **JANGAN** lupa `encodeURIComponent` — newline, special char akan break URL.
- **JANGAN** lupa `rel="noopener noreferrer"` di window.open.
- **JANGAN** modify template default via API call — client-side edit only (tidak persist).

## Verifikasi

- [ ] Modal open, template load
- [ ] Editable
- [ ] Klik "Buka di WhatsApp" → tab baru dengan URL correct + text prefilled

---

# PHASE 16 — Server Actions + Sidebar Nav Integration

**Tujuan:** Server Action `revalidateLeadRoutes` + tambah link admin sidebar.

## Kerjakan

1. Buat `app/actions/leads.ts`:
   ```typescript
   'use server';
   import { revalidatePath } from 'next/cache';

   export async function revalidateLeadRoutes(id: string) {
     revalidatePath('/admin/leads');
     revalidatePath(`/admin/leads/${id}`);
   }
   ```
2. Panggil dari StatusPanel + AdminNotesEditor setelah update sukses.
3. Update admin sidebar (Epic 1) — tambah link "Leads & RFQ" ke `/admin/leads` (kalau belum ada).
4. Commit progress:
   ```bash
   git add .
   git commit -m "feat(admin): complete CRM pipeline UI [Epic 4B Slice 1]"
   ```

## Jangan

- **JANGAN** panggil `revalidatePath('/admin/leads/[id]')` — pattern literal salah. Pakai concrete path `/admin/leads/${id}`.
- **JANGAN** skip sidebar update — klien navigate via sidebar, kalau tidak ada link akan confused.

## Verifikasi

- [ ] Server Action call setelah update
- [ ] Sidebar link visible
- [ ] Commit masuk

---

# PHASE 17 — Build Verification + Local E2E Test

**Tujuan:** Build check + E2E flow lengkap.

## Kerjakan

1. `pnpm build`:
   - `/admin/leads` sebagai `ƒ` (Dynamic — expected)
   - `/admin/leads/[id]` sebagai `ƒ`
   - Public routes tetap `○` (Static)
2. `pnpm lint` — 0 error.
3. E2E test manual:
   - Login admin
   - `/admin/leads` render Kanban
   - Drag lead PT Test dari "Baru" ke "Dihubungi" → status update + toast success
   - Refresh page → status persist
   - Klik lead → detail page
   - Edit admin_notes → blur → "✓ Tersimpan"
   - Update status via dropdown → history row muncul
   - Klik "Buat Pesan WA" → modal → edit → "Buka di WhatsApp" → tab baru dengan message
4. Regression test:
   - `/produk` masih works
   - `/minta-penawaran` submit masih works (email delivery normal)
   - `/kontak` masih works
5. Cleanup test data.

## Jangan

- **JANGAN** commit dengan test data destructive.
- **JANGAN** skip regression Epic 4 CF — walau tidak touch code Epic 4 CF, ada shared migration + shared backend router.

## Verifikasi

- [ ] Build sukses, rendering strategy preserved
- [ ] Lint pass
- [ ] E2E flow full pass
- [ ] Regression Epic 4 CF + Epic 3 pass

---

# PHASE 18 — Deploy Vercel Preview

**Tujuan:** Preview deploy + smoke test.

## Kerjakan

1. `git push`.
2. Vercel deploy.
3. Smoke test di preview URL.
4. Report ke Jazil.

## Verifikasi

- [ ] Preview deploy sukses
- [ ] Smoke test pass
- [ ] Preview URL diberitahukan

---

# 🛑 STOP GATE 2 — Visual QA + E2E + Regression

**Status:** Menunggu Jazil QA di preview.

## Aksi Manual yang Jazil Lakukan

### 1. Visual QA Kanban Desktop
- 6 column layout, horizontal scroll kalau sempit
- Card visual sesuai wireframe (company, industry, volume, city, WA, time, stale badge)
- Drag-drop smooth
- Toast success/error jelas

### 2. Visual QA Kanban Mobile (< 768px)
- Single column list view
- Dropdown status per card
- Tap target ≥ 44×44px

### 3. E2E Test Drag-Drop
- Success case: drag → toast success → refresh persist
- Fail case: disable network → drag → toast error → card revert to original column

### 4. E2E Test Detail Page
- Info render complete
- Auto-save notes: type, blur, indicator changes
- Race condition: type-blur-type-blur cepat → final value correct
- Status update via dropdown → history table update

### 5. E2E Test WA Template
- Modal open dengan template dari backend
- Edit template
- Klik "Buka WhatsApp" → tab baru dengan URL correct

### 6. Regression Test
- Epic 4 CF submit RFQ masih works
- Epic 3 filter + detail + CTA works
- Epic 2 kontak works

### 7. Security Test
- PATCH dengan extra field (via DevTools console fetch) → 422
- Access `/admin/leads` tanpa login → redirect `/admin/login`

### 8. Lighthouse
- Admin routes tidak strict SEO — cukup Accessibility ≥ 95, Performance reasonable

## Setelah Gate Ini Clear
Jazil bilang "Gate 2 clear".

## Sinyal Masalah
- **Drag-drop stuck / card duplicate:** cek `handleDragEnd`, verify original state capture correct
- **Notes disappear after save:** cek `exclude_none=True` di backend PATCH
- **History table empty:** cek DB trigger di Supabase — verify function exists

---

# PHASE 19 — Merge ke `dev` + Production Deploy

**Tujuan:** Merge PR, production release.

## Kerjakan

1. Buat/update PR ke `dev`.
2. PR description include screenshots + DoD checklist.
3. Merge ke `dev` after approval.
4. Vercel deploy staging → smoke test.
5. Jazil manual merge `dev` → `main` → production.
6. Verify production sebelum Gate 3.

## Verifikasi

- [ ] PR merged
- [ ] Production deploy sukses

---

# 🛑 STOP GATE 3 — Client Demo & Sign-Off

**Status:** Menunggu Jazil demo ke Irwan.

## Demo Script (10 menit)

Follow `docs/demos/epic4B_slice1_demo_script.md`:

1. Konteks (1 menit)
2. Login → Kanban walkthrough (2 menit)
3. Drag-drop status update (2 menit) — **klien sendiri yang drag**
4. Detail lead + notes auto-save (2 menit) — **klien sendiri yang type**
5. WA template generator + open WhatsApp Web (2 menit)
6. Roadmap Slice 2 (1 menit): "Selanjutnya, generate proposal AI dari lead ini via satu klik."

**Sign-off criteria:** Klien konfirmasi bisa manage leads mandiri.

## Sinyal Masalah
- **Klien confused drag-drop:** tambah onboarding tooltip di enhancement backlog
- **Klien komplain notes tidak save "ter-save":** klarifikasi UX indicator lebih jelas atau tambah button "Simpan" eksplisit

---

# PHASE 20 — Cleanup & Handover ke Slice 2

## Kerjakan

1. Hapus feature branch after 24-48h stable.
2. Update tracker.
3. Handover note ke Slice 2:
   - `rfq_leads` sekarang bisa di-manage klien
   - `proposal_html`, `proposal_generated`, `proposal_generated_at` masih NULL di semua row — akan populated di Slice 2
   - `LeadDetailView` akan di-touch di Slice 2 untuk integrate `ProposalGeneratorPanel`
4. **Prep untuk Slice 2:** Konfirmasi klien punya ekspektasi jelas soal cost Anthropic (~$0.02/proposal) dan wait time (10-30 detik).

## Verifikasi

- [ ] Branch cleaned
- [ ] Handover note ready

---

# Kontingensi & Troubleshooting

## Situasi: Drag-drop tidak detect drop di column

**Symptom:** Card di-drop di column, tapi tidak ada action.

**Root cause biasa:**
- `useDroppable` `id` mismatch dengan `over.id` di handler
- `DndContext` tidak wrap seluruh Board

**Fix:**
1. Console.log `event.over` di handleDragEnd — verify `over` object exists dan `over.id` sesuai
2. Verify `useDroppable({ id: status })` di KanbanColumn dengan `status` string yang match `LeadStatus` type

## Situasi: Optimistic update tidak revert saat backend fail

**Symptom:** Card stuck di column baru walau toast error muncul.

**Root cause biasa:**
- Rollback logic dependency `leads` state — closure baca stale value
- setState di rollback merge dengan setState optimistic

**Fix:**
1. Capture `originalLead` ke variable sebelum setState optimistic
2. Rollback pakai `setLeads(prev => prev.map(...))` dengan original captured, jangan `setLeads([...leads])`

## Situasi: Auto-save race condition — value hilang

**Symptom:** Type "abc" → blur → cepat type "def" → refresh → value = "abc" (bukan "def")

**Root cause biasa:**
- Debounce tidak clear timeout sebelumnya
- Save call parallel, first response override

**Fix:**
1. Verify `clearTimeout(saveTimeoutRef.current)` di handleBlur
2. Verify `pendingValueRef.current = notes` update di setiap blur
3. Save function baca `pendingValueRef.current`, bukan `notes` state closure

## Situasi: Trigger tidak insert history row

**Symptom:** UPDATE status di DB, tapi history table tetap kosong.

**Root cause biasa:**
- Trigger pakai `<>` bukan `IS DISTINCT FROM` (R-25)
- Trigger tidak `AFTER UPDATE OF status`

**Fix:**
1. Query `SELECT prosrc FROM pg_proc WHERE proname = 'log_lead_status_change';` — verify function body pakai `IS DISTINCT FROM`
2. Verify trigger dengan `SELECT event_manipulation FROM information_schema.triggers WHERE trigger_name = 'trigger_lead_status_change';`

## Situasi: Mobile detection mis-render saat SSR

**Symptom:** First render mobile shows Kanban, then flash ke mobile view.

**Root cause biasa:**
- `useIsMobile` initial state `false`, hydration mismatch

**Fix:**
1. Add loading state during hydration:
   ```typescript
   const [mounted, setMounted] = useState(false);
   useEffect(() => setMounted(true), []);
   if (!mounted) return <LoadingSkeleton />;
   ```
2. Atau accept flash sebagai trade-off — kalau UX-nya minor.

---

# Ringkasan File Slice 1

**Database:**
- Baru: `supabase/migrations/{ts}_create_lead_status_history.sql`
- Baru: `supabase/migrations/{ts+1}_lead_status_history_rls.sql`

**Backend:**
- Modifikasi: `backend/schemas/rfq.py`
- Modifikasi: `backend/routers/rfq.py`
- Baru: `backend/services/wa_template_service.py`

**Frontend Contract:**
- Modifikasi: `types/api.ts`
- Modifikasi: `lib/api.ts`

**Server Actions:**
- Baru: `app/actions/leads.ts`

**Constants & Hooks:**
- Baru: `lib/constants/lead-status.ts`
- Baru: `hooks/useIsMobile.ts`

**Routes:**
- Baru: `app/admin/leads/page.tsx`
- Baru: `app/admin/leads/[id]/page.tsx`

**Components:**
- Baru: `components/admin/lead/LeadsKanbanBoard.tsx`
- Baru: `components/admin/lead/KanbanColumn.tsx`
- Baru: `components/admin/lead/LeadKanbanCard.tsx`
- Baru: `components/admin/lead/FilterPanel.tsx`
- Baru: `components/admin/lead/MobileLeadsView.tsx`
- Baru: `components/admin/lead/LeadDetailView.tsx`
- Baru: `components/admin/lead/AdminNotesEditor.tsx`
- Baru: `components/admin/lead/StatusPanel.tsx`
- Baru: `components/admin/lead/StatusHistoryTable.tsx`
- Baru: `components/admin/lead/WATemplateModal.tsx`

**Cross-Slice Touch (minor):**
- Modifikasi: Admin sidebar navigation (Epic 1) — tambah link "Leads & RFQ"

---

## Catatan Penutup

Slice 1 ini punya **4 area risk utama** yang sengaja saya encode di R-22 sampai R-28:

**1. `@dnd-kit` library baru → learning curve real**

Dokumentasi lebih baik dari alternatives, tapi setup awal + rollback pattern masih non-trivial. Phase 8-10 dedicate untuk ini — jangan skip.

**2. Optimistic UI + rollback (R-23)**

Pattern subtle. Kalau closure baca stale state, rollback tidak works. Capture original **sebelum** setState.

**3. Auto-save debounce race condition (R-24)**

3 refs (timeout, lastSaved, pending) untuk avoid race. Ini pattern yang engineer sering salah. Phase 13 dedicated karena testing manual harus explicit.

**4. DB trigger correctness (R-25)**

`IS DISTINCT FROM` vs `<>` — subtle bug yang tidak ketahuan sampai debugging history data yang tidak terlogged. Test di Gate 1 dengan explicit scenario.

**Post-Slice consideration:**

Setelah Slice 1 live 1-2 minggu, monitor:
- Rate klien pakai Kanban vs manual query DB (adoption metric)
- Auto-save error rate (network issues surface)
- Drag-drop failure rate (backend timeout indicators)

Data ini akan inform prompt engineering di Slice 2 (Anthropic proposal generation) — kalau klien punya kebiasaan tertentu dalam managing leads, prompt bisa reflect itu.

**File:** `docs/execution-guides/CLAUDE_CODE_GUIDE_epic4B_slice1_crm-pipeline.md`
**Version:** 1.0 — 2026-07-05
