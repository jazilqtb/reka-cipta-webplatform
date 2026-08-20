'use client'

// components/admin/product/IndustriesEditor.tsx
// Epic 3B Slice 1 (E3B-S1-FE-07 / AR-05) — Chip-based array editor dengan
// autocomplete. `value` adalah controlled prop dari react-hook-form
// Controller — TIDAK ada internal state yang mirror `value` (hindari
// pola sync useEffect, lihat R-15 di guide Epic 3B). Satu-satunya
// internal state adalah UI transient (input text, dropdown open, flash).

import { useState } from 'react'
import { X } from 'lucide-react'

interface IndustriesEditorProps {
  value: string[]
  onChange: (value: string[]) => void
  suggestions: string[]
}

export function IndustriesEditor({ value, onChange, suggestions }: IndustriesEditorProps) {
  const [inputValue, setInputValue] = useState('')
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const filteredSuggestions = suggestions.filter(
    (s) => !value.includes(s) && s.toLowerCase().includes(inputValue.trim().toLowerCase())
  )

  function handleAdd(raw: string) {
    const industry = raw.trim()
    if (!industry) return

    if (value.includes(industry)) {
      setIsDuplicate(true)
      setTimeout(() => setIsDuplicate(false), 500)
      return
    }

    onChange([...value, industry])
    setInputValue('')
    setShowSuggestions(false)
  }

  function handleRemove(industry: string) {
    onChange(value.filter((i) => i !== industry))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd(inputValue)
    }
  }

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((industry) => (
            <span
              key={industry}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-teal-50 pl-3 pr-1.5 py-1 text-sm font-medium text-brand-teal-700"
            >
              {industry}
              <button
                type="button"
                onClick={() => handleRemove(industry)}
                className="flex items-center justify-center h-5 w-5 rounded-full hover:bg-brand-teal-100 transition-colors"
                aria-label={`Hapus ${industry}`}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik nama industri..."
            className={[
              'h-9 flex-1 rounded-md border px-3 text-sm transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal-600',
              isDuplicate ? 'border-danger-500 bg-danger-50' : 'border-neutral-300',
            ].join(' ')}
          />
          <button
            type="button"
            onClick={() => handleAdd(inputValue)}
            className="h-9 px-4 rounded-md border border-neutral-300 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            Tambah
          </button>
        </div>

        {showSuggestions && filteredSuggestions.length > 0 && (
          <ul
            role="listbox"
            className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-neutral-200 bg-white shadow-md"
          >
            {filteredSuggestions.map((s) => (
              <li key={s} role="option" aria-selected={false}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleAdd(s)}
                  className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isDuplicate && (
        <p className="text-xs text-danger-600" role="alert">
          Industri sudah ada di daftar.
        </p>
      )}
    </div>
  )
}
