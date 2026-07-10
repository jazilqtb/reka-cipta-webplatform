# Claude Code Execution Guide — Epic 4B Slice 3 (Advanced Customization) — Master Guide

**Project:** reka-cipta-platform
**Slice:** Epic 4B Slice 3 — Advanced Customization (SPLIT into Sub-Slice 3A / 3B / 3C)
**Task Breakdown Reference:** `epic4B_task_breakdown_admin-panel.md` (Slice 3 section — WAJIB dibaca sebelum eksekusi)
**Status:** ⚠️ **POST-MVP — DO NOT EXECUTE UPFRONT** (lihat "Trigger Criteria" bawah)
**Prasyarat:** Epic 4B Slice 1 + Slice 2 sudah merged ke `main`, live production **minimal 2 minggu**, sign-off klien, ada usage data konkret
**Version:** 1.0
**Author:** Ach. Jazilul Qutbi
**Total Phase:** 27 (9 di 3A + 8 di 3B + 9 di 3C + 1 shared preflight) | **STOP Gates:** 12 (4 per sub-slice)

---

## Cara Pakai Guide Ini

Guide ini **berbeda struktural** dari Slice 1 & Slice 2:

- **Bukan single execution unit.** Dibagi jadi 3 sub-slice (3A, 3B, 3C) yang **execute independen** — masing-masing punya branch, merge cycle, dan client demo sendiri.
- **Post-MVP.** Jangan buka guide ini sampai trigger criteria terpenuhi (lihat section berikutnya). Kalau Anda buka lebih cepat karena "supaya lengkap", Anda melanggar pushback di catatan penutup task breakdown Anda sendiri.
- **Roadmap doc, bukan sprint plan.** Guide ini di-lock sekarang saat context masih fresh, tapi eksekusi triggered oleh **klien feedback + usage data**, bukan calendar.

**Kenapa split jadi 3 sub-slice?**

Slice 3 aslinya 31 tasks / 6 sub-features. Kalau execute sekaligus = 8-12 hari monolithic risk. Split by **klien value delivery order**:

| Sub-Slice | Scope | Estimated Effort | Client Value |
|---|---|---|---|
| **3A** | Editable System Prompt + Advanced Mode | 5-7 hari | **Highest** — langsung impact quality proposal |
| **3B** | Email + WA Template Management | 3-4 hari | Medium — improve consistency messaging |
| **3C** | Layout Customizer + Optional DOCX | 3-5 hari | Low-Medium — branding & format flexibility |

**Execute berurutan.** Setelah 3A live 2 minggu, evaluate — kalau adoption rendah / feedback negatif, **jangan lanjut 3B**. Sub-slice independence adalah fitur, bukan bug.

---

## ⚠️ Trigger Criteria — WAJIB Dipenuhi Sebelum Buka Sub-Slice 3A

Jangan mulai Phase apa pun kalau **salah satu** dari kriteria ini belum terpenuhi:

### 1. Slice 1 + Slice 2 sudah live minimal 2 minggu

Bukan 3 hari, bukan 1 minggu. **2 minggu minimum** karena butuh cukup usage untuk klien punya opini konkret tentang customization needs.

### 2. Ada minimal 5 real proposal yang di-generate dan dikirim ke customer

Kalau klien belum kirim 5 proposal, mereka **tidak punya basis empiris** untuk request customization. Editable prompt tanpa usage context = klien akan edit random, quality drop, dan blame produk Anda.

### 3. Klien secara eksplisit request feature yang ada di Slice 3

Bukan Anda yang asumsi. Klien harus bilang salah satu:
- "Saya mau ubah gaya bahasa proposal" → 3A candidate
- "Email confirmation-nya perlu saya edit" → 3B candidate
- "PDF proposal butuh logo saya di header" → 3C candidate

Kalau klien belum request explicit, **feature ini speculative** — high risk build sesuatu yang tidak dipakai.

### 4. Untuk 3A specifically — klien punya technical literacy minimum

Klien harus paham konsep basic:
- Apa itu "system prompt" / "instruksi AI"
- Kenapa prompt yang buruk = output yang buruk
- Iterative refinement (bukan one-shot edit)

Kalau klien treat prompt editor sebagai "textbox biasa" tanpa understanding, **jangan aktifkan 3A** — Anda akan bertanggung jawab untuk output quality yang klien rusak sendiri (R-41 di bawah).

### 5. Financial buffer klien secure

Advanced Mode dengan `temperature` tinggi dan `max_tokens` besar bisa cost 2-3x normal. Kalau klien punya budget concern, don't enable Advanced Mode di UI.

**Kalau salah satu tidak terpenuhi, tutup guide ini dan tunggu.** Bukan procrastination — ini disiplin scope.

---

## Operating Rules — Delta dari Guide Sebelumnya

R-01 sampai R-36 dari guide sebelumnya tetap berlaku. Rules tambahan spesifik Slice 3:

### R-37 — Settings DB Fallback Pattern

Setiap settings loader HARUS punya fallback ke hardcoded default kalau row DB tidak ada / corrupt:

```python
def load_proposal_settings() -> ProposalSettings:
    try:
        row = supabase.table("proposal_settings").select("*").eq("id", 1).single().execute()
        if row.data:
            return ProposalSettings(**row.data)
    except Exception as e:
        logger.warning(f"Failed load settings, using default: {e}")
    return ProposalSettings.default()  # Hardcoded default = Slice 2 prompt
```

**Kenapa:** Kalau klien edit prompt sampai broken (e.g., kosong, syntax error di template placeholder), sistem tidak boleh crash — fall back ke default supaya proposal tetap bisa di-generate.

- **JANGAN** raise exception kalau settings row tidak ada — degrade gracefully.
- **JANGAN** cache settings di memory tanpa TTL — kalau klien edit, next generate harus pakai versi baru dalam < 60 detik.

### R-38 — Advanced Mode Optional Params

Advanced params (`temperature`, `max_tokens`, `custom_instructions`) HARUS optional. Quick Mode (existing Slice 2) tetap works tanpa perubahan behavior.

Backend endpoint signature:

```python
class GenerateProposalRequest(BaseModel):
    # Advanced params — all optional, semua default None
    temperature: float | None = None  # None → pakai default 0.7
    max_tokens: int | None = None      # None → pakai default 2000
    custom_instructions: str | None = None  # None → tidak append apa-apa
```

- **JANGAN** ubah default behavior. Existing frontend Slice 2 yang belum update tetap harus works.
- **JANGAN** validate `temperature > 1.0` reject — allow up to 1.5 dengan warning UI (Anthropic supports up to 1.0 for `claude-*` models secara umum, tapi ini bisa berubah — cek docs saat eksekusi).
- **JANGAN** hardcode advanced params limit di frontend — read dari backend response supaya sync.

### R-39 — Cross-Slice Touch Discipline Slice 2

Sub-Slice 3A HEAVILY touches Slice 2 code:
- `backend/services/proposal_generator.py` — load prompt dari DB (bukan hardcoded)
- `components/admin/lead/ProposalGeneratorPanel.tsx` — Advanced Mode toggle

**Regression risk: HIGH.** Slice 2 sudah live dan klien pakai. Kalau Advanced Mode integration break Quick Mode, semua proposal generation gagal.

Pattern wajib:
1. **Baca file Slice 2 dulu**, jangan asumsi struktur.
2. **Refactor incremental** — 1 file per commit, testable.
3. **Feature flag optional** — kalau ragu, add `ENABLE_ADVANCED_MODE=false` env var, deploy dengan false dulu, verify Quick Mode intact, baru flip.
4. **E2E test Quick Mode DULU** setelah refactor sebelum lanjut Advanced Mode UI.

Test regression setelah setiap perubahan Slice 2:
- Quick Mode generate proposal (tanpa Advanced params) → works
- Preview iframe → works
- Download PDF → works
- Send email → works
- LeadDetailView Slice 1 flow (notes, status, WA) → works

Kalau salah satu break, **revert commit** dan redesign.

### R-40 — Structured Prompt Editor (Bukan Free-Form Textarea)

Prompt editor HARUS structured 4-field, bukan 1 textarea besar:

```typescript
interface PromptStructure {
  role: string;          // "Kamu adalah AI proposal writer untuk industri X..."
  task: string;          // "Tugasmu adalah membuat proposal berdasarkan data lead..."
  constraints: string;   // "- Gunakan Bahasa Indonesia formal\n- Panjang 300-500 kata..."
  output_format: string; // "Format HTML dengan struktur: <div class='proposal'>..."
}
```

Backend join keempat section dengan separator konsisten saat build final prompt.

**Kenapa:**
- Free-form textarea = klien mudah rusak struktur, delete section penting tanpa sadar.
- Structured = klien edit per section, section lain tetap intact.
- Klien belajar prompt engineering basic tanpa harus paham full structure.

**JANGAN** kasih klien akses raw prompt string. **JANGAN** allow klien tambah section baru — 4 section fixed.

### R-41 — Client Prompt Literacy Guardrail

Sebelum handover 3A ke klien, Anda WAJIB briefing 30-60 menit:

1. **Konsep dasar prompt engineering** — Anda sebagai "boss" AI, prompt sebagai "instruksi kerja"
2. **Iterative testing** — edit prompt → generate 3 proposal → evaluate → refine, bukan one-shot
3. **Rollback mechanism** — tombol "Reset ke Default" WAJIB ada di UI
4. **Versioning basic** — save history 5 versi terakhir, klien bisa revert
5. **Kapan panggil Anda** — kalau output quality drop drastis, jangan otak-atik lagi, contact Anda

Dokumentasikan briefing ini di `docs/client-briefings/3A_prompt_engineering_briefing.md` — proof kalau kalau nanti klien komplain quality turun.

**JANGAN** launch 3A tanpa briefing done. Kalau klien tidak available untuk briefing dalam 1 minggu, tunda handover.

### R-42 — DOCX Skip Decision Point (Explicit)

Di Sub-Slice 3C Phase 2, ada **explicit decision gate** untuk DOCX export: execute atau skip.

Default: **SKIP**. Justifikasi execute HARUS:
- Klien explicit minta DOCX (bukan "kalau bisa, tolong")
- Klien punya use case konkret (e.g., "customer minta editable file untuk revisi")
- Effort budget tersedia (+2-3 hari)

Kalau ragu, **SKIP**. PDF-only sudah sufficient untuk 95% use case B2B proposal.

DOCX rendering fidelity ≠ PDF. Klien akan komplain "kok formatnya beda?" — Anda spend 1-2 hari fix layout DOCX yang tidak akan pernah match PDF perfectly.

### R-43 — Layout Preview Before Save

Layout customizer (header text, footer text, logo URL) HARUS ada preview real-time sebelum save:

```
[Header Input] → live update →  [Preview Panel: render sample PDF thumbnail]
[Footer Input] → live update →  [Preview Panel: ...]
[Logo URL]     → live update →  [Preview Panel: ...]
```

Preview pakai sample lead data (hardcoded fixture), bukan real DB call — bukan cost, bukan latency issue.

**JANGAN** biarkan klien save tanpa preview — mereka akan save layout broken, generate proposal, kirim ke customer, baru sadar broken.

### R-44 — Sub-Slice Execution Independence

Setiap sub-slice (3A / 3B / 3C) HARUS:
- Punya branch sendiri: `feature/epic4B-slice3a-prompt-editor`, `feature/epic4B-slice3b-templates`, `feature/epic4B-slice3c-layout`
- Merged ke `dev` → prod deploy → client demo → live minimal 2 minggu sebelum sub-slice berikutnya start
- Bisa di-skip permanent kalau evaluation setelah sub-slice sebelumnya show low adoption

**JANGAN** merge 3A + 3B sekaligus untuk "efficiency". Independence adalah risk mitigation.

### R-45 — Post-MVP Trigger Criteria Documentation

Setiap kali Anda buka sub-slice, dokumentasikan di commit message atau `docs/epic-breakdown/slice3_execution_log.md`:

- Tanggal trigger
- Trigger criteria mana yang terpenuhi (referensi ke section "Trigger Criteria" di atas)
- Klien quote / feedback yang justify execution
- Usage data snapshot (e.g., "Klien sudah generate 12 proposal dalam 3 minggu")

Ini bukan bureaucratic — ini defensive record kalau nanti Anda review "kenapa gue execute Slice 3?" dan lupa reasoning-nya.

---

# 🔷 SHARED PREFLIGHT — Wajib Dijalankan Sebelum Sub-Slice Apa Pun

**Tujuan:** Verify prasyarat post-MVP terpenuhi, verify Slice 1+2 stable, setup logging execution decision.

## Kerjakan

1. **Trigger Criteria Check** — Buka section "Trigger Criteria" di atas. Untuk setiap criterion, tulis status di file baru `docs/epic-breakdown/slice3_execution_log.md`:
   ```markdown
   # Slice 3 Execution Log
   
   ## Trigger Check — {tanggal hari ini}
   
   - [ ] Slice 1+2 live minimal 2 minggu (live sejak: ...)
   - [ ] Minimum 5 real proposal generated (actual: ...)
   - [ ] Klien explicit request feature: (quote klien: "...")
   - [ ] Klien technical literacy adequate (basis penilaian: ...)
   - [ ] Financial buffer klien secure (justifikasi: ...)
   
   ## Decision
   - Sub-slice yang di-trigger: {3A / 3B / 3C}
   - Justifikasi: ...
   ```
2. **Kalau salah satu criterion tidak terpenuhi**, STOP. Jangan lanjut Phase apa pun. Update log dengan alasan defer.
3. **Baseline health check Slice 1+2 production:**
   - Login admin production
   - Buka `/admin/leads/{some-id}`
   - Test flow lengkap: buka lead → auto-save notes → status update → WA modal → generate proposal → preview → download → send email
   - Screenshot setiap step untuk regression baseline
4. **Verify existing artifacts Slice 2:**
   ```bash
   ls backend/services/proposal_generator.py
   ls backend/prompts/proposal_prompt.py
   ls backend/services/pdf_service.py
   ls components/admin/lead/ProposalGeneratorPanel.tsx
   ```
5. **Verify Anthropic Console status:**
   - Current usage bulan ini (cek /Settings/Usage)
   - Spending limit masih configured ($50/bulan dari R-35)
   - Rate limit tier — kalau Advanced Mode dengan `max_tokens` besar, mungkin butuh upgrade tier
6. **Verify database current state:**
   ```sql
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'rfq_leads';
   -- Confirm: id, company_name, ..., proposal_html, proposal_generated_at, proposal_sent_at
   ```
7. **Commit execution log:**
   ```bash
   git checkout main
   git pull
   git add docs/epic-breakdown/slice3_execution_log.md
   git commit -m "docs(slice3): trigger criteria check for sub-slice 3{A/B/C} [Epic 4B Slice 3]"
   git push
   ```

## Jangan

- **JANGAN** skip trigger criteria check. Ini bukan formality — ini disiplin scope.
- **JANGAN** proceed kalau baseline Slice 1+2 sudah broken. Fix baseline dulu.
- **JANGAN** buka multiple sub-slice branches sekaligus. Fokus 1 sub-slice.

## Verifikasi

- [ ] `slice3_execution_log.md` committed
- [ ] Semua trigger criteria checked & documented
- [ ] Baseline Slice 1+2 flow verified live
- [ ] Anthropic Console status healthy
- [ ] Klien briefing scheduled (untuk 3A) — R-41

---

---

# 🔷 SUB-SLICE 3A — Editable System Prompt + Advanced Mode

**Estimated Effort:** 5-7 hari
**Klien Value:** HIGHEST — langsung impact quality proposal output
**Regression Risk:** HIGH — heavy touch Slice 2 code
**Cost Implication:** Advanced Mode dengan temperature/max_tokens tinggi bisa 2-3x normal cost

## Prasyarat Sub-Slice 3A

- Shared Preflight done
- Klien scheduled untuk briefing prompt engineering (R-41) — WAJIB done sebelum Phase 9
- Slice 2 production live, semua flow verified working

## Ringkasan Sub-Slice 3A

Menambahkan kemampuan admin edit system prompt (structured 4-field) via `/admin/proposal-settings` + toggle Advanced Mode di ProposalGeneratorPanel dengan optional params (`temperature`, `max_tokens`, `custom_instructions`).

---

## PHASE 3A-1 — Preflight Sub-Slice 3A + Branch Setup

**Tujuan:** Confirm 3A specific prasyarat, buat branch.

### Kerjakan

1. Verify shared preflight done (`slice3_execution_log.md` exists).
2. Verify klien briefing scheduled — masukkan tanggal ke log.
3. `git checkout main && git pull`
4. `git checkout -b feature/epic4B-slice3a-prompt-editor`
5. Verify Slice 2 hardcoded prompt file exists dan bisa dibaca:
   ```bash
   cat backend/prompts/proposal_prompt.py
   ```
   Ini akan jadi **default fallback** di R-37 pattern.

### Jangan

- Jangan proceed kalau klien belum konfirmasi briefing slot.

### Verifikasi

- [ ] Branch `feature/epic4B-slice3a-prompt-editor` aktif
- [ ] Slice 2 prompt file confirmed exists
- [ ] Klien briefing schedule confirmed

---

## PHASE 3A-2 — Backend: Migration `proposal_settings` Table

**Tujuan:** Tambah single-row settings table.

### Kerjakan

1. Generate timestamp: `TS=$(date -u +%Y%m%d%H%M%S)`
2. Buat `supabase/migrations/{ts}_add_proposal_settings.sql`:
   ```sql
   CREATE TABLE IF NOT EXISTS public.proposal_settings (
     id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- Single row enforcement
     
     -- Prompt sections (R-40)
     prompt_role TEXT NOT NULL,
     prompt_task TEXT NOT NULL,
     prompt_constraints TEXT NOT NULL,
     prompt_output_format TEXT NOT NULL,
     
     -- Advanced Mode defaults
     default_temperature NUMERIC(3,2) NOT NULL DEFAULT 0.7 CHECK (default_temperature BETWEEN 0 AND 1.5),
     default_max_tokens INT NOT NULL DEFAULT 2000 CHECK (default_max_tokens BETWEEN 500 AND 8000),
     
     -- Model config
     model_id TEXT NOT NULL DEFAULT 'claude-haiku-4-5-20251001',
     
     -- Metadata
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     updated_by UUID REFERENCES auth.users(id)
   );
   
   -- RLS: admin only
   ALTER TABLE public.proposal_settings ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Admin can read proposal_settings"
     ON public.proposal_settings FOR SELECT
     USING (auth.jwt() ->> 'role' IN ('admin', 'service_role'));
   
   CREATE POLICY "Admin can update proposal_settings"
     ON public.proposal_settings FOR UPDATE
     USING (auth.jwt() ->> 'role' IN ('admin', 'service_role'));
   
   -- Updated_at trigger
   CREATE TRIGGER set_proposal_settings_updated_at
     BEFORE UPDATE ON public.proposal_settings
     FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
   ```
3. Buat companion migration untuk versioning (R-41 rollback support):
   ```sql
   CREATE TABLE IF NOT EXISTS public.proposal_settings_history (
     id BIGSERIAL PRIMARY KEY,
     snapshot JSONB NOT NULL,
     created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
     created_by UUID REFERENCES auth.users(id)
   );
   
   CREATE INDEX idx_proposal_settings_history_created_at
     ON public.proposal_settings_history(created_at DESC);
   
   -- RLS: admin read only
   ALTER TABLE public.proposal_settings_history ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Admin can read history"
     ON public.proposal_settings_history FOR SELECT
     USING (auth.jwt() ->> 'role' IN ('admin', 'service_role'));
   
   -- Trigger to snapshot before update
   CREATE OR REPLACE FUNCTION snapshot_proposal_settings()
   RETURNS TRIGGER AS $$
   BEGIN
     INSERT INTO public.proposal_settings_history (snapshot, created_by)
     VALUES (row_to_json(OLD)::JSONB, OLD.updated_by);
     
     -- Keep only last 10 snapshots
     DELETE FROM public.proposal_settings_history
     WHERE id NOT IN (
       SELECT id FROM public.proposal_settings_history
       ORDER BY created_at DESC LIMIT 10
     );
     
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;
   
   CREATE TRIGGER snapshot_before_update
     BEFORE UPDATE ON public.proposal_settings
     FOR EACH ROW EXECUTE FUNCTION snapshot_proposal_settings();
   ```
4. Commit progress (jangan push yet):
   ```bash
   git add supabase/migrations/
   git commit -m "feat(db): add proposal_settings + history tables [Epic 4B Slice 3A]"
   ```

### Jangan

- **JANGAN** allow multiple rows di `proposal_settings` — single-row enforcement via `CHECK (id = 1)`.
- **JANGAN** skip history table — ini rollback mechanism critical untuk R-41.
- **JANGAN** lupa RLS policy — admin-only access.

### Verifikasi

- [ ] Migration file `_add_proposal_settings.sql` created
- [ ] Migration file untuk history table created
- [ ] Commit done, belum push

---

## 🛑 STOP GATE 3A-1 — Migration Apply + Seed Default Row

**Status:** Menunggu Jazil apply migration + seed default row dengan Slice 2 hardcoded prompt.

### Aksi Manual yang Jazil Lakukan

**1. Apply migrations via Supabase Dashboard SQL Editor.**

Verify:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('proposal_settings', 'proposal_settings_history');
-- Expected: 2 rows
```

**2. Extract Slice 2 hardcoded prompt** dari `backend/prompts/proposal_prompt.py`:
- Identify 4 section: role, task, constraints, output_format
- Kalau prompt Slice 2 belum structured, refactor dulu ke 4 section — ini adalah baseline yang klien akan edit

**3. Seed default row:**
```sql
INSERT INTO public.proposal_settings (
  id, prompt_role, prompt_task, prompt_constraints, prompt_output_format,
  default_temperature, default_max_tokens, model_id
) VALUES (
  1,
  '{paste role section}',
  '{paste task section}',
  '{paste constraints section}',
  '{paste output_format section}',
  0.7,
  2000,
  'claude-haiku-4-5-20251001'
);
```

**4. Verify seed:**
```sql
SELECT id, LENGTH(prompt_role), LENGTH(prompt_task), 
       LENGTH(prompt_constraints), LENGTH(prompt_output_format),
       default_temperature, default_max_tokens, model_id
FROM public.proposal_settings;
-- Expected: 1 row, all lengths > 0
```

**5. Test RLS** — coba query pakai anon key (harus deny):
```bash
curl -X GET "${SUPABASE_URL}/rest/v1/proposal_settings" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
# Expected: empty array (RLS block)
```

### Setelah Gate Ini Clear

- Update `slice3_execution_log.md` dengan tanggal migration applied
- Backend siap refactor ProposalGeneratorService untuk load dari DB

### Sinyal Masalah

- Kalau seed gagal karena constraint violation — cek `default_temperature` value (0-1.5 range)
- Kalau RLS test return data — policy salah, fix sebelum lanjut

---

## PHASE 3A-3 — Backend: ProposalSettingsService + Endpoints

**Tujuan:** Service layer + REST endpoint untuk GET/PUT settings + rollback endpoint.

### Kerjakan

1. Buat `backend/services/proposal_settings_service.py`:
   ```python
   from typing import Optional
   from pydantic import BaseModel, Field
   from supabase import Client
   import logging
   
   logger = logging.getLogger(__name__)
   
   class ProposalSettings(BaseModel):
       prompt_role: str
       prompt_task: str
       prompt_constraints: str
       prompt_output_format: str
       default_temperature: float = Field(ge=0, le=1.5)
       default_max_tokens: int = Field(ge=500, le=8000)
       model_id: str
       
       @classmethod
       def hardcoded_default(cls) -> "ProposalSettings":
           """Fallback jika DB row tidak ada / corrupt (R-37)."""
           from backend.prompts.proposal_prompt import (
               DEFAULT_ROLE, DEFAULT_TASK, 
               DEFAULT_CONSTRAINTS, DEFAULT_OUTPUT_FORMAT
           )
           return cls(
               prompt_role=DEFAULT_ROLE,
               prompt_task=DEFAULT_TASK,
               prompt_constraints=DEFAULT_CONSTRAINTS,
               prompt_output_format=DEFAULT_OUTPUT_FORMAT,
               default_temperature=0.7,
               default_max_tokens=2000,
               model_id='claude-haiku-4-5-20251001',
           )
       
       def build_full_prompt(self) -> str:
           """Join 4 section jadi 1 prompt string."""
           return f"""# ROLE
   {self.prompt_role}
   
   # TASK
   {self.prompt_task}
   
   # CONSTRAINTS
   {self.prompt_constraints}
   
   # OUTPUT FORMAT
   {self.prompt_output_format}
   """
   
   class ProposalSettingsHistoryEntry(BaseModel):
       id: int
       snapshot: dict
       created_at: str
       created_by: Optional[str]
   
   class ProposalSettingsService:
       def __init__(self, supabase: Client):
           self.supabase = supabase
       
       def get(self) -> ProposalSettings:
           """Load settings dari DB. Fallback ke default kalau error (R-37)."""
           try:
               result = self.supabase.table("proposal_settings") \
                   .select("*") \
                   .eq("id", 1) \
                   .single() \
                   .execute()
               if result.data:
                   return ProposalSettings(**result.data)
           except Exception as e:
               logger.warning(f"Failed load proposal_settings, using default: {e}")
           return ProposalSettings.hardcoded_default()
       
       def update(self, settings: ProposalSettings, updated_by: str) -> ProposalSettings:
           """Update settings. Trigger DB auto-snapshot ke history."""
           result = self.supabase.table("proposal_settings") \
               .update({
                   **settings.model_dump(),
                   "updated_by": updated_by,
               }) \
               .eq("id", 1) \
               .execute()
           
           if not result.data:
               raise ValueError("Failed update proposal_settings")
           
           return ProposalSettings(**result.data[0])
       
       def get_history(self, limit: int = 10) -> list[ProposalSettingsHistoryEntry]:
           result = self.supabase.table("proposal_settings_history") \
               .select("*") \
               .order("created_at", desc=True) \
               .limit(limit) \
               .execute()
           return [ProposalSettingsHistoryEntry(**row) for row in result.data]
       
       def rollback(self, history_id: int, updated_by: str) -> ProposalSettings:
           """Rollback ke snapshot tertentu."""
           history_result = self.supabase.table("proposal_settings_history") \
               .select("snapshot") \
               .eq("id", history_id) \
               .single() \
               .execute()
           
           if not history_result.data:
               raise ValueError(f"History {history_id} not found")
           
           snapshot = history_result.data["snapshot"]
           # Extract only settings fields (exclude id, timestamps)
           settings = ProposalSettings(**{
               k: v for k, v in snapshot.items()
               if k in ProposalSettings.model_fields
           })
           return self.update(settings, updated_by)
       
       def reset_to_default(self, updated_by: str) -> ProposalSettings:
           """Reset ke hardcoded default (R-41 rollback mechanism)."""
           return self.update(ProposalSettings.hardcoded_default(), updated_by)
   ```
2. Refactor `backend/prompts/proposal_prompt.py` untuk export 4 constants:
   ```python
   DEFAULT_ROLE = """..."""
   DEFAULT_TASK = """..."""
   DEFAULT_CONSTRAINTS = """..."""
   DEFAULT_OUTPUT_FORMAT = """..."""
   ```
3. Tambah endpoint di `backend/routers/proposal_settings.py`:
   ```python
   from fastapi import APIRouter, Depends, HTTPException
   from ..dependencies import get_current_admin_user, get_supabase
   from ..services.proposal_settings_service import (
       ProposalSettings, ProposalSettingsService, ProposalSettingsHistoryEntry
   )
   
   router = APIRouter(prefix="/proposal-settings", tags=["proposal-settings"])
   
   @router.get("", response_model=ProposalSettings)
   def get_settings(
       user = Depends(get_current_admin_user),
       supabase = Depends(get_supabase),
   ):
       return ProposalSettingsService(supabase).get()
   
   @router.put("", response_model=ProposalSettings)
   def update_settings(
       settings: ProposalSettings,
       user = Depends(get_current_admin_user),
       supabase = Depends(get_supabase),
   ):
       return ProposalSettingsService(supabase).update(settings, user.id)
   
   @router.get("/history", response_model=list[ProposalSettingsHistoryEntry])
   def get_history(
       user = Depends(get_current_admin_user),
       supabase = Depends(get_supabase),
   ):
       return ProposalSettingsService(supabase).get_history()
   
   @router.post("/rollback/{history_id}", response_model=ProposalSettings)
   def rollback(
       history_id: int,
       user = Depends(get_current_admin_user),
       supabase = Depends(get_supabase),
   ):
       return ProposalSettingsService(supabase).rollback(history_id, user.id)
   
   @router.post("/reset-to-default", response_model=ProposalSettings)
   def reset_to_default(
       user = Depends(get_current_admin_user),
       supabase = Depends(get_supabase),
   ):
       return ProposalSettingsService(supabase).reset_to_default(user.id)
   ```
4. Register router di `backend/main.py`.
5. Commit:
   ```bash
   git add backend/
   git commit -m "feat(backend): add ProposalSettingsService + endpoints [Epic 4B Slice 3A]"
   ```

### Jangan

- **JANGAN** cache settings di module-level global — akan stale kalau ada instance backend multiple.
- **JANGAN** return raw exception ke frontend — sanitize error messages.
- **JANGAN** skip `reset_to_default` endpoint — ini emergency rollback yang klien butuh saat prompt broken.

### Verifikasi

- [ ] Service file created
- [ ] Router registered di main
- [ ] Hardcoded fallback tested (delete row di local DB, verify fallback works)

---

## PHASE 3A-4 — Backend: Refactor ProposalGeneratorService (CROSS-SLICE, HIGH RISK)

**Tujuan:** Refactor Slice 2 `ProposalGeneratorService` untuk load prompt dari DB via `ProposalSettingsService`.

### Kerjakan

1. **BACA DULU** `backend/services/proposal_generator.py` yang existing dari Slice 2. Jangan asumsi struktur.
2. **BUAT BACKUP branch reference** sebelum edit:
   ```bash
   git tag pre-3a4-refactor
   ```
3. Refactor `ProposalGeneratorService`:
   ```python
   # BEFORE (Slice 2):
   class ProposalGeneratorService:
       PROMPT = load_hardcoded_prompt()  # dari backend/prompts/
       
       def generate(self, lead):
           message = self.client.messages.create(
               model='claude-haiku-4-5-20251001',
               max_tokens=2000,
               messages=[{"role": "user", "content": self.build_user_message(lead)}],
               system=self.PROMPT,
           )
           ...
   
   # AFTER (Slice 3A):
   class ProposalGeneratorService:
       def __init__(self, client: Anthropic, settings_service: ProposalSettingsService):
           self.client = client
           self.settings_service = settings_service
       
       def generate(
           self,
           lead,
           temperature: float | None = None,
           max_tokens: int | None = None,
           custom_instructions: str | None = None,
       ):
           settings = self.settings_service.get()  # Load fresh setiap call (R-37, no cache)
           
           system_prompt = settings.build_full_prompt()
           if custom_instructions:
               system_prompt += f"\n\n# ADDITIONAL INSTRUCTIONS\n{custom_instructions}"
           
           message = self.client.messages.create(
               model=settings.model_id,
               max_tokens=max_tokens or settings.default_max_tokens,
               temperature=temperature or settings.default_temperature,
               messages=[{"role": "user", "content": self.build_user_message(lead)}],
               system=system_prompt,
           )
           ...
   ```
4. Update dependency injection di `backend/dependencies.py`.
5. **Test Quick Mode dulu** (no advanced params) — pastikan behavior identik dengan Slice 2:
   ```bash
   # Curl endpoint tanpa advanced params
   curl -X POST "http://localhost:8000/rfq/leads/{id}/generate-proposal" \
     -H "Authorization: Bearer $TOKEN"
   ```
   Compare output dengan proposal Slice 2 sample — semantically similar (LLM output non-deterministic tapi structure/tone harus sama).
6. Commit incremental:
   ```bash
   git add backend/services/proposal_generator.py backend/dependencies.py
   git commit -m "refactor(backend): ProposalGeneratorService loads prompt from DB [Epic 4B Slice 3A]"
   ```

### Jangan

- **JANGAN** ubah endpoint signature Slice 2. Frontend Slice 2 harus tetap works tanpa perubahan.
- **JANGAN** skip Quick Mode test setelah refactor. Kalau Quick Mode break, semua proposal generation gagal.
- **JANGAN** hilangkan error handling R-30 (APITimeoutError, RateLimitError, APIError) — semua tetap wajib.

### Verifikasi

- [ ] Quick Mode curl test — output looks correct
- [ ] Backup tag `pre-3a4-refactor` exists (untuk emergency revert)
- [ ] No regression di error handling

---

## PHASE 3A-5 — Backend: Advanced Mode Params Support

**Tujuan:** Update endpoint `generate-proposal` accept optional advanced params (R-38).

### Kerjakan

1. Update request model di `backend/routers/proposals.py` (atau wherever generate endpoint):
   ```python
   class GenerateProposalRequest(BaseModel):
       temperature: float | None = Field(None, ge=0, le=1.5)
       max_tokens: int | None = Field(None, ge=500, le=8000)
       custom_instructions: str | None = Field(None, max_length=2000)
   ```
2. Update endpoint signature:
   ```python
   @router.post("/rfq/leads/{lead_id}/generate-proposal")
   def generate_proposal(
       lead_id: str,
       request: GenerateProposalRequest = GenerateProposalRequest(),  # Optional body
       user = Depends(get_current_admin_user),
       supabase = Depends(get_supabase),
       generator = Depends(get_proposal_generator),
   ):
       lead = get_lead(supabase, lead_id)
       result = generator.generate(
           lead,
           temperature=request.temperature,
           max_tokens=request.max_tokens,
           custom_instructions=request.custom_instructions,
       )
       ...
   ```
3. **Backward compat test** — call endpoint tanpa body (Slice 2 pattern):
   ```bash
   curl -X POST "http://localhost:8000/rfq/leads/{id}/generate-proposal" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json"
   # Expected: 200 OK, works seperti Slice 2
   ```
4. **Advanced mode test** — dengan body:
   ```bash
   curl -X POST "http://localhost:8000/rfq/leads/{id}/generate-proposal" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"temperature": 1.0, "max_tokens": 3000, "custom_instructions": "Tekankan aspek harga."}'
   ```
5. Log advanced params usage untuk cost audit:
   ```python
   logger.info(
       f"generate_proposal lead={lead_id} temp={request.temperature} "
       f"max_tokens={request.max_tokens} custom_instr_len={len(request.custom_instructions or '')}"
   )
   ```
6. Commit:
   ```bash
   git add backend/
   git commit -m "feat(backend): support advanced mode params in generate-proposal [Epic 4B Slice 3A]"
   ```

### Jangan

- **JANGAN** validate `temperature > 1.0` reject — allow up to 1.5 (R-38).
- **JANGAN** allow `custom_instructions` unlimited length — 2000 chars max (cost + prompt injection surface).
- **JANGAN** skip logging — audit trail critical untuk cost monitoring.

### Verifikasi

- [ ] Backward compat test pass (Quick Mode still works)
- [ ] Advanced mode test pass
- [ ] Logging includes advanced params

---

## 🛑 STOP GATE 3A-2 — Backend Deploy + Smoke Test

**Status:** Menunggu Jazil deploy backend + smoke test semua endpoints.

### Aksi Manual yang Jazil Lakukan

**1. Push branch → Railway auto-deploy:**
```bash
git push -u origin feature/epic4B-slice3a-prompt-editor
```

**2. Wait Railway build. Cek build logs — no errors.**

**3. Smoke test semua endpoint baru + regression Slice 2:**

```bash
# GET settings
curl -X GET "${API_URL}/proposal-settings" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# Expected: 200 OK, 4 prompt fields + defaults

# PUT settings (test small edit)
curl -X PUT "${API_URL}/proposal-settings" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt_role": "...", "prompt_task": "...", ...}'
# Expected: 200 OK, updated

# GET history
curl -X GET "${API_URL}/proposal-settings/history" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# Expected: 1 entry (snapshot dari PUT sebelumnya)

# Reset to default
curl -X POST "${API_URL}/proposal-settings/reset-to-default" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# Expected: 200 OK, back to default

# ⚠️ CRITICAL: Regression Slice 2 Quick Mode
curl -X POST "${API_URL}/rfq/leads/{real-lead-id}/generate-proposal" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# Expected: 200 OK, proposal generated, quality similar to Slice 2 baseline

# Advanced Mode
curl -X POST "${API_URL}/rfq/leads/{real-lead-id}/generate-proposal" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"temperature": 0.9, "custom_instructions": "Fokus di value proposition."}'
# Expected: 200 OK, output slightly different tone
```

**4. Auth negative test:**
- Try tanpa token — 401
- Try dengan non-admin token — 403

**5. Cost check di Anthropic Console:**
- Bandingkan cost/generation Advanced vs Quick — Advanced dengan max_tokens=3000 harusnya ~1.5x
- Kalau spike unusual, investigate log

### Setelah Gate Ini Clear

- Backend production-ready untuk 3A
- Frontend siap dimulai

### Sinyal Masalah

- Kalau Quick Mode regression fail — revert commit Phase 3A-4, redesign refactor
- Kalau history table kosong setelah PUT — trigger `snapshot_before_update` broken, cek migration
- Kalau cost per generation > 2x expected untuk Advanced Mode — cek `max_tokens` di request vs response

---

## PHASE 3A-6 — Frontend: Contract Layer (Types + lib/api)

**Tujuan:** TypeScript types + API client functions.

### Kerjakan

1. Add types di `lib/api/types.ts` (atau file baru):
   ```typescript
   export interface ProposalSettings {
     prompt_role: string;
     prompt_task: string;
     prompt_constraints: string;
     prompt_output_format: string;
     default_temperature: number;
     default_max_tokens: number;
     model_id: string;
   }
   
   export interface ProposalSettingsHistoryEntry {
     id: number;
     snapshot: ProposalSettings;
     created_at: string;
     created_by: string | null;
   }
   
   export interface GenerateProposalAdvancedParams {
     temperature?: number;
     max_tokens?: number;
     custom_instructions?: string;
   }
   ```
2. Add API client functions di `lib/api/proposal-settings.ts`:
   ```typescript
   export async function getProposalSettings(token: string): Promise<ProposalSettings> { ... }
   export async function updateProposalSettings(settings: ProposalSettings, token: string): Promise<ProposalSettings> { ... }
   export async function getSettingsHistory(token: string): Promise<ProposalSettingsHistoryEntry[]> { ... }
   export async function rollbackSettings(historyId: number, token: string): Promise<ProposalSettings> { ... }
   export async function resetSettingsToDefault(token: string): Promise<ProposalSettings> { ... }
   ```
3. Update `lib/api/proposals.ts` generate function untuk accept advanced params:
   ```typescript
   export async function generateProposal(
     leadId: string,
     token: string,
     advancedParams?: GenerateProposalAdvancedParams,
   ): Promise<ProposalGenerateResponse> {
     const response = await fetch(`${API_URL}/rfq/leads/${leadId}/generate-proposal`, {
       method: 'POST',
       headers: {
         Authorization: `Bearer ${token}`,
         'Content-Type': 'application/json',
       },
       body: advancedParams ? JSON.stringify(advancedParams) : undefined,
     });
     ...
   }
   ```
4. Commit:
   ```bash
   git add lib/api/
   git commit -m "feat(frontend): contract layer for proposal settings + advanced params [Epic 4B Slice 3A]"
   ```

### Jangan

- **JANGAN** ubah signature `generateProposal` existing — advanced params optional last arg.
- **JANGAN** hardcode API URL — pakai `process.env.NEXT_PUBLIC_API_URL`.

### Verifikasi

- [ ] Types compile
- [ ] Import paths correct

---

## PHASE 3A-7 — Frontend: Route `/admin/proposal-settings` + PromptEditor Component

**Tujuan:** Halaman admin untuk edit prompt structured 4-field + history + rollback.

### Kerjakan

1. Buat `app/admin/proposal-settings/page.tsx` (Server Component):
   ```tsx
   import { getProposalSettings } from '@/lib/api/proposal-settings';
   import { getServerSession } from '@/lib/auth';
   import { PromptEditor } from '@/components/admin/settings/PromptEditor';
   
   export default async function ProposalSettingsPage() {
     const session = await getServerSession();
     if (!session || session.user.role !== 'admin') redirect('/admin/login');
     
     const settings = await getProposalSettings(session.token);
     
     return (
       <div className="max-w-4xl mx-auto p-6">
         <h1 className="text-2xl font-bold mb-2">Pengaturan Proposal</h1>
         <p className="text-sm text-neutral-600 mb-6">
           Edit instruksi AI untuk generate proposal. Perubahan akan mempengaruhi 
           semua proposal yang di-generate setelah save.
         </p>
         <PromptEditor initial={settings} />
       </div>
     );
   }
   ```
2. Buat `components/admin/settings/PromptEditor.tsx` (Client Component):
   ```tsx
   'use client';
   
   import { useState } from 'react';
   import { Button } from '@/components/ui/button';
   import { Textarea } from '@/components/ui/textarea';
   import { Label } from '@/components/ui/label';
   import { updateProposalSettings, resetSettingsToDefault } from '@/lib/api/proposal-settings';
   import { toast } from 'sonner';
   import { HistoryPanel } from './HistoryPanel';
   
   export function PromptEditor({ initial }: { initial: ProposalSettings }) {
     const [role, setRole] = useState(initial.prompt_role);
     const [task, setTask] = useState(initial.prompt_task);
     const [constraints, setConstraints] = useState(initial.prompt_constraints);
     const [outputFormat, setOutputFormat] = useState(initial.prompt_output_format);
     const [temperature, setTemperature] = useState(initial.default_temperature);
     const [maxTokens, setMaxTokens] = useState(initial.default_max_tokens);
     
     const [isSaving, setSaving] = useState(false);
     
     async function handleSave() {
       // Basic validation
       if (!role.trim() || !task.trim() || !constraints.trim() || !outputFormat.trim()) {
         toast.error('Semua section prompt wajib diisi');
         return;
       }
       
       setSaving(true);
       try {
         await updateProposalSettings({
           prompt_role: role,
           prompt_task: task,
           prompt_constraints: constraints,
           prompt_output_format: outputFormat,
           default_temperature: temperature,
           default_max_tokens: maxTokens,
           model_id: initial.model_id,
         }, /* token */);
         toast.success('Pengaturan tersimpan');
       } catch (e) {
         toast.error('Gagal simpan');
       } finally {
         setSaving(false);
       }
     }
     
     async function handleReset() {
       if (!confirm('Reset ke default? Semua perubahan akan hilang (masih bisa di-rollback via history).')) return;
       await resetSettingsToDefault(/* token */);
       toast.success('Reset selesai. Reload halaman.');
       location.reload();
     }
     
     return (
       <div className="space-y-6">
         <SectionEditor
           label="1. Role (Peran AI)"
           helpText="Siapa AI ini? Contoh: 'Kamu adalah proposal writer untuk industri garam industri.'"
           value={role}
           onChange={setRole}
         />
         <SectionEditor
           label="2. Task (Tugas)"
           helpText="Apa yang AI harus lakukan? Contoh: 'Buat proposal untuk lead berdasarkan data...'"
           value={task}
           onChange={setTask}
         />
         <SectionEditor
           label="3. Constraints (Batasan)"
           helpText="Aturan yang harus diikuti. Contoh: '- Bahasa Indonesia formal\n- 300-500 kata'"
           value={constraints}
           onChange={setConstraints}
         />
         <SectionEditor
           label="4. Output Format (Format Keluaran)"
           helpText="Struktur HTML output. JANGAN edit tanpa paham teknis."
           value={outputFormat}
           onChange={setOutputFormat}
         />
         
         <div className="border-t pt-6">
           <h3 className="font-semibold mb-4">Default Parameter</h3>
           <div className="grid grid-cols-2 gap-4">
             <div>
               <Label>Temperature (0-1.5)</Label>
               <input type="number" min={0} max={1.5} step={0.1} 
                 value={temperature} onChange={e => setTemperature(parseFloat(e.target.value))} />
               <p className="text-xs text-neutral-500">Semakin tinggi = semakin kreatif tapi kurang konsisten.</p>
             </div>
             <div>
               <Label>Max Tokens (500-8000)</Label>
               <input type="number" min={500} max={8000} step={100}
                 value={maxTokens} onChange={e => setMaxTokens(parseInt(e.target.value))} />
               <p className="text-xs text-neutral-500">Panjang maksimum output. Semakin tinggi = semakin mahal.</p>
             </div>
           </div>
         </div>
         
         <div className="flex gap-2 justify-between border-t pt-6">
           <Button onClick={handleReset} variant="outline" className="text-red-600">
             Reset ke Default
           </Button>
           <Button onClick={handleSave} disabled={isSaving}>
             {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
           </Button>
         </div>
         
         <HistoryPanel initial={initial} />
       </div>
     );
   }
   
   function SectionEditor({ label, helpText, value, onChange }: {
     label: string; helpText: string;
     value: string; onChange: (v: string) => void;
   }) {
     return (
       <div>
         <Label className="font-semibold">{label}</Label>
         <p className="text-xs text-neutral-500 mb-2">{helpText}</p>
         <Textarea
           value={value}
           onChange={e => onChange(e.target.value)}
           rows={6}
           className="font-mono text-sm"
         />
         <p className="text-xs text-neutral-400 mt-1">{value.length} karakter</p>
       </div>
     );
   }
   ```
3. Buat `components/admin/settings/HistoryPanel.tsx` untuk versioning UI (R-41):
   - List 10 history entries
   - Tombol "Rollback ke versi ini" per entry
   - Confirm dialog sebelum rollback
4. Add navbar link di admin layout untuk `/admin/proposal-settings`.
5. Test manual local:
   - Buka `/admin/proposal-settings`
   - Edit small text di role section
   - Save → toast success
   - Reload → text ter-persist
   - History panel → muncul 1 entry
   - Rollback → text kembali
   - Reset to default → text kembali ke Slice 2 baseline
6. Commit:
   ```bash
   git add app/admin/proposal-settings/ components/admin/settings/
   git commit -m "feat(frontend): admin proposal-settings page with PromptEditor [Epic 4B Slice 3A]"
   ```

### Jangan

- **JANGAN** allow raw prompt textarea (single field) — structured 4-field per R-40.
- **JANGAN** save tanpa client-side validation minimal (semua section non-empty).
- **JANGAN** hilangkan "Reset ke Default" button — R-41 rollback mechanism.
- **JANGAN** pakai Radix — pakai Base UI (project constraint dari memories).

### Verifikasi

- [ ] Route accessible untuk admin
- [ ] 4-section editor works
- [ ] Save + reload persistence works
- [ ] History + rollback works
- [ ] Reset to default works

---

## PHASE 3A-8 — Frontend: Advanced Mode Toggle di ProposalGeneratorPanel (CROSS-SLICE, HIGH RISK)

**Tujuan:** Tambah Advanced Mode toggle + params UI di `ProposalGeneratorPanel` (Slice 2 component).

### Prep

1. **BACA DULU** `components/admin/lead/ProposalGeneratorPanel.tsx` yang existing dari Slice 2.
2. **BACKUP branch reference:**
   ```bash
   git tag pre-3a8-panel-edit
   ```

### Kerjakan

1. Add state untuk Advanced Mode:
   ```tsx
   const [advancedMode, setAdvancedMode] = useState(false);
   const [temperature, setTemperature] = useState<number | undefined>(undefined);
   const [maxTokens, setMaxTokens] = useState<number | undefined>(undefined);
   const [customInstructions, setCustomInstructions] = useState('');
   ```
2. Add toggle + collapsible section:
   ```tsx
   <div className="border-t pt-4">
     <label className="flex items-center gap-2 cursor-pointer">
       <input
         type="checkbox"
         checked={advancedMode}
         onChange={e => setAdvancedMode(e.target.checked)}
       />
       <span className="text-sm font-medium">Advanced Mode</span>
       <span className="text-xs text-neutral-500">
         (Override default parameter — biaya lebih tinggi)
       </span>
     </label>
     
     {advancedMode && (
       <div className="mt-3 p-3 bg-neutral-50 rounded space-y-3">
         {/* Warning banner */}
         <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
           ⚠️ Advanced Mode: parameter di sini override default. 
           Temperature tinggi = output kreatif tapi kurang konsisten. 
           Max tokens tinggi = output panjang + biaya lebih besar.
         </div>
         
         <div className="grid grid-cols-2 gap-3">
           <div>
             <Label className="text-xs">Temperature (opsional)</Label>
             <input type="number" min={0} max={1.5} step={0.1}
               placeholder="Kosongkan = default"
               value={temperature ?? ''}
               onChange={e => setTemperature(e.target.value ? parseFloat(e.target.value) : undefined)} />
           </div>
           <div>
             <Label className="text-xs">Max Tokens (opsional)</Label>
             <input type="number" min={500} max={8000} step={100}
               placeholder="Kosongkan = default"
               value={maxTokens ?? ''}
               onChange={e => setMaxTokens(e.target.value ? parseInt(e.target.value) : undefined)} />
           </div>
         </div>
         
         <div>
           <Label className="text-xs">Custom Instructions (opsional, max 2000 karakter)</Label>
           <Textarea
             value={customInstructions}
             onChange={e => setCustomInstructions(e.target.value.slice(0, 2000))}
             placeholder="Contoh: Tekankan aspek harga kompetitif dan pengiriman cepat."
             rows={3}
           />
           <p className="text-xs text-neutral-500">{customInstructions.length}/2000</p>
         </div>
       </div>
     )}
   </div>
   ```
3. Update generate handler untuk pass advanced params:
   ```tsx
   async function handleGenerate() {
     setGenerating(true);
     try {
       const advancedParams = advancedMode ? {
         temperature,
         max_tokens: maxTokens,
         custom_instructions: customInstructions || undefined,
       } : undefined;
       
       const result = await generateProposal(lead.id, token, advancedParams);
       ...
     } ...
   }
   ```
4. **CRITICAL: Test Quick Mode regression FIRST:**
   - Buka lead di `/admin/leads/{id}`
   - **JANGAN** enable Advanced Mode
   - Click Generate
   - Verify: 200 OK, proposal generated, works persis seperti sebelum Slice 3
5. **Test Advanced Mode:**
   - Enable toggle
   - Set temperature = 1.0
   - Custom instructions = "Fokus di harga."
   - Generate
   - Verify: output berbeda tone dari default
6. **Test edge case:**
   - Advanced Mode enabled tapi semua field kosong → should behave like Quick Mode (backend receive `undefined` params → pakai default)
7. Regression test Slice 1 (auto-save notes, status update, WA modal) → semua works.
8. Commit:
   ```bash
   git add components/admin/lead/ProposalGeneratorPanel.tsx
   git commit -m "feat(frontend): advanced mode toggle in ProposalGeneratorPanel [Epic 4B Slice 3A]"
   ```

### Jangan

- **JANGAN** ubah default panel behavior. Quick Mode (toggle off) HARUS identik dengan Slice 2.
- **JANGAN** send empty string `""` sebagai custom_instructions — pakai `undefined` supaya backend skip append.
- **JANGAN** trigger regenerate otomatis saat toggle change — waste API call.

### Verifikasi

- [ ] Quick Mode regression pass
- [ ] Advanced Mode works
- [ ] Slice 1 regression pass
- [ ] `pre-3a8-panel-edit` tag exists

---

## 🛑 STOP GATE 3A-3 — Visual QA + E2E All Customization Flows

**Status:** Menunggu Jazil manual QA + E2E test full flow.

### Aksi Manual yang Jazil Lakukan

**1. Visual QA `/admin/proposal-settings`:**
- Layout 4-section clean, tidak overflow
- History panel expand/collapse works
- Reset button prominent tapi tidak terlalu dominant
- Mobile responsive (klien akan pakai iPad kadang)

**2. E2E Flow: Edit Prompt → Generate → Verify Quality:**
- Buka `/admin/proposal-settings`
- Edit `prompt_role` — tambah 1 kalimat spesifik (mis. "Selalu sebut brand name 'Reka Cipta'.")
- Save
- Buka lead → generate proposal Quick Mode
- Verify: output proposal include "Reka Cipta" (proof prompt edit took effect)

**3. E2E Flow: History + Rollback:**
- Edit prompt lagi (delete `prompt_role` kalimat baru)
- Save
- Buka History panel → 2 entries visible
- Klik "Rollback" ke entry pertama (yang punya kalimat baru)
- Verify: prompt kembali ke versi dengan kalimat baru
- Generate → verify output include "Reka Cipta" lagi

**4. E2E Flow: Advanced Mode:**
- Buka lead
- Enable Advanced Mode
- Set temperature = 1.2, custom instructions = "Gunakan bahasa yang lebih casual."
- Generate
- Verify: output tone berbeda (lebih casual dari default)
- Compare cost di Anthropic Console — Advanced ~1.2-1.5x Quick Mode

**5. E2E Flow: Reset to Default (Emergency):**
- Rusak prompt sengaja — set `prompt_role` = kosong (via console curl, karena UI validasi)
- Actually — coba di UI dulu apakah blocked. Kalau blocked, bagus.
- Kalau bisa save empty — generate → should fail gracefully OR fallback ke hardcoded default (R-37)
- Klik "Reset ke Default" → verify prompt kembali normal
- Generate → verify quality kembali baseline

**6. Regression Slice 1 + Slice 2:**
- Auto-save notes → works
- Status update → works
- WA modal → works
- Quick Mode generate (Advanced Mode off) → works persis seperti sebelum Slice 3A
- PDF download → works
- Send email → works

**7. Cost sanity check:**
- Cek Anthropic Console usage last 24 jam
- Total spend seharusnya < $2 untuk semua testing (jangan lebih)

### Setelah Gate Ini Clear

- 3A siap merge & production deploy

### Sinyal Masalah

- Kalau rollback tidak restore prompt — DB history trigger broken, investigate SQL
- Kalau reset default juga tidak fix output quality — hardcoded default drift dari Slice 2 baseline, sync ulang
- Kalau cost spike > 3x expected — bug retry loop, investigate frontend + backend logs

---

## PHASE 3A-9 — Merge ke `dev` + Production Deploy + Client Briefing

**Tujuan:** Merge, deploy production, execute R-41 client briefing.

### Kerjakan

1. Merge ke `dev`:
   ```bash
   git checkout dev
   git pull
   git merge feature/epic4B-slice3a-prompt-editor --no-ff
   git push
   ```
2. Verify Vercel + Railway production deploy sukses.
3. Post-deploy smoke test production:
   - Login admin production
   - Test full flow (edit prompt → generate → rollback → reset)
   - Test regression Slice 1+2
4. **R-41 Client Briefing** (30-60 menit sesi):
   - Konsep prompt engineering basic
   - Demo edit prompt live
   - Demo generate → observe output change
   - Demo rollback + reset
   - Tekankan: kalau output aneh, JANGAN otak-atik terus — contact Jazil
5. Dokumentasikan briefing di `docs/client-briefings/3A_prompt_engineering_briefing.md`:
   - Tanggal, durasi, siapa yang attend
   - Topik yang di-cover
   - Klien concerns / questions
   - Signed-off atau not
6. Merge `dev` ke `main`:
   ```bash
   git checkout main
   git pull
   git merge dev --no-ff
   git push
   ```
7. Tag release: `git tag epic4B-slice3a-live && git push --tags`

### Verifikasi

- [ ] Merge sukses
- [ ] Production deploy verified
- [ ] Regression Slice 1+2 pass di production
- [ ] Client briefing done + documented + signed-off
- [ ] Release tag pushed

---

## 🛑 STOP GATE 3A-4 — Post-Launch Monitoring (2 Minggu)

**Status:** Menunggu 2 minggu post-launch untuk collect usage data sebelum trigger Sub-Slice 3B.

### Yang Jazil Monitor Selama 2 Minggu

**1. Adoption metrics:**
- Berapa kali klien edit prompt? (query `proposal_settings_history` count)
- Berapa kali klien pakai Advanced Mode? (log grep untuk `custom_instr_len > 0`)
- Rasio Advanced vs Quick generation

**2. Cost metrics:**
- Anthropic total spend
- Cost per proposal average
- Spike alerts

**3. Quality metrics (subjective, ask klien):**
- Apakah proposal quality naik/turun dibanding baseline Slice 2?
- Apakah Advanced Mode useful?
- Apakah ada situasi klien mau feature tambahan?

**4. Support tickets:**
- Berapa kali klien contact Jazil karena output aneh?
- Trend up/down?

### Decision Point (Setelah 2 Minggu)

Tulis di `slice3_execution_log.md`:

| Metric | Target | Actual | Verdict |
|---|---|---|---|
| Edit frequency | > 3x/2 minggu | ? | ? |
| Advanced Mode usage | > 20% generation | ? | ? |
| Quality subjective | Naik | ? | ? |
| Support tickets | < 3 | ? | ? |
| Cost spike | Tidak ada | ? | ? |

**Kalau adoption rendah (< 3 edit + < 10% Advanced usage):** 3B & 3C likely tidak butuh execute. Klien tidak invest waktu untuk customization — feature speculative confirmed.

**Kalau adoption tinggi + klien request 3B/3C specifically:** Proceed to Sub-Slice 3B trigger check.

---

---

# 🔷 SUB-SLICE 3B — Email + WA Template Management

**Estimated Effort:** 3-4 hari
**Klien Value:** Medium — improve messaging consistency
**Regression Risk:** MEDIUM — touch Epic 4 CF email service + Slice 1 WA template rendering
**Cost Implication:** Zero (no LLM cost)

## Prasyarat Sub-Slice 3B

- Shared Preflight done
- Sub-Slice 3A live minimal 2 minggu
- Klien explicit request untuk edit email/WA template
- Adoption 3A cukup tinggi (indikasi klien willing untuk manage customization)

## Ringkasan Sub-Slice 3B

Menambahkan kemampuan admin edit email confirmation template (untuk RFQ Epic 4 CF) + WA templates per status (untuk Slice 1 WA modal) via `/admin/email-templates`.

---

## PHASE 3B-1 — Preflight Sub-Slice 3B + Branch Setup

### Kerjakan

1. Verify Sub-Slice 3A live minimal 2 minggu, adoption data recorded.
2. Update `slice3_execution_log.md` dengan trigger check untuk 3B.
3. `git checkout main && git pull`
4. `git checkout -b feature/epic4B-slice3b-templates`
5. Verify existing artifacts:
   ```bash
   ls backend/services/email_service.py  # dari Epic 4 CF
   grep -r "TEMPLATES" backend/  # find hardcoded WA templates dari Slice 1
   ```

### Verifikasi

- [ ] Branch aktif
- [ ] Existing template locations identified

---

## PHASE 3B-2 — Backend: Migration `email_templates` + `wa_templates`

### Kerjakan

1. Migration `_add_email_wa_templates.sql`:
   ```sql
   -- Email templates (key-value store, keyed by 'template_type')
   CREATE TABLE IF NOT EXISTS public.email_templates (
     id BIGSERIAL PRIMARY KEY,
     template_type TEXT UNIQUE NOT NULL,  -- e.g., 'rfq_confirmation', 'proposal_sent'
     subject TEXT NOT NULL,
     body_html TEXT NOT NULL,
     body_text TEXT NOT NULL,  -- fallback plain text
     available_placeholders JSONB NOT NULL DEFAULT '[]',  -- ['{{customer_name}}', ...]
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW(),
     updated_by UUID REFERENCES auth.users(id)
   );
   
   -- WA templates (per status)
   CREATE TABLE IF NOT EXISTS public.wa_templates (
     id BIGSERIAL PRIMARY KEY,
     status_key TEXT UNIQUE NOT NULL,  -- 'new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'
     template_text TEXT NOT NULL,
     available_placeholders JSONB NOT NULL DEFAULT '[]',
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW(),
     updated_by UUID REFERENCES auth.users(id)
   );
   
   -- RLS admin only
   ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.wa_templates ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Admin read email_templates" ON public.email_templates
     FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'service_role'));
   CREATE POLICY "Admin update email_templates" ON public.email_templates
     FOR UPDATE USING (auth.jwt() ->> 'role' IN ('admin', 'service_role'));
   
   CREATE POLICY "Admin read wa_templates" ON public.wa_templates
     FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'service_role'));
   CREATE POLICY "Admin update wa_templates" ON public.wa_templates
     FOR UPDATE USING (auth.jwt() ->> 'role' IN ('admin', 'service_role'));
   
   -- Updated_at triggers
   CREATE TRIGGER set_email_templates_updated_at
     BEFORE UPDATE ON public.email_templates
     FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
   
   CREATE TRIGGER set_wa_templates_updated_at
     BEFORE UPDATE ON public.wa_templates
     FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
   ```
2. Commit.

### Verifikasi

- [ ] Migration file created

---

## 🛑 STOP GATE 3B-1 — Migration Apply + Seed Default Templates

### Aksi Manual

**1. Apply migration via Supabase Dashboard.**

**2. Seed defaults** — extract dari hardcoded templates existing:
```sql
INSERT INTO public.email_templates (template_type, subject, body_html, body_text, available_placeholders)
VALUES 
  ('rfq_confirmation', 
   'Konfirmasi Permintaan Anda - Reka Cipta Indonesia',
   '{paste HTML dari Epic 4 CF email_service.py}',
   '{paste plain text version}',
   '["{{customer_name}}", "{{company_name}}", "{{rfq_id}}"]'::jsonb
  );

INSERT INTO public.wa_templates (status_key, template_text, available_placeholders)
VALUES
  ('new', 'Halo {{customer_name}}, kami sudah terima permintaan Anda...', '["{{customer_name}}"]'::jsonb),
  ('contacted', '...', '[...]'::jsonb),
  ('qualified', '...', '[...]'::jsonb),
  ('proposal_sent', '...', '[...]'::jsonb),
  ('won', '...', '[...]'::jsonb),
  ('lost', '...', '[...]'::jsonb);
```

**3. Verify:**
```sql
SELECT template_type FROM public.email_templates;
SELECT status_key FROM public.wa_templates;
```

---

## PHASE 3B-3 — Backend: Templates Services + Endpoints

### Kerjakan

1. Buat `backend/services/email_templates_service.py`:
   ```python
   class EmailTemplate(BaseModel):
       template_type: str
       subject: str
       body_html: str
       body_text: str
       available_placeholders: list[str]
   
   class EmailTemplatesService:
       def __init__(self, supabase: Client):
           self.supabase = supabase
       
       def get(self, template_type: str) -> EmailTemplate:
           try:
               result = self.supabase.table("email_templates") \
                   .select("*").eq("template_type", template_type).single().execute()
               if result.data:
                   return EmailTemplate(**result.data)
           except Exception as e:
               logger.warning(f"Failed load email template {template_type}: {e}")
           return EmailTemplate.hardcoded_default(template_type)
       
       def list_all(self) -> list[EmailTemplate]: ...
       def update(self, template: EmailTemplate, updated_by: str) -> EmailTemplate: ...
       
       def render(self, template_type: str, context: dict) -> tuple[str, str, str]:
           """Return (subject, body_html, body_text) dengan placeholders replaced."""
           tmpl = self.get(template_type)
           return (
               self._replace_placeholders(tmpl.subject, context),
               self._replace_placeholders(tmpl.body_html, context),
               self._replace_placeholders(tmpl.body_text, context),
           )
       
       def _replace_placeholders(self, text: str, context: dict) -> str:
           for key, value in context.items():
               text = text.replace(f"{{{{{key}}}}}", str(value))
           return text
   ```
2. Buat `backend/services/wa_templates_service.py` (similar pattern).
3. Endpoints `backend/routers/templates.py`:
   ```python
   @router.get("/email-templates", response_model=list[EmailTemplate])
   @router.get("/email-templates/{template_type}", response_model=EmailTemplate)
   @router.put("/email-templates/{template_type}", response_model=EmailTemplate)
   
   @router.get("/wa-templates", response_model=list[WATemplate])
   @router.get("/wa-templates/{status_key}", response_model=WATemplate)
   @router.put("/wa-templates/{status_key}", response_model=WATemplate)
   ```
4. Commit.

### Verifikasi

- [ ] Services created
- [ ] Endpoints registered

---

## PHASE 3B-4 — Backend: Refactor Epic 4 CF Email Service (CROSS-SLICE)

### Prep

`git tag pre-3b4-email-refactor`

### Kerjakan

1. Baca `backend/services/email_service.py` (dari Epic 4 CF).
2. Refactor untuk load template dari DB:
   ```python
   # BEFORE:
   def send_rfq_confirmation(lead, resend_client):
       subject = "Konfirmasi..."  # hardcoded
       body_html = f"<p>Halo {lead.customer_name}...</p>"  # hardcoded
       resend_client.emails.send(...)
   
   # AFTER:
   def send_rfq_confirmation(lead, resend_client, templates_service):
       subject, body_html, body_text = templates_service.render(
           'rfq_confirmation',
           {'customer_name': lead.customer_name, 'company_name': lead.company_name, 'rfq_id': lead.id},
       )
       resend_client.emails.send({
           'from': ..., 'to': lead.email,
           'subject': subject, 'html': body_html, 'text': body_text,
       })
   ```
3. Update dependency injection.
4. Test locally — trigger RFQ submit, verify email pakai template dari DB.
5. Commit.

### Jangan

- **JANGAN** ubah email trigger flow (masih via BackgroundTasks fire-and-forget).
- **JANGAN** hilangkan fallback R-37 — kalau DB template kosong, pakai hardcoded.

### Verifikasi

- [ ] Local test: RFQ submit → email delivered dengan template DB
- [ ] Fallback test: rename template row, verify pakai default

---

## PHASE 3B-5 — Backend: Refactor Slice 1 WA Template Rendering (CROSS-SLICE)

### Prep

`git tag pre-3b5-wa-refactor`

### Kerjakan

1. Identify existing hardcoded WA templates di Slice 1 code.
2. Refactor untuk load dari DB. Kalau WA rendering di frontend (klien pakai `wa.me` link), maka refactor:
   - Frontend fetch WA template dari backend endpoint
   - Render placeholders di frontend
   - Build `wa.me/{phone}?text={rendered}` URL
3. Kalau WA rendering di backend, similar pattern dengan email.
4. Test regression Slice 1 — status update → WA button → verify link dengan template dari DB.
5. Commit.

### Verifikasi

- [ ] Slice 1 WA flow regression pass
- [ ] Template dari DB reflected di WA link

---

## 🛑 STOP GATE 3B-2 — Backend Deploy + Smoke Test

Similar dengan Gate 3A-2. Test:
- GET/PUT email templates
- GET/PUT WA templates
- RFQ submit → email delivered
- WA link generation
- Fallback saat DB row kosong

---

## PHASE 3B-6 — Frontend: Contract Layer

Types + API functions untuk email + wa templates. Skip detail — pattern sama dengan Phase 3A-6.

---

## PHASE 3B-7 — Frontend: Route `/admin/email-templates` (Unified UI)

### Kerjakan

1. Buat `app/admin/email-templates/page.tsx` — 2 tabs: "Email" dan "WhatsApp".
2. **Email tab:**
   - List all email templates
   - Klik template → open editor
   - Editor: subject input + body HTML editor (textarea + preview iframe) + body text
   - Placeholder chips untuk copy-paste (`{{customer_name}}`, dst)
   - Save + Reset to Default per template
3. **WhatsApp tab:**
   - List all status templates
   - Klik status → open editor
   - Editor: single textarea (WA plain text only)
   - Placeholder chips
   - Save + Reset per status
4. **Preview mechanism:**
   - Sample context data hardcoded (mis. `customer_name: "Budi", company_name: "PT Contoh"`)
   - Preview render dengan sample context, real-time
5. Test manual: edit template → save → trigger RFQ submit → verify email match edit.
6. Commit.

### Jangan

- **JANGAN** allow HTML edit di WA templates (plain text only).
- **JANGAN** biarkan klien save template tanpa placeholders required (validate).

### Verifikasi

- [ ] Both tabs functional
- [ ] Preview works
- [ ] Save persistence works

---

## 🛑 STOP GATE 3B-3 — Visual QA + E2E

**E2E tests:**
1. Edit email template → RFQ submit → verify email pakai edit
2. Edit WA template `contacted` → status update lead ke `contacted` → click WA button → verify pesan pakai edit
3. Reset email template → verify kembali default → RFQ submit → email default
4. Regression Epic 4 CF (RFQ form submission) → works
5. Regression Slice 1 (WA modal semua status) → works
6. Regression 3A (prompt editing) → works

---

## PHASE 3B-8 — Merge + Prod Deploy + Client Demo

Similar dengan 3A-9. Tag: `epic4B-slice3b-live`.

---

## 🛑 STOP GATE 3B-4 — Post-Launch Monitoring (2 Minggu)

Same pattern dengan 3A-4. Track adoption email/WA template edits.

---

---

# 🔷 SUB-SLICE 3C — Layout Customizer + Optional DOCX Export

**Estimated Effort:** 3-5 hari (5 kalau execute DOCX)
**Klien Value:** Low-Medium — branding & format flexibility
**Regression Risk:** MEDIUM — touch PDF service (Slice 2)
**Cost Implication:** Minimal (Storage untuk logo)

## Prasyarat Sub-Slice 3C

- Shared Preflight done
- Sub-Slice 3A + 3B live minimal 2 minggu each
- Klien explicit request untuk layout customization
- DOCX request explicit (kalau tidak, skip DOCX section)

## Ringkasan Sub-Slice 3C

Menambahkan layout customizer (header, footer, logo) untuk PDF proposal. Optional DOCX export via `python-docx`.

---

## PHASE 3C-1 — Preflight Sub-Slice 3C + Branch Setup

Similar preflight. Branch: `feature/epic4B-slice3c-layout`.

---

## PHASE 3C-2 — 🚨 DECISION GATE — DOCX Execute or Skip?

**Ini bukan Phase code — ini decision documentation.**

### Kerjakan

Tulis di `slice3_execution_log.md` section "3C DOCX Decision":

| Question | Answer | Justifikasi |
|---|---|---|
| Klien explicit minta DOCX? | Ya / Tidak | Quote klien: "..." |
| Use case konkret? | Ya / Tidak | ... |
| Frequency use case? | Reguler / Occasional | ... |
| Effort budget +2-3 hari OK? | Ya / Tidak | ... |
| **Decision** | Execute / Skip | ... |

**Default: Skip.** Kalau ragu, skip. Justifikasi Skip:
- PDF sudah sufficient untuk 95% B2B proposal
- DOCX fidelity vs PDF akan create maintenance burden
- Effort budget better di feature lain

Kalau Execute — proceed Phase 3C-6 & 3C-8 sesuai spec.
Kalau Skip — Phase 3C-6 & 3C-8 skip, guide berakhir di Phase 3C-9 (merge tanpa DOCX).

Commit decision:
```bash
git add docs/epic-breakdown/slice3_execution_log.md
git commit -m "docs(slice3): DOCX execute/skip decision for Sub-Slice 3C [Epic 4B Slice 3C]"
```

---

## PHASE 3C-3 — Backend: Migration Extend `proposal_settings` untuk Layout Fields

### Kerjakan

Migration:
```sql
ALTER TABLE public.proposal_settings
ADD COLUMN IF NOT EXISTS layout_header_text TEXT,
ADD COLUMN IF NOT EXISTS layout_footer_text TEXT,
ADD COLUMN IF NOT EXISTS layout_logo_url TEXT,
ADD COLUMN IF NOT EXISTS layout_primary_color TEXT DEFAULT '#0EA5E9';
```

Commit.

---

## 🛑 STOP GATE 3C-1 — Migration Apply

Apply via Supabase Dashboard. Verify columns exist.

---

## PHASE 3C-4 — Backend: Update PDF Service (CROSS-SLICE, Slice 2)

### Prep

`git tag pre-3c4-pdf-refactor`

### Kerjakan

1. Baca `backend/services/pdf_service.py` dari Slice 2.
2. Update HTML template wrapper untuk include header/footer/logo:
   ```python
   def wrap_proposal_html(proposal_body_html: str, settings: ProposalSettings) -> str:
       header = settings.layout_header_text or ''
       footer = settings.layout_footer_text or 'CV Reka Cipta Indonesia — Surabaya'
       logo = settings.layout_logo_url or ''
       color = settings.layout_primary_color or '#0EA5E9'
       
       return f"""
       <html>
       <head>
         <style>
           @page {{
             margin: 2cm;
             @top-center {{ content: "{header}"; font-size: 10pt; color: #666; }}
             @bottom-center {{ content: "{footer}"; font-size: 9pt; color: #999; }}
             @bottom-right {{ content: counter(page) " / " counter(pages); font-size: 9pt; }}
           }}
           body {{ font-family: 'Liberation Sans', sans-serif; }}
           .logo {{ max-height: 60px; margin-bottom: 1cm; }}
           h1, h2 {{ color: {color}; }}
         </style>
       </head>
       <body>
         {f'<img class="logo" src="{logo}" />' if logo else ''}
         {proposal_body_html}
       </body>
       </html>
       """
   ```
3. Update PDF generation endpoint untuk load settings + wrap.
4. **Preview endpoint** — return sample PDF dengan fixture lead data untuk R-43:
   ```python
   @router.post("/proposal-settings/layout-preview")
   def layout_preview(user = Depends(get_current_admin_user), ...):
       sample_html = "<h1>Proposal Sample</h1><p>Contoh isi proposal...</p>"
       pdf_bytes = generate_pdf_with_layout(sample_html, ...)
       return Response(content=pdf_bytes, media_type='application/pdf')
   ```

### Jangan

- **JANGAN** allow arbitrary HTML/CSS di header/footer — sanitize untuk prevent PDF injection.
- **JANGAN** load logo dari URL eksternal tanpa timeout — WeasyPrint block kalau URL slow.
- **JANGAN** hardcode font family — pakai `fonts-liberation` yang installed dari R-29.

### Verifikasi

- [ ] Local test: generate PDF dengan custom header/footer → PDF render benar
- [ ] Preview endpoint works

---

## PHASE 3C-5 — Backend: DOCX Service (OPTIONAL — Skip Kalau Phase 3C-2 = Skip)

**SKIP INI KALAU DOCX = Skip di Phase 3C-2.**

### Kerjakan (Kalau Execute)

1. Install `python-docx`:
   ```bash
   pip install python-docx
   pip freeze > requirements.txt
   ```
2. Buat `backend/services/docx_service.py`:
   ```python
   from docx import Document
   from docx.shared import Pt, RGBColor
   from bs4 import BeautifulSoup
   
   def generate_docx_from_html(proposal_html: str, settings: ProposalSettings) -> bytes:
       """Convert proposal HTML ke DOCX. Fidelity approximate."""
       doc = Document()
       
       # Header
       if settings.layout_header_text:
           header = doc.sections[0].header
           header.paragraphs[0].text = settings.layout_header_text
       
       # Parse HTML → convert to DOCX paragraphs
       soup = BeautifulSoup(proposal_html, 'html.parser')
       for element in soup.find_all(['h1', 'h2', 'h3', 'p', 'ul', 'ol']):
           # Basic conversion — h1 → Heading 1, p → paragraph, dst
           # ... implementasi detail ...
       
       # Footer
       if settings.layout_footer_text:
           footer = doc.sections[0].footer
           footer.paragraphs[0].text = settings.layout_footer_text
       
       output = io.BytesIO()
       doc.save(output)
       return output.getvalue()
   ```
3. Endpoint download:
   ```python
   @router.get("/rfq/leads/{lead_id}/proposal.docx")
   def download_docx(lead_id: str, ...):
       lead = get_lead(...)
       settings = settings_service.get()
       docx_bytes = generate_docx_from_html(lead.proposal_html, settings)
       return Response(
           content=docx_bytes,
           media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
           headers={'Content-Disposition': f'attachment; filename="proposal-{lead.company_name}.docx"'}
       )
   ```

### Jangan (Kalau Execute)

- **JANGAN** promise klien DOCX = PDF perfectly (R-42). Manage expectation upfront: "DOCX is approximate. Complex CSS won't render identically."
- **JANGAN** skip fidelity test — generate 3 sample proposal, compare PDF vs DOCX side-by-side.

### Verifikasi

- [ ] DOCX download works
- [ ] Fidelity test acceptable (klien approve tolerance)

---

## 🛑 STOP GATE 3C-2 — Backend Deploy + Preview Test

Deploy + smoke test:
- Layout preview endpoint returns valid PDF
- Custom header/footer render di generated proposal PDF
- DOCX (kalau execute) downloads valid file
- Regression Slice 2 Quick Mode + Advanced Mode + PDF download

---

## PHASE 3C-6 — Frontend: Contract Layer

Types + API functions untuk layout fields + preview endpoint. Skip detail.

---

## PHASE 3C-7 — Frontend: LayoutCustomizer Component + Integration

### Kerjakan

1. Buat `components/admin/settings/LayoutCustomizer.tsx`:
   ```tsx
   'use client';
   
   export function LayoutCustomizer({ initial }: { initial: ProposalSettings }) {
     const [headerText, setHeaderText] = useState(initial.layout_header_text || '');
     const [footerText, setFooterText] = useState(initial.layout_footer_text || '');
     const [logoUrl, setLogoUrl] = useState(initial.layout_logo_url || '');
     const [primaryColor, setPrimaryColor] = useState(initial.layout_primary_color || '#0EA5E9');
     
     const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
     const [isPreviewing, setPreviewing] = useState(false);
     
     async function handlePreview() {
       // R-43: preview before save
       setPreviewing(true);
       try {
         const response = await fetch(`${API_URL}/proposal-settings/layout-preview`, {
           method: 'POST',
           headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
           body: JSON.stringify({ headerText, footerText, logoUrl, primaryColor }),
         });
         const blob = await response.blob();
         setPreviewPdfUrl(URL.createObjectURL(blob));
       } finally {
         setPreviewing(false);
       }
     }
     
     return (
       <div className="grid grid-cols-2 gap-6">
         <div className="space-y-4">
           <div>
             <Label>Header Text</Label>
             <input value={headerText} onChange={e => setHeaderText(e.target.value)} maxLength={100} />
           </div>
           <div>
             <Label>Footer Text</Label>
             <input value={footerText} onChange={e => setFooterText(e.target.value)} maxLength={150} />
           </div>
           <div>
             <Label>Logo URL (opsional)</Label>
             <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} type="url" />
             <p className="text-xs text-neutral-500">
               Upload logo ke Supabase Storage, paste URL di sini.
             </p>
           </div>
           <div>
             <Label>Primary Color</Label>
             <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
           </div>
           
           <div className="flex gap-2">
             <Button variant="outline" onClick={handlePreview} disabled={isPreviewing}>
               {isPreviewing ? 'Loading...' : 'Preview PDF'}
             </Button>
             <Button onClick={handleSave} disabled={!previewPdfUrl}>
               Simpan (Preview dulu)
             </Button>
           </div>
         </div>
         
         <div>
           <Label>Preview</Label>
           {previewPdfUrl ? (
             <iframe src={previewPdfUrl} className="w-full h-96 border" />
           ) : (
             <div className="w-full h-96 border flex items-center justify-center text-neutral-400">
               Klik "Preview PDF" untuk melihat hasil
             </div>
           )}
         </div>
       </div>
     );
   }
   ```
2. Integrate `LayoutCustomizer` ke `/admin/proposal-settings/page.tsx` — tambah tab "Layout" atau collapsible section.
3. Test manual: edit header → preview → verify PDF punya header baru → save → generate real proposal → verify.

### Jangan

- **JANGAN** enable Save button sebelum preview di-generate minimal sekali (R-43).
- **JANGAN** cache preview blob URL tanpa revoke — memory leak.
- **JANGAN** allow logo URL yang bukan HTTPS Supabase Storage — security surface.

### Verifikasi

- [ ] Preview works before save
- [ ] Save persist ke DB
- [ ] Generated PDF pakai layout baru

---

## PHASE 3C-8 — Frontend: DOCX Download Button (OPTIONAL — Skip Kalau DOCX Skip)

**SKIP kalau Phase 3C-2 = Skip.**

### Kerjakan (Kalau Execute)

1. Tambah tombol "Download DOCX" di `ProposalGeneratorPanel` (samping "Download PDF").
2. Handler mirip R-32 JWT workaround pattern, tapi endpoint `.docx`.
3. Test download, open di Word / Google Docs / LibreOffice.

---

## 🛑 STOP GATE 3C-3 — Visual QA + PDF/DOCX Fidelity Test

**E2E tests:**
1. Edit layout → preview → save → generate proposal → download PDF → verify header/footer/logo
2. DOCX download (kalau execute) → open di Word → verify content
3. Regression Slice 2 (default layout still works kalau semua field kosong)
4. Regression Slice 3A + 3B
5. Klien review 3 sample PDF dengan layout baru — approve tolerance

---

## PHASE 3C-9 — Merge + Prod Deploy + Client Demo

Similar dengan 3A-9. Tag: `epic4B-slice3c-live`.

**Setelah 3C live + monitored 2 minggu, Epic 4 fully closed** — customer facing + admin CRM + proposal generator + advanced customization all live.

---

## 🛑 STOP GATE 3C-4 — Epic 4 Fully Closed Verification

**Final verification:**

| Sub-Slice | Live Date | Adoption | Verdict |
|---|---|---|---|
| Epic 4 CF | ? | ? | ? |
| Epic 4B Slice 1 | ? | ? | ? |
| Epic 4B Slice 2 | ? | ? | ? |
| Epic 4B Slice 3A | ? | ? | ? |
| Epic 4B Slice 3B | ? | ? | ? |
| Epic 4B Slice 3C | ? | ? | ? |

Kalau semua verdict OK, close Epic 4. Update `docs/epic-breakdown/epic4_closed.md` dengan final summary + handover ke Epic 5.

---

---

# Kontingensi & Troubleshooting

## Situasi: Klien edit prompt sampai output broken

1. Login admin production
2. Buka `/admin/proposal-settings`
3. Klik "Reset ke Default" → confirm
4. Verify generate proposal kembali normal
5. Investigate history untuk lihat edit terakhir — dokumentasikan untuk briefing lanjutan dengan klien

## Situasi: Advanced Mode cost spike unexpected

1. Cek Anthropic Console usage — lihat request dengan `max_tokens` tinggi
2. Grep backend logs untuk `custom_instr_len > 0` — mungkin klien pakai Advanced Mode berlebihan
3. Kalau bug retry loop:
   - Immediately set Anthropic spending limit LOWER
   - Investigate frontend retry logic
   - Deploy fix
4. Kalau legitimate usage tapi cost concern:
   - Diskusi dengan klien — mungkin lower default `max_tokens` di settings
   - Atau tambah cost warning UI di Advanced Mode

## Situasi: Migration `proposal_settings` fail karena existing rows conflict

Kemungkinan ada previous migration attempt yang partial. Cleanup:
```sql
DROP TABLE IF EXISTS public.proposal_settings CASCADE;
DROP TABLE IF EXISTS public.proposal_settings_history CASCADE;
-- Then re-run migration fresh
```

## Situasi: Email template rendering error karena placeholder mismatch

1. Cek `available_placeholders` di DB row match yang di-provide di render context
2. Kalau klien tambah placeholder tidak documented — regex validate saat save
3. Fallback: send email dengan placeholder mentah `{{customer_name}}` (bukan crash) — perbaiki setelah delivery

## Situasi: WeasyPrint PDF layout broken karena custom CSS di header/footer

1. Test dengan minimal CSS dulu
2. WeasyPrint tidak support semua CSS3 — cek https://doc.courtbouillon.org/weasyprint/stable/features.html
3. Fallback: revert layout ke default, notify klien limitation

## Situasi: DOCX rendering jauh berbeda dari PDF

Expected — R-42 sudah warning. Options:
1. Manage klien expectation — "DOCX approximate, PDF authoritative"
2. Refine `docx_service.py` HTML→DOCX converter (butuh iterasi 1-2 hari)
3. Deprecate DOCX kalau maintenance burden > value

---

# Ringkasan File per Sub-Slice

## Sub-Slice 3A

**Backend baru:**
- `backend/services/proposal_settings_service.py`
- `backend/routers/proposal_settings.py`
- Migrations: `_add_proposal_settings.sql`, `_add_proposal_settings_history_and_trigger.sql`

**Backend refactored (Slice 2 touch):**
- `backend/services/proposal_generator.py`
- `backend/prompts/proposal_prompt.py`
- `backend/routers/proposals.py`
- `backend/dependencies.py`

**Frontend baru:**
- `app/admin/proposal-settings/page.tsx`
- `components/admin/settings/PromptEditor.tsx`
- `components/admin/settings/HistoryPanel.tsx`
- `lib/api/proposal-settings.ts`

**Frontend refactored (Slice 2 touch):**
- `components/admin/lead/ProposalGeneratorPanel.tsx`
- `lib/api/proposals.ts`
- `lib/api/types.ts`

**Docs baru:**
- `docs/client-briefings/3A_prompt_engineering_briefing.md`
- `docs/epic-breakdown/slice3_execution_log.md` (updated)

## Sub-Slice 3B

**Backend baru:**
- `backend/services/email_templates_service.py`
- `backend/services/wa_templates_service.py`
- `backend/routers/templates.py`
- Migration: `_add_email_wa_templates.sql`

**Backend refactored:**
- `backend/services/email_service.py` (Epic 4 CF touch)
- Slice 1 WA rendering location (varies)

**Frontend baru:**
- `app/admin/email-templates/page.tsx`
- `components/admin/settings/EmailTemplateEditor.tsx`
- `components/admin/settings/WATemplateEditor.tsx`
- `lib/api/templates.ts`

## Sub-Slice 3C

**Backend baru:**
- `backend/services/docx_service.py` (OPTIONAL)
- Migration: `_extend_proposal_settings_layout.sql`

**Backend refactored:**
- `backend/services/pdf_service.py` (Slice 2 touch)
- `backend/routers/proposal_settings.py` (add layout-preview endpoint)

**Frontend baru:**
- `components/admin/settings/LayoutCustomizer.tsx`
- Integration ke `app/admin/proposal-settings/page.tsx`

**Frontend refactored (OPTIONAL DOCX):**
- `components/admin/lead/ProposalGeneratorPanel.tsx` (DOCX download button)

---

# Catatan Penutup

Slice 3 adalah **enhancement, bukan MVP**. Guide ini di-lock di versi 1.0 supaya Anda punya roadmap tapi eksekusi harus **triggered by klien feedback + usage data**, bukan calendar atau completeness urge.

## Pushback yang perlu Anda evaluasi ulang kalau di-execute nanti

### 1. Sub-slice independence discipline

Godaan besar setelah 3A live: "sekalian aja lah 3B + 3C sekaligus." **Jangan.** Tiap sub-slice = 1 hipotesis usage. 3A adoption rendah = tidak ada basis empiris untuk 3B/3C. Kalau merge sekaligus, Anda amplify sunk cost fallacy.

### 2. Prompt sebagai IP kritis vs klien empowerment tension

R-40 (structured editor) + R-41 (briefing) adalah kompromi antara:
- **Klien empowerment** (bisa customize)
- **IP protection** (prompt engineering knowledge Anda tetap valuable)
- **Quality guardrail** (klien tidak rusak baseline)

Kompromi ini imperfect. Kalau klien sangat sophisticated → kompromi overkill. Kalau klien sangat non-technical → kompromi tidak cukup, Anda tetap yang akan fix output quality.

**Trigger reconsider:** kalau 3A adoption tinggi tapi quality complaints juga naik — R-40 tidak cukup, mungkin butuh **guided prompt templates** (klien pilih dari 3-5 preset, tidak edit free-form).

### 3. DOCX skip default

Default skip di R-42 adalah opinionated. Justifikasi: PDF-only 95% cukup untuk B2B proposal. Kalau ternyata klien konsisten minta DOCX → data itu justifikasi execute, tapi jangan build DOCX "untuk jaga-jaga."

### 4. Cross-slice touch discipline mahal

Sub-Slice 3A touch heavily Slice 2 code. Setiap refactor Slice 2 = regression risk. Cost: extra E2E testing di setiap Gate + backup tags (`pre-3aX-...`) untuk emergency revert. Ini bukan overhead, ini insurance.

### 5. Post-launch monitoring 2 minggu mandatory

Godaan besar: "3A live minggu ini, 3B minggu depan." **Jangan.** 2 minggu monitoring bukan arbitrary — itu waktu minimum untuk klien build habit + Anda collect usage data yang meaningful.

---

**Trigger reminder:** Kalau Anda buka guide ini < 2 minggu setelah Slice 2 live, tutup dulu. Baca task breakdown catatan penutup Anda sendiri. Slice 3 execution tanpa validated demand = feature yang tidak dipakai + tech debt yang harus di-maintain.

**File:** `docs/execution-guides/CLAUDE_CODE_GUIDE_epic4B_slice3_advanced-customization.md`
**Version:** 1.0 — {tanggal generate}
**Author:** Ach. Jazilul Qutbi
