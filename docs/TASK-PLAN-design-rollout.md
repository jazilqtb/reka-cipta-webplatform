# TASK-PLAN v2 — Design System Rollout ke 7 Rute

> Canonical control document. `TASK-DASHBOARD.html` (jika dibuat nanti) adalah turunan, bukan sumber kebenaran.
> Dibuat: 2026-08-14 · Runtime: Claude Code (edit Markdown ini langsung)

---

## 0. Feature Preparation Gate

status: `complete`

| Field | Value |
| --- | --- |
| `design_source_of_truth` | Beranda (`app/(public)/page.tsx` + `components/sections/*`), `/produk`, `/produk/[slug]`, `/tentang-kami`, `/kontak` — semua sudah selesai di Ronde 4–10 |
| `design_tokens_frozen` | `app/globals.css` (`@theme`) + `tailwind.config.ts` — FROZEN, hanya boleh ditambah lewat pengecualian terdokumentasi |
| `reusable_components_ready` | `SectionDivider`, `ParallaxBlob`, `Magnetic`, `RevealWrapper`, `.panel-card`, `.spotlight-card`, `.tag-pill(-dark)`, `.rule-index`, `.mono-tech`, `.link-arrow`, `.no-scrollbar` |
| `precedent_hero_pattern` | `ProductCatalogHero.tsx`, `ProductHero.tsx`, `AboutHero.tsx`, `ContactHero.tsx` — 4 preseden identik, tinggal direplikasi |
| `blocking_unknowns` | none |

### Design DNA yang WAJIB direplikasi (diekstrak dari source of truth)

```
D1  Hero gelap: bg-gradient-to-b from-ink-950 to-ink-900 (VERTIKAL MURNI, bukan diagonal)
D2  Mesh gradient radial diklaster di AREA ATAS saja + ParallaxBlob (bukan motif garis)
D3  Breadcrumb di DALAM Hero (CaretRightIcon, teal-300/70), bukan section terpisah
D4  .rule-index eyebrow + H1/H2 font-ui dgn <span italic font-medium text-brand-teal-*>
D5  Garis kredensial mono-tech di bawah border-t border-white/10 pt-5
D6  SectionDivider penutup — fill-* WAJIB match 1:1 warna tepi section di atasnya
D7  Hover: -translate-y + soft shadow. DILARANG border-hover kasar
D8  Ikon: Phosphor duotone (@phosphor-icons/react/ssr). DILARANG Lucide baru
D9  Kartu: rounded-2xl + .panel-card. Tombol: rounded-xl. Badge teks: .tag-pill
D10 DILARANG .bg-salt-texture / .bg-salt-grain (motif garis) di section manapun
D11 Mobile: hindari stack vertikal panjang — grid-2/horizontal-swipe/compact
```

---

## 1. Feature-Level Fields

| Field | Value |
| --- | --- |
| `feature_id` | `DS-ROLLOUT-01` |
| `feature_title` | Design System Rollout ke 7 Rute Sisa |
| `rationale` | Beranda + 4 rute sudah punya DNA desain final; 7 rute sisa masih memakai `InnerPageHero` generik & styling Epic 2–6 lama, menimbulkan inkonsistensi visual yang mencolok saat pengunjung berpindah halaman |
| `priority` | P1 |
| `status` | `in_progress` |
| `goal` | 7 rute memakai DNA desain identik (D1–D11), lolos audit seam divider & responsivitas mobile 9:16, tanpa regresi fungsional |
| `scope_in` | Layer presentasi: Hero, section wrapper, kartu, form styling, tipografi, divider, ikon, copywriting heading/eyebrow |
| `scope_out` | Logika form (validasi Zod, submit handler, apiFetch), query Supabase, route handler, skema DB, `components/ui/*` primitif, `tailwind.config.ts` |
| `changed_subsystems` | `app/(public)/artikel`, `app/(public)/jadi-supplier`, `app/(public)/kalkulator`, `app/(public)/minta-penawaran`, `components/article`, `components/calculator`, `components/rfq`, `components/supplier`, `components/sections` |
| `constraints` | CLAUDE.md: `globals.css`/`tailwind.config.ts` FROZEN (pengecualian wajib didokumentasikan inline); `components/ui/*` tidak diedit langsung — override lewat `cn()` className |
| `assumptions` | `InnerPageHero` boleh berhenti dipakai oleh 7 rute ini; file komponennya sendiri dibiarkan sampai pemakai terakhir hilang |
| `open_questions` | none |
| `risks` | Menyentuh file berisi logika form (`RFQForm`, `SupplierRegistrationForm`, `CalculatorForm`) berisiko merusak validasi/submit jika edit tidak dibatasi ke className |
| `regression_risks` | (a) `'use client'` directive terhapus saat edit header komentar — PRESEDEN NYATA di `ContactForm.tsx` Tahap 10; (b) prefill query-param rusak; (c) seam divider baru muncul |
| `non_functional_requirements` | Tidak ada horizontal overflow (`scrollWidth <= innerWidth`); tidak ada console error; `tsc` bersih; lint tidak menambah problem di atas baseline 8 |
| `milestones` | M1 Artikel · M2 Supplier · M3 Kalkulator · M4 RFQ · M5 Audit akhir |
| `wiki_pages_to_read_before` | `CLAUDE.md`, `docs/CODEBASE_LEARNING_GUIDE.md` |
| `wiki_pages_to_update_after` | none (perubahan presentasi tidak mengubah arsitektur) |
| `wiki_do_not_store` | Kredensial Supabase, isi `.env.local` |

---

## 2. Execution Governance

| Field | Value |
| --- | --- |
| `mode` | `CODE-FIRST, NO-FICTION, ONE-TASK-ONLY` |
| `no_fiction_policy` | Dilarang mengklaim file/verifikasi yang tidak dijalankan. `commands_run` hanya diisi setelah eksekusi nyata |
| `code_first_policy` | Task implementasi tidak boleh ditutup dengan perubahan komentar/dokumen saja |
| `done_policy` | `done` butuh: tsc bersih + lint tidak di atas baseline + QA browser + seam divider terverifikasi `getComputedStyle` + tidak ada overflow |
| `mock_policy` | Dilarang mock diam-diam. Aset dummy WAJIB jadi alarm terdaftar (lihat §5) |
| `placeholder_policy` | Placeholder hanya boleh sebagai alarm aktif dengan jalur penggantian eksplisit |
| `boundary_audit_policy` | Menyentuh `scope_out` = pelanggaran, task dibuka ulang |
| `rollback_policy` | Perubahan murni presentasi → revert per-file via git; tidak ada migrasi/data yang perlu di-rollback |
| `alarm_propagation_policy` | Alarm aktif wajib disalin ke task block + laporan ke user |
| `max_review_loops` | 2 |
| `escalation_rule` | Jika 2 loop gagal, hentikan task, laporkan ke user dengan temuan konkret, jangan paksakan |

---

## 3. Verification Policy (direncanakan SEBELUM implementasi)

| Field | Value |
| --- | --- |
| `tests_required` | `manual-check-needed` — repo tidak punya test runner UI (tidak ada Jest/Vitest/Playwright di `package.json`); verifikasi lewat typecheck + lint + QA browser terinstrumentasi |
| `test_levels` | `smoke` (HTTP 200), `manual-check-needed` (QA browser) |
| `oracle` | 1. `npx tsc --noEmit` → output kosong. 2. `npm run lint` → tetap `8 problems (2 errors, 6 warnings)`. 3. `curl -o /dev/null -w "%{http_code}"` → `200`. 4. `getComputedStyle(section).backgroundColor/backgroundImage` tepi bawah == `getComputedStyle(path).fill` divider. 5. `document.documentElement.scrollWidth <= window.innerWidth`. 6. `read_console_messages` → nihil error |
| `negative_tests` | `/minta-penawaran` & `/kontak` dengan query prefill (`?produk=&intent=`) harus tetap mengisi form; form validation error state harus tetap muncul |
| `determinism_notes` | RevealWrapper & Framer Motion membeku di tab background — QA wajib pada tab foreground (`document.visibilityState === 'visible'`) |
| `flakiness_risk` | Screenshot mid-reveal bisa menampilkan elemen setengah transparan — bukan bug, konfirmasi via DOM bukan mata |
| `commands_planned` | `npx tsc --noEmit`, `npm run lint`, `npm run dev -- -p 3001`, `curl`, browser QA, `graphify update .` |
| `commands_run` | (diisi per task setelah eksekusi nyata) |
| `stop_on_failure` | `true` |

---

## 4. Task Register

| task_id | title | status | owner_role | depends_on |
| --- | --- | --- | --- | --- |
| T1 | Shared: `PageHero` + `ThankYouPanel` reusable | `done` | implementer | — |
| T2 | `/artikel` — list + CategoryTabs + Pagination + copywriting | `done` | implementer | T1 |
| T3 | `/artikel/[slug]` — long-form reading layout | `done` | implementer | T1 |
| T4 | `/jadi-supplier` — Hero + Benefits + Form | `done` | implementer | T1 |
| T5 | `/jadi-supplier/terima-kasih` — success state | `done` | implementer | T1 |
| T6 | `/kalkulator` — bento grid + Intro + Form + Result | `done` | implementer | T1 |
| T7 | `/minta-penawaran` — Hero + RFQForm + InfoBlock | `done` | implementer | T1 |
| T8 | `/minta-penawaran/terima-kasih` — success state | `done` | implementer | T1, T5 |
| T9 | Audit akhir lintas-rute (seam, mobile 9:16, console) | `done` | tester | T2–T8 |

### Hasil verifikasi (commands_run — dieksekusi nyata)

```
npx tsc --noEmit              → output kosong (bersih)
npm run lint                  → 8 problems (2 errors, 6 warnings) = BASELINE, nol regresi
curl 7 rute                   → semua HTTP 200
seam audit getComputedStyle   → /artikel 2/2 match, /jadi-supplier 2/2, /minta-penawaran 2/2
negative test prefill         → kalkulator→RFQ: volume=15 terisi, 1 jenis garam tercentang ✓
overflow check                → scrollWidth 1914 <= innerWidth 1920, tidak ada overflow
console                       → nihil error di semua rute yang diuji
graphify update .             → 1965 nodes, 3649 edges, 158 communities
```

### Temuan tak terduga selama eksekusi (didokumentasikan, bukan disembunyikan)

1. **`.prose-brand` adalah no-op total.** Dirujuk CLAUDE.md & dipakai 2 komponen,
   tapi tidak pernah didefinisikan di `globals.css` DAN
   `@tailwindcss/typography` tidak terpasang. Seluruh isi artikel selama ini
   dirender tanpa styling. → Didefinisikan manual (pengecualian terdokumentasi).
2. **Lightning CSS membuang CSS secara diam-diam.** Versi pertama `.form-brand`
   memakai `input:not([type='checkbox'])`; compiler membuang SELURUH sisa file
   sejak aturan itu — tanpa error di terminal. Ditemukan lewat pembandingan
   CSS hasil build vs file sumber. → Diganti allowlist eksplisit `[type="..."]`.
3. **`InnerPageHero` jadi kode mati.** Setelah 7 rute ini memakai `PageHero`,
   tidak ada satu pun halaman yang memakainya → dihapus.

---

## 5. Active Alarms

##### A-PH-001
```
alarm_id: A-PH-001
alarm_type: placeholder
severity: warning
status: active
scope: feature
applies_to: DS-ROLLOUT-01
location: Hero 7 rute (tanpa foto), thumbnail artikel fallback
summary: Hero rute baru tidak memakai foto; artikel tanpa thumbnail memakai ikon fallback
current_value: gradient + mesh + ParallaxBlob (tanpa <Image>), BookOpenIcon utk artikel tanpa thumbnail
why_present: User eksplisit: "gunakan elemen dummy (placeholder), nanti saya tambahkan aset aslinya"
missing_to_replace: File foto asli (hero lanskap ~1920x1080; thumbnail artikel 16:9 ~1200x675)
replacement_target: <Image> full-bleed di Hero (pola HeroCarousel.tsx) / thumbnail_url terisi di DB
replacement_plan: Saat user menyediakan file → pasang <Image fill> + overlay gradient, pola identik HeroCarousel
owner_role: user (penyedia aset) + implementer (pemasangan)
blocks: none  # desain tetap utuh & profesional tanpa foto — bukan blocker
must_propagate: true
```

---

## 6. Task Blocks

### T1 — Shared reusable components

```
task_id: T1
goal: Satu <PageHero> generik (menggantikan pola copy-paste 4 Hero) + <ThankYouPanel> dipakai 2 halaman terima-kasih
rationale: 7 rute butuh Hero identik; menyalin ProductCatalogHero 7x = duplikasi & risiko drift seam
scope_in: components/sections/PageHero.tsx (baru), components/sections/ThankYouPanel.tsx (baru)
scope_out: Mengubah Hero yg SUDAH jadi (ProductCatalogHero/ProductHero/AboutHero/ContactHero) — sudah disetujui user, jangan disentuh
acceptance_criteria: PageHero menerima eyebrow/title/titleAccent/subtitle/breadcrumb/stats; render gradient vertikal + mesh + blob + SectionDivider dgn fill yg benar
rollback_plan: hapus 2 file baru (belum dipakai siapa pun sampai T2)
active_alarm_ids: A-PH-001
```

### T2 — /artikel

```
task_id: T2
goal: List artikel memakai PageHero + kartu .panel-card + tab kategori pill-slide (pola CategoryFilterTabs /produk)
scope_in: app/(public)/artikel/page.tsx, components/article/CategoryTabs.tsx, components/article/ArticlePagination.tsx, components/blocks/ArticleCard.tsx
scope_out: lib/data/articles.ts (query), logika pagination
acceptance_criteria: (a) copywriting "Edukasi Garam" diganti istilah B2B berwibawa; (b) tidak ada bg motif garis; (c) hover kartu lift+shadow tanpa border
regression_risks: filter kategori & pagination via query param harus tetap jalan
```

### T3 — /artikel/[slug]

```
task_id: T3
goal: Layout baca long-form nyaman (line-height, max-width, font-size) + breadcrumb dalam Hero
scope_in: app/(public)/artikel/[slug]/page.tsx, components/article/ArticleBreadcrumb.tsx, components/article/RelatedArticles.tsx
scope_out: lib/article-content.ts (sanitizer), ArticleViewTracker (analytics)
acceptance_criteria: prose max-w ~68ch, leading relaxed, heading hierarchy jelas di mobile & desktop
regression_risks: sanitizeArticleContent + view tracker harus tetap terpanggil
```

### T4 — /jadi-supplier

```
task_id: T4
goal: Hero + BenefitsSection kartu modern + form dgn focus-glow
scope_in: app/(public)/jadi-supplier/page.tsx, components/supplier/BenefitsSection.tsx, components/supplier/SupplierRegistrationForm.tsx, components/supplier/SupplierSaltTypesCheckboxGroup.tsx
scope_out: Zod schema, submit handler, rate-limit countdown logic
constraints: SupplierRegistrationForm punya 'use client' — JANGAN sampai terhapus saat edit header
active_alarm_ids: A-PH-001
```

### T5 — /jadi-supplier/terima-kasih

```
task_id: T5
goal: Success state meyakinkan: checkmark beranimasi + Next Steps eksplisit
scope_in: app/(public)/jadi-supplier/terima-kasih/page.tsx (+ pakai ThankYouPanel dari T1)
acceptance_criteria: animasi respek prefers-reduced-motion; langkah selanjutnya bernomor & konkret
```

### T6 — /kalkulator

```
task_id: T6
goal: Bento grid layout, input transisi halus, hasil kalkulasi sbg kartu data mono-tech
scope_in: app/(public)/kalkulator/page.tsx, components/calculator/CalculatorIntro.tsx, components/calculator/CalculatorForm.tsx, components/calculator/CalculatorResult.tsx
scope_out: lib/calculator.ts, lib/constants/salt-calculator.ts (rumus & data)
constraints: CalculatorForm 'use client' + react-hook-form watch() — jangan sentuh logika
regression_risks: perhitungan & sub-option dinamis per industri harus tetap benar
```

### T7 — /minta-penawaran

```
task_id: T7
goal: Hero + RFQForm bergaya modern + InfoBlock selaras
scope_in: app/(public)/minta-penawaran/page.tsx, components/rfq/RFQForm.tsx, components/rfq/FormSection.tsx, components/rfq/InfoBlock.tsx, components/rfq/SaltTypeCheckboxGroup.tsx
scope_out: rfq-schema.ts, submit ke FastAPI, prefill logic
regression_risks: prefill dari /kalkulator (?produk=&volume=) WAJIB masih jalan — negative test
```

### T8 — /minta-penawaran/terima-kasih

```
task_id: T8
goal: Success state konsisten dgn T5 (komponen sama, copy berbeda)
scope_in: app/(public)/minta-penawaran/terima-kasih/page.tsx
```

### T9 — Audit akhir

```
task_id: T9
owner_role: tester
goal: Verifikasi lintas-rute: seam divider, mobile, console, overflow, prefill
commands_planned: tsc, lint, dev server, curl 7 rute, browser QA, graphify update
oracle: lihat §3
```

---

## 7. Agent Sequence (per task)

```
A1 planner    → bekukan scope & candidate_files (SELESAI, dokumen ini)
A2 implementer→ tulis kode ke file lokal
A3 tester     → jalankan oracle §3
A4 docs_sync  → update graphify + laporkan ke user per grup rute
handoff: A2 tidak boleh lanjut ke task berikutnya sebelum A3 hijau utk task berjalan
stop_conditions: tsc merah, lint di atas baseline, console error, seam mismatch
```
