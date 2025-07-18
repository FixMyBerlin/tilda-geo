import { getUnixTime, startOfYear, subYears } from 'date-fns'
import { FileMapDataSubcategory, FileMapDataSubcategoryStyleLegend } from '../types'
import { mapboxStyleLayers } from './mapboxStyles/mapboxStyleLayers'
import { MapboxStyleLayer } from './mapboxStyles/types'

const subcatId = 'bikelanes'
const source = 'atlas_bikelanes'
const sourceLayer = 'bikelanes'
export type SubcatRadinfraCurrentnesshId = typeof subcatId
export type SubcatRadinfraCurrentnesshStyleIds = 'default'

// Calculate timestamps for age thresholds based on legend
const timestamp3YearsAgo = getUnixTime(startOfYear(subYears(new Date(), 3))) // 3 years ago (Jan 1)
const timestamp6YearsAgo = getUnixTime(startOfYear(subYears(new Date(), 6))) // 6 years ago (Jan 1)
const timestamp10YearsAgo = getUnixTime(startOfYear(subYears(new Date(), 10))) // 10 years ago (Jan 1)

// This used to be at app/src/app/regionen/[regionSlug]/_mapData/mapDataSubcategories/mapboxStyles/groups/radinfra_currentness.ts
// But since we need to have JS in here, it now moved here.
export const bikelanesCurrentLayers: MapboxStyleLayer[] = [
  {
    type: 'line',
    id: 'current-colors',
    paint: {
      'line-offset': ['interpolate', ['linear'], ['zoom'], 12, 0, 15, -1],
      'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1.5, 16, 4],
      'line-color': [
        'step',
        ['get', 'updated_at'],
        '#fda5e4', // oldest data (10+ Jahre) - Dringend prüfen
        timestamp10YearsAgo, // 10 years ago
        '#ffe500', // 6-10 Jahre
        timestamp6YearsAgo, // 6 years ago
        '#b5c615', // 3-6 Jahre
        timestamp3YearsAgo, // 3 years ago
        '#15c65c', // 1-3 Jahre - good
      ],
    },
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    filter: ['has', 'updated_at'],
  },
  {
    type: 'line',
    id: 'current-zoomed-out',
    paint: {
      'line-offset': ['interpolate', ['linear'], ['zoom'], 12, 0, 15, -1],
      'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1.5, 16, 4],
      'line-color': 'gray',
    },
    layout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    filter: ['!', ['has', 'updated_at']],
  },
]

export const bikelanesCurrentnessLegend: FileMapDataSubcategoryStyleLegend[] = [
  {
    id: 'good',
    name: '1-3 Jahre',
    style: {
      type: 'line',
      color: '#15c65c',
    },
  },
  {
    id: 'check3',
    name: '3-6 Jahre',
    style: {
      type: 'line',
      color: '#b5c615',
    },
  },
  {
    id: 'check6',
    name: '6-10 Jahre',
    style: {
      type: 'line',
      color: '#ffe500',
    },
  },
  {
    id: 'old',
    name: 'Dringed prüfen (10+ Jahre)',
    style: {
      type: 'line',
      color: '#fda5e4',
    },
  },
  {
    id: 'zoom_needed',
    name: 'Auf dieser Zoomstufe können die Daten nicht angezeigt werden',
    style: {
      type: 'line',
      color: 'gray',
    },
  },
]

export const subcat_radinfra_currentness: FileMapDataSubcategory = {
  id: subcatId,
  name: 'RVA Aktualität',
  ui: 'checkbox',
  beforeId: 'atlas-app-beforeid-top',
  sourceId: source,
  styles: [
    {
      id: 'default',
      name: 'RVA Aktualität', // field hidden
      desc: null,
      layers: mapboxStyleLayers({
        layers: bikelanesCurrentLayers,
        source,
        sourceLayer,
      }),
      legends: bikelanesCurrentnessLegend,
    },
  ],
}
