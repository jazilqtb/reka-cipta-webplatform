-- ============================================================
-- BASE RLS PATTERNS — CV Reka Cipta Indonesia
-- Source: ARCHITECTURE.md §13.2
-- Gunakan sebagai template copy-paste untuk setiap tabel baru
-- ============================================================

-- ============================================================
-- HELPER FUNCTION: is_authenticated()
-- Digunakan di semua policy sebagai shorthand
-- ============================================================
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT auth.uid() IS NOT NULL
$$;

-- ============================================================
-- PATTERN A: Public READ, Auth WRITE
-- Digunakan untuk: company_settings, products
-- Public bisa SELECT semua. Hanya authenticated yang bisa CUD.
-- ============================================================
/*
-- Template — copy dan ganti nama tabel:

ALTER TABLE <nama_tabel> ENABLE ROW LEVEL SECURITY;

CREATE POLICY "<nama_tabel>_public_read"
  ON <nama_tabel> FOR SELECT
  USING (true);

CREATE POLICY "<nama_tabel>_auth_insert"
  ON <nama_tabel> FOR INSERT
  WITH CHECK (is_authenticated());

CREATE POLICY "<nama_tabel>_auth_update"
  ON <nama_tabel> FOR UPDATE
  USING (is_authenticated())
  WITH CHECK (is_authenticated());

CREATE POLICY "<nama_tabel>_auth_delete"
  ON <nama_tabel> FOR DELETE
  USING (is_authenticated());
*/

-- ============================================================
-- PATTERN B: Public INSERT only, Auth READ+UPDATE+DELETE
-- Digunakan untuk: rfq_leads, supplier_registrations
-- Publik bisa INSERT (submit form). Hanya auth yang bisa baca & edit.
-- ============================================================
/*
-- Template:

ALTER TABLE <nama_tabel> ENABLE ROW LEVEL SECURITY;

CREATE POLICY "<nama_tabel>_public_insert"
  ON <nama_tabel> FOR INSERT
  WITH CHECK (true);

CREATE POLICY "<nama_tabel>_auth_select"
  ON <nama_tabel> FOR SELECT
  USING (is_authenticated());

CREATE POLICY "<nama_tabel>_auth_update"
  ON <nama_tabel> FOR UPDATE
  USING (is_authenticated())
  WITH CHECK (is_authenticated());

CREATE POLICY "<nama_tabel>_auth_delete"
  ON <nama_tabel> FOR DELETE
  USING (is_authenticated());
*/

-- ============================================================
-- PATTERN C: Conditional READ (published filter), Auth full
-- Digunakan untuk: articles
-- Public SELECT hanya baris is_published = true.
-- Auth bisa semua operasi termasuk baca draft.
-- ============================================================
/*
-- Template:

ALTER TABLE <nama_tabel> ENABLE ROW LEVEL SECURITY;

CREATE POLICY "<nama_tabel>_public_read_published"
  ON <nama_tabel> FOR SELECT
  USING (
    is_published = true          -- publik hanya baca yang published
    OR is_authenticated()        -- admin bisa baca semua termasuk draft
  );

CREATE POLICY "<nama_tabel>_auth_insert"
  ON <nama_tabel> FOR INSERT
  WITH CHECK (is_authenticated());

CREATE POLICY "<nama_tabel>_auth_update"
  ON <nama_tabel> FOR UPDATE
  USING (is_authenticated())
  WITH CHECK (is_authenticated());

CREATE POLICY "<nama_tabel>_auth_delete"
  ON <nama_tabel> FOR DELETE
  USING (is_authenticated());
*/

-- ============================================================
-- PATTERN D: Auth READ+WRITE only (no public access)
-- Digunakan untuk: lead_status_history
-- Semua operasi butuh authenticated user.
-- ============================================================
/*
-- Template:

ALTER TABLE <nama_tabel> ENABLE ROW LEVEL SECURITY;

CREATE POLICY "<nama_tabel>_auth_all"
  ON <nama_tabel>
  USING (is_authenticated())
  WITH CHECK (is_authenticated());
*/