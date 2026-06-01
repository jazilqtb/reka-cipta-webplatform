/**
 * tailwind.config.ts
 * ═══════════════════════════════════════════════════════════════
 * CV Reka Cipta Indonesia — Platform Digital
 * Design System v2.0 · Teal-First Palette
 *
 * Task:    E1-UX-01 — Design token & brand color system
 * Source:  DESIGN_SYSTEM_RekaCirciptaIndonesia_v2.md (§36, §2–5, §8)
 * Output:  Theme extension siap pakai seluruh engineer
 *
 * JANGAN edit token warna/spasi/shadow di file komponen.
 * Semua harus merujuk ke config ini sebagai single source of truth.
 * ═══════════════════════════════════════════════════════════════
 */

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  darkMode: 'class',

  theme: {
    extend: {
      /* ──────────────────────────────────────────────
       * COLORS — Teal-First Palette (§2)
       * ────────────────────────────────────────────── */
      colors: {
        // ── PRIMARY: Brand Teal ⭐ ──────────────────
        // Identitas merek, semua CTA, button utama, elemen aktif.
        // brand-teal-600 (#0B7D6E) = REFERENSI PRIMER
        'brand-teal': {
          950: '#011210',
          900: '#042B26',
          800: '#064038',
          700: '#085E52',
          600: '#0B7D6E',
          500: '#0F9E8B',
          400: '#1BBFAA',
          300: '#52D6C4',
          200: '#93E7DC',
          100: '#C7F2EE',
          50:  '#E6FAF8',
        },

        // ── DARK: Deep Ink ──────────────────────────
        // Dark surfaces, heading text, sidebar, footer.
        // ink-700 (#173F3A) = REFERENSI DARK
        ink: {
          950: '#050F0E',
          900: '#0A1E1C',
          800: '#102E2B',
          700: '#173F3A',
          600: '#1F5249',
          500: '#296B60',
          400: '#3D8C80',
          300: '#6DB8AD',
          200: '#A8D8D3',
          100: '#D4EEEB',
          50:  '#EAF6F4',
        },

        // ── ACCENT: Warm Sand ☀️ ────────────────────
        // Kristal garam & pesisir Madura. Highlights, badge premium,
        // section supplier/petani.
        // sand-600 (#8A6535) = AKSEN UTAMA
        sand: {
          950: '#1C1208',
          900: '#2E1E0D',
          800: '#4D3318',
          700: '#6B4B25',
          600: '#8A6535',
          500: '#A88048',
          400: '#C8A06A',
          300: '#E0C49A',
          200: '#EEDFC4',
          100: '#F6EFE1',
          50:  '#FAF6EF',
        },

        // ── NEUTRAL: Cool Gray ──────────────────────
        // Teks, border, background — tetap cool gray.
        neutral: {
          950: '#0A0B0D',
          900: '#111827',
          800: '#1F2937',
          700: '#374151',
          600: '#4B5563',
          500: '#6B7280',
          400: '#9CA3AF',
          300: '#D1D5DB',
          200: '#E5E7EB',
          100: '#F3F4F6',
          50:  '#F9FAFB',
          0:   '#FFFFFF',
        },

        // ── SEMANTIC ────────────────────────────────
        // Success digeser ke emerald agar distinct dari teal.
        success: {
          900: '#064E3B',
          700: '#065F46',
          600: '#16A34A',
          500: '#22C55E',
          100: '#DCFCE7',
          50:  '#F0FDF4',
        },
        warning: {
          900: '#78350F',
          700: '#92400E',
          600: '#D97706',
          500: '#F59E0B',
          100: '#FEF3C7',
          50:  '#FFFBEB',
        },
        danger: {
          900: '#7F1D1D',
          700: '#991B1B',
          600: '#DC2626',
          500: '#EF4444',
          100: '#FEE2E2',
          50:  '#FEF2F2',
        },
        info: {
          900: '#1E3A8A',
          700: '#1D4ED8',
          600: '#3B82F6',
          500: '#60A5FA',
          100: '#DBEAFE',
          50:  '#EFF6FF',
        },

        // ── CRM LEAD STATUS (§2.7) ──────────────────
        // Warna status lead/mitra di admin panel.
        status: {
          new:          { bg: '#E6FAF8', border: '#93E7DC', text: '#085E52' },
          contacted:    { bg: '#FFF7ED', border: '#FED7AA', text: '#9A3412' },
          'sample-sent':{ bg: '#EFF6FF', border: '#BAE6FD', text: '#1E40AF' },
          negotiation:  { bg: '#FDF4FF', border: '#E9D5FF', text: '#6B21A8' },
          deal:         { bg: '#F0FDF4', border: '#BBF7D0', text: '#14532D' },
          lost:         { bg: '#FFF1F2', border: '#FECDD3', text: '#9F1239' },
        },
      },

      /* ──────────────────────────────────────────────
       * TYPOGRAPHY (§3)
       * ────────────────────────────────────────────── */
      fontFamily: {
        sans: [
          'Plus Jakarta Sans',
          'Inter',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'Courier New',
          'monospace',
        ],
      },

      fontSize: {
        // Body & small
        '2xs':  ['0.625rem',  { lineHeight: '0.875rem' }],   // 10px
        xs:     ['0.75rem',   { lineHeight: '1rem' }],        // 12px
        sm:     ['0.875rem',  { lineHeight: '1.25rem' }],     // 14px
        base:   ['1rem',      { lineHeight: '1.5rem' }],      // 16px
        lg:     ['1.125rem',  { lineHeight: '1.75rem' }],     // 18px
        xl:     ['1.25rem',   { lineHeight: '1.75rem' }],     // 20px

        // Heading
        '2xl':  ['1.5rem',    { lineHeight: '2rem' }],        // 24px
        '3xl':  ['1.875rem',  { lineHeight: '2.375rem' }],    // 30px
        '4xl':  ['2.25rem',   { lineHeight: '2.75rem' }],     // 36px
        '5xl':  ['3rem',      { lineHeight: '3.5rem' }],      // 48px
        '6xl':  ['3.75rem',   { lineHeight: '4.25rem' }],     // 60px

        // Display — hero section (§3.2)
        'display-lg': ['3rem',    { lineHeight: '3.5rem',  fontWeight: '700', letterSpacing: '-0.02em' }],  // 48px
        'display-xl': ['3.75rem', { lineHeight: '4.25rem', fontWeight: '700', letterSpacing: '-0.02em' }],  // 60px
        'display-2xl':['4.5rem',  { lineHeight: '5rem',    fontWeight: '700', letterSpacing: '-0.025em' }], // 72px
      },

      /* ──────────────────────────────────────────────
       * SPACING (§4) — 4px grid base
       * Tailwind default sudah 4px-based, tapi kita
       * tambahkan alias eksplisit untuk clarity.
       * ────────────────────────────────────────────── */
      spacing: {
        4.5:  '1.125rem',  // 18px — antara 4 dan 5
        13:   '3.25rem',   // 52px
        15:   '3.75rem',   // 60px
        18:   '4.5rem',    // 72px
        22:   '5.5rem',    // 88px
        30:   '7.5rem',    // 120px — section padding besar
      },

      /* ──────────────────────────────────────────────
       * BORDER RADIUS (§5.1)
       * ────────────────────────────────────────────── */
      borderRadius: {
        sm:   '4px',
        DEFAULT: '6px',
        md:   '8px',
        lg:   '12px',
        xl:   '16px',
        '2xl':'20px',
        full: '9999px',
      },

      /* ──────────────────────────────────────────────
       * SHADOWS — Teal-Tinted (§5.2)
       * Semua shadow menggunakan rgba brand-teal-600
       * untuk nuansa organik khas Reka Cipta.
       * ────────────────────────────────────────────── */
      boxShadow: {
        // Elevation scale
        xs:      '0 1px 2px rgba(11,125,110,0.05)',
        sm:      '0 2px 4px rgba(11,125,110,0.06), 0 1px 2px rgba(11,125,110,0.04)',
        DEFAULT: '0 4px 8px rgba(11,125,110,0.08), 0 2px 4px rgba(11,125,110,0.05)',
        md:      '0 4px 8px rgba(11,125,110,0.08), 0 2px 4px rgba(11,125,110,0.05)',
        lg:      '0 8px 16px rgba(11,125,110,0.10), 0 4px 8px rgba(11,125,110,0.06)',
        xl:      '0 16px 32px rgba(11,125,110,0.12), 0 8px 16px rgba(11,125,110,0.08)',
        '2xl':   '0 24px 48px rgba(11,125,110,0.16)',

        // Teal glow — CTA hero, featured elements
        'glow-sm': '0 0 0 3px rgba(11,125,110,0.15)',
        'glow-md': '0 0 0 6px rgba(11,125,110,0.12), 0 4px 16px rgba(11,125,110,0.15)',
        'glow-lg': '0 0 0 8px rgba(11,125,110,0.10), 0 8px 32px rgba(11,125,110,0.20)',

        // Focus rings
        focus:         '0 0 0 2px #FFFFFF, 0 0 0 4px #0B7D6E',
        'focus-dark':  '0 0 0 2px rgba(0,0,0,0.2), 0 0 0 4px #52D6C4',
        'focus-error': '0 0 0 2px #FFFFFF, 0 0 0 4px #DC2626',

        none: 'none',
      },

      /* ──────────────────────────────────────────────
       * MOTION — Timing Functions (§8.2)
       * ────────────────────────────────────────────── */
      transitionTimingFunction: {
        spring:       'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spring-soft':'cubic-bezier(0.25, 1.25, 0.5, 1)',
        decelerate:   'cubic-bezier(0.0, 0.0, 0.2, 1)',
        accelerate:   'cubic-bezier(0.4, 0.0, 1, 1)',
        standard:     'cubic-bezier(0.4, 0.0, 0.2, 1)',
        anticipate:   'cubic-bezier(0.36, -0.18, 0.64, 1.56)',
        wave:         'cubic-bezier(0.45, 0.05, 0.55, 0.95)',
      },

      /* ──────────────────────────────────────────────
       * MOTION — Duration Tokens (§8.1)
       * ────────────────────────────────────────────── */
      transitionDuration: {
        '50':   '50ms',
        '100':  '100ms',
        '150':  '150ms',
        '200':  '200ms',
        '300':  '300ms',
        '400':  '400ms',
        '600':  '600ms',
        '800':  '800ms',
        '1200': '1200ms',
        '3000': '3000ms',
      },

      /* ──────────────────────────────────────────────
       * ANIMATIONS (§8, §36)
       * ────────────────────────────────────────────── */
      animation: {
        // Skeleton & loading
        skeleton:       'skeleton-shimmer 1.4s ease-in-out infinite',
        'spin-fast':    'spin 0.65s linear infinite',
        'dot-bounce':   'dot-bounce 1.2s ease-in-out infinite',
        processing:     'processing-pulse 1.5s ease-in-out infinite',

        // Enter animations
        'fade-in':      'fade-in 200ms ease-out',
        'slide-up':     'slide-up 350ms cubic-bezier(0, 0, 0.2, 1)',
        'slide-left':   'slide-left 300ms cubic-bezier(0, 0, 0.2, 1)',
        'scale-in':     'scale-in 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',

        // Brand & decorative
        'cta-pulse':    'cta-hero-pulse 3s ease-in-out infinite',
        'icon-float':   'icon-float 3s ease-in-out infinite',
        'gradient-flow':'gradient-shift 8s ease infinite',
        'ken-burns':    'ken-burns 12s ease-in-out infinite alternate',
        wave:           'wave-move 6s linear infinite',
        'bell-ring':    'bell-ring 600ms cubic-bezier(0.36, 0.07, 0.19, 0.97) both',
        'blob-drift':   'blob-drift 8s ease-in-out infinite alternate',
        'salt-float':   'salt-float 6s ease-in-out infinite',
        'badge-pulse':  'badge-pulse 2s ease-in-out infinite',
      },

      keyframes: {
        'skeleton-shimmer': {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: 'calc(400px + 100%) 0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-left': {
          from: { opacity: '0', transform: 'translateX(8px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { transform: 'scale(0.92)', opacity: '0' },
          to:   { transform: 'scale(1)', opacity: '1' },
        },
        'cta-hero-pulse': {
          '0%, 100%': { boxShadow: '0 4px 8px rgba(11,125,110,0.20)' },
          '50%':      { boxShadow: '0 4px 8px rgba(11,125,110,0.20), 0 0 0 6px rgba(11,125,110,0.12), 0 0 0 12px rgba(11,125,110,0.06)' },
        },
        'icon-float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        'gradient-shift': {
          '0%':   { backgroundPosition: '0% 50%' },
          '50%':  { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'ken-burns': {
          '0%':   { transform: 'scale(1.0) translate(0, 0)' },
          '100%': { transform: 'scale(1.12) translate(-2%, 1%)' },
        },
        'wave-move': {
          from: { transform: 'translateX(0)' },
          to:   { transform: 'translateX(-50%)' },
        },
        'bell-ring': {
          '0%, 100%':      { transform: 'rotate(0deg)' },
          '10%, 50%, 90%': { transform: 'rotate(15deg)' },
          '30%, 70%':      { transform: 'rotate(-12deg)' },
        },
        'blob-drift': {
          from: { transform: 'translate(0, 0) scale(1)' },
          to:   { transform: 'translate(30px, -20px) scale(1.08)' },
        },
        'salt-float': {
          '0%':   { transform: 'translateY(0) rotate(0deg)', opacity: '0' },
          '10%':  { opacity: '0.6' },
          '90%':  { opacity: '0.4' },
          '100%': { transform: 'translateY(-100px) rotate(180deg)', opacity: '0' },
        },
        'processing-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
        'badge-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%':      { transform: 'scale(1.15)' },
        },
        'dot-bounce': {
          '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: '0.4' },
          '40%':           { transform: 'scale(1.0)', opacity: '1' },
        },
      },
    },
  },

  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};

export default config;
