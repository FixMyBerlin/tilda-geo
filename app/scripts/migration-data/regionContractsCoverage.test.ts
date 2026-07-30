import { describe, expect, test } from 'vitest'
import { regionContracts } from '@/scripts/migration-data/regionContracts.const'
import { staticRegion } from '@/scripts/migration-data/regions.const'

describe('regionContracts.const coverage', () => {
  test('only multi-region contracts are defined', () => {
    expect(regionContracts.length).toBeGreaterThan(0)
    for (const contract of regionContracts) {
      expect(
        contract.regionSlugs.length,
        `${contract.slug} must group more than one region`,
      ).toBeGreaterThan(1)
    }
  })

  test('contract region slugs exist in staticRegion and are not assigned twice', () => {
    const regionSlugs = staticRegion.map((region) => region.slug)
    const coveredSlugs = regionContracts.flatMap((contract) => contract.regionSlugs)

    const extra = coveredSlugs.filter((slug) => !regionSlugs.includes(slug))
    expect(extra, `regionContracts slugs not in staticRegion: ${extra.join(', ')}`).toEqual([])

    const seen = new Set<string>()
    const duplicates: string[] = []
    for (const slug of coveredSlugs) {
      if (seen.has(slug)) duplicates.push(slug)
      seen.add(slug)
    }
    expect(
      duplicates,
      `regionContracts assigns slugs more than once: ${duplicates.join(', ')}`,
    ).toEqual([])
  })
})
