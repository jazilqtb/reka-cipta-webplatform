// lib/wa-link.ts
// Epic 2 Slice 3 — Generate deep link WhatsApp dari nomor + pesan default.
// Format: https://wa.me/62xxxxxxxxxx?text=<pesan ter-encode>
// Konversi nomor: leading 0 -> 62 (konsisten dengan constants/navigation.ts).

export function generateWALink(nomor: string, pesan?: string): string {
  const digits = nomor.replace(/\D/g, '')
  const normalized = digits.startsWith('62') ? digits : digits.replace(/^0/, '62')
  return pesan
    ? `https://wa.me/${normalized}?text=${encodeURIComponent(pesan)}`
    : `https://wa.me/${normalized}`
}
