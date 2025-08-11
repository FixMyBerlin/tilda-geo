import { TableId } from 'src/app/regionen/[regionSlug]/_mapData/mapDataSources/tables.const'

export type InteracitvityConfiguartion = Record<
  TableId,
  {
    // See `docs/VectorTiles-Minzoom-Maxzoom.md`
    // When zoom < `minzoom` only `stylingKeys` are present
    // When zoom >= `minzoom` all tags are present
    minzoom: number
    // Only those keys will be present
    stylingKeys: string[]
  }
>

export const interactivityConfiguration: InteracitvityConfiguartion = {
  roads: {
    stylingKeys: [
      'road',
      'oneway',
      'oneway_bicycle',
      // 'lit',
      'maxspeed',
      'smoothness',
      // 'surface',
      'bikelane_left',
      'bikelane_right',
      'bikelane_self',
    ],
    minzoom: 9,
  },
  roadsPathClasses: {
    stylingKeys: ['road'],
    minzoom: 9,
  },
  bikelanesPresence: {
    stylingKeys: ['bikelane_left', 'bikelane_self', 'bikelane_right'],
    minzoom: 0,
  },
  bikeSuitability: {
    stylingKeys: ['bikeSuitability'],
    minzoom: 11,
  },
  bikelanes: {
    stylingKeys: [
      'category',
      // 'surface',
      'smoothness',
      'width',
    ],
    minzoom: 9,
  },
  places: {
    stylingKeys: ['place', 'name', 'population'],
    minzoom: 8,
  },
  poiClassification: {
    stylingKeys: ['category', 'name', 'formalEducation', 'amenity'],
    minzoom: 13,
  },
  barrierAreas: {
    stylingKeys: [],
    minzoom: 9,
  },
  barrierLines: {
    stylingKeys: ['birdge', 'tunnel', 'railway', 'highway'],
    minzoom: 9,
  },
  bicycleParking_areas: {
    stylingKeys: [],
    minzoom: 9,
  },
  bicycleParking_points: {
    stylingKeys: ['covered'],
    minzoom: 9,
  },
  bikeroutes: {
    stylingKeys: ['network', 'ref', 'cycle_highway'],
    minzoom: 9,
  },
  boundaries: {
    stylingKeys: ['category_municipality', 'category_district', 'name', 'name:prefix'],
    minzoom: 0,
  },
  boundaryLabels: {
    stylingKeys: ['category_municipality', 'name:prefix', 'category_district'],
    minzoom: 0,
  },
  landuse: {
    stylingKeys: ['landuse'],
    minzoom: 11,
  },
  publicTransport: {
    stylingKeys: ['category'],
    minzoom: 11,
  },
  trafficSigns: {
    stylingKeys: [],
    minzoom: 0,
  },
  // aggregated_lengths: { // Does not work, see https://github.com/FixMyBerlin/private-issues/issues/2240
  //   stylingKeys: [],
  //   minzoom: 0,
  // },
  todos_lines: {
    stylingKeys: [],
    minzoom: 0,
  },
  parkings: {
    stylingKeys: [],
    minzoom: 0,
  },
  parkings_labels: {
    stylingKeys: [],
    minzoom: 0,
  },
  parkings_cutouts: {
    stylingKeys: [],
    minzoom: 11,
  },
  parkings_quantized: {
    stylingKeys: [],
    minzoom: 11,
  },
  parkings_separate: {
    stylingKeys: [],
    minzoom: 0,
  },
  parkings_separate_labels: {
    stylingKeys: [],
    minzoom: 0,
  },
  parkings_no: {
    stylingKeys: [],
    minzoom: 0,
  },
}
