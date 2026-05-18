import { beforeEach, describe, expect, it } from 'vitest'
import {
  getCachedProjection,
  projectionKeyFromVersion,
  resetProjectionCache,
} from '@/lib/canonicalProjectionCache'

describe('canonicalProjectionCache', () => {
  beforeEach(() => {
    resetProjectionCache()
  })

  it('caches by canonicalId, patch, locale, and projection type', () => {
    const key = projectionKeyFromVersion('tft17_test', 'guide', { patch: '17.1', locale: 'en' })
    let runs = 0
    const a = getCachedProjection(key, () => {
      runs += 1
      return { ok: true }
    })
    const b = getCachedProjection(key, () => {
      runs += 1
      return { ok: false }
    })
    expect(a.ok).toBe(true)
    expect(b.ok).toBe(true)
    expect(runs).toBe(1)
  })
})
