-- Enable RLS
ALTER TABLE public.supplier_registrations ENABLE ROW LEVEL SECURITY;

-- Policy: Public bisa INSERT (submit dari form public /jadi-supplier).
-- Backend legit pakai service_role (bypass RLS) — policy ini defense in
-- depth kalau ada frontend direct insert. WITH CHECK mengunci state awal
-- supaya anon tidak bisa preset status/admin_notes via direct Supabase call.
CREATE POLICY "Public can submit supplier registration"
    ON public.supplier_registrations
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        status = 'new'
        AND admin_notes IS NULL
    );

-- Policy: Authenticated (admin) bisa SELECT semua supplier registrations
CREATE POLICY "Admin can read all suppliers"
    ON public.supplier_registrations
    FOR SELECT
    TO authenticated
    USING (TRUE);

-- Policy: Authenticated (admin) bisa UPDATE (status, admin_notes, dst — Epic 5 Admin Panel)
CREATE POLICY "Admin can update suppliers"
    ON public.supplier_registrations
    FOR UPDATE
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

-- Policy: Authenticated (admin) bisa DELETE
CREATE POLICY "Admin can delete suppliers"
    ON public.supplier_registrations
    FOR DELETE
    TO authenticated
    USING (TRUE);
