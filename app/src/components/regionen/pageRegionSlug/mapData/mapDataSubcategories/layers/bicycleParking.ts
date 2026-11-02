import type { ExpressionSpecification, FilterSpecification } from 'maplibre-gl'
import type { FileMapDataSubcategoryStyleLegend } from '../../types'
import type { StyleLayer } from './utils/types'

/** One colour per `kind`; Okabe-Ito based, so the kinds stay apart for most colour vision types. */
const kindColors = {
  bicycle_parking: '#b624ff',
  cargo_bike_parking: '#e69f00',
  small_electric_vehicle_parking: '#009e73',
  bicycle_rental: '#0072b2',
  mobility_hub: '#cc79a7',
} as const

// The "missing" colour of the other radinfra categories.
const radinfraColors = { missing: '#fda5e4' } as const

const kindColorMatch = [
  'match',
  ['get', 'kind'],
  'bicycle_parking',
  kindColors.bicycle_parking,
  'cargo_bike_parking',
  kindColors.cargo_bike_parking,
  'small_electric_vehicle_parking',
  kindColors.small_electric_vehicle_parking,
  'bicycle_rental',
  kindColors.bicycle_rental,
  'mobility_hub',
  kindColors.mobility_hub,
  kindColors.bicycle_parking,
] satisfies ExpressionSpecification

const isMobilityHub = ['==', ['get', 'kind'], 'mobility_hub'] satisfies FilterSpecification
const isNoMobilityHub = ['!=', ['get', 'kind'], 'mobility_hub'] satisfies FilterSpecification
// Only bicycle and cargo bike parking have a number of spaces in OSM as a rule.
const isBicycleOrCargo = [
  'in',
  ['get', 'kind'],
  ['literal', ['bicycle_parking', 'cargo_bike_parking']],
] satisfies FilterSpecification
const hasMissingCapacity = ['!', ['has', 'capacity']] satisfies FilterSpecification

const areaOutlineWidth = [
  'interpolate',
  ['linear'],
  ['zoom'],
  12,
  1,
  16,
  2.5,
] satisfies ExpressionSpecification

const pointRadius = [
  'interpolate',
  ['linear'],
  ['zoom'],
  9,
  2,
  12,
  3.5,
  16,
  6,
  18,
  8,
] satisfies ExpressionSpecification
// A mobility hub is a ring, so the stands inside it stay visible.
const hubPointRadius = [
  'interpolate',
  ['linear'],
  ['zoom'],
  9,
  4,
  12,
  6,
  16,
  10,
  18,
  13,
] satisfies ExpressionSpecification
const hubRingWidth = [
  'interpolate',
  ['linear'],
  ['zoom'],
  9,
  1.5,
  16,
  3,
] satisfies ExpressionSpecification

export const bicycleParkingLegends: FileMapDataSubcategoryStyleLegend[] = [
  {
    id: 'bicycle_parking',
    name: 'Fahrradstellplätze',
    desc: ['`amenity=bicycle_parking`'],
    style: { type: 'circle', color: kindColors.bicycle_parking },
  },
  {
    id: 'cargo_bike_parking',
    name: 'Lastenrad-Stellplätze',
    desc: [
      '`amenity=bicycle_parking` mit `cargo_bike=designated` oder `capacity:cargo_bike`. Gemischte Objekte werden in Fahrrad- und Lastenrad-Stellplätze aufgeteilt.',
    ],
    style: { type: 'circle', color: kindColors.cargo_bike_parking },
  },
  {
    id: 'small_electric_vehicle_parking',
    name: 'E-Scooter- / Kleinstfahrzeug-Parkplätze',
    desc: ['`amenity=small_electric_vehicle_parking`, `amenity=kick-scooter_parking`'],
    style: { type: 'circle', color: kindColors.small_electric_vehicle_parking },
  },
  {
    id: 'bicycle_rental',
    name: 'Bikesharing-Stationen',
    desc: ['`amenity=bicycle_rental` (ohne Fahrradverleih-Shops)'],
    style: { type: 'circle', color: kindColors.bicycle_rental },
  },
  {
    id: 'mobility_hub',
    name: 'Mobilitätsstationen',
    desc: ['`amenity=mobility_hub`. Summieren zählt die Station selbst nicht mit.'],
    style: { type: 'circle', color: kindColors.mobility_hub },
  },
]

/**
 * Areas of `bicycleParking_areas`: a light shadow in the colour of the kind, like the parking areas
 * of "Parkraum". The point (icon) is the object; the area only shows its extent and is not clickable.
 */
export function bicycleParkingAreaLayers(): StyleLayer[] {
  return [
    {
      id: 'areas-fill',
      type: 'fill',
      paint: {
        'fill-color': kindColorMatch,
        'fill-opacity': 0.15,
      },
    },
    {
      id: 'areas-outline',
      type: 'line',
      paint: {
        'line-color': kindColorMatch,
        'line-dasharray': [1, 1],
        'line-opacity': 0.9,
      },
    },
  ]
}

// From this zoom the points are icons; below, dots in the same colours keep a city view readable.
const iconMinzoom = 14

const kindIconMatch = [
  'match',
  ['get', 'kind'],
  'bicycle_parking',
  'bicycle-parking',
  'cargo_bike_parking',
  'cargo-bike-parking',
  'small_electric_vehicle_parking',
  'scooter-parking',
  'bicycle_rental',
  'bike-share',
  'mobility_hub',
  'mobility-hub',
  'bicycle-parking',
] satisfies ExpressionSpecification

/** Points of `bicycleParking_points`: dots below `iconMinzoom`, an icon per kind from there. */
export function bicycleParkingPointLayers(): StyleLayer[] {
  return [
    {
      id: 'hub-points',
      type: 'circle',
      maxzoom: iconMinzoom,
      filter: isMobilityHub,
      paint: {
        'circle-color': 'rgba(255, 255, 255, 0)',
        'circle-radius': hubPointRadius,
        'circle-stroke-color': kindColors.mobility_hub,
        'circle-stroke-width': hubRingWidth,
      },
    },
    {
      id: 'points',
      type: 'circle',
      maxzoom: iconMinzoom,
      filter: isNoMobilityHub,
      paint: {
        'circle-color': kindColorMatch,
        'circle-radius': pointRadius,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 0.75,
      },
    },
    {
      id: 'icons',
      type: 'symbol',
      minzoom: iconMinzoom,
      layout: {
        'icon-image': kindIconMatch,
        'icon-size': ['interpolate', ['linear'], ['zoom'], iconMinzoom, 0.8, 18, 1.2],
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        // Stands on top, the hub below them.
        'symbol-sort-key': ['case', isMobilityHub, 0, 1],
      },
      paint: {},
    },
  ]
}

export const bicycleParkingCapacityLegends: FileMapDataSubcategoryStyleLegend[] = [
  ...bicycleParkingLegends,
  {
    id: 'missing',
    name: 'Anzahl fehlt',
    desc: ['Fahrrad- und Lastenrad-Stellplätze ohne `capacity`: gepunkteter Ring um das Symbol.'],
    style: { type: 'circle', color: radinfraColors.missing },
  },
]

const isMissingCapacity = [
  'all',
  isBicycleOrCargo,
  hasMissingCapacity,
] satisfies FilterSpecification

/** Radinfra: the areas of the regular style, outlined pink and dashed where the number of spaces is missing. */
export function bicycleParkingCapacityAreaLayers(): StyleLayer[] {
  return [
    ...bicycleParkingAreaLayers(),
    {
      id: 'areas-outline-missing',
      type: 'line',
      filter: isMissingCapacity,
      paint: {
        'line-color': radinfraColors.missing,
        'line-width': areaOutlineWidth,
        'line-dasharray': [1, 1.5],
      },
    },
  ]
}

/** Radinfra: the points of the regular style, with a dotted pink ring where the number of spaces is missing. */
export function bicycleParkingCapacityPointLayers(): StyleLayer[] {
  return [
    {
      id: 'ring-missing',
      type: 'symbol',
      filter: isMissingCapacity,
      layout: {
        'icon-image': 'ring-missing',
        // Around the dot below `iconMinzoom`, around the icon from there.
        'icon-size': ['interpolate', ['linear'], ['zoom'], 9, 0.4, iconMinzoom, 0.8, 18, 1.2],
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
      },
      paint: {},
    },
    ...bicycleParkingPointLayers(),
  ]
}
