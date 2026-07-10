-- Epic 4B Slice 3B (E4B-S3B-DB-01) — Editable email confirmation template
-- (Epic 4 CF) + WA templates per status (Slice 1). Key-value store per
-- template_type / status_key, seeded from the current hardcoded content
-- so switching to DB-backed rendering doesn't change output on day one.
--
-- IMPORTANT CONTEXT: same as proposal_settings (Slice 3A) — implemented
-- ahead of Slice 3 trigger criteria per explicit instruction to have the
-- code ready, not as a signal this should go live without re-checking
-- trigger criteria first.
--
-- Placeholder syntax: {{name}}, replaced via literal string substitution
-- (EmailTemplatesService/WATemplatesService._replace_placeholders), NOT
-- Python .format() — the original wa_template_service.py already flagged
-- .format() as unsafe once templates become admin-editable (a malicious
-- or accidental "{}" in admin input would crash .format()); {{...}}
-- replace has no such injection surface.

CREATE TABLE IF NOT EXISTS public.email_templates (
  id BIGSERIAL PRIMARY KEY,
  template_type TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL,
  available_placeholders JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE TRIGGER trigger_email_templates_set_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE IF NOT EXISTS public.wa_templates (
  id BIGSERIAL PRIMARY KEY,
  status_key TEXT UNIQUE NOT NULL
    CHECK (status_key IN ('new', 'contacted', 'sample_sent', 'negotiation', 'deal', 'lost')),
  template_text TEXT NOT NULL,
  available_placeholders JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE TRIGGER trigger_wa_templates_set_updated_at
  BEFORE UPDATE ON public.wa_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ─── Seed: email_templates ──────────────────────────────────
-- Content identical to EmailService.send_rfq_customer_confirmation
-- (backend/services/email_service.py) at time of writing, just with
-- inline f-string values swapped for {{placeholder}} tokens.

INSERT INTO public.email_templates (template_type, subject, body_html, body_text, available_placeholders)
VALUES (
  'rfq_confirmation',
  '[CV Reka Cipta] Konfirmasi Permintaan Penawaran — {{company_name}}',
  E'<p>Halo {{full_name}},</p>\n<p>Terima kasih atas ketertarikan Anda pada produk kami: <strong>{{product_names}}</strong>.</p>\n<p>Kami sudah menerima permintaan penawaran Anda dan tim kami akan menyiapkan proposal khusus sesuai kebutuhan {{company_name}} ({{volume_per_month}} ton/{{frequency_label}}, pengiriman ke {{delivery_city}}).</p>\n<p>Tim kami akan menghubungi Anda via WhatsApp di {{whatsapp_masked}} dalam 1×24 jam dengan proposal lengkap.</p>\n<p>Kalau ada pertanyaan mendesak, silakan reply email ini.</p>\n<p>Salam,<br>Tim CV Reka Cipta Indonesia</p>',
  E'Halo {{full_name}},\n\nTerima kasih atas ketertarikan Anda pada produk kami: {{product_names}}.\n\nKami sudah menerima permintaan penawaran Anda dan tim kami akan menyiapkan proposal khusus sesuai kebutuhan {{company_name}} ({{volume_per_month}} ton/{{frequency_label}}, pengiriman ke {{delivery_city}}).\n\nTim kami akan menghubungi Anda via WhatsApp di {{whatsapp_masked}} dalam 1x24 jam dengan proposal lengkap.\n\nKalau ada pertanyaan mendesak, silakan reply email ini.\n\nSalam,\nTim CV Reka Cipta Indonesia',
  '["{{full_name}}", "{{product_names}}", "{{company_name}}", "{{volume_per_month}}", "{{frequency_label}}", "{{delivery_city}}", "{{whatsapp_masked}}"]'::jsonb
)
ON CONFLICT (template_type) DO NOTHING;

-- ─── Seed: wa_templates ──────────────────────────────────────
-- Content identical to WA_TEMPLATES dict (backend/services/
-- wa_template_service.py) at time of writing, {name} -> {{name}}.

INSERT INTO public.wa_templates (status_key, template_text, available_placeholders) VALUES
(
  'new',
  E'Halo {{full_name}},\n\nTerima kasih atas permintaan penawaran dari {{company_name}}.\n\nKami sudah menerima detail kebutuhan Anda ({{volume}} ton/{{frequency}}). Tim kami sedang menyiapkan proposal khusus dan akan mengirim ke email {{email}} dalam 1x24 jam.\n\nKalau ada pertanyaan mendesak, silakan reply pesan ini.\n\nSalam,\nTim CV Reka Cipta Indonesia',
  '["{{full_name}}", "{{company_name}}", "{{volume}}", "{{frequency}}", "{{email}}"]'::jsonb
),
(
  'contacted',
  E'Halo {{full_name}},\n\nSaya {{admin_name}} dari CV Reka Cipta Indonesia. Terkait permintaan penawaran garam untuk {{company_name}}, apakah proposal yang kami kirim via email sudah diterima?\n\nKalau ada pertanyaan atau butuh diskusi lebih lanjut, saya siap membantu.',
  '["{{full_name}}", "{{admin_name}}", "{{company_name}}"]'::jsonb
),
(
  'sample_sent',
  E'Halo {{full_name}},\n\nUpdate pengiriman sampel {{product_names}} untuk {{company_name}}:\n\nNomor resi: [ISI RESI]\nEstimasi tiba: [ISI ESTIMASI]\n\nMohon konfirmasi setelah sampel diterima. Terima kasih.',
  '["{{full_name}}", "{{product_names}}", "{{company_name}}"]'::jsonb
),
(
  'negotiation',
  E'Halo {{full_name}},\n\nTerkait diskusi harga garam untuk kebutuhan {{company_name}} ({{volume}} ton/{{frequency}}), berikut poin penawaran:\n\n- [POIN 1]\n- [POIN 2]\n- [POIN 3]\n\nMohon feedback dan kita bisa lanjut ke tahap final. Terima kasih.',
  '["{{full_name}}", "{{company_name}}", "{{volume}}", "{{frequency}}"]'::jsonb
),
(
  'deal',
  E'Halo {{full_name}},\n\nTerima kasih atas kepercayaan {{company_name}} untuk bekerja sama dengan CV Reka Cipta Indonesia.\n\nTim kami akan segera follow up untuk proses order pertama ({{volume}} ton/{{frequency}}). Sampai jumpa!',
  '["{{full_name}}", "{{company_name}}", "{{volume}}", "{{frequency}}"]'::jsonb
),
(
  'lost',
  E'Halo {{full_name}},\n\nTerima kasih atas waktu dan kesempatan diskusi dengan {{company_name}}. Kami memahami kebutuhan saat ini belum sesuai.\n\nKalau di kemudian hari {{company_name}} butuh garam industri lagi, kami siap membantu. Salam sukses.',
  '["{{full_name}}", "{{company_name}}"]'::jsonb
)
ON CONFLICT (status_key) DO NOTHING;
