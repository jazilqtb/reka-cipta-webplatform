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
