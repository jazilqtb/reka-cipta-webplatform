# TASK-PLAN v2 — Admin SaaS Dashboard & Fullstack Overhaul

> Canonical control document. Dibuat 2026-08-15.
> Prasyarat sudah selesai di sesi sebelumnya (lihat `ADMIN-REWORK-CHECKPOINT-REPORT.md`).

## 0. Feature Preparation Gate — `complete`

| Field | Value |
| --- | --- |
| Graph | Current (nol file lebih baru dari `graph.json`) · 2005 nodes · 3696 edges |
| Build | `tsc` clean · lint 7 problems (2 err / 5 warn) — **di bawah** baseline 8 |
| Sudah selesai | Security hardening (allowlist + `require_admin` 34 endpoint + RLS scoped) · Dashboard metrics (3/0/6/5 nyata) · Kolom SEO artikel + fallback publik |
| Belum dikerjakan | **Design system rollout ke admin (0%)** · form SEO di admin · editor audit · notifikasi/email |
| DB access | Supabase LINKED, additive migration bisa di-push |

### Design DNA (sumber kebenaran = portal publik)

```
Warna    ink-950/900/700 · brand-teal-600/500/300 · salt-50 · sand-* (supplier)
Tipografi font-ui (Space Grotesk) = heading/UI · font-sans = body · mono-tech = angka/data
Bentuk   rounded-2xl (kartu/panel) · rounded-xl (tombol/input) · rounded-full (pil badge)
Kelas    .panel-card · .tag-pill(-dark) · .rule-index · .mono-tech · .form-brand · .skeleton
Ikon     Phosphor duotone (@phosphor-icons/react/ssr) — Lucide DILARANG di kode baru
Hover    -translate-y + soft shadow. DILARANG border menyala
Motion   admin = DENSE DIALECT: tanpa hero gradient/divider melengkung/parallax
```

**Keputusan dialek (chair)**: admin memakai **token yang sama** (warna, tipografi, radius,
shadow, ikon) tetapi **bukan bahasa marketing**-nya. Tidak ada `SectionDivider`,
`ParallaxBlob`, atau hero gradien di admin — dashboard butuh kepadatan informasi dan pola
pindai yang berlawanan dengan halaman marketing. Ini menjawab pertanyaan terbuka §4
laporan discovery.

## 1. Execution Governance

| Field | Value |
| --- | --- |
| `mode` | `CODE-FIRST, NO-FICTION, BATCH-REPORT` |
| `scope_out` | **Backend Generator Proposal** (`backend/routers/proposal_settings.py`, `services/proposal_*`) — larangan mutlak. UI-nya boleh di-restyle, logikanya tidak. |
| `db_policy` | Additive → eksekusi. Destructive → tulis SQL + tandai NEEDS APPROVAL, jangan jalankan. |
| `hardcode_policy` | Kalau resource eksternal tak tersedia: bangun UI penuh, stub dependensinya, tandai `// TODO-HARDCODE:` |
| `no_god_node_break` | `cn()`, `apiFetch()`, `get_supabase()`, `createClient()` — boleh dipakai, kontraknya tidak boleh berubah |
| `stop_rule` | Selesaikan 1 batch → lapor → tunggu instruksi lanjut |

## 2. Verification Policy

| Field | Value |
| --- | --- |
| `oracle` | 1. `tsc --noEmit` kosong · 2. lint ≤ 7 problems · 3. rute `/admin/*` tetap `307 → login` saat anon · 4. `scrollWidth <= innerWidth` · 5. nihil console error |
| `blocked` | Verifikasi visual di balik gerbang auth — kredensial tidak bisa masuk browser tanpa melanggar aturan keamanan (lihat laporan sebelumnya). Semua uji terotentikasi lewat API. |
| `commands_planned` | `tsc`, `lint`, `dev -p 3001`, `curl`, `graphify update` |

## 3. Batch Register

| Batch | Isi | Kenapa urutan ini | Status |
| --- | --- | --- | --- |
| **B1** | Primitif admin + chrome (Sidebar, Header) + login + dashboard + error/loading/not-found | **Shell-first**: setiap halaman mewarisi chrome & primitif. Mengerjakan halaman dulu = mengecat ulang dua kali. | `in_progress` |
| B2 | `/admin/articles` — list, editor, SEO form | CMS = permintaan terbesar; butuh primitif B1 | `planned` |
| B3 | `/admin/leads` + `/admin/suppliers` | Tabel padat data; pola tabel yang sama | `planned` |
| B4 | `/admin/products` + `/admin/settings` + `/admin/email-templates` | Form + IA restructure Settings | `planned` |
| B5 | `/admin/proposal-settings` (UI saja) + notifikasi/email + audit akhir | Backend proposal TIDAK disentuh | `planned` |

## 4. Batch 1 — task blocks

```
T1.1 components/admin/ui/* — primitif bersama
     AdminCard, AdminPageHeader, StatTile, StatusPill, EmptyState, AdminButton
     scope_out: components/ui/* (primitif shadcn, dilarang diedit — extend saja)

T1.2 AdminSidebar — token publik + Phosphor + state aktif yang jelas
     RISIKO: dipakai app/admin/layout.tsx (semua rute admin)

T1.3 AdminHeader — GOD NODE ADMIN (13 konsumen). Kontrak props TIDAK diubah,
     hanya isi visual. Kalau props berubah → 13 file ikut berubah.

T1.4 /admin/login — token publik, pertahankan semua perilaku CP1
     (throttle, banner denied, pesan generik)

T1.5 /admin/dashboard — StatTile, pertahankan query CP4 apa adanya

T1.6 error/loading/not-found — konversi ke primitif B1
```
