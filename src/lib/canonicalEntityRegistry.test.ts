import { beforeEach, describe, expect, it } from 'vitest'
import type { CanonicalAugment } from '@/types/canonicalAugment'
import {
  registerEntity,
  registerEntityBatch,
  resetCanonicalEntityRegistry,
  resolveByCanonicalId,
  resolveEntity,
} from '@/lib/canonicalEntityRegistry'

const version = { set: 17, patch: '17.1', locale: 'en' }

function sampleAugment(overrides: Partial<CanonicalAugment> = {}): CanonicalAugment {
  return {
    type: 'augment',
    canonicalId: 'tft17_test_aug',
    apiName: 'TFT17_Augment_Test',
    name: 'Test Augment',
    set: version.set,
    patch: version.patch,
    locale: version.locale,
    version,
    metadata: { sourceChain: ['static'], completeness: { hasEffects: true } },
    ...overrides,
  }
}

describe('canonicalEntityRegistry', () => {
  beforeEach(() => {
    resetCanonicalEntityRegistry()
  })

  it('resolves by canonicalId, apiName, and display name', () => {
    registerEntity(sampleAugment())
    expect(resolveByCanonicalId('augment', 'tft17_test_aug', { silent: true })?.name).toBe(
      'Test Augment',
    )
    expect(resolveEntity('augment', 'TFT17_Augment_Test', { silent: true })?.canonicalId).toBe(
      'tft17_test_aug',
    )
    expect(resolveEntity('augment', 'Test Augment', { silent: true })?.apiName).toBe(
      'TFT17_Augment_Test',
    )
  })

  it('supports batch registration for a patch catalog', () => {
    registerEntityBatch('augment', version, [
      sampleAugment(),
      sampleAugment({
        canonicalId: 'tft17_other',
        apiName: 'TFT17_Augment_Other',
        name: 'Other',
      }),
    ])
    expect(resolveEntity('augment', 'Other', { silent: true })?.canonicalId).toBe('tft17_other')
  })
})
