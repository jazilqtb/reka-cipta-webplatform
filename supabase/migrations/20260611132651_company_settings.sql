-- ============================================================
-- Migration: company_settings
-- Epic 2 · Slice 1 · CV Reka Cipta Indonesia
--
-- Tabel konfigurasi global yang bisa diedit admin tanpa deploy.
-- RLS Pattern A: Public READ (anon), Auth WRITE (authenticated)
-- Ref: ARCHITECTURE.md §13.2
-- ============================================================

-- ─── 1. Tabel ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.company_settings (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  key         VARCHAR(100) NOT NULL,
  value       TEXT         NOT NULL DEFAULT '',
  label       VARCHAR(200) NOT NULL DEFAULT '',
  description TEXT                  DEFAULT '',
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),

  CONSTRAINT company_settings_key_unique UNIQUE (key)
);

COMMENT ON TABLE  public.company_settings             IS 'Konfigurasi global perusahaan. Diedit via /admin/settings.';
COMMENT ON COLUMN public.company_settings.key         IS 'Identifier unik, contoh: whatsapp_1, partner_count';
COMMENT ON COLUMN public.company_settings.value       IS 'Nilai konfigurasi dalam bentuk TEXT';
COMMENT ON COLUMN public.company_settings.label       IS 'Label human-readable untuk admin form';
COMMENT ON COLUMN public.company_settings.description IS 'Hint singkat yang tampil di bawah input admin';

-- ─── 2. Trigger: auto-update updated_at ───────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_company_settings_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ─── 3. Row Level Security ────────────────────────────────
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Siapapun (termasuk anonymous) bisa SELECT
CREATE POLICY "public_read_settings"
  ON public.company_settings
  FOR SELECT
  USING (true);

-- Hanya user yang sudah login (admin) yang bisa INSERT/UPDATE/DELETE
CREATE POLICY "auth_write_settings"
  ON public.company_settings
  FOR ALL
  TO authenticated
  USING     (auth.uid() IS NOT NULL)
  WITH CHECK(auth.uid() IS NOT NULL);

-- ─── 4. Index ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_company_settings_key
  ON public.company_settings (key);
