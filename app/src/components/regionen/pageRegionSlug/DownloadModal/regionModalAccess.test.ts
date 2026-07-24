import { describe, expect, test } from 'vitest'
import type { ExportId } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/exports/exports.const'
import type { RegionForDatasetDerivation } from '@/components/regionen/pageRegionSlug/regionDatasets/deriveRegionDatasetsFromCategories'
import { getRegionModalAccess, getRegionModalDatasets } from './regionModalAccess'

const bibiExports = [
  'bikelanes',
  'bikeroutes',
  'roads',
  'roadsPathClasses',
  'poiClassification',
  'places',
  'publicTransport',
  'parkings',
  'parkings_no',
  'parkings_separate',
  'off_street_parking_areas',
  'off_street_parking_points',
] as [ExportId, ...ExportId[]]

const bibi: RegionForDatasetDerivation = {
  categories: [
    'poi',
    'bikelanes',
    'roads',
    'surface',
    'lit',
    'parkingLars',
    'parkingTilda',
    'mapillary',
  ],
  exports: bibiExports,
}

const parkraumBerlin: RegionForDatasetDerivation = {
  categories: ['parkingTilda', 'parkingLars', 'mapillary'],
  exports: null,
}

const allRegionExportTables = bibiExports

const testRegions: RegionForDatasetDerivation[] = [bibi, parkraumBerlin]

describe('getRegionModalDatasets', () => {
  test('splits downloadable and other datasets for bibi', () => {
    const { downloadable, other, all } = getRegionModalDatasets(bibi, allRegionExportTables)

    expect(all.length).toBeGreaterThan(0)
    expect(downloadable.length).toBeGreaterThan(0)
    expect(all.map((dataset) => dataset.tableName).sort()).toEqual(
      [...downloadable, ...other].map((dataset) => dataset.tableName).sort(),
    )
    expect(downloadable.every((dataset) => dataset.isDownloadable)).toBe(true)
    expect(other.every((dataset) => !dataset.isDownloadable)).toBe(true)
  })

  test('marks all datasets as non-downloadable when exports is null', () => {
    const { downloadable, other, all } = getRegionModalDatasets(
      parkraumBerlin,
      allRegionExportTables,
    )

    expect(downloadable).toEqual([])
    expect(other.length).toBe(all.length)
    expect(other.length).toBeGreaterThan(0)
  })
})

describe('getRegionModalAccess', () => {
  test('shows documentation button when user lacks permissions', () => {
    const access = getRegionModalAccess(bibi, false, allRegionExportTables)

    expect(access.showDownloadableSectionInDownloadModal).toBe(false)
    expect(access.showOtherDatasetsSectionInDownloadModal).toBe(false)
    expect(access.docsLinksVisibleInDownloadModal).toBe(false)
    expect(access.showDocumentationButton).toBe(true)
  })

  test('shows download sections and hides documentation button for permitted user with exports', () => {
    const access = getRegionModalAccess(bibi, true, allRegionExportTables)

    expect(access.showDownloadableSectionInDownloadModal).toBe(true)
    expect(access.docsLinksVisibleInDownloadModal).toBe(true)
    expect(access.showDocumentationButton).toBe(false)
  })

  test('shows documentation button when exports is null', () => {
    const access = getRegionModalAccess(parkraumBerlin, true, allRegionExportTables)

    expect(access.showDownloadableSectionInDownloadModal).toBe(false)
    expect(access.showOtherDatasetsSectionInDownloadModal).toBe(false)
    expect(access.showDocumentationButton).toBe(true)
  })

  test('other section requires downloadable section', () => {
    const access = getRegionModalAccess(bibi, true, allRegionExportTables)

    if (access.showOtherDatasetsSectionInDownloadModal) {
      expect(access.showDownloadableSectionInDownloadModal).toBe(true)
      expect(access.other.length).toBeGreaterThan(0)
    }
  })
})

describe('getRegionModalAccess region matrix', () => {
  test.each(
    testRegions.flatMap((region) =>
      [true, false].map((hasPermissions) => [region, hasPermissions] as const),
    ),
  )('aligns doc surfaces for region (permissions=%s)', (region, hasPermissions) => {
    const access = getRegionModalAccess(region, hasPermissions, allRegionExportTables)

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
