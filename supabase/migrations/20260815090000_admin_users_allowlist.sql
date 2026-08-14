-- Checkpoint 1 — Auth/Authorization hardening
-- Migrasi ADDITIVE: tabel allowlist admin + helper is_admin().
--
-- LATAR BELAKANG (temuan audit 2026-08-15):
-- Sebelum migrasi ini, sistem TIDAK punya konsep "admin" sama sekali:
--   1. middleware.ts hanya cek `!user`  -> siapa pun yang login lolos
--   2. app/admin/layout.tsx idem
--   3. RLS memberi CRUD penuh ke role `authenticated` dgn USING (TRUE)
--   4. backend get_current_user() mengembalikan payload JWT tanpa cek klaim
-- Ditambah `disable_signup = false` di project Supabase (terverifikasi via
-- GET /auth/v1/settings), artinya SIAPA PUN bisa mendaftar sendiri lalu
-- mendapat akses tulis penuh. Ini kerentanan kritis yang hidup.
--
-- KENAPA TABEL ALLOWLIST, BUKAN app_metadata.role:
-- - Murni additive; tidak menyentuh skema `auth.*` milik Supabase.
-- - Bisa dikelola lewat SQL/dashboard biasa, tidak perlu Admin API.
-- - Mudah diaudit (siapa admin = satu SELECT) dan mudah dicabut.
-- - Tidak bergantung pada custom claim yang harus disuntik ke JWT.

-- ─────────────────────────────────────────────────────────────
-- 1. Tabel allowlist
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    note        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.admin_users IS
    'Allowlist akun yang boleh mengakses /admin/*. Keanggotaan di tabel ini '
    'adalah SATU-SATUNYA sumber kebenaran otorisasi admin — dicek di RLS '
    '(via public.is_admin()), di middleware Next.js, dan di backend FastAPI.';

-- ─────────────────────────────────────────────────────────────
-- 2. Helper is_admin()
--    SECURITY DEFINER supaya bisa membaca admin_users tanpa terjebak
--    rekursi RLS (policy di admin_users sendiri memanggil fungsi ini).
--    search_path dikunci — mencegah search_path hijacking pada fungsi
--    SECURITY DEFINER (praktik standar PostgreSQL).
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
    );
$$;

COMMENT ON FUNCTION public.is_admin() IS
    'TRUE jika auth.uid() terdaftar di public.admin_users. Dipakai sebagai '
    'predikat RLS untuk seluruh tabel admin-only.';

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon, service_role;

-- ─────────────────────────────────────────────────────────────
-- 3. RLS untuk admin_users itu sendiri
--    Hanya admin yang boleh melihat daftar admin. TIDAK ada policy
--    INSERT/UPDATE/DELETE: penambahan admin baru HARUS lewat service
--    role (SQL editor / migrasi), tidak bisa lewat sesi user biasa —
--    mencegah privilege escalation mandiri.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_users_select_admin" ON public.admin_users;
CREATE POLICY "admin_users_select_admin"
    ON public.admin_users
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- ─────────────────────────────────────────────────────────────
-- 4. Seed admin pertama
--    Dipilih deterministik = akun paling awal dibuat (akun pendiri),
--    BUKAN UUID/email hardcoded — supaya tidak ada PII di file migrasi
--    yang ikut ter-commit ke Git.
--    Idempoten: aman dijalankan ulang.
-- ─────────────────────────────────────────────────────────────
INSERT INTO public.admin_users (user_id, note)
SELECT id, 'seed: akun admin pendiri (user paling awal)'
FROM auth.users
ORDER BY created_at ASC
LIMIT 1
ON CONFLICT (user_id) DO NOTHING;
