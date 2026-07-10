-- Epic 4B Slice 3A (E4B-S3A-DB-01) — Editable proposal prompt + Advanced
-- Mode defaults. Single-row settings table (id locked to 1) so the admin
-- panel always edits exactly one config, no list/select UI needed.
--
-- IMPORTANT CONTEXT: Slice 3 trigger criteria (task breakdown "Trigger
-- Criteria" section — Slice 1+2 live 2+ weeks, 5+ real proposals sent,
-- explicit client request) are NOT yet met at the time this migration was
-- written. This was implemented ahead of trigger per explicit instruction
-- to have the code ready (so nothing errors once an Anthropic API key is
-- available), not as a signal that Slice 3 should go live. Do not wire
-- this into a client demo without re-checking the trigger criteria first.
--
-- R-40 (structured prompt editor): 4 separate sections (role/task/
-- constraints/output_format) instead of 1 free-form textarea, so an
-- admin editing the prompt can't accidentally wipe out a whole section.

CREATE TABLE IF NOT EXISTS public.proposal_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),

  -- Prompt sections (R-40) — joined by ProposalSettings.build_full_prompt()
  prompt_role TEXT NOT NULL,
  prompt_task TEXT NOT NULL,
  prompt_constraints TEXT NOT NULL,
  prompt_output_format TEXT NOT NULL,

  -- Advanced Mode defaults (R-38) — overridable per-request via optional
  -- temperature/max_tokens params on POST /rfq/leads/{id}/generate-proposal
  default_temperature NUMERIC(3,2) NOT NULL DEFAULT 0.7
    CHECK (default_temperature BETWEEN 0 AND 1.5),
  default_max_tokens INT NOT NULL DEFAULT 4096
    CHECK (default_max_tokens BETWEEN 500 AND 8000),

  -- Model hardcoded intentionally elsewhere too (AR-01) — kept here so a
  -- future model swap is a data change, not necessarily a redeploy.
  model_id TEXT NOT NULL DEFAULT 'claude-haiku-4-5-20251001',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE TRIGGER trigger_proposal_settings_set_updated_at
  BEFORE UPDATE ON public.proposal_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ─── Versioning / rollback support (R-41) ──────────────────
-- Snapshot of the OLD row is captured before every UPDATE, so "Reset ke
-- Default" always has an escape hatch and admins can undo a bad prompt
-- edit without calling the developer.

CREATE TABLE IF NOT EXISTS public.proposal_settings_history (
  id BIGSERIAL PRIMARY KEY,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_proposal_settings_history_created_at
  ON public.proposal_settings_history (created_at DESC);

CREATE OR REPLACE FUNCTION public.snapshot_proposal_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.proposal_settings_history (snapshot, created_by)
  VALUES (row_to_json(OLD)::JSONB, OLD.updated_by);

  -- Keep only the last 10 snapshots — this is an undo buffer, not an
  -- audit log; unbounded growth isn't worth the storage for MVP.
  DELETE FROM public.proposal_settings_history
  WHERE id NOT IN (
    SELECT id FROM public.proposal_settings_history
    ORDER BY created_at DESC LIMIT 10
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_snapshot_proposal_settings
  BEFORE UPDATE ON public.proposal_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.snapshot_proposal_settings();

-- ─── Seed default row ───────────────────────────────────────
-- Extracted verbatim from backend/prompts/proposal_prompt.py SYSTEM_PROMPT
-- v1 (docs/prompts/proposal_prompt_v1.md), split into the 4 R-40 sections.
-- This IS the Slice 2 baseline — ProposalSettings.hardcoded_default() in
-- Python mirrors this exact text as the R-37 fallback when this row is
-- missing/corrupt, so Quick Mode behavior is identical whether it reads
-- from this table or falls back to the Python constant.

INSERT INTO public.proposal_settings (
  id, prompt_role, prompt_task, prompt_constraints, prompt_output_format,
  default_temperature, default_max_tokens, model_id
) VALUES (
  1,
  'Anda adalah proposal writer profesional untuk CV Reka Cipta Indonesia, distributor garam industri dari Surabaya.',
  E'Tulis proposal penawaran garam industri dalam format HTML valid untuk calon partner yang meng-submit RFQ (Request for Quotation).\n\nSTRUKTUR PROPOSAL (5 section, wajib ada semua):\n1. <h1>Pembukaan personal — sapa PIC dengan nama, mention perusahaan calon partner\n2. <h2>Tentang CV Reka Cipta — 1 paragraf company introduction dari data yang di-provide\n3. <h2>Rekomendasi Produk — table atau list produk yang cocok berdasarkan RFQ, include spec teknis dari data produk\n4. <h2>Term Penawaran — volume, frekuensi, kota tujuan (sesuai request), pricing placeholder ("Harga akan dikonfirmasi tim sales via WhatsApp")\n5. <h2>Penutup — CTA follow-up dalam 1x24 jam via WhatsApp, tanda tangan tim sales',
  E'- Bahasa Indonesia formal bisnis (avoid slang)\n- Tone profesional tapi hangat (bukan robot)\n- Panjang: 400-800 kata\n- Format HTML valid dengan inline CSS minimal\n- JANGAN include informasi harga aktual — sebutkan "akan dikonfirmasi via sales"\n- JANGAN mengarang spec produk — hanya pakai data yang di-provide\n- JANGAN sertakan email atau WhatsApp Reka Cipta — cukup mention nama Tim Sales',
  E'STYLING HTML:\nGunakan inline CSS untuk kompatibilitas WeasyPrint:\n- Font: \'Liberation Sans\', sans-serif\n- Heading color: #0B7D6E (brand teal)\n- Body text color: #1F2937\n- Table borders visible, padding cell 8px\n- Section spacing margin-top 24px\n\nOUTPUT:\nReturn HTML dengan <html><head><style>...</style></head><body>...</body></html> lengkap.\nJangan wrap dengan markdown code block. Return raw HTML.',
  0.7,
  4096,
  'claude-haiku-4-5-20251001'
)
ON CONFLICT (id) DO NOTHING;
