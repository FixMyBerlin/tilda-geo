import { describe, expect, test } from 'vitest'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { modeSwitcherSearch } from './modeSwitcherSearch'

describe('modeSwitcherSearch', () => {
  test('keeps notes compose params when switching to Hinweise', () => {
    const prev = {
      map: '14/52.5/13.4',
      [searchParamsRegistry.osmNote]: '14/52.5/13.4',
    }
    expect(modeSwitcherSearch('notes', prev)).toBe(prev)
  })

  test('strips notes compose params when leaving Hinweise', () => {
    const prev = {
      map: '14/52.5/13.4',
      [searchParamsRegistry.osmNote]: '14/52.5/13.4',
      [searchParamsRegistry.internalNote]: '14/52.5/13.4',
    }
    expect(modeSwitcherSearch('map', prev)).toEqual({ map: '14/52.5/13.4' })
    expect(modeSwitcherSearch('qa', prev)).toEqual({ map: '14/52.5/13.4' })
    expect(modeSwitcherSearch('reviewLists', prev)).toEqual({ map: '14/52.5/13.4' })
  })

  test('returns the same object when there is nothing to strip', () => {
    const prev = { map: '14/52.5/13.4' }
    expect(modeSwitcherSearch('map', prev)).toBe(prev)
  })
})
