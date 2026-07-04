import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Epic 2 Slice 3 — "082136096528" -> "+62 821-3609-6528"
export function formatPhoneDisplay(nomor: string): string {
  const digits = nomor.replace(/\D/g, "")
  const withCountryCode = digits.startsWith("62") ? digits : digits.replace(/^0/, "62")
  const rest = withCountryCode.slice(2)

  const groups: string[] = []
  let i = rest.length
  while (i > 0) {
    const start = Math.max(0, i - 4)
    groups.unshift(rest.slice(start, i))
    i = start
  }

  return `+62 ${groups.join("-")}`
}
