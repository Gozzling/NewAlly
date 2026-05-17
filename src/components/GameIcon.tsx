import { useEffect, useState } from 'react'
import placeholderImg from '@/assets/icons/placeholder.svg'

interface GameIconProps {
  src: string
  fallbackSrc?: string
  alt?: string
  width: number
  height: number
  className?: string
  style?: React.CSSProperties
}

export function GameIcon({
  src,
  fallbackSrc,
  alt = '',
  width,
  height,
  className,
  style,
}: GameIconProps) {
  const [activeSrc, setActiveSrc] = useState(src)

  useEffect(() => {
    setActiveSrc(src)
  }, [src])

  return (
    <img
      src={activeSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={style}
      onError={() => {
        if (fallbackSrc && activeSrc !== fallbackSrc) {
          setActiveSrc(fallbackSrc)
          return
        }
        if (activeSrc !== placeholderImg) {
          setActiveSrc(placeholderImg)
        }
      }}
    />
  )
}
