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
// Epic 4: RFQLead, LeadStatus, LeadStatusUpdate, WaTemplate
// Epic 5: SupplierRegistration, SupplierStatus
// Epic 6: Article, ArticleCreate, ArticleUpdate

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
