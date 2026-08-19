// app/api/debug-runtime/route.ts
//
// SEMENTARA — HAPUS setelah /artikel terbukti pulih.
// TODO-HARDCODE: endpoint diagnostik sementara — needs: dihapus oleh Jazil
// begitu penyebab ERR_REQUIRE_ESM di produksi terkonfirmasi.
//
// Tujuannya menjawab satu pertanyaan yang tidak bisa dijawab dari luar:
// versi Node berapa yang SEBENARNYA menjalankan serverless function di
// produksi, dan apakah require() atas jsdom benar-benar gagal di sana.
// Log runtime Vercel tidak mencatat versi Node, dan Production Overrides
// (24.x) ternyata tidak bisa diubah lewat Project Settings.
//
// Sengaja TIDAK mengembalikan env var, secret, atau path absolut apa pun.

import { createRequire } from 'node:module'

export const dynamic = 'force-dynamic'

export async function GET() {
  const info: Record<string, unknown> = {
    nodeVersion: process.version,
    platform: `${process.platform}/${process.arch}`,
    nextRuntime: process.env.NEXT_RUNTIME ?? null,
  }

  // Uji langsung operasi yang gagal di /artikel: require() atas jsdom,
  // yang secara transitif me-require @exodus/bytes (ESM murni).
  try {
    const nodeRequire = createRequire(import.meta.url)
    nodeRequire('jsdom')
    info.jsdom = 'OK — berhasil di-require'
  } catch (err) {
    info.jsdom = 'GAGAL'
    info.jsdomError =
      err instanceof Error ? `${err.name}: ${err.message}`.slice(0, 600) : String(err)
  }

  return Response.json(info)
}
