import { describe, expect, test } from 'vitest'
import { formatRegionMaskSyncError, maskParamsEqual } from './syncRegionMaskAfterWrite.server'

describe('maskParamsEqual', () => {
  test('equal when same ids and buffer', () => {
    expect(
      maskParamsEqual(
        { maskOsmRelationIds: [1, 2], maskBufferKm: 10 },
        { maskOsmRelationIds: [1, 2], maskBufferKm: 10 },
      ),
    ).toBe(true)
  })

  test('unequal when buffer differs', () => {
    expect(
      maskParamsEqual(
        { maskOsmRelationIds: [1], maskBufferKm: 10 },
        { maskOsmRelationIds: [1], maskBufferKm: 5 },
      ),
    ).toBe(false)
  })

  test('unequal when ids differ', () => {
    expect(
      maskParamsEqual(
        { maskOsmRelationIds: [1], maskBufferKm: 10 },
        { maskOsmRelationIds: [2], maskBufferKm: 10 },
      ),
    ).toBe(false)
  })
})

describe('formatRegionMaskSyncError', () => {
  test('includes cause and retry hint', () => {
    const message = formatRegionMaskSyncError('OSM Relation ID(s) nicht gefunden: 1')
    expect(message).toContain('Region gespeichert, aber Maske konnte nicht aktualisiert werden:')
    expect(message).toContain('OSM Relation ID(s) nicht gefunden: 1')
    expect(message).toContain('Buffer')
  })
})
