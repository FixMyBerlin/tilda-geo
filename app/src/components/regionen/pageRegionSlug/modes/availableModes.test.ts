import { describe, expect, test } from 'vitest'
import type { TRegion } from '@/server/regions/regionConfigMapper.server'
import { deriveAvailableModes, isMemberOnlyModePathname } from './availableModes'

const region = (overrides: Partial<Pick<TRegion, 'notesOsm' | 'notesInternal'>>) => {
  return {
    notesOsm: false,
    notesInternal: false,
    ...overrides,
  } satisfies Pick<TRegion, 'notesOsm' | 'notesInternal'>
}

describe('deriveAvailableModes()', () => {
  test('notes mode follows the region notes config', () => {
    expect(deriveAvailableModes({ region: region({}), qaConfigsCount: 0 }).notes).toBe(false)
    expect(
      deriveAvailableModes({ region: region({ notesOsm: true }), qaConfigsCount: 0 }).notes,
    ).toBe(true)
    expect(
      deriveAvailableModes({ region: region({ notesInternal: true }), qaConfigsCount: 0 }).notes,
    ).toBe(true)
  })

  test('qa mode requires at least one QA config', () => {
    expect(deriveAvailableModes({ region: region({}), qaConfigsCount: 0 }).qa).toBe(false)
    expect(deriveAvailableModes({ region: region({}), qaConfigsCount: 2 }).qa).toBe(true)
  })

  test('review lists mode requires an assigned list, or manage rights to bootstrap one', () => {
    expect(deriveAvailableModes({ region: region({}), qaConfigsCount: 0 }).reviewLists).toBe(false)
    expect(
      deriveAvailableModes({ region: region({}), qaConfigsCount: 0, reviewListsCount: 1 })
        .reviewLists,
    ).toBe(true)
    // Members/admins see the mode even with no lists, so they can create the first one.
    expect(
      deriveAvailableModes({ region: region({}), qaConfigsCount: 0, canManage: true }).reviewLists,
    ).toBe(true)
  })
})

describe('isMemberOnlyModePathname()', () => {
  test('QA and Prüflisten are always member-only', () => {
    expect(isMemberOnlyModePathname('/regionen/foo/qa')).toBe(true)
    expect(isMemberOnlyModePathname('/regionen/foo/prueflisten')).toBe(true)
    expect(isMemberOnlyModePathname('/regionen/foo')).toBe(false)
    expect(isMemberOnlyModePathname('/regionen/foo/hinweise')).toBe(false)
  })

  test('Hinweise is member-only only when the region has internal notes and no OSM notes', () => {
    expect(
      isMemberOnlyModePathname('/regionen/foo/hinweise', region({ notesInternal: true })),
    ).toBe(true)
    expect(
      isMemberOnlyModePathname('/regionen/foo/hinweise', {
        notesOsm: true,
        notesInternal: true,
      }),
    ).toBe(false)
    expect(isMemberOnlyModePathname('/regionen/foo/hinweise', region({ notesOsm: true }))).toBe(
      false,
    )
  })
})
