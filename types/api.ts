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
