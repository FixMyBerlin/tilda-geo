import { describe, expect, test } from 'vitest'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { modeSwitcherSearch } from './modeSwitcherSearch'

describe('modeSwitcherSearch', () => {
  test('keeps notes.new when switching modes; ModeScopedSelectionReset clears compose', () => {
    const prev = {
      map: '14/52.5/13.4',
      [searchParamsRegistry.notes]: { new: '14/52.5/13.4' },
    }
    expect(modeSwitcherSearch('notes', prev)).toBe(prev)
    expect(modeSwitcherSearch('map', prev)).toBe(prev)
    expect(modeSwitcherSearch('qa', prev)).toBe(prev)
    expect(modeSwitcherSearch('reviewLists', prev)).toBe(prev)
  })
})
