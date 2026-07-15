// ============================================================
// API Types — CV Reka Cipta Indonesia
// HARUS selalu sinkron dengan backend/schemas/*.py
// Setiap perubahan Pydantic → update file ini juga
// Source: ARCHITECTURE.md §16
// ============================================================

// ── Auth ────────────────────────────────────────────────────

export interface LoginRequest {
  email: string
  password: string
}

export interface UserProfile {
  id: string
  email: string
  created_at: string // ISO 8601
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: UserProfile
}

export interface LogoutResponse {
  message: string
}

export interface ApiError {
  detail: string
  code: string
}

// ── Generic ─────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
}

// ── Placeholders (akan diisi per Epic) ─────────────────────

// === Epic 2: Company Settings (E2-S1-CONT-01) ===
// Mirror dari backend/schemas/settings.py — jaga sinkron (ARCHITECTURE.md §16)

export interface CompanySettingItem {
  id: string
  key: string
  value: string
  label: string
  description: string | null
  updated_at: string  // ISO 8601
}

export interface CompanySettingsResponse {
  data: CompanySettingItem[]
  count: number
}

export interface CompanySettingUpdate {
  value: string
}

export interface CompanySettingsBulkUpdate {
  updates: Record<string, string>  // { key: new_value }
}

// Convenience: settings sebagai key-value map — dipakai page.tsx
// (hasil Object.fromEntries dari select key,value)
export type CompanySettingsMap = Record<string, string>

// === Epic 2 Slice 3: Contact Form (E2-S3-CONT-01) ===
// Mirror dari backend/schemas/contact.py — jaga sinkron (ARCHITECTURE.md §16)

export interface ContactRequest {
  name: string
  email: string
  phone?: string
  message: string
}

export interface ContactResponse {
  success: boolean
  message: string
  submitted_at: string // ISO 8601
}

// === Epic 3 Slice 1: Products (E3-S1-CT-01) ===
// Mirror dari backend/schemas/product.py — jaga sinkron (ARCHITECTURE.md §16)

export type ProductCategory = 'halus' | 'kasar' | 'industri'

export interface ProductSpecs {
  nacl_pct?: number
  water_pct?: number
  kio3_ppm?: number
  insoluble_impurities_pct?: number
  color?: string
  smell?: string
  mesh_size?: string
  grain_size_mm?: string
  // Extend as needed for future spec fields
  [key: string]: string | number | undefined
}

export interface Product {
  id: string
  name: string
  slug: string
  code: string
  tagline: string | null
  description: string | null
  specs: ProductSpecs
  industries: string[]
  category: ProductCategory
  is_sni: boolean
  is_active: boolean
  sort_order: number
  photo_url: string | null
  lab_doc_url: string | null
  created_at: string // ISO 8601
  updated_at: string
}

export interface ProductListResponse {
  products: Product[]
  total: number
}

export interface ProductDetailResponse {
  product: Product
}

// Row mentah dari Supabase (dipakai Server Component yang fetch langsung,
// bypass FastAPI — lihat lib/supabase/public.ts). Beda dari `Product`:
// simpan photo_path/lab_doc_path (path relatif di storage bucket), bukan
// URL absolut. Map ke `Product` via lib/product-mapper.ts sebelum dipakai
// komponen. Ref: ARCHITECTURE.md §12.4 — project ref tidak boleh hardcoded.
export interface ProductRow extends Omit<Product, 'photo_url' | 'lab_doc_url'> {
  photo_path: string | null
  lab_doc_path: string | null
}

// === Epic 3B Slice 1: Admin edit (E3B-S1-CT-01) ===
// Mirror dari backend/schemas/product.py ProductUpdateRequest/
// ProductAdminListResponse — jaga sinkron (ARCHITECTURE.md §16).
// Field di sini SENGAJA tidak termasuk id/slug/code/category/created_at/
// updated_at/photo_url/lab_doc_url — locked per AR-01, backend reject
// dengan 422 kalau ada field ekstra (Pydantic extra='forbid').

export interface ProductUpdateRequest {
  name: string
  tagline: string | null
  description: string | null
  specs: ProductSpecs
  industries: string[]
  is_sni: boolean
  is_active: boolean
  sort_order: number
}

export interface ProductAdminListResponse {
  products: Product[]
  total: number
  active_count: number
  inactive_count: number
}

// === Epic 4 Customer-Facing: RFQ (E4-CF-CT-01) ===
// Mirror dari backend/schemas/rfq.py — jaga sinkron (ARCHITECTURE.md §16).
// Enum values HARUS match char-per-char dengan Pydantic constants
// INDUSTRY_TYPES/DELIVERY_FREQUENCIES dan lib/validation/rfq-schema.ts (Zod).

export type DeliveryFrequency = 'weekly' | 'biweekly' | 'monthly'

export type IndustryType =
  | 'makanan-minuman'
  | 'farmasi'
  | 'kimia'
  | 'peternakan'
  | 'tekstil'
  | 'pengolahan-ikan'
  | 'lainnya'

export interface RFQSubmitRequest {
  full_name: string
  company_name: string
  position: string | null
  industry_type: IndustryType
  salt_types: string[]
  volume_per_month: number
  delivery_frequency: DeliveryFrequency
  delivery_city: string
  email: string
  whatsapp: string
  notes: string | null
}

export interface RFQSubmitResponse {
  success: boolean
  lead_id: string
  message: string
}

// === Epic 4B Slice 1: Admin CRM Pipeline (E4B-S1-CT-01) ===
// Mirror dari backend/schemas/rfq.py — jaga sinkron (ARCHITECTURE.md §16).

export type LeadStatus =
  | 'new' | 'contacted' | 'sample_sent'
  | 'negotiation' | 'deal' | 'lost'

export interface RFQLead {
  id: string
  full_name: string
  company_name: string
  position: string | null
  industry_type: IndustryType
  salt_types: string[]
  volume_per_month: number
  delivery_frequency: DeliveryFrequency
  delivery_city: string
  email: string
  whatsapp: string
  notes: string | null
  admin_notes: string | null
  status: LeadStatus
  proposal_html: string | null
  proposal_generated: boolean
  proposal_generated_at: string | null // ISO 8601
  proposal_sent_at: string | null // ISO 8601 — Epic 4B Slice 2
  created_at: string // ISO 8601
  updated_at: string // ISO 8601
}

export interface LeadStatusHistory {
  id: string
  lead_id: string
  from_status: LeadStatus | null
  to_status: LeadStatus
  changed_at: string // ISO 8601
}

export interface RFQLeadUpdateRequest {
  status?: LeadStatus
  admin_notes?: string
}

export interface RFQLeadListResponse {
  leads: RFQLead[]
  total: number
}

export interface RFQLeadDetailResponse {
  lead: RFQLead
  history: LeadStatusHistory[]
}

export interface WATemplateResponse {
  template: string
  whatsapp_number: string
}

// === Epic 4B Slice 3A: Proposal Settings (E4B-S3A-CT-01) ===
// Mirror dari backend/schemas/proposal_settings.py — jaga sinkron
// (ARCHITECTURE.md §16).
//
// NOTE: implemented ahead of Slice 3 trigger criteria (task breakdown
// "Trigger Criteria" — Slice 1+2 live 2+ minggu, 5+ proposal terkirim,
// klien explicit request) per instruksi eksplisit supaya kode siap saat
// Anthropic API key tersedia. Belum di-demo ke klien.

export interface ProposalSettings {
  prompt_role: string
  prompt_task: string
  prompt_constraints: string
  prompt_output_format: string
  default_temperature: number
  default_max_tokens: number
  model_id: string
  // Epic 4B Slice 3C — layout customizer (same row, ALTER TABLE extension)
  layout_header_text: string | null
  layout_footer_text: string | null
  layout_logo_url: string | null
  layout_primary_color: string
}

export interface ProposalSettingsUpdateRequest {
  prompt_role: string
  prompt_task: string
  prompt_constraints: string
  prompt_output_format: string
  default_temperature: number
  default_max_tokens: number
  layout_header_text: string | null
  layout_footer_text: string | null
  layout_logo_url: string | null
  layout_primary_color: string
}

export interface ProposalSettingsHistoryEntry {
  id: number
  snapshot: ProposalSettingsUpdateRequest & Record<string, unknown>
  created_at: string // ISO 8601
  created_by: string | null
}

export interface GenerateProposalAdvancedParams {
  temperature?: number
  max_tokens?: number
  custom_instructions?: string
}

// === Epic 4B Slice 3B: Email + WA Template Management (E4B-S3B-CT-01) ===
// Mirror dari backend/schemas/templates.py — jaga sinkron.

export interface EmailTemplate {
  template_type: string
  subject: string
  body_html: string
  body_text: string
  available_placeholders: string[]
}

export interface EmailTemplateUpdateRequest {
  subject: string
  body_html: string
  body_text: string
}

export interface WATemplateSetting {
  status_key: LeadStatus
  template_text: string
  available_placeholders: string[]
}

export interface WATemplateSettingUpdateRequest {
  template_text: string
}

// === Epic 5 CF: Supplier Registration (E5-CF-CT-01) ===
// Mirror dari backend/schemas/supplier.py — jaga sinkron (ARCHITECTURE.md §16).
// Enum salt_types_available juga sync manual ke lib/constants/supplier-salt-types.ts
// dan lib/validation/supplier-schema.ts.

export interface SupplierRegisterRequest {
  business_name: string
  location_city: string
  location_province: string
  salt_types_available: string[]
  capacity_per_month: number
  capacity_unit: 'ton' | 'kwintal' | 'kg'
  whatsapp: string
  email: string | null
  additional_notes: string | null
}

export interface SupplierRegisterResponse {
  success: boolean
  supplier_id: string
  message: string
}

// === Epic 5 Admin: Supplier Management (E5-ADM-CT-01) ===
// Mirror dari backend/schemas/supplier.py (bagian admin) — jaga sinkron.
// R-56: sengaja TIDAK ada SupplierDetailResponse wrapper dengan field
// history — supplier tidak punya status history table (beda dari RFQLead).

export type SupplierStatus = 'new' | 'verified' | 'active' | 'inactive'

export interface Supplier {
  id: string
  business_name: string
  location_city: string
  location_province: string
  salt_types_available: string[]
  capacity_per_month: number
  capacity_unit: 'ton' | 'kwintal' | 'kg'
  whatsapp: string
  email: string | null
  additional_notes: string | null
  admin_notes: string | null
  status: SupplierStatus
  created_at: string
  updated_at: string
}

export interface SupplierListResponse {
  suppliers: Supplier[]
  total: number
}

export interface SupplierUpdateRequest {
  status?: SupplierStatus
  admin_notes?: string
}

export interface SupplierWATemplateRequest {
  supplier_id: string
  status: SupplierStatus
}

export interface SupplierWATemplateResponse {
  template: string
  whatsapp_number: string
}

// === Epic 6 Slice 1: Artikel & Berita (E6-S1-CT-01) ===
// Direct-Supabase read (AR-01) — bukan mirror Pydantic schema, karena tidak
// ada endpoint FastAPI publik untuk artikel. Sinkron dengan
// supabase/migrations/20260715190000_create_articles_table.sql.

export type ArticleCategory = 'education' | 'company_news'

export interface Article {
  id: string
  title: string
  slug: string
  category: ArticleCategory
  content: string
  thumbnail_url: string | null
  meta_description: string | null
  view_count: number
  published_at: string | null
}

// Bentuk mentah row Supabase — thumbnail_path (path relatif bucket), bukan
// thumbnail_url. Dipetakan ke Article via lib/article-mapper.ts, pola sama
// dengan ProductRow/Product (photo_path → photo_url).
export interface ArticleRow extends Omit<Article, 'thumbnail_url'> {
  thumbnail_path: string | null
  is_published: boolean
  created_at: string
  updated_at: string
}

// === Epic 6 Admin Slice 1: Article CRUD (E6-ADM-S1-CT-01) ===
// Mirror dari backend/schemas/article.py — jaga sinkron (ARCHITECTURE.md §16).

export interface ArticleAdmin {
  id: string
  title: string
  slug: string
  category: ArticleCategory
  content: string
  thumbnail_url: string | null
  meta_description: string | null
  view_count: number
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface ArticleCreateRequest {
  title: string
  slug?: string
  category: ArticleCategory
  content: string
  meta_description: string | null
  is_published: boolean
}

export interface ArticleUpdateRequest {
  title: string
  slug: string
  category: ArticleCategory
  content: string
  meta_description: string | null
}

export interface ArticlePublishRequest {
  is_published: boolean
}

export interface ArticleDetailResponse {
  article: ArticleAdmin
}
