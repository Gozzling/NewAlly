import { useEffect, useState } from 'react'

export function QuickTips() {
  const [currentTip, setCurrentTip] = useState(0)
  const [fadeState, setFadeState] = useState<'in' | 'out'>('in')

  const TIPS = [
    'Position your units to maximize trait synergies',
    'Reroll at level 5 for 1-2 cost carries, level 7 for 3 costs',
    'Save gold early to hit interest thresholds (10/20/30/40/50)',
    "Losing streaks give bonus gold — don't panic sell",
    'Position your tank in front of your backline carry',
    'Check opponent boards each round to predict their comp',
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeState('out')
      setTimeout(() => {
        setCurrentTip((prev) => (prev + 1) % TIPS.length)
        setFadeState('in')
      }, 300)
    }, 8000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className={`text-[11px] font-body leading-tight text-ally-muted min-h-[42px] flex items-center transition-opacity duration-200 ease-out ${fadeState === 'in' ? 'opacity-100' : 'opacity-0'}`}
    >
      {TIPS[currentTip]}
    </div>
  )
}
