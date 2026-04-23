import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ally: {
          bg:      '#181818', // background — hsl(0 0% 9%)
          card:    '#1f1f1f', // card surfaces — hsl(0 0% 12%)
          accent:  '#35c3e7', // primary accent — cyan
          text:    '#ffffff', // primary text — pure white
          muted:   '#a1a1a1', // secondary text
          border:  '#2a2a2a', // subtle borders
          hover:   '#252525', // hover states on cards
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Rajdhani', 'sans-serif'], // for headings / logo
      },
      borderRadius: {
        card: '12px',
        pill: '9999px',
      },
      boxShadow: {
        accent: '0 0 12px rgba(53, 195, 231, 0.25)',
        card:   '0 2px 8px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
}

export default config
