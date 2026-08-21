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

  const row: Record<string, unknown> = {
    title,
    notes: input.notes?.trim() || null,
    due_on: input.dueOn || null,
    status: 'open',
    [PARENT_COLUMN[input.parentKind]]: input.parentId,
  }
  // Default menugaskan ke diri sendiri. Pada tim 1-2 orang, memaksa memilih
  // penanggung jawab setiap kali hanya menambah satu klik untuk jawaban
  // yang hampir selalu sama.
  if (input.assignSelf !== false) row.assignee_id = user.id

  const { error } = await supabase.from('tasks').insert(row)
  if (error) {
    console.error('[tasks] create gagal:', error.message)
    return { ok: false, error: 'Gagal membuat tugas.' }
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
