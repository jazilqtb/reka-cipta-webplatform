-- Create lead_status_history table + auto-log trigger
-- Epic 4B Slice 1 (E4B-S1-DB-01) — histori perubahan status rfq_leads,
-- dipakai admin panel /admin/leads/[id] untuk timeline follow-up.

CREATE TABLE IF NOT EXISTS public.lead_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.rfq_leads(id) ON DELETE CASCADE,
    from_status VARCHAR(50),  -- NULL untuk insert awal
    to_status VARCHAR(50) NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT lead_status_history_status_check
        CHECK (to_status IN ('new', 'contacted', 'sample_sent', 'negotiation', 'deal', 'lost'))
);

CREATE INDEX idx_lead_status_history_lead_id ON public.lead_status_history(lead_id);
CREATE INDEX idx_lead_status_history_changed_at ON public.lead_status_history(changed_at DESC);

COMMENT ON TABLE public.lead_status_history IS 'Auto-logged via trigger_lead_status_change — jangan insert manual dari backend (Epic 4B Slice 1, R-28)';

-- Trigger auto-log setiap perubahan status. IS DISTINCT FROM (bukan <> atau
-- !=) karena NULL-safe — <> dengan operand NULL return NULL (bukan TRUE),
-- yang bikin history gagal ter-insert saat OLD.status NULL (E4B-S1 R-25).
CREATE OR REPLACE FUNCTION public.log_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.lead_status_history (lead_id, from_status, to_status)
        VALUES (NEW.id, NULL, NEW.status);
    ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.lead_status_history (lead_id, from_status, to_status)
        VALUES (NEW.id, OLD.status, NEW.status);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- `OF status` membatasi trigger hanya fire saat kolom status di-update —
-- update admin_notes saja tidak akan trigger fungsi ini sama sekali.
CREATE TRIGGER trigger_lead_status_change
    AFTER INSERT OR UPDATE OF status ON public.rfq_leads
    FOR EACH ROW EXECUTE FUNCTION public.log_lead_status_change();
