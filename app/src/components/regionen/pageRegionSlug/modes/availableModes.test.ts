import { describe, expect, test } from 'vitest'
import type { TRegion } from '@/server/regions/regionConfigMapper.server'
import { deriveAvailableModes, isMemberOnlyMode } from './availableModes'

type RegionFields = Pick<TRegion, 'notesOsm' | 'notesInternal' | 'categories'>

const region = (overrides: Partial<RegionFields>) => {
  return {
    notesOsm: false,
    notesInternal: false,
    categories: [],
    ...overrides,
  } satisfies RegionFields
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
    expect(
      deriveAvailableModes({
        region: region({ notesOsm: true, notesInternal: true }),
        qaConfigsCount: 0,
      }).notes,
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

  test('calculator mode requires a category with a dataset that can be summed', () => {
    const calculator = (categories: RegionFields['categories']) =>
      deriveAvailableModes({ region: region({ categories }), qaConfigsCount: 0 }).calculator
    expect(calculator([])).toBe(false)
    expect(calculator(['bikelanes', 'roads'])).toBe(false)
    expect(calculator(['bikelanes', 'parkingTilda'])).toBe(true)
    expect(calculator(['parkingLars'])).toBe(false)
  })
})

describe('isMemberOnlyMode()', () => {
  test('QA and Prüflisten are always member-only', () => {
    expect(isMemberOnlyMode('qa', region({}))).toBe(true)
    expect(isMemberOnlyMode('reviewLists', region({}))).toBe(true)
  })

  test('Summieren is open to everyone who can see the region', () => {
    expect(isMemberOnlyMode('calculator', region({ notesInternal: true }))).toBe(false)
  })

  test('Hinweise is member-only only when the region has internal notes and no OSM notes', () => {
    expect(isMemberOnlyMode('notes', region({ notesInternal: true }))).toBe(true)
    expect(isMemberOnlyMode('notes', region({ notesOsm: true, notesInternal: true }))).toBe(false)
    expect(isMemberOnlyMode('notes', region({ notesOsm: true }))).toBe(false)
    expect(isMemberOnlyMode('notes', region({}))).toBe(false)
  })
})
