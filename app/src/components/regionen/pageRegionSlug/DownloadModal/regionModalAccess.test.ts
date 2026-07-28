import { describe, expect, test } from 'vitest'
import { staticRegion } from '@/data/regions.const'
import { getRegionModalAccess, getRegionModalDatasets } from './regionModalAccess'

const bibi = staticRegion.find((region) => region.slug === 'bibi')
const parkraumBerlin = staticRegion.find((region) => region.slug === 'parkraum-berlin')

describe('getRegionModalDatasets', () => {
  test('splits downloadable and other datasets for bibi', () => {
    if (!bibi) throw new Error('bibi region not found')

    const { downloadable, other, all } = getRegionModalDatasets(bibi)

    expect(all.length).toBeGreaterThan(0)
    expect(downloadable.length).toBeGreaterThan(0)
    expect(all.map((dataset) => dataset.tableName).sort()).toEqual(
      [...downloadable, ...other].map((dataset) => dataset.tableName).sort(),
    )
    expect(downloadable.every((dataset) => dataset.isDownloadable)).toBe(true)
    expect(other.every((dataset) => !dataset.isDownloadable)).toBe(true)
  })

  test('marks all datasets as non-downloadable when exports is null', () => {
    if (!parkraumBerlin) throw new Error('parkraum-berlin region not found')

    const { downloadable, other, all } = getRegionModalDatasets(parkraumBerlin)

    expect(downloadable).toEqual([])
    expect(other.length).toBe(all.length)
    expect(other.length).toBeGreaterThan(0)
  })
})

describe('getRegionModalAccess', () => {
  test('shows documentation button when user lacks permissions', () => {
    if (!bibi) throw new Error('bibi region not found')

    const access = getRegionModalAccess(bibi, false)

    expect(access.showDownloadableSectionInDownloadModal).toBe(false)
    expect(access.showOtherDatasetsSectionInDownloadModal).toBe(false)
    expect(access.docsLinksVisibleInDownloadModal).toBe(false)
    expect(access.showDocumentationButton).toBe(true)
  })

  test('shows download sections and hides documentation button for permitted user with exports', () => {
    if (!bibi) throw new Error('bibi region not found')

    const access = getRegionModalAccess(bibi, true)

    expect(access.showDownloadableSectionInDownloadModal).toBe(true)
    expect(access.docsLinksVisibleInDownloadModal).toBe(true)
    expect(access.showDocumentationButton).toBe(false)
  })

  test('shows documentation button when exports is null', () => {
    if (!parkraumBerlin) throw new Error('parkraum-berlin region not found')

    const access = getRegionModalAccess(parkraumBerlin, true)

    expect(access.showDownloadableSectionInDownloadModal).toBe(false)
    expect(access.showOtherDatasetsSectionInDownloadModal).toBe(false)
    expect(access.showDocumentationButton).toBe(true)
  })

  test('other section requires downloadable section', () => {
    if (!bibi) throw new Error('bibi region not found')

    const access = getRegionModalAccess(bibi, true)

    if (access.showOtherDatasetsSectionInDownloadModal) {
      expect(access.showDownloadableSectionInDownloadModal).toBe(true)
      expect(access.other.length).toBeGreaterThan(0)
    }
  })
})

describe('getRegionModalAccess staticRegion matrix', () => {
  test.each(
    staticRegion.flatMap((region) =>
      [true, false].map((hasPermissions) => [region, hasPermissions] as const),
    ),
  )('aligns doc surfaces for %s (permissions=%s)', (region, hasPermissions) => {
    const access = getRegionModalAccess(region, hasPermissions)

    expect(access.showDocumentationButton && access.docsLinksVisibleInDownloadModal).toBe(false)

    if (access.showOtherDatasetsSectionInDownloadModal) {
      expect(access.showDownloadableSectionInDownloadModal).toBe(true)
    }

    if (access.all.length === 0) {
      expect(access.showDocumentationButton).toBe(false)
      expect(access.docsLinksVisibleInDownloadModal).toBe(false)
      return
    }

    const docSurfaces = [
      access.showDocumentationButton,
      access.docsLinksVisibleInDownloadModal,
    ].filter(Boolean)

    expect(docSurfaces).toHaveLength(1)
  })
})
