import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      // Custom type scale aligned with design principles
      // caption: small UI labels, body: main copy, subheading: secondary headings, heading: primary section titles, display: large page headings
      fontSize: {
        caption: ['0.75rem', { lineHeight: '1.2', letterSpacing: '0.02em' }], // 12px
        body: ['1rem', { lineHeight: '1.5' }], // 16px
        subheading: ['1.125rem', { lineHeight: '1.35' }], // 18px
        heading: ['1.5rem', { lineHeight: '1.3', fontWeight: '700' }], // 24px
        display: ['2rem', { lineHeight: '1.2', fontWeight: '700' }], // 32px
      },
      colors: {
        ally: {
          bg:      'var(--color-ally-bg)',
          card:    'var(--color-ally-card)',
          accent:  'var(--color-ally-accent)',
          accentDark: 'var(--color-ally-accent-dark)',
          accentLight: 'var(--color-ally-accent-light)',
          text:    'var(--color-ally-text)',
          textDim:   'var(--color-ally-text-dim)',
          muted:   'var(--color-ally-muted)',
          border:  'var(--color-ally-border)',
          borderBright: 'var(--color-ally-border-bright)',
          hover:   'var(--color-ally-hover)',
          success: '#10b981',
          warning: '#f59e0b',
          error:   '#ef4444',
          gradientPrimary: 'from-[var(--color-ally-accent)] to-[var(--color-ally-accent)]',
          gradientSecondary: 'from-[#10b981] to-[#059669]',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Rajdhani', 'sans-serif'], // for headings / logo
        numbers: ['Space Grotesk', 'monospace'], // for stats/costs/damage
      },
      borderRadius: {
        card: '12px',
        pill: '9999px',
      },
      boxShadow: {
        accent: '0 0 12px rgba(0, 212, 255, 0.25)',
        accentStrong: '0 0 20px rgba(0, 212, 255, 0.4), 0 0 40px rgba(0, 212, 255, 0.2)',
        card:   '0 2px 8px rgba(0, 0, 0, 0.4)',
        cardHover: '0 4px 16px rgba(0, 0, 0, 0.5)',
        inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.6)',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '15%': { transform: 'rotate(-5deg)' },
          '30%': { transform: 'rotate(5deg)' },
          '45%': { transform: 'rotate(-3deg)' },
          '60%': { transform: 'rotate(3deg)' },
        },
        'ally-page-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'ally-dropdown-in': {
          from: { opacity: '0', transform: 'translateY(-6px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        pulse: 'pulse 3s ease-in-out infinite',
        shimmer: 'shimmer 3s linear infinite',
        float: 'float 6s ease-in-out infinite',
        wiggle: 'wiggle 2s ease-in-out infinite',
        'ally-page-in': 'ally-page-in 0.18s ease-out',
        'ally-dropdown-in': 'ally-dropdown-in 0.18s ease-out',
      },
    },
  },
  plugins: [],
}

export default config
