-- Enable RLS
ALTER TABLE public.rfq_leads ENABLE ROW LEVEL SECURITY;

-- Policy: Public bisa INSERT (submit RFQ dari form public /minta-penawaran).
-- Backend legit pakai service_role (bypass RLS) — policy ini defense in
-- depth kalau ada frontend direct insert. WITH CHECK mengunci state awal
-- supaya anon tidak bisa preset status/admin fields via direct Supabase call.
CREATE POLICY "Public can submit RFQ"
    ON public.rfq_leads
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        status = 'new'
        AND proposal_generated = FALSE
        AND admin_notes IS NULL
        AND proposal_html IS NULL
    );

-- Policy: Authenticated (admin) bisa SELECT semua leads
CREATE POLICY "Admin can read all RFQ"
    ON public.rfq_leads
    FOR SELECT
    TO authenticated
    USING (TRUE);

-- Policy: Authenticated (admin) bisa UPDATE (status, admin_notes, proposal, dst — Epic 4B)
CREATE POLICY "Admin can update RFQ"
    ON public.rfq_leads
    FOR UPDATE
    TO authenticated
    USING (TRUE)
    WITH CHECK (TRUE);

-- Policy: Authenticated (admin) bisa DELETE
CREATE POLICY "Admin can delete RFQ"
    ON public.rfq_leads
    FOR DELETE
    TO authenticated
    USING (TRUE);
