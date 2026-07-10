-- Epic 4B Slice 3A (E4B-S3A-DB-02) — RLS proposal_settings + history.
-- Same pattern as rfq_leads/lead_status_history: backend uses service
-- role (bypasses RLS) for writes; these policies are defense-in-depth
-- for any direct Supabase call from an authenticated admin session.

ALTER TABLE public.proposal_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read proposal_settings"
  ON public.proposal_settings FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Admin can update proposal_settings"
  ON public.proposal_settings FOR UPDATE TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- No INSERT/DELETE policy — single row (id=1) is seeded by migration,
-- never created/removed at runtime.

ALTER TABLE public.proposal_settings_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read proposal_settings_history"
  ON public.proposal_settings_history FOR SELECT TO authenticated USING (TRUE);

-- No INSERT/UPDATE/DELETE policy — only the snapshot trigger writes here.
