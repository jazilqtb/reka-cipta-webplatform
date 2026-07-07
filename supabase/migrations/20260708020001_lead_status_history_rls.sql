-- RLS lead_status_history
-- Epic 4B Slice 1 (E4B-S1-DB-02) — hanya trigger yang boleh insert;
-- tidak ada policy INSERT/UPDATE/DELETE untuk role manapun.

ALTER TABLE public.lead_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read history"
    ON public.lead_status_history FOR SELECT TO authenticated USING (TRUE);
