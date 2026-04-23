interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const PREFIX = 'tft-ally::'

export function setCache<T>(key: string, value: T, ttlMs: number): void {
  const entry: CacheEntry<T> = { value, expiresAt: Date.now() + ttlMs }
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(entry))
  } catch {
    // storage full — silently drop
  }
}

export function getCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null
    const entry = JSON.parse(raw) as CacheEntry<T>
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(PREFIX + key)
      return null
    }
    return entry.value
  } catch {
    return null
  }
}

export function removeCache(key: string): void {
  localStorage.removeItem(PREFIX + key)
}

export function clearAllCache(): void {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i)
    if (k?.startsWith(PREFIX)) localStorage.removeItem(k)
  }
}

export const ONE_HOUR = 60 * 60 * 1000
export const ONE_DAY = 24 * ONE_HOUR
