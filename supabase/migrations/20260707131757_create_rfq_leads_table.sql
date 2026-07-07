-- Create rfq_leads table
-- Epic 4 Customer-Facing (E4-CF-DB-01) — leads dari form /minta-penawaran.
CREATE TABLE IF NOT EXISTS public.rfq_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    position VARCHAR(100),
    industry_type VARCHAR(100) NOT NULL,
    salt_types TEXT[] NOT NULL,
    volume_per_month DECIMAL(10, 2) NOT NULL CHECK (volume_per_month > 0),
    delivery_frequency VARCHAR(50) NOT NULL,
    delivery_city VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    whatsapp VARCHAR(20) NOT NULL,
    notes TEXT,
    admin_notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'new',
    proposal_html TEXT,
    proposal_generated BOOLEAN NOT NULL DEFAULT FALSE,
    proposal_generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT rfq_leads_status_check
        CHECK (status IN ('new', 'contacted', 'sample_sent', 'negotiation', 'deal', 'lost')),
    CONSTRAINT rfq_leads_frequency_check
        CHECK (delivery_frequency IN ('weekly', 'biweekly', 'monthly'))
);

-- Indexes for common queries
CREATE INDEX idx_rfq_leads_status ON public.rfq_leads(status);
CREATE INDEX idx_rfq_leads_created_at ON public.rfq_leads(created_at DESC);
CREATE INDEX idx_rfq_leads_email ON public.rfq_leads(email);
CREATE INDEX idx_rfq_leads_industry ON public.rfq_leads(industry_type);

-- Trigger auto-update updated_at (reuse function dari migration company_settings)
CREATE TRIGGER trigger_rfq_leads_set_updated_at
    BEFORE UPDATE ON public.rfq_leads
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Comment untuk dokumentasi
COMMENT ON TABLE public.rfq_leads IS 'Leads dari form Minta Penawaran (/minta-penawaran) — Epic 4 Customer-Facing';
COMMENT ON COLUMN public.rfq_leads.salt_types IS 'Array slug produk yang dipilih customer (mis. ["garam-halus-yodium"])';
COMMENT ON COLUMN public.rfq_leads.admin_notes IS 'Catatan internal admin — belum dipakai di slice customer-facing, di-include untuk schema stability menjelang Epic 4B admin panel';
COMMENT ON COLUMN public.rfq_leads.proposal_html IS 'HTML proposal hasil generate AI — diisi di Epic 4B Admin Panel Slice 2, NULL di slice customer-facing';
COMMENT ON COLUMN public.rfq_leads.proposal_generated_at IS 'Timestamp kapan proposal di-generate — untuk admin analytics, diisi di Epic 4B Slice 2';
