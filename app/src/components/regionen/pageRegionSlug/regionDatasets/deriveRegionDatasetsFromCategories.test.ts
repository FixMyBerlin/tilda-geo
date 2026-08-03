import { describe, expect, test } from 'vitest'
import { getRegionModalDatasets } from '@/components/regionen/pageRegionSlug/DownloadModal/regionModalAccess'
import type { ExportId } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/exports/exports.const'
import { exportConfigs } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/exports/exports.const'
import {
  deriveRegionDatasetsFromCategories,
  getExportIdsOrderedByRegionCategories,
  type RegionForDatasetDerivation,
} from './deriveRegionDatasetsFromCategories'

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

const allExportIds = exportConfigs.map((config) => config.id)

describe('getExportIdsOrderedByRegionCategories', () => {
  test('matches download modal category-derived order for bibi', () => {
    const ordered = getExportIdsOrderedByRegionCategories(
      bibi.categories,
      allExportIds,
      bibiExports,
    )
    const modalOrder = getRegionModalDatasets(bibi, bibiExports).all.map(
      (dataset) => dataset.tableName,
    )

    expect(ordered.slice(0, modalOrder.length)).toEqual(modalOrder)
  })

  test('appends exports not mapped by categories in catalog order', () => {
    const ordered = getExportIdsOrderedByRegionCategories(
      bibi.categories,
      allExportIds,
      bibiExports,
    )
    const categoryDerived = deriveRegionDatasetsFromCategories(bibi, bibiExports).map(
      (dataset) => dataset.tableName,
    )
    const remainder = allExportIds.filter((exportId) => !categoryDerived.includes(exportId))

    expect(ordered).toEqual([...categoryDerived, ...remainder])
  })

  test('falls back to catalog order when no categories are selected', () => {
    expect(getExportIdsOrderedByRegionCategories([], allExportIds, bibiExports)).toEqual(
      allExportIds,
    )
  })
})
