import type { FileMapDataSubcategoryStyleLegend } from '../../types'
import type { MapboxStyleLayer } from '../mapboxStyles/types'

const litColors = {
  yes: '#f8c52a',
  no: '#736e59',
  special: '#ffac38',
  missingRadinfra: '#fda5e4',
} as const

const litSpecialLegendDesc = [
  'Alles außer `lit=yes` / `lit=no`, z.B. `automatic`, `interval`, zeitliche Angaben.',
]

const lineWidth = ['interpolate', ['linear'], ['zoom'], 12, 3, 14, 5, 18, 12] as const
const lineOpacityLit = ['interpolate', ['linear'], ['zoom'], 13, 1, 18, 0.6] as const
const lineOpacityDim = ['interpolate', ['linear'], ['zoom'], 13, 0.8, 18, 0.6] as const
const hitareaLineWidth = ['interpolate', ['linear'], ['zoom'], 9, 1, 14.1, 10, 22, 12] as const
const radinfraMissingLineWidth = ['interpolate', ['linear'], ['zoom'], 12, 1, 22, 4] as const
const areaFillOpacity = ['interpolate', ['linear'], ['zoom'], 11, 0.35, 16, 0.5] as const
const areaOutlineWidth = ['interpolate', ['linear'], ['zoom'], 12, 1, 16, 2.5] as const

export const litLineLegends: FileMapDataSubcategoryStyleLegend[] = [
  {
    id: 'lit',
    name: 'Beleuchtet',
    style: { type: 'line', color: litColors.yes },
  },
  {
    id: 'lit-special',
    name: 'Beleuchtet (Sonderfälle)',
    desc: litSpecialLegendDesc,
    style: { type: 'line', color: litColors.special },
  },
  {
    id: 'unlit',
    name: 'Unbeleuchtet',
    style: { type: 'line', color: litColors.no },
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
    desc: litSpecialLegendDesc,
    style: { type: 'fill', color: litColors.special },
  },
  {
    id: 'unlit',
    name: 'Unbeleuchtet',
    style: { type: 'fill', color: litColors.no },
  },
]

export const litAbsentDataLegend = {
  id: 'missing',
  name: 'Nichts = Daten fehlen',
  style: { type: 'line', color: 'transparent' },
} satisfies FileMapDataSubcategoryStyleLegend

export const litAbsentAreaDataLegend = {
  id: 'missing',
  name: 'Nichts = Daten fehlen',
  style: { type: 'fill', color: 'transparent' },
} satisfies FileMapDataSubcategoryStyleLegend

export const litMissingDataLegendRadinfra = {
  id: 'missing',
  name: 'Daten fehlen',
  style: { type: 'line', color: litColors.missingRadinfra, dasharray: [3, 2], width: 2 },
} satisfies FileMapDataSubcategoryStyleLegend

export const litMissingAreaDataLegendRadinfra = {
  id: 'missing',
  name: 'Daten fehlen',
  style: { type: 'fill', color: litColors.missingRadinfra },
} satisfies FileMapDataSubcategoryStyleLegend

export function litLineLayers() {
  return [
    {
      id: 'lit-special-line',
      type: 'line',
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

function litLineMissingLayersRadinfra() {
  // Without `lit` in stylingKeys, `!has lit` would match every feature below interactivity minzoom
  const missingMinzoom = 9
  return [
    {
      id: 'lit-missing',
      type: 'line',
      minzoom: missingMinzoom,
      filter: ['!', ['has', 'lit']],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': litColors.missingRadinfra,
        'line-opacity': 1,
        'line-width': radinfraMissingLineWidth,
        'line-dasharray': [3, 1],
      },
    },
    {
      id: 'hitarea-lit-missing',
      type: 'line',
      minzoom: missingMinzoom,
      filter: ['!', ['has', 'lit']],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': 'rgb(216, 20, 255)',
        'line-dasharray': [3, 1],
        'line-opacity': 0,
        'line-width': hitareaLineWidth,
      },
    },
  ] satisfies MapboxStyleLayer[]
}

export function litLineCompletenessLayersRadinfra() {
  return [...litLineLayers(), ...litLineMissingLayersRadinfra()]
}

export function litAreaLayers() {
  return [
    {
      id: 'lit-special-fill',
      type: 'fill',
      filter: ['match', ['get', 'lit'], ['special'], true, false],
      paint: {
        'fill-color': litColors.special,
        'fill-opacity': areaFillOpacity,
      },
    },
    {
      id: 'lit-no-fill',
      type: 'fill',
      filter: ['match', ['get', 'lit'], ['no'], true, false],
      paint: {
        'fill-color': litColors.no,
        'fill-opacity': areaFillOpacity,
      },
    },
    {
      id: 'lit-yes-fill',
      type: 'fill',
      filter: ['match', ['get', 'lit'], ['yes'], true, false],
      paint: {
        'fill-color': litColors.yes,
        'fill-opacity': areaFillOpacity,
      },
    },
    {
      id: 'lit-special-outline',
      type: 'line',
      filter: ['match', ['get', 'lit'], ['special'], true, false],
      paint: {
        'line-color': litColors.special,
        'line-opacity': lineOpacityDim,
        'line-width': areaOutlineWidth,
      },
    },
    {
      id: 'lit-no-outline',
      type: 'line',
      filter: ['match', ['get', 'lit'], ['no'], true, false],
      paint: {
        'line-color': litColors.no,
        'line-opacity': lineOpacityDim,
        'line-width': areaOutlineWidth,
      },
    },
    {
      id: 'lit-yes-outline',
      type: 'line',
      filter: ['match', ['get', 'lit'], ['yes'], true, false],
      paint: {
        'line-color': litColors.yes,
        'line-opacity': lineOpacityLit,
        'line-width': areaOutlineWidth,
      },
    },
    {
      id: 'hitarea-lit-area',
      type: 'fill',
      filter: ['has', 'lit'],
      paint: {
        'fill-color': '#d814ff',
        'fill-opacity': 0,
      },
    },
  ]
}

function litAreaMissingLayersRadinfra() {
  const missingMinzoom = 9
  return [
    {
      id: 'lit-missing-fill',
      type: 'fill',
      minzoom: missingMinzoom,
      filter: ['!', ['has', 'lit']],
      paint: {
        'fill-color': litColors.missingRadinfra,
        'fill-opacity': 0.35,
      },
    },
    {
      id: 'lit-missing-outline',
      type: 'line',
      minzoom: missingMinzoom,
      filter: ['!', ['has', 'lit']],
      paint: {
        'line-color': litColors.missingRadinfra,
        'line-opacity': 0.85,
        'line-width': areaOutlineWidth,
        'line-dasharray': [3, 1],
      },
    },
    {
      id: 'hitarea-lit-missing-area',
      type: 'fill',
      minzoom: missingMinzoom,
      filter: ['!', ['has', 'lit']],
      paint: {
        'fill-color': 'rgb(216, 20, 255)',
        'fill-opacity': 0,
      },
    },
  ] satisfies MapboxStyleLayer[]
}

export function litAreaCompletenessLayersRadinfra() {
  return [...litAreaLayers(), ...litAreaMissingLayersRadinfra()]
}
