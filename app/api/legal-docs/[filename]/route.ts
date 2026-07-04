import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Whitelist: HANYA filename ini yang valid — mencegah path traversal
const VALID_FILENAMES = [
  'akta-notaris.pdf',
  'nib.pdf',
  'npwp.pdf',
  'kemenkumham.pdf',
]

// Service role client — HANYA di server, JANGAN pernah expose ke client
// Pakai supabase-js langsung (bukan @supabase/ssr) karena butuh service role bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!  // server-only — tidak pernah NEXT_PUBLIC_
)

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params

  // Security: validasi filename ada di whitelist
  if (!VALID_FILENAMES.includes(filename)) {
    return NextResponse.json(
      { error: 'Document not found', code: 'INVALID_FILENAME' },
      { status: 404 }
    )
  }

  const { data, error } = await supabaseAdmin.storage
    .from('legal-docs')
    .createSignedUrl(filename, 3600) // 1 jam expiry

  if (error || !data?.signedUrl) {
    console.error('[legal-docs] Failed to create signed URL:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil dokumen', code: 'SIGNED_URL_ERROR' },
      { status: 500 }
    )
  }

  // Cache response 5 menit di browser (signed URL valid 1 jam)
  return NextResponse.json(
    { url: data.signedUrl },
    {
      headers: {
        'Cache-Control': 'private, max-age=300',
      },
    }
  )
}
