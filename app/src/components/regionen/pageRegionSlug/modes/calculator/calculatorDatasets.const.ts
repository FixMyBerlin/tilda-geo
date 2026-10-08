import type { MapDataCategoryId } from '@/components/regionen/pageRegionSlug/mapData/mapDataCategories/MapDataCategoryId'
import type { SourcesId } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/sources.const'
import { mapboxStyleLayers } from '@/components/regionen/pageRegionSlug/mapData/mapDataSubcategories/mapboxStyles/mapboxStyleLayers'
import type { MapboxStyleLayer } from '@/components/regionen/pageRegionSlug/mapData/mapDataSubcategories/mapboxStyles/types'
import type { FileMapDataSubcategoryStyleLayer } from '@/components/regionen/pageRegionSlug/mapData/types'
import { translations } from '@/components/regionen/pageRegionSlug/SidebarInspector/TagsTable/translations/translations.const'
import type { CalculatorFilter } from './calculatorModeParam'

/**
 * The tag that says which part of a dataset a point is from. The points do not have it: the
 * engine adds it (`useUpdateCalculation`), and the map resolves it per layer. It is broken down,
 * filtered and colored like any other tag.
 */
export const calculatorPartKey = 'part'

type CalculatorDatasetPart = {
  /** The value of `calculatorPartKey`; translated in `translationsSources.const.ts`. */
  id: string
  /** The summed source; its `calculator` config holds the sum and group-by keys. */
  sourceId: SourcesId
  /** The summed points. Only on the map while the dataset is selected in the mode. */
  layers: FileMapDataSubcategoryStyleLayer[]
}

export type CalculatorDataset = {
  /** The URL value (`sum.key`). */
  id: string
  name: string
  /** A region offers the dataset when it has this category. */
  categoryId: MapDataCategoryId
  /** The sources that are summed together. */
  parts: CalculatorDatasetPart[]
  /** The filter of a link without `sum.filter`: what the dataset opens with. */
  defaultFilter: CalculatorFilter
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

const parkingPart = (id: string, source: SourcesId, sourceLayer: string, color: string) =>
  ({
    id,
    sourceId: source,
    layers: mapboxStyleLayers({ layers: [quantizedPointsLayer(color)], source, sourceLayer }),
  }) satisfies CalculatorDatasetPart

/**
 * What the Summieren mode can sum. The order is the order in the panel; the first dataset of a
 * region is its default.
 *
 * Parking is one dataset of two sources, the points along the streets and those of the parking
 * areas off the street. It opens with the public parking along the streets; a click in the panel
 * adds the rest. Public and private parking are the tag `operator_type` of both sources.
 */
const calculatorDatasets: CalculatorDataset[] = [
  {
    id: 'parking',
    name: 'Parkraum',
    categoryId: 'parkingTilda',
    parts: [
      parkingPart('street', 'tilda_parkings_quantized', 'parkings_quantized', '#6d28d9'),
      parkingPart(
        'off_street',
        'tilda_parkings_off_street_quantized',
        'off_street_parking_quantized',
        '#a21caf',
      ),
    ],
    defaultFilter: { [calculatorPartKey]: 'street', operator_type: 'public' },
  },
]

export const calculatorDatasetsForCategories = (categoryIds: MapDataCategoryId[]) =>
  calculatorDatasets.filter((dataset) => categoryIds.includes(dataset.categoryId))

export const calculatorSourceKey = (datasetId: string, partId: string) =>
  `calculator--${datasetId}--${partId}`

export const calculatorLayerId = (datasetId: string, partId: string, layerId: string) =>
  `calculator--${datasetId}--${partId}--${layerId}`

/**
 * The source whose translations name a tag, or one of its values: the parts share most tags,
 * but each has values the other does not know (`parking=lane`, `parking=underground`).
 */
export const calculatorTranslationSourceId = (
  parts: Pick<CalculatorDatasetPart, 'sourceId'>[],
  key: string,
  value?: string,
) => {
  const translationKey = (sourceId: string) =>
    value === undefined ? `${sourceId}--${key}--key` : `${sourceId}--${key}=${value}`
  const match = parts.find((part) => translations[translationKey(part.sourceId)])
  return (match ?? parts[0])?.sourceId ?? ''
}
