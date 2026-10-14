import type { MapDataCategoryId } from '@/components/regionen/pageRegionSlug/mapData/mapDataCategories/MapDataCategoryId'
import type { SourcesId } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/sources.const'
import type { StyleLayer } from '@/components/regionen/pageRegionSlug/mapData/mapDataSubcategories/layers/utils/types'
import { wrapSourceLayers } from '@/components/regionen/pageRegionSlug/mapData/mapDataSubcategories/layers/utils/wrapSourceLayers'
import type { FileMapDataSubcategoryStyleLayer } from '@/components/regionen/pageRegionSlug/mapData/types'
import { translations } from '@/components/regionen/pageRegionSlug/SidebarInspector/TagsTable/translations/translations.const'
import type { CalculatorFilter } from './calculatorModeParam'

/**
 * The tag that says which part of a dataset a feature is from. The features do not have it: the
 * server adds it to the rows it returns, and the map resolves it per layer. It is broken down,
 * filtered and colored like any other tag.
 */
export const calculatorPartKey = 'part'

/** The amounts a feature can carry; the order the panel offers them in. */
export const calculatorMetricOrder = ['capacity', 'area', 'length_directions'] as const

export type CalculatorMetric = (typeof calculatorMetricOrder)[number]

type CalculatorDatasetPart = {
  /**
   * The `part` of `tilda_measure_<dataset>` and the value of `calculatorPartKey`; translated in
   * `translationsSources.const.ts`.
   */
  id: string
  /** The map source that serves the table of this part: its tiles and the names of its tags. */
  sourceId: SourcesId
  /** The tags the sum is broken down by, in the order of the groups in the panel. */
  groupByKeys: string[]
  /** The summed features. Only on the map while the dataset is selected in the mode. */
  layers: FileMapDataSubcategoryStyleLayer[]
}

export type CalculatorDataset = {
  /** The URL value (`sum.key`). */
  id: string
  name: string
  /** A region offers the dataset when it has one of these categories. */
  categoryIds: MapDataCategoryId[]
  /**
   * The SQL functions with the features: `tilda_measure_<name>`
   * (`processing/measure/measure_functions.sql`). `roads` is the streets and the paths.
   */
  measureDatasets: ('parking' | 'bikelanes' | 'roads' | 'bicycle_parking')[]
  /** The amounts that are summed (numeric tags of the features) and how the panel names them. */
  sumKeys: Partial<Record<CalculatorMetric, string>>
  /** The tables that are summed together. */
  parts: CalculatorDatasetPart[]
  /** The filter of a link without `sum.filter`: what the dataset opens with. */
  defaultFilter: CalculatorFilter
}

/** One color per part of a dataset, while no style colors the features. */
const partColors = ['#6d28d9', '#a21caf', '#0e7490'] as const

const lineLayers = (color: string) =>
  [
    {
      id: 'line',
      type: 'line',
      layout: { 'line-cap': 'round' },
      paint: {
        'line-color': color,
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 16, 3],
      },
    },
  ] satisfies StyleLayer[]

const areaLayers = (color: string) =>
  [
    { id: 'fill', type: 'fill', paint: { 'fill-color': color } },
    { id: 'outline', type: 'line', paint: { 'line-color': color, 'line-width': 1 } },
  ] satisfies StyleLayer[]

const pointLayers = (color: string) =>
  [
    {
      id: 'points',
      type: 'circle',
      paint: {
        'circle-color': color,
        'circle-stroke-color': '#fdf4ff',
        'circle-stroke-width': ['interpolate', ['linear'], ['zoom'], 16, 0, 20, 2],
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 1, 17, 4],
      },
    },
  ] satisfies StyleLayer[]

const part = ({
  sourceLayer,
  layers,
  ...rest
}: Omit<CalculatorDatasetPart, 'layers'> & {
  /** The table of the part, which is its layer in the tiles of the source. */
  sourceLayer: string
  layers: StyleLayer[]
}) =>
  ({
    ...rest,
    layers: wrapSourceLayers({ layers, source: rest.sourceId, sourceLayer }),
  }) satisfies CalculatorDatasetPart

/**
 * What the Summieren mode can sum. The order is the order in the panel; the first dataset of a
 * region is its default. A dataset is a folder of tables that are summed together (`parts`) and
 * opens narrowed to what is asked for most (`defaultFilter`); a click in the panel adds the rest.
 *
 * Streets and paths open with the cycling infrastructure only.
 *
 * Parking is one dataset of two tables, the parking along the streets (lines) and the parking
 * areas off the street. It opens with the public parking along the streets; a click in the panel
 * adds the rest. Public and private parking are the tag `operator_type` of both tables.
 */
const calculatorDatasets: CalculatorDataset[] = [
  {
    id: 'parking',
    name: 'Parkraum',
    categoryIds: ['parkingTilda'],
    measureDatasets: ['parking'],
    sumKeys: { capacity: 'Stellplätze', area: 'Fläche' },
    parts: [
      part({
        id: 'street',
        sourceId: 'tilda_parkings',
        sourceLayer: 'parkings',
        groupByKeys: [
          'operator_type',
          'parking',
          'orientation',
          'surface',
          'condition_category_primary',
        ],
        layers: lineLayers(partColors[0]),
      }),
      part({
        id: 'off_street',
        sourceId: 'tilda_parkings_off_street',
        sourceLayer: 'off_street_parking_areas',
        groupByKeys: ['operator_type', 'parking', 'access', 'condition_category_primary'],
        layers: areaLayers(partColors[1]),
      }),
    ],
    defaultFilter: { [calculatorPartKey]: ['street'], operator_type: ['public'] },
  },
  {
    id: 'roads',
    name: 'Straßen & Wege',
    categoryIds: ['bikelanes', 'roads'],
    measureDatasets: ['bikelanes', 'roads'],
    // Per direction of travel, like the Statistik: a line that is not a oneway counts twice.
    sumKeys: { length_directions: 'Länge je Fahrtrichtung' },
    parts: [
      part({
        id: 'bikelanes',
        sourceId: 'atlas_bikelanes',
        sourceLayer: 'bikelanes',
        groupByKeys: ['category', 'oneway', 'surface', 'smoothness'],
        layers: lineLayers(partColors[0]),
      }),
      part({
        id: 'roads',
        sourceId: 'atlas_roads',
        sourceLayer: 'roads',
        groupByKeys: ['road', 'oneway', 'maxspeed', 'surface', 'smoothness'],
        layers: lineLayers(partColors[1]),
      }),
      part({
        id: 'paths',
        sourceId: 'atlas_roadsPathClasses',
        sourceLayer: 'roadsPathClasses',
        // Like the streets, without `maxspeed`: no path has one.
        groupByKeys: ['road', 'oneway', 'surface', 'smoothness'],
        layers: lineLayers(partColors[2]),
      }),
    ],
    defaultFilter: { [calculatorPartKey]: ['bikelanes'] },
  },
  {
    id: 'bicycle_parking',
    name: 'Fahrradstellplätze',
    categoryIds: ['bicycleParking'],
    measureDatasets: ['bicycle_parking'],
    sumKeys: { capacity: 'Stellplätze' },
    // Only the points: a bicycle parking mapped as an area is in `bicycleParking_points` as well,
    // as the point at its centroid.
    parts: [
      part({
        id: 'points',
        sourceId: 'atlas_bicycleParking',
        sourceLayer: 'bicycleParking_points',
        groupByKeys: ['bicycle_parking', 'covered', 'access'],
        layers: pointLayers(partColors[0]),
      }),
    ],
    defaultFilter: {},
  },
]

export const calculatorDatasetsForCategories = (categoryIds: MapDataCategoryId[]) =>
  calculatorDatasets.filter((dataset) =>
    dataset.categoryIds.some((categoryId) => categoryIds.includes(categoryId)),
  )

/** A group per tag of any part, the part itself first where there is more than one. */
export const calculatorFilterKeys = (dataset: CalculatorDataset) => [
  ...new Set([
    ...(dataset.parts.length > 1 ? [calculatorPartKey] : []),
    ...dataset.parts.flatMap((part) => part.groupByKeys),
  ]),
]

/** Parts of the same source share its tiles. */
export const calculatorSourceKey = (datasetId: string, sourceId: SourcesId) =>
  `calculator--${datasetId}--${sourceId}`

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
