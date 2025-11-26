import svgBibi from '@/src/app/_components/assets/bibi-logo.svg'
import svgInfravelo from '@/src/app/_components/assets/infravelo.svg'
import svgNudafa from '@/src/app/_components/assets/nudafa-logo.svg'
import svgParking from '@/src/app/_components/assets/osm-parkraum-logo-2025.svg'
import svgRadinfra from '@/src/app/_components/assets/radinfra-logo.svg'
import imageTrTo from '@/src/app/_components/assets/trto-logo.png'
import imageUeberlingen from '@/src/app/_components/assets/ueberlingen-logo.jpeg'
import { categories } from '@/src/app/regionen/[regionSlug]/_mapData/mapDataCategories/categories.const'
import { ExportId } from '@/src/app/regionen/[regionSlug]/_mapData/mapDataSources/exports/exports.const'
import {
  SourcesRasterIds,
  sourcesBackgroundsRaster,
} from '@/src/app/regionen/[regionSlug]/_mapData/mapDataSources/sourcesBackgroundsRaster.const'
import {
  TableId,
  UnionTiles,
} from '@/src/app/regionen/[regionSlug]/_mapData/mapDataSources/tables.const'
import { StaticImport } from 'next/dist/shared/lib/get-img-props'
import { MapDataCategoryId } from '../app/regionen/[regionSlug]/_mapData/mapDataCategories/MapDataCategoryId'

type StaticRegionInitialMapPositionZoom = {
  lat: number
  lng: number
  zoom: number
}

export type StaticRegion = {
  slug: RegionSlug
  name: string
  fullName: string
  product: 'radverkehr' | 'parkraum' | 'fussverkehr'
  /** @desc 1-n relation IDs, used for the mask and export bbox — @href use https://hanshack.com/geotools/gimmegeodata/ to get the ids */
  osmRelationIds: number[] | []
  map: StaticRegionInitialMapPositionZoom
} & (
  | {
      logoPath: string | StaticImport | null
      externalLogoPath?: never
    }
  | {
      logoPath?: never
      externalLogoPath: string | null
    }
) & {
    logoWhiteBackgroundRequired: boolean
    navigationLinks?: { name: string; href: string }[]
    categories: MapDataCategoryId[]
    backgroundSources: SourcesRasterIds[]
    notes: 'osmNotes' | 'atlasNotes' | 'disabled'
    showSearch?: boolean
    cacheWarming?: { minZoom: number; maxZoom: number; tables: UnionTiles<TableId>[] }
  } & (
    | {
        /** @desc Hide the download buttons. */
        exports: null
        bbox: null
      }
    | {
        /** @desc List of export IDs available for this region. When non-null, bbox must be set. */
        exports: [ExportId, ...ExportId[]]
        /** @desc Used by the download panel to pass to the api endpoint. */
        bbox: { min: readonly [number, number]; max: readonly [number, number] }
      }
  )

const bboxToMinMax = (bbox: [number, number, number, number]) => {
  return {
    min: [bbox[2], bbox[1]] as const,
    max: [bbox[0], bbox[3]] as const,
  }
}

const defaultBackgroundSources: SourcesRasterIds[] = [
  'mapnik',
  'esri',
  'maptiler-satellite',
  'maptiler-satellite-v1',
  'mapbox-satellite',
  'cyclosm',
  'thunderforest-opencyclemap',
  'memomaps-transport',
  'thunderforest-transport',
  'thunderforest-landscape',
  'thunderforest-outdoors',
  'waymarkedtrails-cycling',
  'waymarkedtrails-hiking',
  'opentopomap',
]

const berlinBackgroundSources: SourcesRasterIds[] = [
  ...defaultBackgroundSources,
  'strassenbefahrung',
  'alkis',
  'brandenburg-dop20',
  'brandenburg-aktualitaet',
  'areal2025-summer',
  'areal2025',
  'areal2024',
  'areal2023',
  'areal2022',
  'areal2021',
  'areal2020',
  'areal2019',
  'parkraumkarte_neukoelln',
]

export type RegionSlug =
  | 'bb-beteiligung' // Land Brandenburg, für Beteiligung
  | 'bb-kampagne' // Kampagne mit Land Brandenburg
  | 'bb-pg' // Land Brandenburg Projektgruppe
  | 'bb-sg' // Land Brandenburg Steuerungsgruppe
  | 'bb' // Öffentlich, Land Brandenburg
  | 'berlin'
  | 'bibi'
  | 'deutschland'
  | 'fahrradstellplaetze'
  | 'herrenberg'
  | 'infravelo'
  | 'langerwehe'
  | 'lueneburg'
  | 'magdeburg'
  | 'mainz'
  | 'muenchen'
  | 'nrw'
  | 'nudafa'
  | 'ostalbkreis'
  | 'pankow'
  | 'parkraum-berlin-euvm'
  | 'parkraum-berlin'
  | 'parkraum'
  | 'radinfra' // radinfra.de
  | 'radplus'
  | 'rs8'
  | 'testing'
  | 'trassenscout-umfragen'
  | 'trto'
  | 'ueberlingen'
  | 'woldegk'

export const defaultTildaRadverkehrSources = [
  // DEFAULT
  // The order here specifies the order in the UI
  'poi',
  'bikelanes',
  'roads',
  'surface',
  'lit',
  'mapillary',
] satisfies MapDataCategoryId[]
export const defaultTildaRadverkehrExports = [
  // DEFAULT
  // The order here specifies the order in the UI
  'bikelanes',
  'bikeroutes',
  'roads',
  'roadsPathClasses',
  'poiClassification',
  'places',
  'publicTransport',
] satisfies [ExportId, ...ExportId[]]

export const staticRegion: StaticRegion[] = [
  {
    slug: 'bibi',
    name: 'BiBi',
    fullName: 'Bietigheim-Bissingen',
    product: 'radverkehr',
    osmRelationIds: [1613510],
    map: { lat: 48.95793, lng: 9.1395, zoom: 13 },
    bbox: {
      min: [9.0671, 48.9229],
      max: [9.1753, 48.9838],
    },
    logoPath: svgBibi,
    logoWhiteBackgroundRequired: false,
    categories: [
      // The order here specifies the order in the UI
      'poi',
      'bikelanes',
      'roads',
      'surface',
      'lit',
      'parkingLars',
      'parkingTilda',
      'mapillary',
    ],
    backgroundSources: defaultBackgroundSources,
    notes: 'osmNotes',
    exports: [
      'bikelanes',
      'bikeroutes',
      'roads',
      'roadsPathClasses',
      'poiClassification',
      'places',
      'publicTransport',
      'parkings',
      'parkings_no',
      'parkings_separate',
      'off_street_parking_areas',
      'off_street_parking_points',
    ],
  },
  {
    slug: 'trto',
    name: 'TrTo',
    fullName: 'Treptower Tollensewinkel',
    product: 'radverkehr',
    osmRelationIds: [1427697],
    map: { lat: 53.6774, lng: 13.267, zoom: 10.6 },
    bbox: {
      min: [12.9949, 53.5934],
      max: [13.4782, 53.8528],
    },
    logoPath: imageTrTo,
    logoWhiteBackgroundRequired: true,
    categories: defaultTildaRadverkehrSources,
    backgroundSources: [...defaultBackgroundSources, 'trto-radwege'],
    notes: 'osmNotes',
    exports: defaultTildaRadverkehrExports,
  },
  {
    slug: 'berlin',
    name: 'Berlin',
    fullName: 'Berlin Ring',
    product: 'radverkehr',
    osmRelationIds: [
      62422,
      // 11905744, // Hundekopf not 'adminstration' and therefore not present
    ],
    map: { lat: 52.507, lng: 13.367, zoom: 11.8 },
    bbox: {
      min: [13.2809, 52.46],
      max: [13.4929, 52.5528],
    },
    logoPath: null,
    logoWhiteBackgroundRequired: false,
    categories: [
      // The order here specifies the order in the UI
      'bikelanes',
      'roads',
      'surface',
      'parkingTilda',
      'parkingLars',
      'bicycleParking',
      'poi',
      'mapillary',
    ],
    backgroundSources: berlinBackgroundSources,
    notes: 'osmNotes',
    exports: [
      'bikelanes',
      'bikeroutes',
      'roads',
      'roadsPathClasses',
      'parkings',
      'parkings_no',
      'parkings_separate',
      'off_street_parking_areas',
      'off_street_parking_points',
      'bicycleParking_points',
      'poiClassification',
      'places',
      'publicTransport',
    ],
  },
  {
    slug: 'infravelo',
    name: 'infraVelo',
    fullName: 'infraVelo / Berlin',
    product: 'radverkehr',
    osmRelationIds: [62422],
    map: { lat: 52.507, lng: 13.367, zoom: 11.8 },
    bbox: {
      min: [13.0883, 52.3382],
      max: [13.7611, 52.6755],
    },
    logoPath: svgInfravelo,
    logoWhiteBackgroundRequired: true,
    showSearch: true,
    categories: [
      // The order here specifies the order in the UI
      'bikelanes',
      'roads',
      'surface',
      // 'parkingLars',
      // 'bicycleParking',
      // 'poi',
      'mapillary',
    ],
    backgroundSources: berlinBackgroundSources,
    notes: 'atlasNotes',
    cacheWarming: {
      minZoom: 9,
      maxZoom: 13,
      tables: ['bikelanes', 'roads', 'roadsPathClasses'],
    },
    exports: ['bikelanes', 'bikeroutes', 'roads', 'roadsPathClasses'],
  },
  {
    slug: 'parkraum-berlin',
    name: 'Parkraum Berlin',
    fullName: 'Parkraum Berlin',
    product: 'parkraum',
    osmRelationIds: [62422],
    map: { lat: 52.507, lng: 13.367, zoom: 11.8 },
    bbox: null,
    logoPath: svgParking,
    logoWhiteBackgroundRequired: false,
    categories: [
      'parkingTilda',
      'parkingLars',
      // 'trafficSigns', // NOTE: Not finished, yet
      'mapillary',
    ],
    backgroundSources: berlinBackgroundSources,
    exports: null,
    notes: 'osmNotes',
  },
  {
    slug: 'parkraum-berlin-euvm',
    name: 'Parkraum Berlin eUVM',
    fullName: 'Parkraum Berlin eUVM',
    product: 'parkraum',
    osmRelationIds: [62422],
    map: { lat: 52.507, lng: 13.367, zoom: 11.8 },
    bbox: {
      min: [13.0883, 52.3382],
      max: [13.7611, 52.6755],
    },
    logoPath: svgParking,
    logoWhiteBackgroundRequired: false,
    showSearch: true,
    categories: [
      // Sort
      'parkingTilda',
      'parkingLars', // TODO: Remove next time we update the URL store
      'roads',
      'mapillary',
    ],
    backgroundSources: berlinBackgroundSources,
    notes: 'atlasNotes',
    exports: [
      'parkings',
      'off_street_parking_areas',
      'off_street_parking_points',
      'parkings_no',
      'parkings_separate',
    ],
  },
  {
    slug: 'parkraum',
    name: 'Parkraum',
    fullName: 'Parkraumanalyse',
    product: 'parkraum',
    osmRelationIds: [],
    map: { lat: 52.4918, lng: 13.4261, zoom: 13.5 },
    bbox: null,
    logoPath: svgParking,
    logoWhiteBackgroundRequired: false,
    categories: [
      'parkingLars',
      // 'trafficSigns', // NOTE: Not finished, yet
      'mapillary',
    ],
    backgroundSources: berlinBackgroundSources,
    exports: null,
    notes: 'osmNotes',
  },
  {
    slug: 'nudafa',
    name: 'NUDAFA',
    fullName: 'NUDAFA',
    product: 'radverkehr',
    osmRelationIds: [
      55775, // Zeuthen
      55773, //Eichwalde
      55774, // Schulzendorf
      55776, // Wildau
      5583556, // Königs Wusterhausen
      55772, // Schönefeld
    ],
    map: { lat: 52.35, lng: 13.61, zoom: 12 },
    bbox: {
      min: [13.3579, 52.2095],
      max: [13.825, 52.4784],
    },
    logoPath: svgNudafa,
    logoWhiteBackgroundRequired: true,
    categories: [
      // The order here specifies the order in the UI
      'poi',
      'bikelanes',
      'roads',
      'surface',
      'lit',
      'bicycleParking',
      'mapillary',
    ],
    backgroundSources: [
      'brandenburg-dop20',
      'brandenburg-aktualitaet',
      ...defaultBackgroundSources,
    ],
    notes: 'osmNotes',
    exports: [
      'bikelanes',
      'bikeroutes',
      'roads',
      'roadsPathClasses',
      'poiClassification',
      'places',
      'publicTransport',
      'bicycleParking_points',
    ],
  },
  {
    slug: 'rs8',
    name: 'RS 8',
    fullName: 'Trassenscout RS 8',
    product: 'radverkehr',
    osmRelationIds: [
      405292, // Stadt Ludwigsburg
      405291, // Remseck am Neckar
      401697, // Stadt Waiblingen (inkl. Exklave, die wir eigentlich nicht brauchen)
    ],
    map: { lat: 48.8769, lng: 9.2425, zoom: 12 },
    bbox: null,
    // bbox: {
    //   min: [9.13736562, 48.81051166],
    //   max: [9.36731192, 48.93255599],
    // },
    externalLogoPath: 'https://trassenscout.de/favicon.svg',
    logoWhiteBackgroundRequired: false,
    categories: defaultTildaRadverkehrSources,
    backgroundSources: defaultBackgroundSources,
    notes: 'osmNotes',
    exports: null,
  },
  {
    slug: 'mainz',
    name: 'Mainz',
    fullName: 'radnetz-mainz.de',
    product: 'radverkehr',
    osmRelationIds: [62630],
    map: { lat: 49.9876, lng: 8.2506, zoom: 14 },
    bbox: null,
    // bbox: {
    //   min: [8.1435156, 49.8955342],
    //   max: [8.3422611, 50.0353045],
    // },
    externalLogoPath: 'https://radnetz-mainz.de/favicon.ico',
    logoWhiteBackgroundRequired: false,
    categories: defaultTildaRadverkehrSources,
    backgroundSources: defaultBackgroundSources,
    notes: 'osmNotes',
    exports: null,
  },
  {
    slug: 'lueneburg',
    name: 'LK Lüneburg',
    fullName: 'Landkreis Lüneburg',
    product: 'radverkehr',
    osmRelationIds: [2084746],
    map: { lat: 53.2493, lng: 10.4142, zoom: 11.5 },
    bbox: null,
    // bbox: {
    //   min: [10.041308, 53.0468526],
    //   max: [11.1957671, 53.385876],
    // },
    externalLogoPath:
      'https://www.landkreis-lueneburg.de/_Resources/Static/Packages/Marktplatz.LKLG/Images/Logos/logo.png',
    logoWhiteBackgroundRequired: true,
    categories: defaultTildaRadverkehrSources,
    backgroundSources: defaultBackgroundSources,
    notes: 'osmNotes',
    exports: null,
  },
  {
    slug: 'woldegk',
    name: 'Woldegk',
    fullName: 'Amt Woldegk',
    product: 'radverkehr',
    osmRelationIds: [1419902],
    map: { lat: 53.4613672, lng: 13.5808433, zoom: 11.5 },
    bbox: null,
    // bbox: {
    //   min: [13.378969848860086, 53.37938986368977],
    //   max: [13.74006560910362, 53.613911346911244],
    // },
    externalLogoPath: 'https://upload.wikimedia.org/wikipedia/commons/c/c4/Amt_Woldegk_in_MBS.svg', // There is no better image apparently https://de.wikipedia.org/wiki/Amt_Woldegk
    logoWhiteBackgroundRequired: true,
    categories: defaultTildaRadverkehrSources,
    backgroundSources: defaultBackgroundSources,
    notes: 'atlasNotes',
    exports: null,
  },
  {
    slug: 'trassenscout-umfragen',
    name: '[INTERN] TS Umfragen',
    fullName: '[INTERN] Trassenscout Umfrage-Daten',
    product: 'radverkehr',
    osmRelationIds: [],
    map: { lat: 52.507, lng: 13.367, zoom: 11.8 },
    bbox: null,
    externalLogoPath: null,
    logoWhiteBackgroundRequired: true,
    categories: [
      // The order here specifies the order in the UI
      'roads',
      'mapillary',
    ],
    backgroundSources: defaultBackgroundSources,
    notes: 'disabled',
    exports: null,
  },
  {
    slug: 'ostalbkreis',
    name: 'Ostalbkreis',
    fullName: 'Ostalbkreis',
    product: 'radverkehr',
    osmRelationIds: [62708],
    map: { lat: 48.8364862, lng: 10.092577, zoom: 10 },
    bbox: null, //bboxToMinMax([9.6189511, 48.7145541, 10.4569049, 49.0608132]),
    externalLogoPath: 'https://www.ostalbkreis.de/sixcms/media.php/18/OAK-Logo.svg',
    logoWhiteBackgroundRequired: true,
    categories: defaultTildaRadverkehrSources,
    backgroundSources: defaultBackgroundSources,
    notes: 'osmNotes',
    exports: null,
  },
  {
    name: 'Langerwehe',
    fullName: 'Gemeinde Langerwehe',
    product: 'radverkehr',
    slug: 'langerwehe',
    osmRelationIds: [162550],
    map: { lat: 50.8176382, lng: 6.3580711, zoom: 12 },
    bbox: null,
    // bbox: {
    //   min: [6.298514, 50.7564788],
    //   max: [6.4182952, 50.8355042],
    // },
    externalLogoPath: 'https://upload.wikimedia.org/wikipedia/commons/1/12/DEU_Langerwehe_COA.jpg',
    logoWhiteBackgroundRequired: false,
    categories: defaultTildaRadverkehrSources,
    backgroundSources: defaultBackgroundSources,
    notes: 'osmNotes',
    exports: null,
  },
  {
    name: 'Herrenberg',
    fullName: 'Stadt Herrenberg',
    product: 'radverkehr',
    slug: 'herrenberg',
    osmRelationIds: [722073],
    map: { lat: 48.5959, lng: 8.8675, zoom: 11 },
    bbox: null,
    // bbox: {
    //   min: [8.7898756, 48.5602164],
    //   max: [8.9819058, 48.6392506],
    // },
    externalLogoPath: 'https://upload.wikimedia.org/wikipedia/commons/e/ed/Wappen_Herrenberg.svg',
    logoWhiteBackgroundRequired: false,
    categories: defaultTildaRadverkehrSources,
    backgroundSources: defaultBackgroundSources,
    notes: 'osmNotes',
    exports: null,
  },
  {
    name: 'Magdeburg',
    fullName: 'Stadt Magdeburg',
    product: 'radverkehr',
    slug: 'magdeburg',
    osmRelationIds: [62481],
    map: { lat: 52.1257, lng: 11.6423, zoom: 11 },
    bbox: null,
    // bbox: {
    //   min: [11.5172379, 52.0237486],
    //   max: [11.7639936, 52.2283566],
    // },
    externalLogoPath: 'https://upload.wikimedia.org/wikipedia/commons/7/73/Wappen_Magdeburg.svg',
    logoWhiteBackgroundRequired: false,
    categories: defaultTildaRadverkehrSources,
    backgroundSources: defaultBackgroundSources,
    notes: 'osmNotes',
    exports: null,
  },
  {
    name: 'Brandenburg',
    fullName: 'Land Brandenburg',
    product: 'radverkehr',
    slug: 'bb',
    osmRelationIds: [62504],
    map: { lat: 52.3968, lng: 13.0342, zoom: 11 },
    bbox: {
      min: [11.2662278, 51.359064],
      max: [14.7658159, 53.5590907],
    },
    externalLogoPath: 'https://brandenburg.de/media_fast/bb1.a.3795.de/logo-brb@2.png',
    logoWhiteBackgroundRequired: true,
    categories: [
      // The order here specifies the order in the UI
      'poi',
      'bikelanes',
      'roads',
      'surface',
      'bicycleParking',
      'mapillary',
    ],
    backgroundSources: ['brandenburg-dop20', ...defaultBackgroundSources],
    notes: 'osmNotes',
    cacheWarming: {
      minZoom: 8,
      maxZoom: 10,
      // TODO: extend to allow joined tables
      tables: [
        'bikelanes',
        'roads',
        'poiClassification',
        'roadsPathClasses',
        'publicTransport',
        'landuse',
        'places',
        'landuse',
        'boundaries,boundaryLabels',
        'barrierAreas,barrierLines',
      ],
    },
    exports: defaultTildaRadverkehrExports,
  },
  {
    name: 'Brandenburg Beteiligung',
    fullName: 'Land Brandenburg – Version für Beteiligung',
    product: 'radverkehr',
    slug: 'bb-beteiligung',
    osmRelationIds: [62504],
    map: { lat: 52.3968, lng: 13.0342, zoom: 11 },
    bbox: null,
    externalLogoPath: 'https://brandenburg.de/media_fast/bb1.a.3795.de/logo-brb@2.png',
    logoWhiteBackgroundRequired: true,
    showSearch: true,
    categories: [
      // The order here specifies the order in the UI
      'bikelanes-minimal',
      'poi',
      'roads',
      'mapillary',
    ],
    backgroundSources: [
      'brandenburg-dop20',
      'brandenburg-aktualitaet',
      ...defaultBackgroundSources,
    ],
    notes: 'disabled',
    exports: null,
  },
  {
    slug: 'bb-pg',
    name: 'Brandenburg Projektgruppe',
    fullName: 'Land Brandenburg – Version für Projektgruppe',
    product: 'radverkehr',
    osmRelationIds: [62504],
    map: { lat: 52.3968, lng: 13.0342, zoom: 11 },
    bbox: {
      min: [11.2662278, 51.359064],
      max: [14.7658159, 53.5590907],
    },
    externalLogoPath: 'https://brandenburg.de/media_fast/bb1.a.3795.de/logo-brb@2.png',
    logoWhiteBackgroundRequired: true,
    showSearch: true,
    categories: [
      // The order here specifies the order in the UI
      'poi',
      'bikelanes',
      'roads',
      'surface',
      'bicycleParking',
      'mapillary',
    ],
    backgroundSources: [
      'brandenburg-dop20',
      'brandenburg-aktualitaet',
      ...defaultBackgroundSources,
    ],
    notes: 'disabled',
    // notes: 'atlasNotes',
    exports: defaultTildaRadverkehrExports,
  },
  {
    slug: 'bb-sg',
    name: 'Brandenburg Steuerungsgruppe',
    fullName: 'Land Brandenburg – Version für Steuerungsgruppe',
    product: 'radverkehr',
    osmRelationIds: [62504],
    map: { lat: 52.3968, lng: 13.0342, zoom: 11 },
    bbox: {
      min: [11.2662278, 51.359064],
      max: [14.7658159, 53.5590907],
    },
    externalLogoPath: 'https://brandenburg.de/media_fast/bb1.a.3795.de/logo-brb@2.png',
    logoWhiteBackgroundRequired: true,
    showSearch: true,
    categories: [
      // The order here specifies the order in the UI
      'poi',
      'bikelanes',
      'roads',
      'surface',
      'bicycleParking',
      'mapillary',
    ],
    backgroundSources: [
      'brandenburg-dop20',
      'brandenburg-aktualitaet',
      ...defaultBackgroundSources,
    ],
    notes: 'atlasNotes',
    exports: defaultTildaRadverkehrExports,
  },
  {
    name: 'Brandenburg Kampagne',
    fullName: 'Kampagne Radinfrastruktur Brandenburg',
    product: 'radverkehr',
    slug: 'bb-kampagne',
    osmRelationIds: [62504],
    map: { lat: 52.3968, lng: 13.0342, zoom: 11 },
    bbox: null,
    externalLogoPath: 'https://brandenburg.de/media_fast/bb1.a.3795.de/logo-brb@2.png',
    logoWhiteBackgroundRequired: true,
    showSearch: true,
    categories: [
      // The order here specifies the order in the UI
      'bikelanes',
      'roads',
      'surface',
      'boundaries',
      'mapillary',
    ],
    backgroundSources: [
      'brandenburg-dop20',
      'brandenburg-aktualitaet',
      ...defaultBackgroundSources,
    ],
    notes: 'osmNotes',
    exports: null,
  },
  {
    slug: 'muenchen',
    name: 'München',
    fullName: 'München',
    product: 'radverkehr',
    osmRelationIds: [62428],
    map: { lat: 48.1566, lng: 11.5492, zoom: 12 },
    bbox: null,
    // bbox: {
    //   min: [11.360777, 48.0616244],
    //   max: [11.7229099, 48.2481162],
    // },
    logoPath: null,
    logoWhiteBackgroundRequired: false,
    categories: ['bikelanes', 'lit', 'poi', 'roads', 'surface', 'bicycleParking', 'mapillary'],
    backgroundSources: defaultBackgroundSources,
    notes: 'osmNotes',
    exports: null,
  },
  {
    slug: 'nrw',
    name: 'NRW',
    fullName: 'NRW',
    product: 'radverkehr',
    osmRelationIds: [62761],
    map: { lat: 51.588, lng: 7.567, zoom: 9 },
    bbox: null,
    logoPath: null,
    logoWhiteBackgroundRequired: false,
    categories: ['bikelanes', 'poi', 'roads', 'surface', 'bicycleParking', 'mapillary'],
    backgroundSources: [...defaultBackgroundSources, 'nrw-ortho'],
    notes: 'osmNotes',
    exports: null,
  },
  {
    slug: 'radplus',
    name: 'Rad+',
    fullName: 'Rad+ & Bahnhofsumfelddaten',
    product: 'radverkehr',
    osmRelationIds: [62369, 62422],
    map: { lat: 52.3919, lng: 13.0702, zoom: 13 },
    bbox: null,
    logoPath: null,
    logoWhiteBackgroundRequired: false,
    categories: ['bikelanes', 'poi', 'roads', 'bicycleParking', 'mapillary'],
    backgroundSources: [
      'brandenburg-dop20',
      'brandenburg-aktualitaet',
      ...defaultBackgroundSources,
    ],
    notes: 'atlasNotes',
    exports: null,
  },
  {
    name: 'Fahrradstellplätze',
    fullName: 'Fahrradstellplätze',
    product: 'radverkehr',
    slug: 'fahrradstellplaetze',
    osmRelationIds: [],
    map: { lat: 51.07, lng: 13.35, zoom: 5 },
    bbox: null,
    externalLogoPath:
      'https://raw.githubusercontent.com/rapideditor/temaki/main/icons/bicycle_parked.svg',
    logoWhiteBackgroundRequired: true,
    categories: [
      // The order here specifies the order in the UI
      'bicycleParking',
      'poi',
      'bikelanes',
      'roads',
      'mapillary',
    ],
    backgroundSources: defaultBackgroundSources,
    notes: 'osmNotes',
    exports: null,
  },
  {
    name: 'Stadt Überlingen',
    fullName: 'Stadt Überlingen – Radinfrastruktur',
    product: 'radverkehr',
    slug: 'ueberlingen',
    osmRelationIds: [2784807],
    map: { lat: 47.77, lng: 9.17, zoom: 12 },
    bbox: {
      min: [9.0654381, 47.7454374],
      max: [9.2562242, 47.8592311],
    },
    logoPath: imageUeberlingen,
    logoWhiteBackgroundRequired: false,
    categories: [
      // The order here specifies the order in the UI
      'bikelanes',
      'roads',
      'boundaries',
      'surface',
      'mapillary',
    ],
    backgroundSources: [...defaultBackgroundSources, 'ELI_baden-w-rttemberg-dop20'],
    notes: 'osmNotes',
    exports: ['bikelanes', 'bikeroutes', 'roads', 'roadsPathClasses'],
  },
  {
    slug: 'deutschland',
    name: 'Download',
    fullName: 'Deutschlandweiter Download',
    product: 'radverkehr',
    osmRelationIds: [],
    map: { lat: 51.07, lng: 13.35, zoom: 5 },
    bbox: {
      min: [5.8663153, 47.2701114],
      max: [15.0419309, 55.099161],
    },
    logoPath: null,
    logoWhiteBackgroundRequired: false,
    categories: [
      // The order here specifies the order in the UI
      'bikelanes',
      'poi',
      'roads',
      'surface',
      'lit',
      'mapillary',
    ],
    backgroundSources: defaultBackgroundSources,
    notes: 'osmNotes',
    exports: defaultTildaRadverkehrExports,
  },
  {
    slug: 'radinfra',
    name: 'radinfra.de',
    fullName: 'radinfra.de – Radinfrastruktur Deutschland',
    product: 'radverkehr',
    osmRelationIds: [],
    map: { lat: 51.07, lng: 13.35, zoom: 6 },
    bbox: null,
    logoPath: svgRadinfra,
    logoWhiteBackgroundRequired: false,
    navigationLinks: [
      { name: 'Was ist radinfra.de', href: 'https://radinfra.de/' },
      { name: 'Mithelfen', href: 'https://radinfra.de/mitmachen/' },
    ],
    showSearch: true,
    categories: [
      // The order here specifies the order in the UI
      'radinfra_bikelanes',
      'radinfra_surface',
      'radinfra_width',
      'radinfra_oneway',
      'radinfra_trafficSigns',
      'radinfra_currentness',
      'radinfra_campagins',
      // 'radinfra_statistics',
      'radinfra_mapillary',
    ],
    backgroundSources: defaultBackgroundSources,
    notes: 'osmNotes',
    cacheWarming: {
      minZoom: 5,
      maxZoom: 8,
      tables: ['bikelanes', 'todos_lines'],
    },
    exports: null,
  },
  {
    slug: 'pankow',
    name: 'Pankow',
    fullName: 'Pankow',
    product: 'fussverkehr',
    osmRelationIds: [164723],
    map: { lat: 52.5482, lng: 13.4016, zoom: 16 },
    bbox: null,
    externalLogoPath:
      'https://www.berlin.de/imgscaler/F5uhRQooKmQVGom47pZ-GrE68UX1FF9gh_Tkiv9mFCk/sitelogo/L3N5czExLXByb2QvYmEtcGFua293L19hc3NldHMvZml0dG9zaXplX181MF83NV9lZTI0MDBhYmY5ZmQzZjdiM2FjZThjMDhhNGE5ZjY2NV93YXBwZW5fcGFua293X21pdF9tYXVlcmtyb25lLmpwZw.jpg',
    logoWhiteBackgroundRequired: true,
    categories: [
      // The order here specifies the order in the UI
      'roads',
      'mapillary',
    ],
    backgroundSources: berlinBackgroundSources,
    notes: 'atlasNotes',
    exports: null,
  },
  {
    slug: 'testing',
    name: 'Testing',
    fullName: 'Test new processing',
    product: 'radverkehr',
    osmRelationIds: [],
    map: { lat: 51.07, lng: 13.35, zoom: 5 },
    bbox: null,
    logoPath: null,
    logoWhiteBackgroundRequired: false,
    categories: categories.map((t) => t.id),
    backgroundSources: sourcesBackgroundsRaster.map((s) => s.id),
    notes: 'osmNotes',
    exports: null,
  },
]
