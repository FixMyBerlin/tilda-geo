import { describe, expect, test } from 'vitest'
import { serializeFeaturesParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/featuresParamCodec'
import { additionalSourceKeys } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useFeaturesParam/url'
import { defaultRegionSearch } from '@/shared/regionen/regionSearchSchemas'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { stripModeScopedSearch } from './modeScopedSearchMiddleware'

const [osmNotesSourceId, , , qaSourceId] = additionalSourceKeys

const notesFeatureWire = serializeFeaturesParam([
  { id: 1, sourceId: osmNotesSourceId, coordinates: [13.4, 52.5] },
])
const qaFeatureWire = serializeFeaturesParam([
  { id: 3, sourceId: qaSourceId, coordinates: [13.4, 52.5] },
])

describe('stripModeScopedSearch', () => {
  test('drops notes.new outside notes mode and keeps it on notes', () => {
    const search = {
      ...defaultRegionSearch(),
      [searchParamsRegistry.notes]: { new: '14/52.5/13.4', search: 'foo' },
    }
    expect(stripModeScopedSearch(search, 'notes')[searchParamsRegistry.notes]).toEqual({
      new: '14/52.5/13.4',
      search: 'foo',
    })
    expect(stripModeScopedSearch(search, 'map')[searchParamsRegistry.notes]).toEqual({
      search: 'foo',
    })
  })

  test('drops review.new and review.move outside reviewLists', () => {
    const search = {
      ...defaultRegionSearch(),
      [searchParamsRegistry.review]: { key: 9, new: true as const, move: true as const },
    }
    expect(stripModeScopedSearch(search, 'reviewLists')[searchParamsRegistry.review]).toEqual({
      key: 9,
      new: true,
      move: true,
    })
    expect(stripModeScopedSearch(search, 'qa')[searchParamsRegistry.review]).toEqual({ key: 9 })
  })

  test('filters mode-owned f features and drops the key when empty', () => {
    const search = {
      ...defaultRegionSearch(),
      [searchParamsRegistry.f]: notesFeatureWire,
    }
    expect(stripModeScopedSearch(search, 'notes')[searchParamsRegistry.f]).toBe(notesFeatureWire)
    expect(stripModeScopedSearch(search, 'map')[searchParamsRegistry.f]).toBeUndefined()
  })

  test('keeps allowed f features when stripping others', () => {
    const mixed = serializeFeaturesParam([
      { id: 1, sourceId: osmNotesSourceId, coordinates: [13.4, 52.5] },
      { id: 3, sourceId: qaSourceId, coordinates: [13.4, 52.5] },
    ])
    const search = {
      ...defaultRegionSearch(),
      [searchParamsRegistry.f]: mixed,
    }
    expect(stripModeScopedSearch(search, 'qa')[searchParamsRegistry.f]).toBe(qaFeatureWire)
  })
})
