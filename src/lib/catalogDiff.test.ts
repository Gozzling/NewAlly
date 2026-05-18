import { describe, expect, it } from 'vitest'
import { compareCatalogs, diffEntities } from '@/lib/catalogDiff'

const v17 = { set: 17, patch: '17.1', locale: 'en' }
const v17b = { set: 17, patch: '17.2', locale: 'en' }

describe('catalogDiff', () => {
  it('returns empty diff for identical patch keys', () => {
    const diff = compareCatalogs(v17, v17)
    expect(diff.entities).toHaveLength(0)
    expect(diff.relationships).toHaveLength(0)
  })

  it('diffs entity snapshots across patches', () => {
    const entityDiff = diffEntities(v17, v17b, 'augment')
    expect(Array.isArray(entityDiff)).toBe(true)
  })
})
