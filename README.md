# CV Reka Cipta Indonesia — Web Platform & CRM System
Tech Stack: Next.js 14 (App Router) + TypeScript | FastAPI | Supabase | Anthropic Claude

## 📚 Dokumentasi
- `ARCHITECTURE.md` — Arsitektur teknis, routing, auth flow, folder structure
- `docs/` — PRD, Epic Docs, Design System, Wireframes, Task Breakdown
- `E1_Task_Ordering_Guide.md` — Urutan pengerjaan dependency-driven

## 🛠️ Local Setup
1. `npm install`
2. `cp .env.local.example .env.local` → isi credentials Supabase, Sentry, dll.
3. Backend: `cd backend && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`
4. Run: `npm run dev` (frontend) | `uvicorn main:app --reload` (backend)

## 🌿 Branch Strategy
- `main` → Production (auto-deploy Vercel/Railway)
- `dev` → Staging (auto-deploy untuk demo klien)
- `feature/{task-id}-{slug}` → Preview branches
