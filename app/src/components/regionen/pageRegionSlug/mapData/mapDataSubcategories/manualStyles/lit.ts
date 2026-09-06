import type { FileMapDataSubcategoryStyleLegend } from '../../types'
import type { MapboxStyleLayer } from '../mapboxStyles/types'

export const litColors = {
  yes: '#f8c52a',
  no: '#736e59',
  special: '#ffac38',
  missingGeneral: '#fa80f4',
  missingRadinfra: '#fda5e4',
} as const

type LitCompletenessLayerOptions = {
  missingColor: string
  dashed?: boolean
}

const lineWidth = ['interpolate', ['linear'], ['zoom'], 12, 3, 14, 5, 18, 12] as const

const lineOpacityLit = ['interpolate', ['linear'], ['zoom'], 13, 1, 18, 0.6] as const
const lineOpacityDim = ['interpolate', ['linear'], ['zoom'], 13, 0.8, 18, 0.6] as const

const missingLineWidth = ['interpolate', ['linear'], ['zoom'], 12, 1, 14, 1.5, 18, 3] as const

const hitareaLineWidth = ['interpolate', ['linear'], ['zoom'], 9, 1, 14.1, 10, 22, 12] as const

const radinfraMissingLineWidth = ['interpolate', ['linear'], ['zoom'], 12, 1, 22, 4] as const

const areaFillOpacity = ['interpolate', ['linear'], ['zoom'], 11, 0.35, 16, 0.5] as const

const LIT_MIN_ZOOM = 9

export const litLineLegends: FileMapDataSubcategoryStyleLegend[] = [
  {
    id: 'lit',
    name: 'Beleuchtet',
    style: { type: 'line', color: litColors.yes },
  },
  {
    id: 'lit-special',
    name: 'Beleuchtet (Sonderfälle)',
    style: { type: 'line', color: litColors.special },
  },
  {
    id: 'unlit',
    name: 'Unbeleuchtet',
    style: { type: 'line', color: litColors.no },
  },
]

export const litLineLitOnlyLegends: FileMapDataSubcategoryStyleLegend[] = [
  {
    id: 'lit',
    name: 'Beleuchtet',
    style: { type: 'line', color: litColors.yes },
  },
  {
    id: 'lit-special',
    name: 'Beleuchtet (Sonderfälle)',
    style: { type: 'line', color: litColors.special },
  },
]

export const litAreaLegends: FileMapDataSubcategoryStyleLegend[] = [
  {
    id: 'lit',
    name: 'Beleuchtet',
    style: { type: 'fill', color: litColors.yes },
  },
  {
    id: 'lit-special',
    name: 'Beleuchtet (Sonderfälle)',
    style: { type: 'fill', color: litColors.special },
  },
  {
    id: 'unlit',
    name: 'Unbeleuchtet',
    style: { type: 'fill', color: litColors.no },
  },
]

export const litAreaLitOnlyLegends: FileMapDataSubcategoryStyleLegend[] = [
  {
    id: 'lit',
    name: 'Beleuchtet',
    style: { type: 'fill', color: litColors.yes },
  },
  {
    id: 'lit-special',
    name: 'Beleuchtet (Sonderfälle)',
    style: { type: 'fill', color: litColors.special },
  },
]

export const litMissingDataLegend = (missingColor: string, geometry: 'line', dashed?: boolean) =>
  ({
    id: 'missing',
    name: 'Daten fehlen',
    style: {
      type: 'line',
      color: missingColor,
      ...(dashed ? { dasharray: [3, 2], width: 2 } : {}),
    },
  }) satisfies FileMapDataSubcategoryStyleLegend

export const litMissingAreaDataLegend = (missingColor: string) =>
  ({
    id: 'missing',
    name: 'Daten fehlen',
    style: {
      type: 'fill',
      color: missingColor,
    },
  }) satisfies FileMapDataSubcategoryStyleLegend

export const radinfraLitCompletenessOptions = {
  missingColor: litColors.missingRadinfra,
  dashed: true,
} satisfies LitCompletenessLayerOptions

export function litLineLayers() {
  return [
    {
      id: 'lit-special-line',
      type: 'line',
      minzoom: LIT_MIN_ZOOM,
      filter: ['match', ['get', 'lit'], ['special'], true, false],
      layout: { 'line-cap': 'round' },
      paint: {
        'line-blur': 1,
        'line-color': litColors.special,
        'line-opacity': lineOpacityDim,
        'line-width': lineWidth,
      },
    },
    {
      id: 'lit-no-line',
      type: 'line',
      minzoom: LIT_MIN_ZOOM,
      filter: ['match', ['get', 'lit'], ['no'], true, false],
      layout: { 'line-cap': 'round' },
      paint: {
        'line-blur': 2,
        'line-color': litColors.no,
        'line-opacity': lineOpacityDim,
        'line-width': lineWidth,
      },
    },
    {
      id: 'lit-yes-line',
      type: 'line',
      minzoom: LIT_MIN_ZOOM,
      filter: ['match', ['get', 'lit'], ['yes'], true, false],
      layout: { 'line-cap': 'round' },
      paint: {
        'line-blur': 3,
        'line-color': litColors.yes,
        'line-opacity': lineOpacityLit,
        'line-width': lineWidth,
      },
    },
    {
      id: 'hitarea-lit',
      type: 'line',
      minzoom: LIT_MIN_ZOOM,
      filter: ['has', 'lit'],
      layout: { 'line-cap': 'round' },
      paint: {
        'line-color': '#d814ff',
        'line-opacity': 0,
        'line-width': hitareaLineWidth,
      },
    },
  ]
}

function litLineMissingLayers({ missingColor, dashed = false }: LitCompletenessLayerOptions) {
  const missingPaint: Record<string, unknown> = {
    'line-color': missingColor,
    'line-opacity': dashed ? 1 : 0.7,
    'line-width': dashed ? radinfraMissingLineWidth : missingLineWidth,
  }
  if (dashed) {
    missingPaint['line-dasharray'] = [3, 1]
  }

  const layers: MapboxStyleLayer[] = [
    {
      id: 'lit-missing',
      type: 'line',
      minzoom: LIT_MIN_ZOOM,
      filter: ['!', ['has', 'lit']],
      layout: dashed ? { 'line-cap': 'round', 'line-join': 'round' } : undefined,
      paint: missingPaint,
    },
  ]

  if (dashed) {
    layers.push({
      id: 'hitarea-lit-missing',
      type: 'line',
      minzoom: LIT_MIN_ZOOM,
      filter: ['!', ['has', 'lit']],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': 'rgb(216, 20, 255)',
        'line-dasharray': [3, 1],
        'line-opacity': 0,
        'line-width': hitareaLineWidth,
      },
    })
  }

  return layers
}

export function litLineCompletenessLayers(options: LitCompletenessLayerOptions) {
  return [...litLineLayers(), ...litLineMissingLayers(options)]
}

export function litAreaLayers() {
  return [
    {
      id: 'lit-special-fill',
      type: 'fill',
      minzoom: LIT_MIN_ZOOM,
      filter: ['match', ['get', 'lit'], ['special'], true, false],
      paint: {
        'fill-color': litColors.special,
        'fill-opacity': areaFillOpacity,
      },
    },
    {
      id: 'lit-no-fill',
      type: 'fill',
      minzoom: LIT_MIN_ZOOM,
      filter: ['match', ['get', 'lit'], ['no'], true, false],
      paint: {
        'fill-color': litColors.no,
        'fill-opacity': areaFillOpacity,
      },
    },
    {
      id: 'lit-yes-fill',
      type: 'fill',
      minzoom: LIT_MIN_ZOOM,
      filter: ['match', ['get', 'lit'], ['yes'], true, false],
      paint: {
        'fill-color': litColors.yes,
        'fill-opacity': areaFillOpacity,
      },
    },
    {
      id: 'lit-special-outline',
      type: 'line',
      minzoom: LIT_MIN_ZOOM,
      filter: ['match', ['get', 'lit'], ['special'], true, false],
      paint: {
        'line-color': litColors.special,
        'line-opacity': lineOpacityDim,
        'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1, 16, 2.5],
      },
    },
    {
      id: 'lit-no-outline',
      type: 'line',
      minzoom: LIT_MIN_ZOOM,
      filter: ['match', ['get', 'lit'], ['no'], true, false],
      paint: {
        'line-color': litColors.no,
        'line-opacity': lineOpacityDim,
        'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1, 16, 2.5],
      },
    },
    {
      id: 'lit-yes-outline',
      type: 'line',
      minzoom: LIT_MIN_ZOOM,
      filter: ['match', ['get', 'lit'], ['yes'], true, false],
      paint: {
        'line-color': litColors.yes,
        'line-opacity': lineOpacityLit,
        'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1, 16, 2.5],
      },
    },
    {
      id: 'hitarea-lit-area',
      type: 'fill',
      minzoom: LIT_MIN_ZOOM,
      filter: ['has', 'lit'],
      paint: {
        'fill-color': '#d814ff',
        'fill-opacity': 0,
      },
    },
  ]
}

function litAreaMissingLayers({ missingColor, dashed = false }: LitCompletenessLayerOptions) {
  const outlinePaint: Record<string, unknown> = {
    'line-color': missingColor,
    'line-opacity': 0.85,
    'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1, 16, 2.5],
  }
  if (dashed) {
    outlinePaint['line-dasharray'] = [3, 1]
  }

  const layers: MapboxStyleLayer[] = [
    {
      id: 'lit-missing-fill',
      type: 'fill',
      minzoom: LIT_MIN_ZOOM,
      filter: ['!', ['has', 'lit']],
      paint: {
        'fill-color': missingColor,
        'fill-opacity': 0.35,
      },
    },
    {
      id: 'lit-missing-outline',
      type: 'line',
      minzoom: LIT_MIN_ZOOM,
      filter: ['!', ['has', 'lit']],
      paint: outlinePaint,
    },
  ]

  if (dashed) {
    layers.push({
      id: 'hitarea-lit-missing-area',
      type: 'fill',
      minzoom: LIT_MIN_ZOOM,
      filter: ['!', ['has', 'lit']],
      paint: {
        'fill-color': 'rgb(216, 20, 255)',
        'fill-opacity': 0,
      },
    })
  }

  return layers
}

export function litAreaCompletenessLayers(options: LitCompletenessLayerOptions) {
  return [...litAreaLayers(), ...litAreaMissingLayers(options)]
}
