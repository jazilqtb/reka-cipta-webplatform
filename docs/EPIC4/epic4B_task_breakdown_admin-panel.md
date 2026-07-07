# Epic 4B Task Breakdown — Admin Panel + Proposal Generator

**Project:** reka-cipta-platform
**Epic:** Epic 4 — Sistem RFQ + AI Proposal Generator
**Scope Dokumen:** Bagian **B. CRM/Admin Panel** — 3 Slice
**Version:** 1.0
**Author:** Ach. Jazilul Qutbi
**Status:** Draft — menunggu review sebelum eksekusi
**Depends on:** Epic 1, Epic 2 (semua), Epic 3 (semua), Epic 3B (semua), **Epic 4 Customer-Facing (WAJIB — supply `rfq_leads` table)**
**Blocks:** Epic 5 (Supplier Registration), Epic 6 (Artikel + Kalkulator)

---

## Framing MVP vs Post-MVP

**Anda memberi request 6 features engine proposal generator.** Analisis komprehensif menyimpulkan bahwa 3 dari 6 = fundamentally **post-MVP** kalau Anda serius dengan "MVP dulu, benar-benar tidak ada error":

| Fitur User Request | Slice | MVP? | Rasional |
|---|---|---|---|
| CRM Pipeline + Lead Management | Slice 1 | ✅ MVP | Critical — tanpa ini klien manual query DB |
| Basic Proposal Generator (Quick Mode + Anthropic Haiku) | Slice 2 | ✅ MVP | Core value proposition Epic 4 |
| System Prompt lengkap (Role, Task, Constraint sections) | Slice 3 | ❌ Post-MVP | Hardcoded prompt di Slice 2 cukup untuk MVP |
| Input Template rich text editor (heading, footer, page number) | Slice 3 | ❌ Post-MVP | High complexity, unclear demand |
| Custom header/footer/background logo di proposal | Slice 3 | ❌ Post-MVP | Klien belum tahu preferensi styling — build after usage data |
| LLM selector | Slice 3 (skip actually) | ❌ Skip | 1 provider (Anthropic Haiku) sudah reliable + murah; UI selector = speculative |
| Multi-format output (PDF/DOCX/text) | Slice 3 | ❌ Post-MVP | PDF-only untuk MVP; DOCX support di enhancement kalau klien minta |
| Quick vs Advanced mode | Split di Slice 2 & 3 | Partial | Slice 2 = Quick mode only. Advanced mode = Slice 3 (post-MVP) |
| Email confirmation template management | Slice 3 | ❌ Post-MVP | Hardcoded di Epic 4 CF cukup untuk MVP |

**Struktur eksekusi rekomendasi:**

1. **Slice 1 + Slice 2 = MVP release.** Klien punya panel Kanban + generate proposal via Quick Mode. Ini yang harus di-execute untuk claim "Epic 4 MVP done".
2. **Slice 3 = usage-driven enhancement.** Execute setelah 1-2 bulan Slice 1+2 live dan Anda punya data konkret feature apa yang klien benar-benar butuh customize. Jangan execute upfront karena speculative.

Slice 3 tetap saya spec di dokumen ini supaya Anda punya roadmap lengkap — tapi treat as **enhancement backlog**, bukan sprint immediate berikutnya.

---

## Konteks Slice

Setelah Epic 4 Customer-Facing live, klien Reka Cipta dapat notifikasi email tapi harus manual query database Supabase untuk lihat detail lead. Ini anti-pattern operasional. Epic 4B melengkapi loop dengan admin panel penuh:

- **Slice 1** — Pipeline Kanban + detail lead + WA template. Klien bisa manage leads visually.
- **Slice 2** — Quick Mode proposal generator. Klien klik "Generate Proposal" di lead detail → Anthropic Haiku generate HTML → convert ke PDF → preview → download atau kirim email ke customer.
- **Slice 3 (post-MVP)** — Advanced customization: editable system prompt, custom layout, DOCX output, email template management.

---

## Prasyarat Teknis

- [ ] Epic 4 Customer-Facing live: `rfq_leads` table populated, RLS active
- [ ] Epic 2 Slice 3 pattern reference: admin CRUD dengan Server Component + Client Form + Server Action revalidate
- [ ] Epic 3B pattern reference: `apiFetch` dengan `auth: true`, Sonner toast, react-hook-form + Zod
- [ ] Middleware auth Epic 1 active untuk `/admin/*`
- [ ] `company_settings` table punya field: `email`, `whatsapp_1`, `address`, `full_company_name`, `founding_year`, dll (context untuk proposal generation di Slice 2)
- [ ] Anthropic API key ready dan set di env production (untuk Slice 2)

---

## Keputusan Arsitektur Global Epic 4B

### AR-01 — Anthropic Model: Claude Haiku 4.5

**Chosen:** `claude-haiku-4-5-20251001` untuk Slice 2 MVP.

**Rasional:**
- Cost: ~$0.023 per proposal (input $0.80/1M, output $4/1M)
- Latency: Haiku generally < 5 detik untuk 5000 output tokens
- Quality: sufficient untuk structured Bahasa Indonesia business writing
- Konsisten dengan planning awal (userMemories)

**Alternatif** (defer sebagai enhancement):
- Claude Sonnet 4.6 — quality lebih baik ~4× cost. Upgrade kalau klien komplain quality Haiku
- Multi-provider (Gemini paid, OpenAI) — butuh abstraction layer, out of scope MVP

**Config env var:** `ANTHROPIC_API_KEY` di Railway. Model hardcoded di `backend/config.py` — bukan env var supaya perubahan model memerlukan code review.

### AR-02 — PDF Generation: WeasyPrint

**Chosen:** WeasyPrint (Python, backend-side).

**Rasional dan trade-off** sudah dijelaskan di konfirmasi awal. Ringkasan:
- Pro: simple setup, konsisten stack Python
- Con: CSS3 modern limited (no Flexbox full, no advanced grid)
- Migration path: kalau butuh advanced styling, migrate ke Puppeteer di container terpisah

**Docker consideration:** WeasyPrint butuh sistem library (`libcairo`, `libpango`, `libgdk-pixbuf`). Kalau Dockerfile backend belum handle, tambah:
```dockerfile
RUN apt-get update && apt-get install -y \
    libcairo2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    shared-mime-info
```

### AR-03 — Proposal Storage Strategy

**Chosen:** Store `proposal_html` di DB, generate PDF on-demand (tidak persist di Storage).

**Rasional:**
- HTML per proposal ~10-50 KB — trivial DB overhead
- PDF generation cepat (WeasyPrint ~1-2 detik untuk HTML complex)
- Menghindari Storage cost + orphan management
- Regenerasi PDF cheap → klien bisa "tweak HTML sedikit lalu regenerate" tanpa storage churn

**Alternatif:** Cache PDF di Supabase Storage setelah first generation. Skip untuk MVP — implement kalau klien banyak download berulang.

### AR-04 — Anthropic Service Abstraction Layer

**Chosen:** Buat service class `ProposalGeneratorService` dengan method signature yang provider-agnostic.

```python
# backend/services/proposal_generator.py
class ProposalGeneratorService:
    def __init__(self, client_provider: str = "anthropic"):
        # For MVP: hanya anthropic
        # Future: bisa init OpenAI/Gemini client
        pass

    async def generate(
        self,
        context: ProposalContext,
        options: GenerationOptions = None
    ) -> str:
        """Returns proposal HTML."""
        pass
```

Effort abstraksi minimal (~2 jam extra), pay-off future flexibility besar. Kalau klien nanti mau switch provider, tinggal implement adapter baru.

### AR-05 — WhatsApp Template Generator: Hardcoded 5 Template di Slice 1

Backend `POST /rfq/wa-template` return string template berdasarkan `status` current lead. Template hardcoded di `backend/services/wa_template_service.py`:

```python
WA_TEMPLATES = {
    'new': """Halo {full_name},
Terima kasih atas permintaan penawaran dari {company_name}...""",
    'contacted': """Halo {full_name}, saya {admin_name} dari CV Reka Cipta...""",
    'sample_sent': """Halo {full_name}, ini update pengiriman sampel...""",
    'negotiation': """Halo {full_name}, sesuai diskusi kemarin...""",
    'sample_received': """Halo {full_name}, semoga sampel sudah diterima..."""
}
```

Editability di Slice 3 (post-MVP). Jangan spec editable template UI di Slice 1.

### AR-06 — Kanban Drag-Drop: @dnd-kit

**Chosen:** `@dnd-kit/core` + `@dnd-kit/sortable`.

**Rasional:**
- Modern, actively maintained
- Accessible (keyboard navigation supported natively)
- React 19 compatible
- `react-beautiful-dnd` deprecated (Atlassian officially stopped maintenance)

**Fallback UX untuk mobile:** Dropdown per kartu lead untuk change status (bukan drag-drop di mobile — touch drag UX buruk untuk case ini).

### AR-07 — Auth Guard All Admin Endpoints

Semua endpoint di router `/rfq/leads` (Slice 1) dan `/rfq/leads/{id}/generate-proposal` (Slice 2) WAJIB `Depends(get_current_user)`. Konsisten dengan Epic 3B.

### AR-08 — Lead Status Transitions: Free (No State Machine)

MVP tidak enforce transisi valid (mis. tidak boleh `deal` → `new`). Klien bisa move card antar column bebas.

**Konsekuensi:** Data histori bisa aneh secara business logic (mis. lead move ke `deal` lalu balik ke `contacted`). Ini acceptable karena:
- Klien tahu context bisnis, tidak akan random move
- Full transition state machine = premature optimization untuk MVP

Enhancement future: state machine dengan allowed transitions matrix.

### AR-09 — Auto-Save Admin Notes: Debounced On-Blur

Textarea `admin_notes` auto-save saat blur (bukan on-change) dengan debounce 500ms sebagai safety net kalau blur cepat.

**Konsekuensi concurrent edit:** Kalau 2 admin edit bersamaan (tidak likely dengan 1-2 admin), last-write-wins. No conflict resolution UI. Simple untuk MVP.

### AR-10 — System Prompt Slice 2 MVP: Hardcoded

System prompt untuk Anthropic di-hardcode di `backend/prompts/proposal_prompt.py`. Structure:

1. Role: "Anda adalah proposal writer profesional untuk CV Reka Cipta Indonesia..."
2. Task: "Buat proposal penawaran garam industri untuk calon partner..."
3. Context: Company profile Reka Cipta (di-inject dari `company_settings`), lead data (dari `rfq_leads`), product spec (dari `products`)
4. Constraints: Format HTML, Bahasa Indonesia formal bisnis, struktur 5 section (opening, company intro, product recommendation, pricing terms placeholder, closing)
5. Output format: valid HTML string dengan inline styling minimal (kompatibel dengan WeasyPrint)

Editability di Slice 3.

### AR-11 — Pattern Reuse dari Epic 3B

`ProductEditForm` pattern dari Epic 3B Slice 1 adalah reference untuk semua admin CRUD di Epic 4B:
- Server Component wrapper + Client Form leaf
- react-hook-form + Zod
- Server Action revalidate
- `apiFetch` dengan `auth: true`
- Sonner toast success/error

Ini "template pattern" — jangan reinvent, replicate.

---

## Ringkasan Task per Slice

| Slice | UX | US | Backend | Contract | Frontend | QA | Total |
|---|---|---|---|---|---|---|---|
| **Slice 1** — CRM Pipeline | 6 | 5 | 6 | 1 | 15 | 6 | **39** |
| **Slice 2** — Proposal Generator (MVP) | 4 | 4 | 8 | 1 | 7 | 5 | **29** |
| **Slice 3** — Advanced (Post-MVP) | 5 | 4 | 6 | 1 | 10 | 5 | **31** |

**Total: 99 task across 3 slice.**

Estimasi effort:
- Slice 1: 6-9 hari (Kanban drag-drop + 4 endpoint + detail page kompleks)
- Slice 2: 5-7 hari (Anthropic integration + PDF + preview UI + email send)
- Slice 3 (kalau execute): 8-12 hari (settings engine kompleks)

**MVP timeline:** ~2-3 minggu untuk Slice 1 + Slice 2.

---

# SLICE 1 — CRM Pipeline & Lead Management

## Tujuan Slice 1

Setelah Slice 1 selesai:
1. Backend endpoints CRUD untuk leads accessible dengan JWT
2. `lead_status_history` table populated setiap status change
3. Route `/admin/leads` render Kanban 6 kolom dengan drag-drop
4. Route `/admin/leads/[id]` render detail lengkap dengan admin notes auto-save + status update + history
5. WA template modal dengan 5 template per status + tombol "Buka WhatsApp"
6. Cache invalidation setelah update: admin lain lihat data terkini
7. Demoable: klien manage leads dari Kanban, follow-up via WA, catat notes internal

---

## Layer 1 — UX Tasks (Slice 1)

### E4B-S1-UX-01 — Wireframe `/admin/leads` (Kanban)

**Priority:** P0 · **Tags:** `wireframe` `admin` `complex`

**File:** `docs/wireframes/Epic4B_slice1_admin-leads-kanban.md`

**Struktur:**
```
┌──────────────────────────────────────────────────────────────┐
│  <AdminLayout>                                               │
│  ┌───────┬────────────────────────────────────────────────┐ │
│  │Sidebar│  Header: "Pipeline Leads"  [Filter▾][Search..] │ │
│  │       │                                                 │ │
│  │       │  ┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐┌─────┐  │ │
│  │       │  │Baru ││Dihu-││Sam- ││Nego-││Deal ││Tidak│  │ │
│  │       │  │ (5) ││bungi││pel  ││siasi││ (2) ││Jadi │  │ │
│  │       │  │     ││ (3) ││ (2) ││ (4) ││     ││ (1) │  │ │
│  │       │  ├─────┤├─────┤├─────┤├─────┤├─────┤├─────┤  │ │
│  │       │  │Card ││Card ││Card ││Card ││Card ││Card │  │ │
│  │       │  │Card ││Card ││Card ││Card ││Card ││     │  │ │
│  │       │  │Card ││Card ││     ││Card ││     ││     │  │ │
│  │       │  │Card ││     ││     ││Card ││     ││     │  │ │
│  │       │  │Card ││     ││     ││     ││     ││     │  │ │
│  │       │  └─────┘└─────┘└─────┘└─────┘└─────┘└─────┘  │ │
│  │       │                                                 │ │
│  │       │  Total: 17 leads                                │ │
│  └───────┴────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**Interactions:**
- Drag-drop card antar column → status update via PATCH
- Klik card → navigate ke `/admin/leads/{id}`
- Filter panel: industri, rentang tanggal (from/to)
- Search: cari nama/perusahaan (client-side filter dari fetched data)

**Responsive:**
- Desktop (≥1280px): 6 kolom sejajar dengan horizontal scroll kalau viewport sempit
- Tablet (768-1279px): 6 kolom dengan horizontal scroll wajib
- Mobile (<768px): single column view dengan status filter dropdown; drag-drop disabled, ganti dropdown "Ubah Status" per card

**Verifikasi:** Wireframe committed dengan mobile alternative spec explicit.

---

### E4B-S1-UX-02 — Wireframe `/admin/leads/[id]` (Detail)

**Priority:** P0 · **Tags:** `wireframe` `admin`

**File:** `docs/wireframes/Epic4B_slice1_admin-lead-detail.md`

**Struktur:**
```
┌──────────────────────────────────────────────────────────────┐
│  <AdminLayout>                                               │
│  Breadcrumb: Leads / {Company Name}                          │
│  Header: {Company Name} — {Industry}                         │
│  [Status Badge] Last update: 2 hari yang lalu                │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ [Row 1: 2 kolom]                                        ││
│  │                                                         ││
│  │ ┌── Informasi RFQ ──────┐  ┌── Status & Aksi ────────┐ ││
│  │ │ Nama:      Ahmad F     │  │ Status: [Dihubungi ▾] │ ││
│  │ │ Perusahaan: PT XYZ     │  │                       │ ││
│  │ │ Jabatan:   Manager     │  │ [Buat Pesan WA]       │ ││
│  │ │ Email:     ...         │  │                       │ ││
│  │ │ WA:        +62812...   │  │ Preview Proposal:     │ ││
│  │ │ Industri:  Makanan     │  │ [Belum digenerate]    │ ││
│  │ │ Produk:    PRO YD      │  │ (button di Slice 2)   │ ││
│  │ │ Volume:    50 ton/bln  │  │                       │ ││
│  │ │ Kota:      Jakarta     │  └───────────────────────┘ ││
│  │ │ Keterangan: ...        │                             ││
│  │ └───────────────────────┘                             ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  ┌─── Catatan Admin ─────────────────────────────────────┐ │
│  │ [Textarea auto-save, 300 karakter]                    │ │
│  │ ✓ Tersimpan otomatis 3 detik lalu                     │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌─── Histori Status ────────────────────────────────────┐ │
│  │ Waktu           │ Dari      │ Ke        │              │ │
│  │ 5 Jan 2026 10:30│ Baru      │ Dihubungi │              │ │
│  │ 3 Jan 2026 14:15│ (initial) │ Baru      │              │ │
│  └───────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**Verifikasi:** Wireframe committed.

---

### E4B-S1-UX-03 — Spec Component `LeadKanbanCard`

**Priority:** P0 · **Tags:** `component-spec`

**Anatomi kartu di Kanban:**
```
┌───────────────────────────┐
│ PT XYZ Corp               │  ← company_name
│ Makanan & Minuman         │  ← industry (chip kecil)
│                           │
│ 📦 50 ton/bulan           │
│ 📍 Jakarta                │
│                           │
│ 📱 +6281****5678          │  ← WA (mask, click open wa.me)
│                           │
│ 3 hari lalu               │  ← relative time
│ [⚠] jika > 3 hari         │  ← badge stale
└───────────────────────────┘
```

**States:**
- **Default:** white bg, border tipis
- **Hover:** shadow-sm, cursor grab
- **Dragging:** opacity 60%, shadow-lg
- **Stale (>3 hari sejak `updated_at`):** border-l-4 border-orange-500

**Cursor grab:** hanya di desktop, mobile hide drag-drop.

---

### E4B-S1-UX-04 — Spec Component `KanbanColumn`

**Priority:** P0 · **Tags:** `component-spec`

**Anatomi kolom:**
- Header dengan title + count badge
- Drop zone visual feedback (border dashed teal saat card di-hover)
- Scroll internal kalau card > 5
- Empty state kalau column kosong: "Belum ada lead"

**6 kolom hardcoded:**
| Value | Label Display | Color Accent |
|---|---|---|
| `new` | Baru | teal |
| `contacted` | Dihubungi | blue |
| `sample_sent` | Sampel Dikirim | amber |
| `negotiation` | Negosiasi | orange |
| `deal` | Deal | green |
| `lost` | Tidak Jadi | slate |

---

### E4B-S1-UX-05 — Spec Modal `WATemplateGenerator`

**Priority:** P0 · **Tags:** `component-spec` `modal`

**Struktur:**
```
┌────────────────────────────────────────────┐
│ Buat Pesan WhatsApp                    [X] │
├────────────────────────────────────────────┤
│ Status saat ini: Dihubungi                 │
│                                            │
│ Template yang di-generate:                 │
│ ┌────────────────────────────────────────┐│
│ │ Halo Ahmad F,                          ││
│ │ Saya [Nama Admin] dari CV Reka Cipta   ││
│ │ Indonesia. Terkait permintaan          ││
│ │ penawaran garam untuk PT XYZ Corp,     ││
│ │ apakah sudah menerima proposal yang    ││
│ │ kami kirim via email?                  ││
│ │                                        ││
│ │ [Textarea editable]                    ││
│ └────────────────────────────────────────┘│
│                                            │
│ Nomor tujuan: +62812****5678               │
│                                            │
│ [Batal]  [Buka di WhatsApp]                │
└────────────────────────────────────────────┘
```

**Behavior:**
- Load default template dari backend berdasarkan `lead.status`
- Textarea editable — admin bisa customize sebelum kirim
- Button "Buka di WhatsApp" → generate `wa.me/{number_clean}?text={encodeURIComponent(message)}` → open new tab
- Nomor cleaning: strip `+`, `-`, spaces → `wa.me/6281234567890`

**Verifikasi:** Manual test open wa.me link dengan template terisi.

---

### E4B-S1-UX-06 — Edge States

**Priority:** P1 · **Tags:** `edge-case`

**Skenario:**
1. Empty state Kanban (semua column kosong): "Belum ada RFQ masuk. Share halaman /minta-penawaran untuk mulai kumpulkan leads."
2. Filter tidak match: "Tidak ada lead sesuai filter"
3. Drag-drop di mobile (< 768px): disabled, dropdown status muncul di setiap card
4. Backend error saat drag: revert card ke column asal + toast error
5. Auto-save notes gagal: toast error "Gagal menyimpan catatan. Coba lagi."
6. WA template load gagal: fallback ke template generic + toast warning

---

## Layer 2 — User Stories (Slice 1)

### E4B-S1-US-01 — Admin Visual Overview Semua Leads

**As** admin (Irwan) yang manage 20+ leads,
**I want** lihat semua leads dalam pipeline Kanban dengan status jelas,
**So that** saya tahu prioritas follow-up hari ini tanpa perlu open detail satu-satu.

**Acceptance:**
- Kanban render 6 column dengan count per column
- Card menampilkan info esensial (perusahaan, industri, volume, waktu)
- Stale badge (>3 hari) muncul untuk card yang perlu attention
- Total lead visible di footer

---

### E4B-S1-US-02 — Admin Update Status via Drag-Drop

**As** admin yang baru finish call dengan lead PT XYZ,
**I want** drag card mereka dari kolom "Baru" ke "Dihubungi",
**So that** status ter-update tanpa perlu buka detail page.

**Acceptance:**
- Drag card antar column → status update via PATCH backend
- Optimistic UI: card langsung muncul di column baru sebelum backend confirm
- Kalau backend fail, card revert + toast error
- History status tercatat di `lead_status_history`

---

### E4B-S1-US-03 — Admin Filter dan Search Leads

**As** admin yang cari lead dari industri farmasi bulan lalu,
**I want** filter by industri + date range + search by nama,
**So that** saya bisa quickly find lead specific.

**Acceptance:**
- Filter panel: dropdown industri (7 opsi) + date from/to
- Search box: real-time filter by name/company (client-side)
- URL update dengan query params untuk deep-link
- Clear filter tombol reset semua

---

### E4B-S1-US-04 — Admin Catat Notes Internal per Lead

**As** admin yang follow-up multiple leads,
**I want** catat impression, next action, atau info dari conversation di lead detail,
**So that** saya bisa refresh context saat balik ke lead ini beberapa hari kemudian.

**Acceptance:**
- Textarea auto-save on blur (debounce 500ms)
- Indikator status: "Menyimpan..." → "✓ Tersimpan 3 detik lalu"
- Kalau save fail, toast error + retry button
- Notes tersimpan di `rfq_leads.admin_notes`

---

### E4B-S1-US-05 — Admin Generate WA Message Cepat

**As** admin yang follow-up lead via WhatsApp,
**I want** klik satu tombol → dapat template WA sesuai status → edit → langsung buka WhatsApp Web,
**So that** saya tidak perlu re-type message untuk setiap lead.

**Acceptance:**
- Klik "Buat Pesan WA" di lead detail → modal muncul dengan template
- Template dinamis berdasarkan `lead.status`
- Textarea editable
- Klik "Buka di WhatsApp" → wa.me link opens di tab baru
- URL encoding correct (handle newline, emoji, special chars)

---

## Layer 3 — Engineering (Slice 1)

### 3a. Database

#### E4B-S1-DB-01 — Migration `lead_status_history`

**Priority:** P0 · **Tags:** `migration` `database`

**File:** `supabase/migrations/{ts}_create_lead_status_history.sql`

```sql
CREATE TABLE IF NOT EXISTS public.lead_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.rfq_leads(id) ON DELETE CASCADE,
    from_status VARCHAR(50),  -- NULL for initial insert
    to_status VARCHAR(50) NOT NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT lead_status_history_status_check
        CHECK (to_status IN ('new', 'contacted', 'sample_sent', 'negotiation', 'deal', 'lost'))
);

CREATE INDEX idx_lead_status_history_lead_id ON public.lead_status_history(lead_id);
CREATE INDEX idx_lead_status_history_changed_at ON public.lead_status_history(changed_at DESC);
```

**Trigger untuk auto-log** setiap status change:
```sql
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

CREATE TRIGGER trigger_lead_status_change
    AFTER INSERT OR UPDATE OF status ON public.rfq_leads
    FOR EACH ROW EXECUTE FUNCTION public.log_lead_status_change();
```

**Konsekuensi trigger:** History auto-tracked di DB level — backend tidak perlu manual insert history. Simpler + no race condition.

---

#### E4B-S1-DB-02 — RLS `lead_status_history`

**Priority:** P0 · **Tags:** `security`

```sql
ALTER TABLE public.lead_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read history"
    ON public.lead_status_history FOR SELECT TO authenticated USING (TRUE);

-- Tidak ada INSERT/UPDATE/DELETE policy — hanya trigger yang boleh insert.
-- Kalau butuh manual admin, tambah policy nanti.
```

---

### 3b. Backend

#### E4B-S1-BE-01 — Pydantic Schemas

**Priority:** P0 · **Tags:** `backend` `schema`

**File:** `backend/schemas/rfq.py` (extend)

```python
class LeadStatusHistory(BaseModel):
    id: str
    lead_id: str
    from_status: str | None
    to_status: str
    changed_at: datetime


class RFQLead(BaseModel):
    """Full lead data untuk admin."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    company_name: str
    position: str | None
    industry_type: str
    salt_types: list[str]
    volume_per_month: float
    delivery_frequency: str
    delivery_city: str
    email: str
    whatsapp: str
    notes: str | None
    admin_notes: str | None
    status: str
    proposal_html: str | None
    proposal_generated: bool
    proposal_generated_at: datetime | None
    created_at: datetime
    updated_at: datetime


class RFQLeadUpdateRequest(BaseModel):
    """Whitelist untuk PATCH — only status dan admin_notes."""
    model_config = ConfigDict(extra='forbid')

    status: str | None = None
    admin_notes: str | None = None

    @field_validator('status')
    def validate_status(cls, v: str | None) -> str | None:
        if v is not None and v not in {
            'new', 'contacted', 'sample_sent',
            'negotiation', 'deal', 'lost'
        }:
            raise ValueError(f"Invalid status: {v}")
        return v


class RFQLeadListResponse(BaseModel):
    leads: list[RFQLead]
    total: int


class RFQLeadDetailResponse(BaseModel):
    lead: RFQLead
    history: list[LeadStatusHistory]


class WATemplateRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')
    lead_id: str
    status: str


class WATemplateResponse(BaseModel):
    template: str
    whatsapp_number: str  # cleaned untuk wa.me
```

---

#### E4B-S1-BE-02 — Router `GET /rfq/leads` (List dengan Filter)

**Priority:** P0 · **Tags:** `backend` `router` `auth`

**File:** `backend/routers/rfq.py` (extend)

```python
from fastapi import Query
from datetime import datetime

@router.get(
    "/leads",
    response_model=RFQLeadListResponse,
    dependencies=[Depends(get_current_user)],
)
async def list_leads(
    status: str | None = Query(None),
    industry: str | None = Query(None),
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
    search: str | None = Query(None),
) -> RFQLeadListResponse:
    supabase = get_supabase_service()
    query = supabase.table("rfq_leads").select("*")

    if status:
        query = query.eq("status", status)
    if industry:
        query = query.eq("industry_type", industry)
    if date_from:
        query = query.gte("created_at", date_from.isoformat())
    if date_to:
        query = query.lte("created_at", date_to.isoformat())
    if search:
        # Case-insensitive search di 2 field
        query = query.or_(f"full_name.ilike.%{search}%,company_name.ilike.%{search}%")

    query = query.order("created_at", desc=True)
    result = query.execute()
    leads = [RFQLead(**row) for row in result.data]
    return RFQLeadListResponse(leads=leads, total=len(leads))
```

**Verifikasi:** curl test dengan berbagai query param combination.

---

#### E4B-S1-BE-03 — Router `GET /rfq/leads/{id}` (Detail + History)

**Priority:** P0 · **Tags:** `backend` `router`

```python
@router.get(
    "/leads/{lead_id}",
    response_model=RFQLeadDetailResponse,
    dependencies=[Depends(get_current_user)],
)
async def get_lead_detail(lead_id: str) -> RFQLeadDetailResponse:
    supabase = get_supabase_service()

    lead_result = (
        supabase.table("rfq_leads")
        .select("*").eq("id", lead_id).limit(1).execute()
    )
    if not lead_result.data:
        raise HTTPException(404, "Lead not found")

    history_result = (
        supabase.table("lead_status_history")
        .select("*").eq("lead_id", lead_id)
        .order("changed_at", desc=True).execute()
    )

    return RFQLeadDetailResponse(
        lead=RFQLead(**lead_result.data[0]),
        history=[LeadStatusHistory(**h) for h in history_result.data],
    )
```

---

#### E4B-S1-BE-04 — Router `PATCH /rfq/leads/{id}` (Update Status/Notes)

**Priority:** P0 · **Tags:** `backend` `router` `whitelist`

```python
@router.patch(
    "/leads/{lead_id}",
    response_model=RFQLeadDetailResponse,
    dependencies=[Depends(get_current_user)],
)
async def update_lead(
    lead_id: str,
    payload: RFQLeadUpdateRequest,
) -> RFQLeadDetailResponse:
    supabase = get_supabase_service()

    # Exclude None dari update
    update_data = payload.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(422, "No fields to update")

    result = (
        supabase.table("rfq_leads")
        .update(update_data).eq("id", lead_id).execute()
    )

    if not result.data:
        raise HTTPException(404, "Lead not found")

    # Trigger di DB level akan auto-log status history kalau status changed
    # Backend tidak perlu manual insert

    # Return detail dengan history updated
    return await get_lead_detail(lead_id)
```

**Verifikasi:**
- PATCH dengan `{status: "contacted"}` → return updated lead + history row baru
- PATCH dengan `{admin_notes: "test note"}` → notes updated, tidak ada history row baru
- PATCH dengan `{slug: "hack"}` → 422 (extra field forbidden)

---

#### E4B-S1-BE-05 — Router `POST /rfq/wa-template`

**Priority:** P0 · **Tags:** `backend` `router`

```python
from backend.services.wa_template_service import generate_wa_template

@router.post(
    "/wa-template",
    response_model=WATemplateResponse,
    dependencies=[Depends(get_current_user)],
)
async def generate_wa_template_endpoint(
    payload: WATemplateRequest,
) -> WATemplateResponse:
    supabase = get_supabase_service()

    lead_result = (
        supabase.table("rfq_leads")
        .select("*").eq("id", payload.lead_id).limit(1).execute()
    )
    if not lead_result.data:
        raise HTTPException(404, "Lead not found")

    lead = lead_result.data[0]
    template = generate_wa_template(lead=lead, status=payload.status)

    # Clean WA number untuk wa.me link
    whatsapp_clean = re.sub(r'[\s\-+()]', '', lead['whatsapp'])
    if whatsapp_clean.startswith('0'):
        whatsapp_clean = '62' + whatsapp_clean[1:]

    return WATemplateResponse(
        template=template,
        whatsapp_number=whatsapp_clean,
    )
```

---

#### E4B-S1-BE-06 — WA Template Service

**Priority:** P0 · **Tags:** `backend` `service`

**File:** `backend/services/wa_template_service.py`

```python
from typing import Any

WA_TEMPLATES: dict[str, str] = {
    'new': """Halo {full_name},

Terima kasih atas permintaan penawaran dari {company_name}.

Kami sudah menerima detail kebutuhan Anda ({volume} ton/{frequency}). Tim kami sedang menyiapkan proposal khusus dan akan mengirim ke email {email} dalam 1x24 jam.

Kalau ada pertanyaan mendesak, silakan reply pesan ini.

Salam,
Tim CV Reka Cipta Indonesia""",

    'contacted': """Halo {full_name},

Saya {admin_name} dari CV Reka Cipta Indonesia. Terkait permintaan penawaran garam untuk {company_name}, apakah proposal yang kami kirim via email sudah diterima?

Kalau ada pertanyaan atau butuh diskusi lebih lanjut, saya siap membantu.""",

    'sample_sent': """Halo {full_name},

Update pengiriman sampel {product_names} untuk {company_name}:

Nomor resi: [ISI RESI]
Estimasi tiba: [ISI ESTIMASI]

Mohon konfirmasi setelah sampel diterima. Terima kasih.""",

    'negotiation': """Halo {full_name},

Terkait diskusi harga garam untuk kebutuhan {company_name} ({volume} ton/{frequency}), berikut poin penawaran:

- [POIN 1]
- [POIN 2]
- [POIN 3]

Mohon feedback dan kita bisa lanjut ke tahap final. Terima kasih.""",

    'sample_received': """Halo {full_name},

Semoga sampel {product_names} sudah diterima dan sesuai ekspektasi.

Kami ingin dengar feedback Anda:
1. Kualitas sampel sudah OK?
2. Ada spec yang perlu adjustment?
3. Timeline untuk order pertama?

Terima kasih.""",
}


def generate_wa_template(lead: dict[str, Any], status: str) -> str:
    """Generate WA template berdasarkan status lead."""
    template_str = WA_TEMPLATES.get(status)
    if not template_str:
        # Fallback template
        template_str = "Halo {full_name}, terkait permintaan penawaran {company_name}, mohon informasi lebih lanjut."

    # Frequency label Indonesia
    frequency_map = {
        'weekly': 'minggu', 'biweekly': 'dua minggu', 'monthly': 'bulan'
    }
    frequency_label = frequency_map.get(lead.get('delivery_frequency', ''), 'bulan')

    # Product names (kalau ada, tapi kita belum fetch dari products table di service ini)
    # Untuk MVP, pakai raw salt_types
    product_names = ", ".join(lead.get('salt_types', []))

    context = {
        'full_name': lead.get('full_name', ''),
        'company_name': lead.get('company_name', ''),
        'volume': lead.get('volume_per_month', 0),
        'frequency': frequency_label,
        'email': lead.get('email', ''),
        'product_names': product_names,
        'admin_name': '[Nama Admin]',  # Placeholder, admin edit sebelum kirim
    }

    return template_str.format(**context)
```

**Note:** Template pakai `.format()` dengan `{placeholder}` — kalau template hardcoded punya string `{}` accidentally, akan error. Untuk MVP OK. Kalau nanti template editable, ganti ke Jinja2 atau string.Template untuk safer parsing.

---

### 3c. Contract

#### E4B-S1-CT-01 — Types + lib/api

**Priority:** P0 · **Tags:** `contract`

Extend `types/api.ts`:

```typescript
export type LeadStatus =
  | 'new' | 'contacted' | 'sample_sent'
  | 'negotiation' | 'deal' | 'lost';

export interface RFQLead {
  id: string;
  full_name: string;
  company_name: string;
  position: string | null;
  industry_type: IndustryType;
  salt_types: string[];
  volume_per_month: number;
  delivery_frequency: DeliveryFrequency;
  delivery_city: string;
  email: string;
  whatsapp: string;
  notes: string | null;
  admin_notes: string | null;
  status: LeadStatus;
  proposal_html: string | null;
  proposal_generated: boolean;
  proposal_generated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadStatusHistory {
  id: string;
  lead_id: string;
  from_status: LeadStatus | null;
  to_status: LeadStatus;
  changed_at: string;
}

export interface RFQLeadUpdateRequest {
  status?: LeadStatus;
  admin_notes?: string;
}

export interface RFQLeadListResponse {
  leads: RFQLead[];
  total: number;
}

export interface RFQLeadDetailResponse {
  lead: RFQLead;
  history: LeadStatusHistory[];
}

export interface WATemplateResponse {
  template: string;
  whatsapp_number: string;
}
```

Extend `lib/api.ts`:

```typescript
export async function getLeads(filters?: {
  status?: LeadStatus;
  industry?: IndustryType;
  date_from?: string;
  date_to?: string;
  search?: string;
}): Promise<RFQLeadListResponse> {
  const params = new URLSearchParams();
  Object.entries(filters || {}).forEach(([k, v]) => {
    if (v) params.set(k, v);
  });
  const query = params.toString();
  return apiFetch<RFQLeadListResponse>(
    `/rfq/leads${query ? `?${query}` : ''}`,
    { auth: true }
  );
}

export async function getLeadDetail(id: string): Promise<RFQLeadDetailResponse> {
  return apiFetch<RFQLeadDetailResponse>(`/rfq/leads/${id}`, { auth: true });
}

export async function updateLead(
  id: string,
  payload: RFQLeadUpdateRequest
): Promise<RFQLeadDetailResponse> {
  return apiFetch<RFQLeadDetailResponse>(`/rfq/leads/${id}`, {
    method: 'PATCH',
    auth: true,
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function getWATemplate(
  leadId: string,
  status: LeadStatus
): Promise<WATemplateResponse> {
  return apiFetch<WATemplateResponse>('/rfq/wa-template', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({ lead_id: leadId, status }),
    headers: { 'Content-Type': 'application/json' },
  });
}
```

---

### 3d. Frontend Kanban

#### E4B-S1-FE-01 — Install `@dnd-kit`

**Priority:** P0 · **Tags:** `deps`

```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

#### E4B-S1-FE-02 — Route `app/admin/leads/page.tsx`

**Priority:** P0 · **Tags:** `frontend` `server-component`

```typescript
import { getLeads } from '@/lib/api';
import { LeadsKanbanBoard } from '@/components/admin/lead/LeadsKanbanBoard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pipeline Leads - Admin' };

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ industry?: string; date_from?: string; date_to?: string; search?: string }>;
}) {
  const params = await searchParams;
  const data = await getLeads(params);

  return (
    <div>
      <header>
        <h1>Pipeline Leads</h1>
        <p>{data.total} leads total</p>
      </header>
      <LeadsKanbanBoard initialLeads={data.leads} initialFilters={params} />
    </div>
  );
}
```

---

#### E4B-S1-FE-03 — Component `LeadsKanbanBoard` (Client Component, Kompleks)

**Priority:** P0 · **Tags:** `frontend` `client-component` `complex`

**File:** `components/admin/lead/LeadsKanbanBoard.tsx`

**High-level structure:**
```typescript
'use client';

import { DndContext, DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { useState } from 'react';
import { updateLead } from '@/lib/api';
import { toast } from 'sonner';
import { LEAD_STATUSES } from '@/lib/constants/lead-status';

interface Props {
  initialLeads: RFQLead[];
  initialFilters: Record<string, string>;
}

export function LeadsKanbanBoard({ initialLeads, initialFilters }: Props) {
  const [leads, setLeads] = useState(initialLeads);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const leadId = active.id as string;
    const newStatus = over.id as LeadStatus;
    const lead = leads.find(l => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    // Optimistic update
    setLeads(prev => prev.map(l =>
      l.id === leadId ? { ...l, status: newStatus } : l
    ));

    try {
      await updateLead(leadId, { status: newStatus });
      toast.success(`Status diubah ke ${LABEL_MAP[newStatus]}`);
    } catch (err) {
      // Revert
      setLeads(prev => prev.map(l =>
        l.id === leadId ? { ...l, status: lead.status } : l
      ));
      toast.error('Gagal mengubah status. Coba lagi.');
    }
  }

  return (
    <>
      <FilterPanel filters={initialFilters} />
      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto">
          {LEAD_STATUSES.map(status => (
            <KanbanColumn
              key={status}
              status={status}
              leads={leads.filter(l => l.status === status)}
            />
          ))}
        </div>
      </DndContext>
    </>
  );
}
```

**Note:** Mobile detection untuk disable drag-drop:
```typescript
const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
// Kalau isMobile, wrap KanbanColumn dengan dropdown fallback
```

**Verifikasi:** Drag-drop works di desktop, dropdown fallback di mobile.

---

#### E4B-S1-FE-04 — Component `KanbanColumn`

**Priority:** P0 · **Tags:** `frontend`

**File:** `components/admin/lead/KanbanColumn.tsx`

```typescript
'use client';

import { useDroppable } from '@dnd-kit/core';
import { LeadKanbanCard } from './LeadKanbanCard';

interface Props {
  status: LeadStatus;
  leads: RFQLead[];
}

export function KanbanColumn({ status, leads }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-shrink-0 w-72 rounded-lg border bg-slate-50 p-3",
        isOver && "border-brand-teal-600 bg-brand-teal-50"
      )}
    >
      <header className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">{LABEL_MAP[status]}</h3>
        <span className="text-sm text-ink-muted">{leads.length}</span>
      </header>
      <div className="space-y-2">
        {leads.length === 0 && (
          <p className="text-sm text-ink-muted text-center py-4">Belum ada lead</p>
        )}
        {leads.map(lead => <LeadKanbanCard key={lead.id} lead={lead} />)}
      </div>
    </div>
  );
}
```

---

#### E4B-S1-FE-05 — Component `LeadKanbanCard`

**Priority:** P0 · **Tags:** `frontend`

**File:** `components/admin/lead/LeadKanbanCard.tsx`

```typescript
'use client';

import { useDraggable } from '@dnd-kit/core';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export function LeadKanbanCard({ lead }: { lead: RFQLead }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
  });

  const isStale = daysSince(lead.updated_at) > 3;
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded border bg-white p-3 shadow-sm cursor-grab",
        isDragging && "opacity-60",
        isStale && "border-l-4 border-l-orange-500"
      )}
      {...listeners}
      {...attributes}
    >
      <Link href={`/admin/leads/${lead.id}`} className="block">
        <h4 className="font-semibold text-sm">{lead.company_name}</h4>
        <p className="text-xs text-ink-muted">{lead.industry_type}</p>
        <div className="mt-2 flex gap-3 text-xs text-ink-secondary">
          <span>📦 {lead.volume_per_month} ton</span>
          <span>📍 {lead.delivery_city}</span>
        </div>
        <p className="mt-2 text-xs text-ink-muted">
          {formatDistanceToNow(new Date(lead.created_at), { locale: idLocale, addSuffix: true })}
        </p>
      </Link>
    </div>
  );
}
```

**Verifikasi:** Card render, drag works, click navigate ke detail.

---

#### E4B-S1-FE-06 — Component `FilterPanel`

**Priority:** P1 · **Tags:** `frontend`

**File:** `components/admin/lead/FilterPanel.tsx`

Filter panel dengan:
- Dropdown industri (7 opsi + "Semua")
- Date range picker (from + to)
- Search input (real-time client-side filter)
- Tombol "Reset filter"

Update URL query params saat filter berubah (via `router.replace`).

---

#### E4B-S1-FE-07 — Constants `lead-status.ts`

**Priority:** P0 · **Tags:** `frontend`

**File:** `lib/constants/lead-status.ts`

```typescript
export const LEAD_STATUSES: LeadStatus[] = [
  'new', 'contacted', 'sample_sent',
  'negotiation', 'deal', 'lost'
];

export const LABEL_MAP: Record<LeadStatus, string> = {
  new: 'Baru',
  contacted: 'Dihubungi',
  sample_sent: 'Sampel Dikirim',
  negotiation: 'Negosiasi',
  deal: 'Deal',
  lost: 'Tidak Jadi',
};

export const COLOR_MAP: Record<LeadStatus, string> = {
  new: 'teal',
  contacted: 'blue',
  sample_sent: 'amber',
  negotiation: 'orange',
  deal: 'green',
  lost: 'slate',
};
```

---

### 3e. Frontend Detail Lead

#### E4B-S1-FE-08 — Route `app/admin/leads/[id]/page.tsx`

**Priority:** P0 · **Tags:** `frontend` `server-component`

```typescript
import { notFound } from 'next/navigation';
import { getLeadDetail } from '@/lib/api';
import { LeadDetailView } from '@/components/admin/lead/LeadDetailView';

export const dynamic = 'force-dynamic';

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const data = await getLeadDetail(id);
    return <LeadDetailView lead={data.lead} history={data.history} />;
  } catch (err) {
    notFound();
  }
}
```

---

#### E4B-S1-FE-09 — Component `LeadDetailView` (Client Component)

**Priority:** P0 · **Tags:** `frontend` `complex`

**File:** `components/admin/lead/LeadDetailView.tsx`

Struktur:
- Breadcrumb + header (company name, industry, status badge, last update)
- 2-column layout: InfoRFQ (kiri) + StatusPanel (kanan)
- AdminNotesEditor (auto-save)
- StatusHistoryTable

Server Action `revalidateLeadRoutes(id)`:
```typescript
'use server';
export async function revalidateLeadRoutes(id: string) {
  revalidatePath('/admin/leads');
  revalidatePath(`/admin/leads/${id}`);
}
```

---

#### E4B-S1-FE-10 — Component `AdminNotesEditor` (Auto-save)

**Priority:** P0 · **Tags:** `frontend` `stateful`

**File:** `components/admin/lead/AdminNotesEditor.tsx`

```typescript
'use client';

import { useState, useCallback, useRef } from 'react';
import { updateLead } from '@/lib/api';
import { toast } from 'sonner';

interface Props {
  leadId: string;
  initialNotes: string | null;
}

export function AdminNotesEditor({ leadId, initialNotes }: Props) {
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef(initialNotes ?? '');

  const save = useCallback(async (value: string) => {
    if (value === lastSavedRef.current) return;
    setSaveStatus('saving');
    try {
      await updateLead(leadId, { admin_notes: value });
      lastSavedRef.current = value;
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      toast.error('Gagal menyimpan catatan');
    }
  }, [leadId]);

  function handleBlur() {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => save(notes), 500);
  }

  return (
    <div>
      <label className="block mb-2 text-sm font-medium">Catatan Admin</label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={handleBlur}
        rows={4}
        className="w-full rounded border p-2"
      />
      <p className="mt-1 text-xs text-ink-muted">
        {saveStatus === 'saving' && 'Menyimpan...'}
        {saveStatus === 'saved' && '✓ Tersimpan'}
        {saveStatus === 'error' && '⚠ Gagal menyimpan'}
      </p>
    </div>
  );
}
```

**Concurrent edit consideration:** Kalau 2 admin edit simultaneously, last write wins. Add optimistic locking (versi + compare-and-swap) di enhancement.

---

#### E4B-S1-FE-11 — Component `StatusPanel` + Update

**Priority:** P0 · **Tags:** `frontend`

**File:** `components/admin/lead/StatusPanel.tsx`

Dropdown status update + button "Buat Pesan WA".

Panggil `updateLead(id, { status })` saat dropdown change. Update sukses → toast + `router.refresh()`.

---

#### E4B-S1-FE-12 — Component `StatusHistoryTable`

**Priority:** P1 · **Tags:** `frontend`

Simple table dengan Waktu | Dari | Ke. Format tanggal Indonesian.

---

### 3f. WA Template Modal

#### E4B-S1-FE-13 — Component `WATemplateModal`

**Priority:** P0 · **Tags:** `frontend` `modal`

**File:** `components/admin/lead/WATemplateModal.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { getWATemplate } from '@/lib/api';
// Base UI Dialog primitive
import { Dialog } from '@base-ui-components/react/dialog';

interface Props {
  leadId: string;
  status: LeadStatus;
  whatsapp: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WATemplateModal({ leadId, status, whatsapp, open, onOpenChange }: Props) {
  const [template, setTemplate] = useState('');
  const [whatsappClean, setWhatsappClean] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getWATemplate(leadId, status)
      .then(res => {
        setTemplate(res.template);
        setWhatsappClean(res.whatsapp_number);
      })
      .catch(() => toast.error('Gagal memuat template'))
      .finally(() => setLoading(false));
  }, [open, leadId, status]);

  function openWhatsApp() {
    const url = `https://wa.me/${whatsappClean}?text=${encodeURIComponent(template)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    onOpenChange(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Popup className="fixed inset-0 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded bg-white p-6">
            <Dialog.Title>Buat Pesan WhatsApp</Dialog.Title>
            <p className="text-sm text-ink-muted">Status: {LABEL_MAP[status]}</p>
            {loading ? (
              <p>Memuat template...</p>
            ) : (
              <>
                <textarea
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  rows={10}
                  className="w-full rounded border p-2 mt-3"
                />
                <p className="text-sm text-ink-muted mt-2">
                  Nomor tujuan: {maskWA(whatsapp)}
                </p>
                <div className="flex gap-2 justify-end mt-4">
                  <button onClick={() => onOpenChange(false)}>Batal</button>
                  <button
                    onClick={openWhatsApp}
                    className="bg-brand-teal-600 text-white px-4 py-2 rounded"
                  >
                    Buka di WhatsApp
                  </button>
                </div>
              </>
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

**Note:** Path import Base UI Dialog cek `package.json` — kalau bermasalah, fallback ke plain conditional render dengan overlay.

---

### 3g. Cache Invalidation Server Actions

#### E4B-S1-FE-14 — Server Action `revalidateLeadRoutes`

**File:** `app/actions/leads.ts`

```typescript
'use server';
import { revalidatePath } from 'next/cache';

export async function revalidateLeadRoutes(id: string) {
  revalidatePath('/admin/leads');
  revalidatePath(`/admin/leads/${id}`);
}
```

---

#### E4B-S1-FE-15 — Update Sidebar Nav "Leads & RFQ"

**Priority:** P1 · **Tags:** `frontend`

Verify `/admin/leads` link muncul di admin sidebar (Epic 1). Tambah kalau belum.

---

## Layer 4 — QA Tasks (Slice 1)

### E4B-S1-QA-01 — E2E Manage Lead Flow

Login → Kanban → drag lead ke "Dihubungi" → open detail → edit notes → generate WA template → open WhatsApp Web (verify text terisi).

### E4B-S1-QA-02 — Drag-Drop Optimistic Update Rollback

Simulate backend fail (temporary disable network) → drag lead → card muncul di column baru → 2 detik kemudian revert + toast error.

### E4B-S1-QA-03 — Status History Auto-Log

Update status via drag-drop → refresh detail page → history row baru muncul dengan from/to correct.

### E4B-S1-QA-04 — Notes Auto-Save

Type di textarea → blur → indicator "Menyimpan..." → "✓ Tersimpan". Refresh page → notes persist.

### E4B-S1-QA-05 — Filter & Search

Filter industri "Makanan" → hanya lead makanan muncul. Search "PT XYZ" → filter real-time. URL update dengan query params.

### E4B-S1-QA-06 — Client Demo Script Slice 1

**File:** `docs/demos/epic4B_slice1_demo_script.md`

Struktur (~10 menit):
1. Konteks (1 menit)
2. Login → Kanban walkthrough (2 menit)
3. Drag-drop status update (2 menit)
4. Detail lead + notes auto-save (2 menit)
5. WA template generator + buka WA Web (2 menit)
6. Roadmap Slice 2 (1 menit): "Selanjutnya, generate proposal AI dari lead ini via satu klik."

---

## Definition of Done — Slice 1

**Backend:**
- [ ] `lead_status_history` table + trigger active
- [ ] 4 endpoints (list, detail, patch, wa-template) protected JWT
- [ ] Whitelist enforcement `extra='forbid'` di PATCH
- [ ] Trigger auto-log status change verified

**Frontend:**
- [ ] Kanban render 6 column + drag-drop desktop
- [ ] Mobile fallback dropdown status change
- [ ] Filter + search + URL sync
- [ ] Detail page dengan info + notes auto-save + history table
- [ ] WA template modal dengan preview editable + open wa.me
- [ ] Sidebar nav updated

**QA:**
- [ ] E2E flow pass
- [ ] Optimistic update rollback works
- [ ] Auto-log history verified
- [ ] Notes auto-save works

**Demo:** Sign-off from klien.

---

---

# SLICE 2 — Basic Proposal Generator (Quick Mode + Anthropic Haiku)

## Tujuan Slice 2

Setelah Slice 2 selesai:
1. Anthropic API integrated via service class
2. Hardcoded system prompt untuk generate proposal HTML
3. HTML → PDF conversion via WeasyPrint
4. Endpoint `POST /rfq/leads/{id}/generate-proposal` accessible dengan JWT
5. Endpoint `POST /rfq/leads/{id}/send-proposal` untuk kirim email proposal ke customer
6. Frontend proposal generator panel di lead detail: generate → preview → download PDF / send email
7. `rfq_leads.proposal_html` + `proposal_generated` + `proposal_generated_at` populated
8. Demoable: klien klik "Generate Proposal" di lead detail → 10 detik kemudian preview muncul → klien review → klik "Kirim ke Customer" → email delivered

---

## Layer 1 — UX Tasks (Slice 2)

### E4B-S2-UX-01 — Wireframe Proposal Panel di Lead Detail

Update wireframe Slice 1 lead detail — tambah section:
```
┌─── Proposal ─────────────────────────────────────┐
│                                                  │
│ Status: Belum digenerate                         │
│                                                  │
│ [Generate Proposal (Quick Mode)]                 │
│                                                  │
│ ─── setelah generate ───                         │
│                                                  │
│ Digenerate: 5 Jan 2026 10:30                     │
│ ┌──────────────────────────────────────────────┐│
│ │ [Preview HTML dalam iframe]                  ││
│ │                                              ││
│ └──────────────────────────────────────────────┘│
│                                                  │
│ [Regenerate] [Download PDF] [Kirim ke Customer]  │
└──────────────────────────────────────────────────┘
```

### E4B-S2-UX-02 — Spec `ProposalGeneratorPanel`

State machine:
- `idle` (belum ada proposal)
- `generating` (loading spinner, disable button)
- `ready` (preview visible + 3 tombol action)
- `regenerating` (loading + preview lama tetap visible)
- `sending` (loading pada tombol kirim)
- `sent` (badge "Terkirim ke customer" + timestamp)
- `error` (toast + retry button)

### E4B-S2-UX-03 — Preview HTML dalam Iframe

Iframe sandboxed dengan `sandbox="allow-same-origin"` untuk isolasi styling. Content: `srcDoc={proposal_html}`.

**Alternative:** Render langsung di div dengan `dangerouslySetInnerHTML` — lebih sederhana tapi risk styling bleed. Iframe lebih safe untuk MVP.

### E4B-S2-UX-04 — Loading & Error States

- **Generating:** Skeleton preview + progress hint "AI sedang menulis proposal... (biasanya 5-15 detik)"
- **Anthropic API timeout:** Toast "Server AI tidak merespons. Coba lagi dalam beberapa menit." + retry button
- **Anthropic rate limit:** Toast "Batas AI harian tercapai. Hubungi admin." + disable generate 1 jam
- **PDF conversion error:** Toast "Gagal convert PDF. Preview HTML tetap tersedia. Download PDF nanti." + tombol download disabled

---

## Layer 2 — User Stories (Slice 2)

### E4B-S2-US-01 — Admin Generate Proposal Quick

**As** admin yang follow-up lead PT XYZ Corp,
**I want** klik satu tombol "Generate Proposal" → dapat proposal HTML dalam 10-15 detik,
**So that** saya bisa cepat review + kirim ke customer tanpa manual writing.

**Acceptance:**
- Klik generate → loading indicator jelas
- Response < 30 detik (Anthropic Haiku typically 5-15 detik untuk 5000 tokens)
- Preview muncul di iframe
- Proposal include: opening dengan nama PIC + perusahaan, intro Reka Cipta, product recommendation sesuai `salt_types`, volume/frequency confirmation, closing dengan CTA follow-up

### E4B-S2-US-02 — Admin Preview + Regenerate

**As** admin yang tidak puas dengan proposal versi 1,
**I want** klik "Regenerate" untuk generate versi baru,
**So that** saya dapat opsi kedua tanpa manual edit.

**Acceptance:**
- Regenerate replace `proposal_html` di DB
- Preview update
- Old proposal tidak persist (no version history di MVP)

### E4B-S2-US-03 — Admin Download PDF

**As** admin yang mau attach proposal ke email manual,
**I want** download PDF version,
**So that** saya bisa attach via Gmail/Outlook.

**Acceptance:**
- Klik "Download PDF" → PDF download dengan filename `proposal-{company-slug}-{yyyymmdd}.pdf`
- PDF content match preview HTML (styling terjaga)

### E4B-S2-US-04 — Admin Kirim Proposal ke Customer

**As** admin yang sudah review proposal OK,
**I want** klik "Kirim ke Customer" → email otomatis terkirim dengan proposal attached,
**So that** saya tidak perlu manual attach + type email body.

**Acceptance:**
- Klik kirim → confirmation modal ("Kirim ke {email}?")
- Konfirmasi → email delivered dengan PDF attachment
- Update `proposal_sent_at` di DB (field baru — tambah di migration)
- Toast success + badge di UI "Terkirim ke customer 3 detik lalu"

---

## Layer 3 — Engineering (Slice 2)

### 3a. Backend Services

#### E4B-S2-BE-01 — Migration Tambah Field `proposal_sent_at`

**File:** `supabase/migrations/{ts}_add_proposal_sent_at.sql`

```sql
ALTER TABLE public.rfq_leads
ADD COLUMN IF NOT EXISTS proposal_sent_at TIMESTAMPTZ;
```

#### E4B-S2-BE-02 — Install Anthropic + WeasyPrint

Backend deps:
```bash
cd backend
source .venv/bin/activate
pip install anthropic weasyprint
pip freeze > requirements.txt
```

Update Dockerfile (kalau applicable) dengan system deps untuk WeasyPrint (AR-02).

#### E4B-S2-BE-03 — Proposal Prompt Module

**File:** `backend/prompts/proposal_prompt.py`

```python
SYSTEM_PROMPT = """Anda adalah proposal writer profesional untuk CV Reka Cipta Indonesia, distributor garam industri dari Surabaya.

TUGAS:
Tulis proposal penawaran garam industri dalam format HTML valid untuk calon partner yang meng-submit RFQ.

STRUKTUR PROPOSAL (5 section, wajib ada semua):
1. <h1>Pembukaan personal — sapa PIC dengan nama, mention perusahaan calon partner
2. <h2>Tentang CV Reka Cipta — 1 paragraf company introduction dari data yang di-provide
3. <h2>Rekomendasi Produk — table atau list produk yang cocok berdasarkan RFQ, include spec teknis dari data produk
4. <h2>Term Penawaran — volume, frekuensi, kota tujuan (sesuai request), pricing placeholder ("Harga akan dikonfirmasi tim sales via WhatsApp")
5. <h2>Penutup — CTA follow-up dalam 1x24 jam via WhatsApp, tanda tangan tim sales

CONSTRAINTS:
- Bahasa Indonesia formal bisnis (avoid slang)
- Tone profesional tapi hangat (bukan robot)
- Panjang: 400-800 kata
- Format HTML valid dengan inline CSS minimal
- JANGAN include informasi harga aktual — sebutkan "akan dikonfirmasi via sales"
- JANGAN mengarang spec produk — hanya pakai data yang di-provide
- JANGAN sertakan email atau WhatsApp Reka Cipta — cukup mention nama Tim Sales

STYLING HTML:
Gunakan inline CSS untuk kompatibilitas WeasyPrint:
- Font: sans-serif
- Heading color: #0B7D6E (brand teal)
- Body text color: #1F2937
- Table borders visible, padding cell 8px
- Section spacing margin-top 24px

OUTPUT:
Return HTML dengan <html><head><style>...</style></head><body>...</body></html> lengkap.
Jangan wrap dengan markdown code block. Return raw HTML.
"""


def build_user_prompt(
    lead_data: dict,
    products: list[dict],
    company_settings: dict,
) -> str:
    """Build user prompt dengan context data."""
    product_details = "\n".join([
        f"- {p['name']} ({p['code']}): {p.get('tagline', '')}. "
        f"Spec: {p.get('specs', {})}"
        for p in products
    ])

    return f"""DATA CALON PARTNER:
- Nama PIC: {lead_data['full_name']}
- Jabatan: {lead_data.get('position') or '-'}
- Perusahaan: {lead_data['company_name']}
- Industri: {lead_data['industry_type']}
- Volume dibutuhkan: {lead_data['volume_per_month']} ton/{lead_data['delivery_frequency']}
- Kota tujuan: {lead_data['delivery_city']}
- Catatan tambahan: {lead_data.get('notes') or '-'}

DATA PRODUK YANG DIPILIH:
{product_details}

DATA CV REKA CIPTA:
- Nama lengkap: {company_settings.get('full_company_name', 'CV Reka Cipta Indonesia')}
- Alamat: {company_settings.get('address', 'Surabaya')}
- Tahun berdiri: {company_settings.get('founding_year', '')}
- Jumlah client: {company_settings.get('partner_count', '')} partner aktif
- Kota jangkauan: {company_settings.get('cities_served', '')}
- Distribusi total: {company_settings.get('total_distribution_tons', '')} ton

Tulis proposal HTML sesuai instruksi di system prompt.
"""
```

**Penting:** Prompt ini adalah **core intellectual property Epic 4**. Kualitas proposal langsung tergantung pada quality prompt. Iterate + test dengan real data sebelum lock.

#### E4B-S2-BE-04 — Proposal Generator Service (Anthropic Integration)

**File:** `backend/services/proposal_generator.py`

```python
import logging
from anthropic import Anthropic, APIError, APITimeoutError, RateLimitError
from backend.config import settings
from backend.prompts.proposal_prompt import SYSTEM_PROMPT, build_user_prompt

logger = logging.getLogger(__name__)

class ProposalGeneratorError(Exception):
    """Custom exception untuk proposal generator failures."""
    pass


class ProposalGeneratorService:
    """Service untuk generate proposal via Anthropic API."""

    MODEL = "claude-haiku-4-5-20251001"
    MAX_TOKENS = 4096
    TIMEOUT_SECONDS = 30.0

    def __init__(self):
        self.client = Anthropic(
            api_key=settings.ANTHROPIC_API_KEY,
            timeout=self.TIMEOUT_SECONDS,
        )

    async def generate(
        self,
        lead_data: dict,
        products: list[dict],
        company_settings: dict,
    ) -> str:
        """Generate proposal HTML. Raises ProposalGeneratorError on failure."""
        user_prompt = build_user_prompt(lead_data, products, company_settings)

        try:
            message = self.client.messages.create(
                model=self.MODEL,
                max_tokens=self.MAX_TOKENS,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_prompt}],
            )
            html = message.content[0].text
            # Sanity check: minimal include <html> tag
            if "<html" not in html.lower():
                logger.warning(f"Proposal missing <html> tag. Wrapping manually.")
                html = f"<html><body>{html}</body></html>"
            return html
        except APITimeoutError:
            logger.error("Anthropic API timeout")
            raise ProposalGeneratorError("AI timeout. Coba lagi dalam beberapa menit.")
        except RateLimitError:
            logger.error("Anthropic API rate limit")
            raise ProposalGeneratorError("Batas AI harian tercapai.")
        except APIError as e:
            logger.error(f"Anthropic API error: {e}")
            raise ProposalGeneratorError(f"AI service error: {e}")


# Singleton
_service_instance: ProposalGeneratorService | None = None

def get_proposal_service() -> ProposalGeneratorService:
    global _service_instance
    if _service_instance is None:
        _service_instance = ProposalGeneratorService()
    return _service_instance
```

#### E4B-S2-BE-05 — PDF Generation Service

**File:** `backend/services/pdf_service.py`

```python
from weasyprint import HTML
import io

def html_to_pdf(html_string: str) -> bytes:
    """Convert HTML string to PDF bytes."""
    pdf_bytes = io.BytesIO()
    HTML(string=html_string).write_pdf(target=pdf_bytes)
    return pdf_bytes.getvalue()
```

Simple. WeasyPrint handle sisanya.

#### E4B-S2-BE-06 — Router `POST /rfq/leads/{id}/generate-proposal`

```python
from backend.services.proposal_generator import (
    get_proposal_service, ProposalGeneratorError
)

@router.post(
    "/leads/{lead_id}/generate-proposal",
    response_model=RFQLeadDetailResponse,
    dependencies=[Depends(get_current_user)],
)
async def generate_proposal(lead_id: str) -> RFQLeadDetailResponse:
    supabase = get_supabase_service()

    # 1. Fetch lead
    lead_result = supabase.table("rfq_leads").select("*").eq("id", lead_id).limit(1).execute()
    if not lead_result.data:
        raise HTTPException(404, "Lead not found")
    lead = lead_result.data[0]

    # 2. Fetch products
    products_result = (
        supabase.table("products")
        .select("*").in_("slug", lead['salt_types']).execute()
    )
    products = products_result.data or []

    # 3. Fetch company settings
    settings_result = supabase.table("company_settings").select("key,value").execute()
    company_settings = {row['key']: row['value'] for row in settings_result.data or []}

    # 4. Call Anthropic
    service = get_proposal_service()
    try:
        proposal_html = await service.generate(lead, products, company_settings)
    except ProposalGeneratorError as e:
        raise HTTPException(503, str(e))

    # 5. Update DB
    supabase.table("rfq_leads").update({
        "proposal_html": proposal_html,
        "proposal_generated": True,
        "proposal_generated_at": datetime.utcnow().isoformat(),
    }).eq("id", lead_id).execute()

    # 6. Return updated detail
    return await get_lead_detail(lead_id)
```

**Note:** Generate proposal bisa 15-30 detik. Kalau ingin non-blocking, pertimbangkan `BackgroundTasks` + polling di frontend. Untuk MVP, blocking OK karena admin expect explicit wait time.

#### E4B-S2-BE-07 — Router `POST /rfq/leads/{id}/send-proposal`

```python
@router.post(
    "/leads/{lead_id}/send-proposal",
    response_model=RFQLeadDetailResponse,
    dependencies=[Depends(get_current_user)],
)
async def send_proposal(
    lead_id: str,
    background_tasks: BackgroundTasks,
) -> RFQLeadDetailResponse:
    supabase = get_supabase_service()

    lead_result = supabase.table("rfq_leads").select("*").eq("id", lead_id).limit(1).execute()
    if not lead_result.data:
        raise HTTPException(404, "Lead not found")
    lead = lead_result.data[0]

    if not lead['proposal_html']:
        raise HTTPException(422, "Proposal belum di-generate")

    # Generate PDF
    pdf_bytes = html_to_pdf(lead['proposal_html'])

    # Send email via background task
    background_tasks.add_task(
        send_proposal_email,
        to_email=lead['email'],
        lead_data=lead,
        pdf_attachment=pdf_bytes,
    )

    # Update sent_at
    supabase.table("rfq_leads").update({
        "proposal_sent_at": datetime.utcnow().isoformat(),
    }).eq("id", lead_id).execute()

    return await get_lead_detail(lead_id)
```

#### E4B-S2-BE-08 — Email Service Extend

**File:** `backend/services/email_service.py` (extend)

```python
def send_proposal_email(
    to_email: str,
    lead_data: dict,
    pdf_attachment: bytes,
) -> None:
    """Kirim proposal ke customer via email + PDF attachment."""
    subject = f"Proposal Penawaran Garam Industri — {lead_data['company_name']}"
    body = f"""Halo {lead_data['full_name']},

Berikut proposal penawaran khusus untuk kebutuhan garam industri {lead_data['company_name']}.

Silakan review PDF terlampir. Kami tim CV Reka Cipta Indonesia akan menghubungi Anda via WhatsApp dalam 1x24 jam untuk diskusi lebih lanjut.

Kalau ada pertanyaan mendesak, silakan reply email ini.

Salam,
Tim CV Reka Cipta Indonesia"""

    _send_email_with_attachment(
        to=to_email,
        subject=subject,
        text=body,
        attachment_bytes=pdf_attachment,
        attachment_filename=f"proposal-{_slugify(lead_data['company_name'])}.pdf",
        attachment_mime="application/pdf",
    )
```

Resend support attachment via base64 encoding di API request. Cek Resend Python SDK docs.

---

### 3b. Contract

#### E4B-S2-CT-01 — Update lib/api

```typescript
export async function generateProposal(leadId: string): Promise<RFQLeadDetailResponse> {
  return apiFetch<RFQLeadDetailResponse>(`/rfq/leads/${leadId}/generate-proposal`, {
    method: 'POST',
    auth: true,
  });
}

export async function sendProposal(leadId: string): Promise<RFQLeadDetailResponse> {
  return apiFetch<RFQLeadDetailResponse>(`/rfq/leads/${leadId}/send-proposal`, {
    method: 'POST',
    auth: true,
  });
}

export function getProposalPDFUrl(leadId: string): string {
  return `${API_BASE_URL}/rfq/leads/${leadId}/proposal.pdf`;
}
```

**Backend endpoint tambahan `GET /rfq/leads/{id}/proposal.pdf`** untuk download PDF:

```python
@router.get(
    "/leads/{lead_id}/proposal.pdf",
    dependencies=[Depends(get_current_user)],
)
async def download_proposal_pdf(lead_id: str):
    from fastapi.responses import Response
    supabase = get_supabase_service()
    result = supabase.table("rfq_leads").select("proposal_html,company_name").eq("id", lead_id).limit(1).execute()
    if not result.data or not result.data[0]['proposal_html']:
        raise HTTPException(404)
    pdf_bytes = html_to_pdf(result.data[0]['proposal_html'])
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="proposal-{_slugify(result.data[0]["company_name"])}.pdf"'
        }
    )
```

Frontend link ke URL ini dengan JWT via cookie (kalau JWT via header, download link tidak carry Authorization → butuh workaround).

**Workaround kalau JWT via header:** Frontend fetch PDF via `apiFetch`, get blob, create object URL, trigger download programmatically. Contoh:
```typescript
const response = await fetch(url, {
  headers: { Authorization: `Bearer ${token}` }
});
const blob = await response.blob();
const objectUrl = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = objectUrl;
a.download = 'proposal.pdf';
a.click();
URL.revokeObjectURL(objectUrl);
```

---

### 3c. Frontend

#### E4B-S2-FE-01 — Component `ProposalGeneratorPanel`

**File:** `components/admin/lead/ProposalGeneratorPanel.tsx`

State machine dengan tombol yang sesuai state. Full spec:

```typescript
'use client';

import { useState } from 'react';
import { generateProposal, sendProposal, getProposalPDFUrl } from '@/lib/api';
import { toast } from 'sonner';

interface Props {
  lead: RFQLead;
  onLeadUpdated: (lead: RFQLead) => void;
}

export function ProposalGeneratorPanel({ lead, onLeadUpdated }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [confirmSendOpen, setConfirmSendOpen] = useState(false);

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      const data = await generateProposal(lead.id);
      onLeadUpdated(data.lead);
      toast.success('Proposal berhasil digenerate');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal generate';
      toast.error(msg);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleDownload() {
    // Workaround JWT via header
    try {
      const token = getSessionToken();
      const response = await fetch(getProposalPDFUrl(lead.id), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proposal-${lead.company_name}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Gagal download PDF');
    }
  }

  async function handleSend() {
    setIsSending(true);
    try {
      const data = await sendProposal(lead.id);
      onLeadUpdated(data.lead);
      toast.success('Proposal berhasil dikirim ke customer');
      setConfirmSendOpen(false);
    } catch {
      toast.error('Gagal kirim proposal');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section>
      <h2>Proposal</h2>

      {!lead.proposal_html && !isGenerating && (
        <div>
          <p>Belum digenerate</p>
          <button onClick={handleGenerate}>Generate Proposal (Quick Mode)</button>
        </div>
      )}

      {isGenerating && (
        <div>
          <Spinner />
          <p>AI sedang menulis proposal... (biasanya 5-15 detik)</p>
        </div>
      )}

      {lead.proposal_html && !isGenerating && (
        <div>
          <p className="text-sm text-ink-muted">
            Digenerate: {formatDate(lead.proposal_generated_at)}
            {lead.proposal_sent_at && ` · Terkirim: ${formatDate(lead.proposal_sent_at)}`}
          </p>
          <iframe
            srcDoc={lead.proposal_html}
            sandbox="allow-same-origin"
            className="w-full h-96 border rounded"
          />
          <div className="flex gap-2 mt-3">
            <button onClick={handleGenerate}>Regenerate</button>
            <button onClick={handleDownload}>Download PDF</button>
            <button onClick={() => setConfirmSendOpen(true)}>Kirim ke Customer</button>
          </div>
        </div>
      )}

      <ConfirmSendDialog
        open={confirmSendOpen}
        onOpenChange={setConfirmSendOpen}
        email={lead.email}
        isSending={isSending}
        onConfirm={handleSend}
      />
    </section>
  );
}
```

#### E4B-S2-FE-02 — Component `ConfirmSendDialog`

Simple Base UI Dialog dengan confirmation "Kirim proposal ke {email}? Aksi ini tidak bisa dibatalkan."

#### E4B-S2-FE-03 — Integrasi ke `LeadDetailView`

Update `LeadDetailView` (Slice 1) — tambah `<ProposalGeneratorPanel />` di kolom kanan atau section terpisah.

**Regression check:** Notes auto-save + status update dari Slice 1 tetap works setelah integrasi ini.

---

## Layer 4 — QA Tasks (Slice 2)

### E4B-S2-QA-01 — E2E Generate + Preview + Download

Login → open lead detail → klik Generate → wait 15 detik → preview iframe render → klik Download → PDF file download dengan filename correct.

### E4B-S2-QA-02 — E2E Send Proposal ke Customer

Setelah generate → klik Kirim → confirmation dialog → confirm → email delivered ke customer inbox dengan PDF attachment.

### E4B-S2-QA-03 — Error Handling

- Anthropic API key invalid → toast error jelas
- Anthropic timeout → toast + retry works
- PDF generation error (HTML malformed) → toast + preview tetap available

### E4B-S2-QA-04 — Content Quality Sanity Check

Generate 5 proposal untuk 5 lead berbeda (industri, produk, volume berbeda). Manual review:
- Bahasa Indonesia formal (no slang)
- Structure 5 section terlihat
- No hallucinated pricing
- No hallucinated spec
- Length 400-800 kata

### E4B-S2-QA-05 — Client Demo Script Slice 2

Live demo: generate proposal, preview, download, send. **Klien sendiri yang trigger** untuk verify UX intuitive. Handover: klien pahami cost per generation (~$0.02) dan bahwa quality bisa iterate via regenerate.

---

## Definition of Done — Slice 2

**Backend:**
- [ ] Anthropic API integrated, service class + prompt module
- [ ] WeasyPrint installed + Dockerfile updated
- [ ] Endpoint generate-proposal working (10-15 detik response time)
- [ ] Endpoint send-proposal working dengan PDF attachment
- [ ] Endpoint download proposal.pdf working
- [ ] Error handling (timeout, rate limit, API error) jelas

**Frontend:**
- [ ] `ProposalGeneratorPanel` state machine works
- [ ] Preview iframe render HTML dengan styling terjaga
- [ ] Download PDF works (workaround JWT header)
- [ ] Send confirmation dialog + email delivery

**QA:**
- [ ] E2E generate + download + send pass
- [ ] 5 proposal sample manual review pass
- [ ] Error paths handled

**Demo:** Klien operate sendiri, sign-off Epic 4 MVP complete.

---

---

# SLICE 3 — Advanced Customization (POST-MVP, Deferred)

**⚠️ STATUS: POST-MVP ENHANCEMENT — jangan execute upfront**

Slice ini di-spec untuk roadmap visibility, bukan sprint immediate. Execute HANYA kalau:
1. Slice 1 + 2 sudah live 1-2 bulan
2. Klien punya feedback konkret feature customization apa yang mereka butuh
3. Ada data usage yang justify effort

## Tujuan Slice 3 (Kalau Execute)

1. Editable system prompt via admin settings
2. Custom email confirmation template
3. Custom WA template per status
4. Advanced mode di proposal generator: temperature, max_tokens, custom instructions
5. Layout customization: header text, footer text, logo URL untuk PDF proposal
6. Optional: DOCX export

## Ringkasan Task Slice 3

### Layer 1 UX (5 tasks)

- Wireframe `/admin/proposal-settings` page
- Wireframe `/admin/email-templates` page
- Spec `PromptEditor` (structured multi-field: role, task, constraints, output format)
- Spec `LayoutCustomizer` (form untuk header/footer/logo)
- Spec Advanced Mode toggle di ProposalGeneratorPanel

### Layer 2 US (4 tasks)

- Admin edit system prompt
- Admin edit email templates
- Admin edit WA templates
- Admin generate proposal via Advanced Mode

### Layer 3 Engineering (12 tasks)

**Backend:**
- Migration tambah tables: `proposal_settings`, `email_templates`, `wa_templates`
- Endpoints CRUD untuk masing-masing settings
- Update `ProposalGeneratorService` untuk pakai prompt dari DB (bukan hardcoded)
- Update proposal generation flow untuk accept advanced params
- Optional: DOCX export via `python-docx`

**Frontend:**
- Route `/admin/proposal-settings/page.tsx`
- Component `PromptEditor` dengan 4 section
- Route `/admin/email-templates/page.tsx`
- Component template editors
- Update `ProposalGeneratorPanel` dengan Advanced Mode toggle
- Component `LayoutCustomizer`

### Layer 4 QA (5 tasks)

- E2E edit system prompt → generate proposal pakai prompt baru
- E2E edit email template → RFQ submit → email pakai template baru
- E2E advanced mode dengan custom temperature
- E2E layout customization → PDF pakai header/footer custom
- DOCX export sanity check (kalau di-implement)

---

## Definition of Done — Slice 3

Deferred. Definition of Done akan di-refine saat Slice ini execution di-planning setelah usage data terkumpul.

**Key considerations sebelum execute Slice 3:**
1. Klien benar-benar minta feature ini, bukan Anda asumsi
2. Feature ini akan dipakai regular (bukan one-time customization)
3. Klien punya technical literacy untuk edit prompt (mis. paham cara prompt engineering basic) — kalau tidak, edit prompt akan bikin quality proposal turun

---

# Handover ke Epic 5

Setelah Slice 1 + Slice 2 MVP live dan klien sign-off:

- Epic 4 fully closed (customer + admin + proposal generator MVP)
- Klien bisa manage leads end-to-end
- Cost operasional Anthropic ~$1-5/bulan untuk expected volume
- Slice 3 sebagai enhancement backlog

**Epic 5 (Supplier Registration)** dan **Epic 6 (Artikel + Kalkulator)** bisa mulai. Task breakdown terpisah.

---

## Catatan Penutup

**Pushback utama saya di dokumen ini yang perlu Anda evaluasi ulang:**

**1. Slice 3 sebagai post-MVP**

Anda minta "MVP dulu" tapi list features yang non-MVP. Saya split untuk consistency logic. Kalau Anda tidak setuju dan mau execute Slice 3 upfront, alasannya harus lebih kuat dari sekedar "supaya lengkap". Enhancement tanpa validated demand = risk feature yang tidak dipakai.

**2. Anthropic Haiku, bukan Sonnet**

Trade-off cost vs quality. Untuk MVP, Haiku sufficient. Kalau ternyata quality kurang di real usage (mis. proposal terlalu generic, atau Bahasa Indonesia awkward), upgrade ke Sonnet cukup ubah 1 const di `ProposalGeneratorService.MODEL`. Config env kalau mau dinamis, tapi hardcode dulu untuk MVP.

**3. Blocking generation (bukan background task)**

Klien akan wait 10-30 detik saat klik "Generate". Ini acceptable karena expected. Kalau nanti latency masalah (mis. Anthropic sering slow), pindah ke background task + polling. Untuk MVP, blocking simpler.

**4. Iframe untuk preview HTML**

Lebih safe daripada `dangerouslySetInnerHTML`. Trade-off: iframe punya sandbox constraint. Kalau HTML pakai external font atau assets, mungkin tidak render. Test manual dulu — kalau ada issue, adjust CSS di prompt untuk pakai system fonts.

**5. Prompt engineering adalah IP kritis**

Prompt di `backend/prompts/proposal_prompt.py` **menentukan quality output**. Kalau prompt buruk, proposal buruk, no amount of LLM tweaking bisa fix. Investment 4-8 jam iterasi prompt dengan real lead data adalah highest ROI activity di Slice 2. Jangan cut corners.

Kalau ada pertanyaan atau ada bagian yang perlu di-clarify sebelum eksekusi, bilang sekarang.

**File:** `docs/epic-breakdown/epic4B_task_breakdown_admin-panel.md`
**Version:** 1.0 — 2026-07-05
