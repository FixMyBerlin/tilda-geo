import { describe, expect, test } from 'vitest'
import {
  formatSharedWithRegions,
  otherRegionNames,
  sharedWithRegionsSubtitle,
} from './sharedWithRegions'

describe('sharedWithRegions', () => {
  test('otherRegionNames omits the current region', () => {
    expect(otherRegionNames(undefined, 'berlin')).toEqual([])
    expect(otherRegionNames([{ slug: 'berlin', name: 'Berlin' }], 'berlin')).toEqual([])
    expect(
      otherRegionNames(
        [
          { slug: 'berlin', name: 'Berlin' },
          { slug: 'bb', name: 'Brandenburg' },
        ],
        'berlin',
      ),
    ).toEqual(['Brandenburg'])
  })

  test('formatSharedWithRegions omits the hint when nothing else is linked', () => {
    expect(formatSharedWithRegions('Liste', [])).toBeUndefined()
    expect(formatSharedWithRegions('Ordner', ['Brandenburg'])).toBe(
      'Ordner geteilt mit: »Brandenburg«',
    )
    expect(formatSharedWithRegions('Liste', ['Alpha', 'Beta'])).toBe(
      'Liste geteilt mit: »Alpha«, »Beta«',
    )
  })

  test('sharedWithRegionsSubtitle composes both', () => {
    expect(
      sharedWithRegionsSubtitle(
        'Liste',
        [
          { slug: 'berlin', name: 'Berlin' },
          { slug: 'bb', name: 'Brandenburg Projektgruppe' },
        ],
        'berlin',
      ),
    ).toBe('Liste geteilt mit: »Brandenburg Projektgruppe«')
  })
})
