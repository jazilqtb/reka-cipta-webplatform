-- Add proposal_sent_at to rfq_leads
-- Epic 4B Slice 2 (E4B-S2-BE-01) — timestamp kapan proposal terakhir
-- dikirim ke customer via email. NULL sampai admin klik "Kirim ke Customer".

ALTER TABLE public.rfq_leads
ADD COLUMN IF NOT EXISTS proposal_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN public.rfq_leads.proposal_sent_at IS 'Timestamp terakhir proposal dikirim ke customer via email — diisi POST /rfq/leads/{id}/send-proposal (Epic 4B Slice 2)';
