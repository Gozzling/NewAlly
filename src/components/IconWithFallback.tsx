import { useCallback, useEffect, useMemo, useState } from 'react'

type IconWithFallbackProps = {
  urls: string[]
  alt?: string
  size?: number | string
  className?: string
  style?: React.CSSProperties
  fallback?: React.ReactNode
}

/** Stable identity for url list — callers often pass a fresh array each render (`urls={fn()})`). */
function urlsKey(urls: string[]): string {
  return urls.join('\0')
}

export function IconWithFallback({ urls, alt = '', size, className, style, fallback }: IconWithFallbackProps) {
  const resolvedUrls = useMemo(
    () => urls.filter((u): u is string => typeof u === 'string' && u.trim().length > 0),
    [urlsKey(urls)],
  )

  const [index, setIndex] = useState(0)
  const key = urlsKey(resolvedUrls)

  useEffect(() => {
    setIndex(0)
  }, [key])

  const src = resolvedUrls[index]
  const isLast = index >= resolvedUrls.length - 1

  const onError = useCallback(() => {
    if (!isLast) {
      setIndex((i) => i + 1)
    } else {
      setIndex(resolvedUrls.length)
    }
  }, [isLast, resolvedUrls.length])

  if (index >= resolvedUrls.length || !src) {
    return <>{fallback ?? null}</>
  }

  return (
    <img
      key={src}
      src={src}
      alt={alt}
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: 'cover',
        ...style,
      }}
      onError={onError}
    />
  )
}
