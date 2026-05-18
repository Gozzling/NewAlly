import OverlayMockup from '@/components/overlay/OverlayMockup'

/** TEMP: overlay mockup preview — revert desktop main to DesktopApp when done. */
export default function App() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-ally-bg">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-ally-card/40 via-ally-bg to-ally-hover/30" />
      <div className="pointer-events-none absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_center,_var(--color-ally-card)_0%,_transparent_70%)]" />
      <OverlayMockup />
    </div>
  )
}
