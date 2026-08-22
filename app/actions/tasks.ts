'use server'

// app/actions/tasks.ts — CP4 ronde 3

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { PARENT_COLUMN, type TaskParentKind } from '@/lib/data/tasks'

type Result = { ok: boolean; error?: string }

async function session() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

function revalidateTaskSurfaces() {
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/tugas')
  revalidatePath('/admin/leads')
  revalidatePath('/admin/perusahaan')
}

/* Panel lead masih menampilkan baris dari tabel LAMA `rfq_leads` (lihat
   backend/routers/rfq.py), sementara `tasks.rfq_id` menunjuk ke tabel BARU
   `rfqs`. Sesudah migrasi CP1, kedua tabel memakai id yang BERBEDA — `rfqs`
   menyimpan id lamanya di kolom `legacy_lead_id`. Irisan kedua himpunan id
   diukur: 0 dari 4. Artinya SETIAP tugas yang dibuat dari panel lead pasti
   ditolak foreign key (23503), tanpa kecuali.

   Ini sambungan expand→migrate yang belum ditutup: selama langkah CONTRACT
   belum dijalankan, kedua tabel hidup berdampingan dan UI masih memegang
   id lama. Jadi penerjemahnya ditaruh di sini, bukan di komponen —
   satu tempat, dan tetap benar untuk pemanggil mana pun yang masih
   memegang id lama.

   Menerima KEDUA bentuk id disengaja: begitu panel lead dipindahkan ke
   `rfqs`, fungsi ini tidak perlu diubah lagi. */
async function resolveRfqId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string
): Promise<string | null> {
  const { data: direct } = await supabase
    .from('rfqs').select('id').eq('id', id).maybeSingle()
  if (direct) return direct.id as string

  const { data: legacy } = await supabase
    .from('rfqs').select('id').eq('legacy_lead_id', id).maybeSingle()
  return (legacy?.id as string) ?? null
}

export async function createTask(input: {
  title: string
  notes?: string | null
  dueOn?: string | null
  parentKind: TaskParentKind
  parentId: string
  assignSelf?: boolean
}): Promise<Result> {
  const { supabase, user } = await session()
  if (!user) return { ok: false, error: 'Sesi berakhir. Silakan masuk lagi.' }

  const title = input.title.trim()
  if (!title) return { ok: false, error: 'Judul tugas tidak boleh kosong.' }

  let parentId = input.parentId
  if (input.parentKind === 'rfq') {
    const resolved = await resolveRfqId(supabase, parentId)
    if (!resolved) {
      console.error('[tasks] create gagal: RFQ tidak ditemukan untuk id', parentId)
      return { ok: false, error: 'RFQ induk tugas ini tidak ditemukan. Muat ulang halaman lalu coba lagi.' }
    }
    parentId = resolved
  }

  const row: Record<string, unknown> = {
    title,
    notes: input.notes?.trim() || null,
    due_on: input.dueOn || null,
    status: 'open',
    [PARENT_COLUMN[input.parentKind]]: parentId,
  }
  // Default menugaskan ke diri sendiri. Pada tim 1-2 orang, memaksa memilih
  // penanggung jawab setiap kali hanya menambah satu klik untuk jawaban
  // yang hampir selalu sama.
  if (input.assignSelf !== false) row.assignee_id = user.id

  const { error } = await supabase.from('tasks').insert(row)
  if (error) {
    /* Pesan aslinya IKUT dikembalikan. Versi sebelumnya menelannya dan
       hanya mengirim "Gagal membuat tugas." — yang berarti kegagalan
       foreign key di atas tampil sebagai pesan generik yang sama dengan
       kegagalan jaringan, dan tidak ada cara membedakannya dari layar.
       `code` dan `details` PostgREST tidak memuat data pengguna, jadi
       menampilkannya ke admin aman dan justru bikin bisa dilaporkan. */
    console.error('[tasks] create gagal:', error.code, error.message, error.details)
    return { ok: false, error: `Gagal membuat tugas (${error.code ?? 'tanpa kode'}): ${error.message}` }
  }
  revalidateTaskSurfaces()
  return { ok: true }
}

export async function setTaskStatus(
  id: string,
  status: 'open' | 'done' | 'cancelled'
): Promise<Result> {
  const { supabase, user } = await session()
  if (!user) return { ok: false, error: 'Sesi berakhir. Silakan masuk lagi.' }

  // completed_at HARUS bergerak bersama status — constraint di tabel
  // menolak kombinasi yang berselisih, jadi ini bukan sekadar kerapian.
  const { error } = await supabase
    .from('tasks')
    .update({ status, completed_at: status === 'done' ? new Date().toISOString() : null })
    .eq('id', id)

  if (error) {
    console.error('[tasks] update status gagal:', error.message)
    return { ok: false, error: 'Gagal mengubah status tugas.' }
  }
  revalidateTaskSurfaces()
  return { ok: true }
}

export async function deleteTask(id: string): Promise<Result> {
  const { supabase, user } = await session()
  if (!user) return { ok: false, error: 'Sesi berakhir. Silakan masuk lagi.' }
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) return { ok: false, error: 'Gagal menghapus tugas.' }
  revalidateTaskSurfaces()
  return { ok: true }
}
