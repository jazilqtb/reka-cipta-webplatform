-- Epic 4B Slice 3B (E4B-S3B-DB-02) — RLS email_templates + wa_templates.
-- Same pattern as proposal_settings (Slice 3A): backend uses service
-- role for writes; these are defense-in-depth for direct Supabase calls
-- from an authenticated admin session.

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read email_templates"
  ON public.email_templates FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Admin can update email_templates"
  ON public.email_templates FOR UPDATE TO authenticated USING (TRUE) WITH CHECK (TRUE);

ALTER TABLE public.wa_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read wa_templates"
  ON public.wa_templates FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Admin can update wa_templates"
  ON public.wa_templates FOR UPDATE TO authenticated USING (TRUE) WITH CHECK (TRUE);

-- No INSERT/DELETE policy on either table — rows are seeded by migration
-- (1 per template_type / status_key), never created/removed at runtime.
