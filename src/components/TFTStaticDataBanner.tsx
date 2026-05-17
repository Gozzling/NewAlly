import type { TFTStaticMeta } from '@/types/tftStaticData'

interface TFTStaticDataBannerProps {
  meta: TFTStaticMeta
  count: number
  label: string
}

/** Shows which static CD bundle is driving the current guide grid. */
export function TFTStaticDataBanner({ meta, count, label }: TFTStaticDataBannerProps) {
  return (
    <p className="mb-3 text-[10px] uppercase tracking-widest text-ally-muted">
      {meta.setCoreName} · {count} {label}
    </p>
  )
}
