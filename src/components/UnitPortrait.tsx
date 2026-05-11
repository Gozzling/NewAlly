import { useCallback, useEffect, useMemo, useState } from 'react'
import { User } from 'lucide-react'
import { ddragonChampionSquareUrl, unitPortraitPrimaryUrl } from '@/utils/unitDisplay'

type UnitPortraitProps = {
  name: string
  size?: number
  radius?: number
  className?: string
}

type Step = 'primary' | 'ddragon' | 'fail'

/**
 * Unit face: local roster icon when available, Data Dragon fallback, then a neutral icon (no broken initials).
 */
export function UnitPortrait({ name, size = 28, radius = 4, className }: UnitPortraitProps) {
  const [step, setStep] = useState<Step>('primary')

  useEffect(() => {
    setStep('primary')
  }, [name])

  const src = useMemo(() => {
    if (step === 'fail') return ''
    if (step === 'ddragon') return ddragonChampionSquareUrl(name)
    return unitPortraitPrimaryUrl(name)
  }, [step, name])

  const onError = useCallback(() => {
    setStep((s) => {
      if (s === 'primary') {
        const primary = unitPortraitPrimaryUrl(name)
        if (primary.includes('/unit-icons/')) return 'ddragon'
        return 'fail'
      }
      if (s === 'ddragon') return 'fail'
      return s
    })
  }, [name])

  if (step === 'fail') {
    return (
      <div
        className={`flex items-center justify-center shrink-0 bg-ally-card border border-ally-border text-ally-muted ${className ?? ''}`}
        style={{ width: size, height: size, borderRadius: radius }}
        title={name}
      >
        <User size={Math.max(12, size * 0.45)} strokeWidth={2} aria-hidden />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt=""
      title={name}
      className={className}
      style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover' }}
      onError={onError}
    />
  )
}
