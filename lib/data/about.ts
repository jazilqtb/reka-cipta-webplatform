// lib/data/about.ts — CP4 (2026-08-21)
// Konten halaman Tentang Kami dari basis data.
//
// Menggantikan constants/company-profile.ts sebagai SUMBER. Berkas TS itu
// tetap ada dan kini hanya berperan sebagai cadangan: kalau query gagal,
// halaman menampilkan isi yang sama seperti sebelumnya alih-alih kosong.

import { createPublic } from '@/lib/supabase/public'
import { getPublicStorageUrl } from '@/lib/storage'
import {
  COMPANY_TIMELINE,
  COMPANY_MISSION,
  COMPANY_VISION,
  TEAM_MEMBERS,
} from '@/constants/company-profile'

export interface TimelineEntry { id: string; year: number; title: string; description: string }
export interface MissionEntry { id: string; title: string; description: string }
export interface TeamEntry { id: string; name: string; position: string; photoUrl: string | null; initials: string }

/** Nilai diawali '/' berarti aset lokal di /public (foto tim yang sudah ada
 *  sebelum CMS ini). Selain itu = path relatif di bucket `team-photos`.
 *  Dua bentuk sengaja didukung supaya foto lama tetap tampil tanpa harus
 *  dipindahkan manual lebih dulu. */
export function teamPhotoUrl(photoPath: string | null | undefined): string | null {
  const p = photoPath?.trim()
  if (!p) return null
  if (p.startsWith('/')) return p
  return getPublicStorageUrl('team-photos', p)
}

function initialsOf(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
}

export async function getAboutTimeline(): Promise<TimelineEntry[]> {
  try {
    const supabase = createPublic()
    const { data, error } = await supabase
      .from('about_timeline')
      .select('id, year, title, description')
      .order('sort_order', { ascending: true })
      .order('year', { ascending: true })
    if (error || !data || data.length === 0) {
      return COMPANY_TIMELINE.map((m, i) => ({ id: `fallback-${i}`, ...m }))
    }
    return data as TimelineEntry[]
  } catch {
    return COMPANY_TIMELINE.map((m, i) => ({ id: `fallback-${i}`, ...m }))
  }
}

export async function getAboutMission(): Promise<MissionEntry[]> {
  try {
    const supabase = createPublic()
    const { data, error } = await supabase
      .from('about_mission')
      .select('id, title, description')
      .order('sort_order', { ascending: true })
    if (error || !data || data.length === 0) {
      return COMPANY_MISSION.map((m, i) => ({ id: `fallback-${i}`, ...m }))
    }
    return data as MissionEntry[]
  } catch {
    return COMPANY_MISSION.map((m, i) => ({ id: `fallback-${i}`, ...m }))
  }
}

export async function getAboutTeam(): Promise<TeamEntry[]> {
  const fallback = () =>
    TEAM_MEMBERS.map((m, i) => ({
      id: `fallback-${i}`, name: m.name, position: m.position,
      photoUrl: m.photoPath, initials: m.initials,
    }))
  try {
    const supabase = createPublic()
    const { data, error } = await supabase
      .from('about_team')
      .select('id, name, position, photo_path')
      .order('sort_order', { ascending: true })
    if (error || !data || data.length === 0) return fallback()
    return data.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      position: (r.position as string) ?? '',
      photoUrl: teamPhotoUrl(r.photo_path as string | null),
      initials: initialsOf(r.name as string),
    }))
  } catch {
    return fallback()
  }
}

export async function getAboutVision(): Promise<string> {
  try {
    const supabase = createPublic()
    const { data, error } = await supabase
      .from('company_settings').select('value').eq('key', 'about_vision').limit(1).maybeSingle()
    const v = (data?.value as string | undefined)?.trim()
    if (error || !v) return COMPANY_VISION
    return v
  } catch {
    return COMPANY_VISION
  }
}
