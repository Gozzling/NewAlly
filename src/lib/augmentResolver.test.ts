import { beforeEach, describe, expect, it, vi } from 'vitest'

const notifyTelemetry = vi.fn()
vi.mock('@/engine/events/telemetryBridge', () => ({
  notifyTelemetry: (...args: unknown[]) => notifyTelemetry(...args),
}))

import {
  resetAugmentResolverCache,
  resolveAugment,
  resolveAugmentByApiName,
  resolveAugmentByName,
  resolveAugmentDisplayName,
} from '@/lib/augmentResolver'

vi.mock('@/store/useAppStore', () => ({
  useAppStore: {
    getState: () => ({
      gameData: {
        augments: [],
        lastUpdated: 1,
        setNumber: 17,
      },
    }),
  },
}))

describe('augmentResolver', () => {
  beforeEach(() => {
    resetAugmentResolverCache()
    vi.clearAllMocks()
  })

  it('resolves bundled augment by display name', () => {
    const hit = resolveAugmentByName('Space God Blessing')
    expect(hit?.canonicalId).toBeTruthy()
    expect(hit?.name).toBe('Space God Blessing')
    expect(hit?.set).toBe(17)
  })

  it('resolves static augment by apiName', () => {
    const hit = resolveAugmentByApiName('TFT17_Augment_AnimaSquad_Commander')
    expect(hit?.name).toMatch(/Anima/i)
    expect(hit?.canonicalId).toMatch(/^tft17_/)
  })

  it('humanizes GEP internal ids', () => {
    const label = resolveAugmentDisplayName('TFT9_Augment_CyberneticBulk3', { silent: true })
    expect(label.length).toBeGreaterThan(2)
    expect(label).not.toMatch(/^TFT\d+_Augment/)
  })

  it('emits structured telemetry once for unknown identifiers', () => {
    expect(resolveAugment('__totally_unknown_augment_xyz__')).toBeNull()
    expect(resolveAugment('__totally_unknown_augment_xyz__')).toBeNull()
    expect(notifyTelemetry).toHaveBeenCalled()
    const kinds = notifyTelemetry.mock.calls.map((c) => (c[0] as { kind: string }).kind)
    expect(kinds).toContain('entity_unresolved')
    expect(kinds).toContain('augment_unresolved')
  })

  it('accepts patch-aware options', () => {
    const hit = resolveAugment('Space God Blessing', { set: 17, patch: '17.1' })
    expect(hit?.version.patch).toBe('17.1')
  })
})
