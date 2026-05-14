import { useCallback, useEffect, useState } from 'react'

type IconWithFallbackProps = {
  urls: string[]
  alt?: string
  size?: number | string
  className?: string
  style?: React.CSSProperties
  fallback?: React.ReactNode
}

export function IconWithFallback({ urls, alt = '', size, className, style, fallback }: IconWithFallbackProps) {
  const [index, setIndex] = useState(0)
  /** Portrait helpers return a new array each render; only reset when URL list actually changes. */
  const urlsKey = urls.join('\0')

  useEffect(() => {
    setIndex(0)
  }, [urlsKey])

  const src = urls[index]
  const isLast = index >= urls.length - 1

  const onError = useCallback(() => {
    if (!isLast) {
      setIndex(i => i + 1)
    } else {
      setIndex(urls.length)
    }
  }, [isLast, urls.length])

  if (index >= urls.length) {
    return <>{fallback ?? null}</>
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: 'cover',
        ...style
      }}
      onError={onError}
    />
  )
}
