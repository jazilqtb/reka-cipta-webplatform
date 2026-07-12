// lib/api.ts
// Epic 2 Slice 1 (E2-S1-UTIL-01) — Spec: ARCHITECTURE.md §6.4
//
// Typed fetch wrapper: Client Components → FastAPI (Railway).
// HANYA untuk Client Components ('use client') — Server Components
// fetch Supabase langsung via lib/supabase/server.ts (§6.1/§6.2).
//
// Pemakai (per epic):
//   Slice 3 : ContactForm (POST /contact/send, tanpa auth)
//             SettingsForm (PATCH /settings, auth: true)
//   Epic 4  : RFQ endpoints (timeout: 35_000 untuk AI generation)
//
// Error contract (ARCHITECTURE.md §3): FastAPI mengembalikan
// { detail: string, code: string } — kita lempar Error(detail).

import { createClient } from '@/lib/supabase/client'
import { publicEnv } from '@/lib/env'
import type {
  ProductListResponse,
  ProductDetailResponse,
  ProductAdminListResponse,
  ProductUpdateRequest,
  RFQSubmitRequest,
  RFQSubmitResponse,
  LeadStatus,
  RFQLeadListResponse,
  RFQLeadDetailResponse,
  RFQLeadUpdateRequest,
  WATemplateResponse,
  ProposalSettings,
  ProposalSettingsUpdateRequest,
  ProposalSettingsHistoryEntry,
  GenerateProposalAdvancedParams,
  EmailTemplate,
  EmailTemplateUpdateRequest,
  WATemplateSetting,
  WATemplateSettingUpdateRequest,
  SupplierRegisterRequest,
  SupplierRegisterResponse,
} from '@/types/api'

export const BASE_URL = publicEnv.apiUrl // NEXT_PUBLIC_API_URL — type-safe via lib/env.ts

interface FetchOptions extends RequestInit {
  /** true → inject Authorization: Bearer {supabase-session-jwt} */
  auth?: boolean
  /** Timeout ms. Default 10_000. AI endpoints (Epic 4): 35_000. */
  timeout?: number
}

// Epic 2 Slice 3 — Error dengan status code eksplisit. Pesan `detail`
// dari FastAPI tidak selalu memuat angka status (mis. slowapi pakai
// key "error", bukan "detail") — caller yang perlu membedakan
// 401/422/429 HARUS cek `err.status`, bukan string-match pesannya.
export class ApiFetchError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiFetchError'
    this.status = status
  }
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { auth = false, timeout = 10_000, ...rest } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((rest.headers as Record<string, string>) ?? {}),
  }

  if (auth) {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) throw new ApiFetchError('UNAUTHORIZED', 401)
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const res = await fetch(`${BASE_URL}/api/v1${path}`, {
      ...rest,
      headers,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      // Defensive: response error bisa non-JSON (mis. 502 dari proxy)
      const err = await res
        .json()
        .catch(() => ({ detail: `HTTP ${res.status}`, code: 'UNKNOWN' }))
      throw new ApiFetchError(err.detail ?? `HTTP ${res.status}`, res.status)
    }

    return res.json() as Promise<T>
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiFetchError('Permintaan timeout. Silakan coba lagi.', 408)
    }
    throw err
  }
}

// === Epic 3 Slice 1: Products (E3-S1-CT-01) ===
// Public, tanpa auth. Server Component /produk & /produk/[slug] fetch
// langsung dari Supabase (lihat lib/product-mapper.ts) — fetcher ini
// untuk konsumen lain (mis. Client Component di Epic 3B admin panel).

export async function getProducts(): Promise<ProductListResponse> {
  return apiFetch<ProductListResponse>('/products', { auth: false })
}

export async function getProductBySlug(slug: string): Promise<ProductDetailResponse> {
  return apiFetch<ProductDetailResponse>(`/products/${slug}`, { auth: false })
}

// === Epic 3B Slice 1: Admin edit (E3B-S1-CT-01) ===
// [AUTH] Dipakai Client Component saja (butuh session browser) — Server
// Component fetch produk admin langsung via lib/supabase/server.ts, RLS
// "Authenticated can read all products" (lihat migration products_rls.sql).

export async function getProductsAdmin(): Promise<ProductAdminListResponse> {
  return apiFetch<ProductAdminListResponse>('/products/admin', { auth: true })
}

export async function updateProduct(
  id: string,
  payload: ProductUpdateRequest
): Promise<ProductDetailResponse> {
  return apiFetch<ProductDetailResponse>(`/products/${id}`, {
    method: 'PUT',
    auth: true,
    body: JSON.stringify(payload),
  })
}

// === Epic 3B Slice 2: File uploads (E3B-S2-FE-05) ===
// fetch() tidak native support upload progress — pakai XHR, di-isolate
// di sini (R-19) supaya komponen upload tidak perlu tahu detail XHR.

export async function apiFetchMultipart<T>(
  path: string,
  formData: FormData,
  options: { onProgress?: (percent: number) => void } = {}
): Promise<T> {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new ApiFetchError('UNAUTHORIZED', 401)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${BASE_URL}/api/v1${path}`)
    xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && options.onProgress) {
        options.onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as T)
        } catch {
          reject(new ApiFetchError('Invalid JSON response', xhr.status))
        }
        return
      }

      const parsed = (() => {
        try {
          return JSON.parse(xhr.responseText)
        } catch {
          return null
        }
      })()
      reject(new ApiFetchError(parsed?.detail ?? `HTTP ${xhr.status}`, xhr.status))
    }

    xhr.onerror = () => reject(new ApiFetchError('Network error saat upload', 0))
    xhr.ontimeout = () => reject(new ApiFetchError('Upload timeout. Silakan coba lagi.', 408))
    xhr.timeout = 60_000

    xhr.send(formData)
  })
}

export async function uploadProductPhoto(
  id: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<ProductDetailResponse> {
  const formData = new FormData()
  formData.append('file', file)
  return apiFetchMultipart<ProductDetailResponse>(`/products/${id}/upload-photo`, formData, {
    onProgress,
  })
}

export async function uploadProductLabDoc(
  id: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<ProductDetailResponse> {
  const formData = new FormData()
  formData.append('file', file)
  return apiFetchMultipart<ProductDetailResponse>(`/products/${id}/upload-lab-doc`, formData, {
    onProgress,
  })
}

// === Epic 4 Customer-Facing: RFQ (E4-CF-CT-01) ===
// Public, tanpa auth. Dipakai RFQForm ('use client') di /minta-penawaran.

export async function submitRFQ(payload: RFQSubmitRequest): Promise<RFQSubmitResponse> {
  return apiFetch<RFQSubmitResponse>('/rfq/submit', {
    method: 'POST',
    auth: false,
    body: JSON.stringify(payload),
  })
}

// === Epic 4B Slice 1: Admin CRM Pipeline (E4B-S1-CT-01) ===
// [AUTH] Dipakai Client Component saja — lihat komentar apiFetch di atas.

export async function getLeads(filters?: {
  status?: LeadStatus
  industry?: string
  date_from?: string
  date_to?: string
  search?: string
}): Promise<RFQLeadListResponse> {
  const params = new URLSearchParams()
  Object.entries(filters ?? {}).forEach(([k, v]) => {
    if (v) params.set(k, v)
  })
  const query = params.toString()
  return apiFetch<RFQLeadListResponse>(`/rfq/leads${query ? `?${query}` : ''}`, { auth: true })
}

export async function getLeadDetail(id: string): Promise<RFQLeadDetailResponse> {
  return apiFetch<RFQLeadDetailResponse>(`/rfq/leads/${id}`, { auth: true })
}

export async function updateLead(
  id: string,
  payload: RFQLeadUpdateRequest
): Promise<RFQLeadDetailResponse> {
  return apiFetch<RFQLeadDetailResponse>(`/rfq/leads/${id}`, {
    method: 'PATCH',
    auth: true,
    body: JSON.stringify(payload),
  })
}

export async function getWATemplate(
  leadId: string,
  status: LeadStatus
): Promise<WATemplateResponse> {
  return apiFetch<WATemplateResponse>('/rfq/wa-template', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({ lead_id: leadId, status }),
  })
}

// === Epic 4B Slice 2: Proposal Generator (E4B-S2-CT-01) ===
// [AUTH] generateProposal pakai timeout 35s (bukan default 10s) — request
// sengaja blocking selama Anthropic Haiku menulis proposal (R-31).

// Epic 4B Slice 3A (E4B-S3A-CT-01) — `advanced` optional & last-arg, jadi
// caller Slice 2 existing (tanpa argumen ke-2) tetap Quick Mode, behavior
// identik (R-39 backward compat).
export async function generateProposal(
  leadId: string,
  advanced?: GenerateProposalAdvancedParams
): Promise<RFQLeadDetailResponse> {
  return apiFetch<RFQLeadDetailResponse>(`/rfq/leads/${leadId}/generate-proposal`, {
    method: 'POST',
    auth: true,
    timeout: 35_000,
    body: advanced ? JSON.stringify(advanced) : undefined,
  })
}

export async function sendProposal(leadId: string): Promise<RFQLeadDetailResponse> {
  return apiFetch<RFQLeadDetailResponse>(`/rfq/leads/${leadId}/send-proposal`, {
    method: 'POST',
    auth: true,
    timeout: 35_000,
  })
}

// Download butuh XHR/fetch manual dengan blob (R-32) — <a href> tidak
// bisa attach Authorization header — jadi hanya expose URL di sini,
// komponen yang handle fetch + blob + Authorization header.
export function getProposalPDFUrl(leadId: string): string {
  return `${BASE_URL}/api/v1/rfq/leads/${leadId}/proposal.pdf`
}

// === Epic 4B Slice 3A: Proposal Settings (E4B-S3A-CT-01) ===
// [AUTH] Editable prompt (R-40 structured 4-field) + Advanced Mode
// defaults + rollback history. Dipakai /admin/proposal-settings.
//
// NOTE: implemented ahead of Slice 3 trigger criteria — lihat catatan
// di types/api.ts. Route ada di nav tapi belum pernah di-demo ke klien.

export async function getProposalSettings(): Promise<ProposalSettings> {
  return apiFetch<ProposalSettings>('/proposal-settings', { auth: true })
}

export async function updateProposalSettings(
  payload: ProposalSettingsUpdateRequest
): Promise<ProposalSettings> {
  return apiFetch<ProposalSettings>('/proposal-settings', {
    method: 'PUT',
    auth: true,
    body: JSON.stringify(payload),
  })
}

export async function getProposalSettingsHistory(): Promise<ProposalSettingsHistoryEntry[]> {
  return apiFetch<ProposalSettingsHistoryEntry[]>('/proposal-settings/history', { auth: true })
}

export async function rollbackProposalSettings(historyId: number): Promise<ProposalSettings> {
  return apiFetch<ProposalSettings>(`/proposal-settings/rollback/${historyId}`, {
    method: 'POST',
    auth: true,
  })
}

export async function resetProposalSettingsToDefault(): Promise<ProposalSettings> {
  return apiFetch<ProposalSettings>('/proposal-settings/reset-to-default', {
    method: 'POST',
    auth: true,
  })
}

// R-43: preview PDF dengan layout belum-disimpan sebelum admin klik save.
// Return blob URL — sama pola JWT workaround dengan handleDownload di
// ProposalGeneratorPanel (R-32), karena ini juga butuh Authorization
// header yang tidak bisa dibawa <a href>/<iframe src> langsung.
export async function fetchLayoutPreviewPdfBlobUrl(
  layout: Pick<
    ProposalSettingsUpdateRequest,
    'layout_header_text' | 'layout_footer_text' | 'layout_logo_url' | 'layout_primary_color'
  >
): Promise<string> {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new ApiFetchError('UNAUTHORIZED', 401)

  const response = await fetch(`${BASE_URL}/api/v1/proposal-settings/layout-preview`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(layout),
  })
  if (!response.ok) throw new ApiFetchError('Gagal membuat preview PDF', response.status)
  const blob = await response.blob()
  return URL.createObjectURL(blob)
}

// === Epic 4B Slice 3B: Email + WA Template Management (E4B-S3B-CT-01) ===
// [AUTH] Dipakai /admin/email-templates.

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  return apiFetch<EmailTemplate[]>('/templates/email-templates', { auth: true })
}

export async function updateEmailTemplate(
  templateType: string,
  payload: EmailTemplateUpdateRequest
): Promise<EmailTemplate> {
  return apiFetch<EmailTemplate>(`/templates/email-templates/${templateType}`, {
    method: 'PUT',
    auth: true,
    body: JSON.stringify(payload),
  })
}

export async function resetEmailTemplateToDefault(templateType: string): Promise<EmailTemplate> {
  return apiFetch<EmailTemplate>(`/templates/email-templates/${templateType}/reset-to-default`, {
    method: 'POST',
    auth: true,
  })
}

export async function getWATemplatesAdmin(): Promise<WATemplateSetting[]> {
  return apiFetch<WATemplateSetting[]>('/templates/wa-templates', { auth: true })
}

export async function updateWATemplateAdmin(
  statusKey: LeadStatus,
  payload: WATemplateSettingUpdateRequest
): Promise<WATemplateSetting> {
  return apiFetch<WATemplateSetting>(`/templates/wa-templates/${statusKey}`, {
    method: 'PUT',
    auth: true,
    body: JSON.stringify(payload),
  })
}

export async function resetWATemplateAdminToDefault(statusKey: LeadStatus): Promise<WATemplateSetting> {
  return apiFetch<WATemplateSetting>(`/templates/wa-templates/${statusKey}/reset-to-default`, {
    method: 'POST',
    auth: true,
  })
}

// === Epic 5 Customer-Facing: Supplier Registration (E5-CF-CT-01) ===
// Public, tanpa auth. Dipakai SupplierRegistrationForm ('use client') di /jadi-supplier.

export async function registerSupplier(payload: SupplierRegisterRequest): Promise<SupplierRegisterResponse> {
  return apiFetch<SupplierRegisterResponse>('/supplier/register', {
    method: 'POST',
    auth: false,
    body: JSON.stringify(payload),
  })
}
