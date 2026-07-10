-- Epic 4B Slice 3C (E4B-S3C-BE-01) — Layout customizer fields (header/
-- footer text, logo URL, primary color untuk PDF proposal). Extends
-- proposal_settings (Slice 3A) di kolom yang sama — bukan tabel baru.
--
-- Default color = brand-teal-600 (#0B7D6E, CLAUDE.md) supaya proposal
-- yang belum di-customize tetap konsisten dengan brand, sama seperti
-- prompt v1 Slice 2 (STYLING HTML: Heading color #0B7D6E).

ALTER TABLE public.proposal_settings
  ADD COLUMN IF NOT EXISTS layout_header_text TEXT,
  ADD COLUMN IF NOT EXISTS layout_footer_text TEXT,
  ADD COLUMN IF NOT EXISTS layout_logo_url TEXT,
  ADD COLUMN IF NOT EXISTS layout_primary_color TEXT NOT NULL DEFAULT '#0B7D6E';
