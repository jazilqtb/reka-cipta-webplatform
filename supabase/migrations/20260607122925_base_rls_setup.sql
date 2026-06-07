-- ============================================================
-- BASE RLS SETUP — CV Reka Cipta Indonesia
-- Output: E1-ENG-10
-- ============================================================

-- Helper function: dipakai di semua policy sebagai shorthand
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
$$;

-- Grant execute ke semua role
GRANT EXECUTE ON FUNCTION is_authenticated() TO anon, authenticated;