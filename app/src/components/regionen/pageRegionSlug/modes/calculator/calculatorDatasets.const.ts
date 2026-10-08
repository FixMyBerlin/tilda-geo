import type { MapDataCategoryId } from '@/components/regionen/pageRegionSlug/mapData/mapDataCategories/MapDataCategoryId'
import type { SourcesId } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/sources.const'
import { mapboxStyleLayers } from '@/components/regionen/pageRegionSlug/mapData/mapDataSubcategories/mapboxStyles/mapboxStyleLayers'
import type { MapboxStyleLayer } from '@/components/regionen/pageRegionSlug/mapData/mapDataSubcategories/mapboxStyles/types'
import { subcat_parkingTilda_offStreet_private } from '@/components/regionen/pageRegionSlug/mapData/mapDataSubcategories/subcat_parkingTilda_offStreet_private.const'
import { subcat_parkingTilda_offStreet_public } from '@/components/regionen/pageRegionSlug/mapData/mapDataSubcategories/subcat_parkingTilda_offStreet_public.const'
import { subcat_parkingTilda_street_private } from '@/components/regionen/pageRegionSlug/mapData/mapDataSubcategories/subcat_parkingTilda_street_private.const'
import { subcat_parkingTilda_street_public } from '@/components/regionen/pageRegionSlug/mapData/mapDataSubcategories/subcat_parkingTilda_street_public.const'
import type {
  FileMapDataSubcategory,
  FileMapDataSubcategoryStyleLayer,
} from '@/components/regionen/pageRegionSlug/mapData/types'

type CalculatorDataset = {
  /**
   * The URL value (`sum.key`). The id of the sidebar subcategory that shows the same parking,
   * so a dataset reads like its layer in the category list.
   */
  id: string
  name: string
  /** The summed source; its `calculator` config holds the sum and group-by keys. */
  sourceId: SourcesId
  /** A region offers the dataset when it has this category. */
  categoryId: MapDataCategoryId
  /**
   * The part of the source this dataset is, as tag values. Its keys are fixed here, so they are
   * neither broken down in the panel nor offered as filter.
   */
  where: Record<string, string>
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

const street = {
  source: 'tilda_parkings_quantized',
  sourceLayer: 'parkings_quantized',
  color: '#6d28d9',
} as const

const offStreet = {
  source: 'tilda_parkings_off_street_quantized',
  sourceLayer: 'off_street_parking_quantized',
  color: '#a21caf',
} as const

/** One dataset per sidebar subcategory: the same split by `operator_type`, the same name. */
const parkingDataset = (
  subcategory: Pick<FileMapDataSubcategory, 'id' | 'name'>,
  { source, sourceLayer, color }: typeof street | typeof offStreet,
  operatorType: 'public' | 'private',
) =>
  ({
    id: subcategory.id,
    name: subcategory.name,
    sourceId: source,
    categoryId: 'parkingTilda',
    where: { operator_type: operatorType },
    layers: mapboxStyleLayers({
      layers: [quantizedPointsLayer(color)],
      source,
      sourceLayer,
      additionalFilter: ['match', ['get', 'operator_type'], [operatorType], true, false],
    }),
  }) satisfies CalculatorDataset

/**
 * What the Summieren mode can sum. The order is the order in the panel; the first dataset of a
 * region is its default. The parking datasets mirror the four parking layers of the sidebar.
 * They used to be two "Summieren: …" subcategories (see
 * `migrateLegacyCalculatorSubcategories.server.ts` for old links).
 */
export const calculatorDatasets: CalculatorDataset[] = [
  parkingDataset(subcat_parkingTilda_street_public, street, 'public'),
  parkingDataset(subcat_parkingTilda_street_private, street, 'private'),
  parkingDataset(subcat_parkingTilda_offStreet_public, offStreet, 'public'),
  parkingDataset(subcat_parkingTilda_offStreet_private, offStreet, 'private'),
]

export const calculatorDatasetsForCategories = (categoryIds: MapDataCategoryId[]) =>
  calculatorDatasets.filter((dataset) => categoryIds.includes(dataset.categoryId))

export const calculatorSourceKey = (datasetId: string) => `calculator--${datasetId}`

export const calculatorLayerId = (datasetId: string, layerId: string) =>
  `calculator--${datasetId}--${layerId}`
