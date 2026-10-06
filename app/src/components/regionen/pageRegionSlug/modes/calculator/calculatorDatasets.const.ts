import type { MapDataCategoryId } from '@/components/regionen/pageRegionSlug/mapData/mapDataCategories/MapDataCategoryId'
import type { SourcesId } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/sources.const'
import { mapboxStyleGroupLayers_parking_calculator } from '@/components/regionen/pageRegionSlug/mapData/mapDataSubcategories/mapboxStyles/groups/parking_calculator'
import { mapboxStyleLayers } from '@/components/regionen/pageRegionSlug/mapData/mapDataSubcategories/mapboxStyles/mapboxStyleLayers'
import type { MapboxStyleLayer } from '@/components/regionen/pageRegionSlug/mapData/mapDataSubcategories/mapboxStyles/types'
import type { FileMapDataSubcategoryStyleLayer } from '@/components/regionen/pageRegionSlug/mapData/types'

type CalculatorDataset = {
  /** The summed source; its `calculator` config holds the sum and group-by keys. Also the URL value (`sum.key`). */
  sourceId: SourcesId
  name: string
  /** A region offers the dataset when it has this category. */
  categoryId: MapDataCategoryId
  /** The summed points. Only on the map while the dataset is selected in the mode. */
  layers: FileMapDataSubcategoryStyleLayer[]
}

const quantizedPointsLayer = (color: string) =>
  ({
    id: 'parking-points',
    type: 'circle',
    paint: {
      'circle-color': color,
      'circle-stroke-color': '#fdf4ff',
      'circle-stroke-opacity': 0.9,
      'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 16, 0, 20, 2],
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 0, 17, 3],
    },
  }) satisfies MapboxStyleLayer

/**
 * What the Summieren mode can sum. The order is the order in the panel; the first dataset of a
 * region is its default. These used to be "Summieren: …" subcategories of the categories below
 * (see `migrateLegacyCalculatorSubcategories.server.ts` for old links).
 */
export const calculatorDatasets: CalculatorDataset[] = [
  {
    sourceId: 'tilda_parkings_quantized',
    name: 'Öffentliches Straßenparken',
    categoryId: 'parkingTilda',
    layers: mapboxStyleLayers({
      layers: [quantizedPointsLayer('#6d28d9')],
      source: 'tilda_parkings_quantized',
      sourceLayer: 'parkings_quantized',
    }),
  },
  {
    sourceId: 'tilda_parkings_off_street_quantized',
    name: 'Parken abseits des Straßenraumes',
    categoryId: 'parkingTilda',
    layers: mapboxStyleLayers({
      layers: [quantizedPointsLayer('#a21caf')],
      source: 'tilda_parkings_off_street_quantized',
      sourceLayer: 'off_street_parking_quantized',
    }),
  },
  {
    sourceId: 'lars_parking_points',
    name: 'Parkraum (Community)',
    categoryId: 'parkingLars',
    layers: mapboxStyleLayers({
      layers: mapboxStyleGroupLayers_parking_calculator,
      source: 'lars_parking_points',
      sourceLayer: 'processing.parking_spaces',
    }),
  },
]

export const calculatorDatasetsForCategories = (categoryIds: MapDataCategoryId[]) =>
  calculatorDatasets.filter((dataset) => categoryIds.includes(dataset.categoryId))

export const calculatorSourceKey = (sourceId: SourcesId) => `calculator--${sourceId}`

export const calculatorLayerId = (sourceId: SourcesId, layerId: string) =>
  `calculator--${sourceId}--${layerId}`
