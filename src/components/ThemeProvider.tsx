import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const settings = useAppStore((s) => s.settings)

  useEffect(() => {
    const html = document.documentElement

    // Apply accent color
    html.style.setProperty('--color-ally-accent', settings.accentColor)

    // Apply font size
    html.style.setProperty('--font-size-base', `${settings.fontSize}px`)

    // Apply density (affects spacing)
    const densityMultiplier = settings.density === 'compact' ? 0.85 : 1
    html.style.setProperty('--spacing-multiplier', densityMultiplier.toString())

    // Apply density attribute for CSS selectors
    html.setAttribute('data-density', settings.density)

    // Apply font size to body
    document.body.style.fontSize = `${settings.fontSize}px`

  }, [settings.accentColor, settings.density, settings.fontSize])

  return <>{children}</>
}
