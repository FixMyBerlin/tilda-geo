import type { ExpressionSpecification, FilterSpecification } from 'maplibre-gl'
import type { StyleLayer } from './utils/types'

// KEEP IN SYNC: values from `processing/topics/parking/helper/condition_category_primary.lua`
// (priority order lives there), colours from `parkingTilda_street_default.ts` / `parkingTilda_off_default_area.ts`.
const conditionCategoryPrimaryLineColor = (property: string) =>
  [
    'match',
    ['get', property],
    ['no_stopping', 'bus_lane'],
    '#EB0000',
    'no_parking',
    '#F97316',
    'disabled_private',
    '#5B21B6',
    'disabled',
    '#8B5CF6',
    'loading',
    '#93D6FF',
    'charging',
    '#5EF20C',
    'taxi',
    '#FEE13A',
    ['car_sharing', 'vehicle_restriction', 'maxweight'],
    '#6B7280',
    ['private', 'assumed_private'],
    '#FF7162',
    'mixed',
    '#2EB499',
    'residents',
    '#BE3C3C',
    'paid',
    '#0E7490',
    'time_limited',
    '#60A5FA',
    ['free', 'assumed_free'],
    '#16A34A',
    '#4B5563',
  ] satisfies ExpressionSpecification

const parkingKindLineColor = (property: string) =>
  [
    'match',
    ['get', property],
    ['street_side'],
    'rgb(105, 77, 81)',
    ['shoulder'],
    'rgb(161, 142, 119)',
    ['half_on_kerb'],
    'rgb(177, 171, 174)',
    ['on_kerb'],
    'rgb(107, 117, 165)',
    'rgb(206, 189, 134)',
  ] satisfies ExpressionSpecification

const surfaceLineColor = (property: string) =>
  [
    'case',
    [
      'match',
      ['get', property],
      [
        'ground',
        'grass_paver',
        'compacted',
        'grass',
        'fine_gravel',
        'gravel',
        'sand',
        'unpaved',
        'woodchips',
      ],
      true,
      false,
    ],
    'hsl(142, 94%, 40%)',
    [
      'match',
      ['get', property],
      [
        'concrete',
        'concrete:plates',
        'asphalt',
        'bricks',
        'metal',
        'metal_grid',
        'paved',
        'plastic',
        'rubber',
        'wood',
      ],
      true,
      false,
    ],
    'hsl(344, 93%, 35%)',
    [
      'match',
      ['get', property],
      [
        'cobblestone',
        'sett',
        'paving_stones',
        'large_sett',
        'mosaic_sett',
        'pebblestone',
        'small_sett',
        'stone',
      ],
      true,
      false,
    ],
    'hsl(164, 92%, 42%)',
    ['has', property],
    'hsl(280, 94%, 63%)',
    'rgb(199, 199, 199)',
  ] satisfies ExpressionSpecification

type ParkingTildaEdgesOperatorType = 'public' | 'private'

const signedOffset = (side: 'left' | 'right', value: number) => (side === 'left' ? -value : value)

const parkingTildaEdgesCapacityKey = (
  side: 'left' | 'right',
  operatorType: ParkingTildaEdgesOperatorType,
) => (operatorType === 'private' ? `capacity_private_${side}` : `capacity_${side}`)

const parkingTildaEdgesSideFilter = (
  side: 'left' | 'right',
  operatorType: ParkingTildaEdgesOperatorType,
) =>
  [
    'all',
    ['>', ['to-number', ['get', parkingTildaEdgesCapacityKey(side, operatorType)]], 0],
    ['==', ['get', `operator_type_${side}`], operatorType],
  ] satisfies FilterSpecification

const parkingTildaEdgesGuideColor = (operatorType: ParkingTildaEdgesOperatorType) =>
  operatorType === 'private' ? '#FF7162' : '#4B5563'

const parkingTildaEdgesLabelColor = (operatorType: ParkingTildaEdgesOperatorType) =>
  operatorType === 'private' ? '#C2410C' : '#3c3c3c'

const parkingTildaEdgesLineLayer = (
  side: 'left' | 'right',
  operatorType: ParkingTildaEdgesOperatorType,
  lineColor: ExpressionSpecification,
) =>
  ({
    id: `parking-edges-${side}`,
    type: 'line',
    maxzoom: 14,
    interactive: false,
    filter: parkingTildaEdgesSideFilter(side, operatorType),
    layout: {
      'line-cap': 'butt',
      'line-join': 'bevel',
    },
    paint: {
      'line-offset': [
        'interpolate',
        ['linear'],
        ['zoom'],
        11,
        signedOffset(side, 0.35),
        12,
        signedOffset(side, 0.7),
        14,
        signedOffset(side, 3),
      ],
      'line-color': lineColor,
      'line-width': ['interpolate', ['linear'], ['zoom'], 11, 0.75, 12, 1.5, 14, 2.5],
    },
  }) satisfies StyleLayer

// Guide line offset and label size per zoom stop (px). The label offset is derived from both.
const guideOffsetPx = { 14: 8, 16: 14.4 } as const
const labelTextSizePx = { 14: 10, 16: 12 } as const
const labelGapPx = 2

const parkingTildaEdgesGuideLayer = (
  side: 'left' | 'right',
  operatorType: ParkingTildaEdgesOperatorType,
) =>
  ({
    id: `parking-edges-guide-${side}`,
    type: 'line',
    minzoom: 14,
    maxzoom: 16,
    interactive: false,
    filter: parkingTildaEdgesSideFilter(side, operatorType),
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
    paint: {
      'line-offset': [
        'interpolate',
        ['linear'],
        ['zoom'],
        14,
        signedOffset(side, guideOffsetPx[14]),
        16,
        signedOffset(side, guideOffsetPx[16]),
      ],
      'line-color': parkingTildaEdgesGuideColor(operatorType),
      'line-dasharray': [0.15, 1.35],
      'line-opacity': 0.85,
      'line-width': 1.15,
    },
  }) satisfies StyleLayer

// Source layer `parkings_edges_labels`: one point at the middle of each edge, so the number shows once.
// `angle` keeps the text upright along the edge; when the text was turned (`flipped`), the edge's
// left side is below the text. The text is anchored at its street-facing edge and pushed outwards
// past the guide line. MapLibre evaluates zoom expressions in layout properties once per tile
// (integer zoom), so each step uses the offset needed at the end of its zoom range, where the guide
// line is farthest out. The offset is in em, so the guide offset (px) is divided by the text size.
const atZoom = (stops: { 14: number; 16: number }, zoom: number) =>
  stops[14] + ((stops[16] - stops[14]) * (zoom - 14)) / 2

const labelRadialOffsetEm = (zoom: 15 | 16) =>
  (atZoom(guideOffsetPx, zoom) + labelGapPx) / atZoom(labelTextSizePx, zoom)

const parkingTildaEdgesLabelAbove = (side: 'left' | 'right') =>
  (side === 'left'
    ? ['!=', ['get', 'flipped'], true]
    : ['==', ['get', 'flipped'], true]) satisfies ExpressionSpecification

const parkingTildaEdgesLabelLayer = (
  side: 'left' | 'right',
  operatorType: ParkingTildaEdgesOperatorType,
) =>
  ({
    id: `parking-edges-capacity-${side}`,
    type: 'symbol',
    minzoom: 14,
    maxzoom: 16,
    interactive: false,
    filter: parkingTildaEdgesSideFilter(side, operatorType),
    layout: {
      'text-field': ['to-string', ['get', parkingTildaEdgesCapacityKey(side, operatorType)]],
      'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
      'text-rotate': ['to-number', ['get', 'angle'], 0],
      'text-rotation-alignment': 'map',
      'text-anchor': ['case', parkingTildaEdgesLabelAbove(side), 'bottom', 'top'],
      'text-radial-offset': [
        'step',
        ['zoom'],
        labelRadialOffsetEm(15),
        15,
        labelRadialOffsetEm(16),
      ],
      'text-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        14,
        labelTextSizePx[14],
        16,
        labelTextSizePx[16],
      ],
    },
    paint: {
      'text-color': parkingTildaEdgesLabelColor(operatorType),
      'text-halo-color': '#ffffff',
      'text-halo-width': 1.5,
    },
  }) satisfies StyleLayer

const parkingTildaEdgesLayers = (
  operatorType: ParkingTildaEdgesOperatorType,
  lineColor: (side: 'left' | 'right') => ExpressionSpecification,
) =>
  [
    parkingTildaEdgesLineLayer('left', operatorType, lineColor('left')),
    parkingTildaEdgesLineLayer('right', operatorType, lineColor('right')),
    parkingTildaEdgesGuideLayer('left', operatorType),
    parkingTildaEdgesGuideLayer('right', operatorType),
  ] satisfies StyleLayer[]

export const parkingTildaEdgesLabelLayers = (operatorType: ParkingTildaEdgesOperatorType) =>
  [
    parkingTildaEdgesLabelLayer('left', operatorType),
    parkingTildaEdgesLabelLayer('right', operatorType),
  ] satisfies StyleLayer[]

export const parkingTildaEdgesLayersByStyle = (operatorType: ParkingTildaEdgesOperatorType) =>
  ({
    default: parkingTildaEdgesLayers(operatorType, (side) =>
      conditionCategoryPrimaryLineColor(`condition_category_${side}`),
    ),
    surface: parkingTildaEdgesLayers(operatorType, (side) => surfaceLineColor(`surface_${side}`)),
    kind: parkingTildaEdgesLayers(operatorType, (side) => parkingKindLineColor(`parking_${side}`)),
  }) satisfies Record<'default' | 'surface' | 'kind', StyleLayer[]>
