import svgBibi from '@/src/app/_components/assets/bibi-logo.svg'
import svgInfravelo from '@/src/app/_components/assets/infravelo.svg'
import svgNudafa from '@/src/app/_components/assets/nudafa-logo.svg'
import svgParking from '@/src/app/_components/assets/osm-parkraum-logo-2025.svg'
import svgRadinfra from '@/src/app/_components/assets/radinfra-logo.svg'
import imageTrTo from '@/src/app/_components/assets/trto-logo.png'
import { categories } from '@/src/app/regionen/[regionSlug]/_mapData/mapDataCategories/categories.const'
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
  product: 'radverkehr' | 'parkraum' | 'fußverkehr'
  /** @desc 1-n relation IDs, used for the mask and export bbox — @href use https://hanshack.com/geotools/gimmegeodata/ to get the ids */
  osmRelationIds: number[] | []
  map: StaticRegionInitialMapPositionZoom
  /** @desc Used by the download panel to pass to the api endpoint */
  bbox: { min: readonly [number, number]; max: readonly [number, number] } | null
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
    hideDownload?: boolean
    showSearch?: boolean
    cacheWarming?: { minZoom: number; maxZoom: number; tables: UnionTiles<TableId>[] }
  }

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

export type RegionSlug =
  | 'bb-beteiligung' // Land Brandenburg, für Beteiligung
  | 'bb-kampagne' // Kampagne mit Land Brandenburg
  | 'bb-pg' // Land Brandenburg Projektgruppe
  | 'bb-sg' // Land Brandenburg Steuerungsgruppe
  | 'bb' // Öffentlich, Land Brandenburg
  | 'infravelo'
  | 'berlin'
  | 'bibi'
  | 'deutschland'
  | 'fahrradstellplaetze'
  | 'herrenberg'
  | 'langerwehe'
  | 'lueneburg'
  | 'magdeburg'
  | 'mainz'
  | 'muenchen'
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
  | 'trto'
  | 'woldegk'
  | 'trassenscout-umfragen'

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
    categories: [
      // The order here specifies the order in the UI
      'poi',
      'bikelanes',
      'roads',
      'surface',
      'lit',
      'mapillary',
    ],
    backgroundSources: [...defaultBackgroundSources, 'trto-radwege'],
    notes: 'osmNotes',
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
    backgroundSources: [
      ...defaultBackgroundSources,
      'strassenbefahrung',
      'alkis',
      'areal2025',
      'areal2024',
      'areal2023',
      'areal2022',
      'areal2021',
      'areal2020',
      'areal2019',
      'parkraumkarte_neukoelln',
    ],
    notes: 'osmNotes',
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
    backgroundSources: [
      ...defaultBackgroundSources,
      'strassenbefahrung',
      'alkis',
      'areal2025',
      'areal2024',
      'areal2023',
      'areal2022',
      'areal2021',
      'areal2020',
      'areal2019',
      'parkraumkarte_neukoelln',
    ],
    notes: 'atlasNotes',
    cacheWarming: {
      minZoom: 9,
      maxZoom: 13,
      tables: ['bikelanes', 'roads', 'roadsPathClasses'],
    },
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
    backgroundSources: [
      ...defaultBackgroundSources,
      'strassenbefahrung',
      'alkis',
      'areal2025',
      'areal2024',
      'areal2023',
      'areal2022',
      'areal2021',
      'areal2020',
      'areal2019',
      'parkraumkarte_neukoelln',
    ],
    hideDownload: true,
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
      'parkingLars',
      'roads',
      'mapillary',
    ],
    backgroundSources: [
      ...defaultBackgroundSources,
      'strassenbefahrung',
      'alkis',
      'areal2025',
      'areal2024',
      'areal2023',
      'areal2022',
      'areal2021',
      'areal2020',
      'areal2019',
      'parkraumkarte_neukoelln',
    ],
    hideDownload: false,
    notes: 'atlasNotes',
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
    backgroundSources: [
      ...defaultBackgroundSources,
      'strassenbefahrung',
      'alkis',
      'areal2025',
      'areal2024',
      'areal2023',
      'areal2022',
      'areal2021',
      'areal2020',
      'areal2019',
      'brandenburg-dop20',
      'brandenburg-aktualitaet',
      'parkraumkarte_neukoelln',
    ],
    hideDownload: true,
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
    bbox: {
      min: [9.13736562, 48.81051166],
      max: [9.36731192, 48.93255599],
    },
    externalLogoPath: 'https://trassenscout.de/favicon.svg',
    logoWhiteBackgroundRequired: false,
    categories: [
      // The order here specifies the order in the UI
      'poi',
      'bikelanes',
      'roads',
      'surface',
      'lit',
      'mapillary',
    ],
    backgroundSources: defaultBackgroundSources,
    notes: 'osmNotes',
  },
  {
    slug: 'mainz',
    name: 'Mainz',
    fullName: 'radnetz-mainz.de',
    product: 'radverkehr',
    osmRelationIds: [62630],
    map: { lat: 49.9876, lng: 8.2506, zoom: 14 },
    bbox: {
      min: [8.1435156, 49.8955342],
      max: [8.3422611, 50.0353045],
    },
    externalLogoPath: 'https://radnetz-mainz.de/favicon.ico',
    logoWhiteBackgroundRequired: false,
    categories: [
      // The order here specifies the order in the UI
      'poi',
      'bikelanes',
      'roads',
      'surface',
      'lit',
      'mapillary',
    ],
    backgroundSources: defaultBackgroundSources,
    notes: 'osmNotes',
  },
  {
    slug: 'lueneburg',
    name: 'LK Lüneburg',
    fullName: 'Landkreis Lüneburg',
    product: 'radverkehr',
    osmRelationIds: [2084746],
    map: { lat: 53.2493, lng: 10.4142, zoom: 11.5 },
    bbox: {
      min: [10.041308, 53.0468526],
      max: [11.1957671, 53.385876],
    },
    externalLogoPath:
      'https://www.landkreis-lueneburg.de/_Resources/Static/Packages/Marktplatz.LKLG/Images/Logos/logo.png',
    logoWhiteBackgroundRequired: true,
    categories: [
      // The order here specifies the order in the UI
      'poi',
      'bikelanes',
      'roads',
      'surface',
      'lit',
      'mapillary',
    ],
    backgroundSources: defaultBackgroundSources,
    notes: 'osmNotes',
  },
  {
    slug: 'woldegk',
    name: 'Woldegk',
    fullName: 'Amt Woldegk',
    product: 'radverkehr',
    osmRelationIds: [1419902],
    map: { lat: 53.4613672, lng: 13.5808433, zoom: 11.5 },
    bbox: {
      min: [13.378969848860086, 53.37938986368977],
      max: [13.74006560910362, 53.613911346911244],
    },
    externalLogoPath: 'https://upload.wikimedia.org/wikipedia/commons/c/c4/Amt_Woldegk_in_MBS.svg', // There is no better image apparently https://de.wikipedia.org/wiki/Amt_Woldegk
    logoWhiteBackgroundRequired: true,
    categories: [
      // The order here specifies the order in the UI
      'poi',
      'bikelanes',
      'roads',
      'surface',
      'lit',
      'mapillary',
    ],
    backgroundSources: defaultBackgroundSources,
    notes: 'atlasNotes',
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
  },
  {
    slug: 'ostalbkreis',
    name: 'Ostalbkreis',
    fullName: 'Ostalbkreis',
    product: 'radverkehr',
    osmRelationIds: [62708],
    map: { lat: 48.8364862, lng: 10.092577, zoom: 10 },
    bbox: bboxToMinMax([9.6189511, 48.7145541, 10.4569049, 49.0608132]),
    externalLogoPath: 'https://www.ostalbkreis.de/sixcms/media.php/18/OAK-Logo.svg',
    logoWhiteBackgroundRequired: true,
    categories: [
      // The order here specifies the order in the UI
      'poi',
      'bikelanes',
      'roads',
      'surface',
      'lit',
      'mapillary',
    ],
    backgroundSources: defaultBackgroundSources,
    notes: 'osmNotes',
  },
  {
    name: 'Langerwehe',
    fullName: 'Gemeinde Langerwehe',
    product: 'radverkehr',
    slug: 'langerwehe',
    osmRelationIds: [162550],
    map: { lat: 50.8176382, lng: 6.3580711, zoom: 12 },
    bbox: {
      min: [6.298514, 50.7564788],
      max: [6.4182952, 50.8355042],
    },
    externalLogoPath: 'https://upload.wikimedia.org/wikipedia/commons/1/12/DEU_Langerwehe_COA.jpg',
    logoWhiteBackgroundRequired: false,
    categories: [
      // The order here specifies the order in the UI
      'poi',
      'bikelanes',
      'roads',
      'surface',
      'lit',
      'mapillary',
    ],
    backgroundSources: defaultBackgroundSources,
    notes: 'osmNotes',
  },
  {
    name: 'Herrenberg',
    fullName: 'Stadt Herrenberg',
    product: 'radverkehr',
    slug: 'herrenberg',
    osmRelationIds: [722073],
    map: { lat: 48.5959, lng: 8.8675, zoom: 11 },
    bbox: {
      min: [8.7898756, 48.5602164],
      max: [8.9819058, 48.6392506],
    },
    externalLogoPath: 'https://upload.wikimedia.org/wikipedia/commons/e/ed/Wappen_Herrenberg.svg',
    logoWhiteBackgroundRequired: false,
    categories: [
      // The order here specifies the order in the UI
      'poi',
      'bikelanes',
      'roads',
      'surface',
      'lit',
      'mapillary',
    ],
    backgroundSources: defaultBackgroundSources,
    notes: 'osmNotes',
  },
  {
    name: 'Magdeburg',
    fullName: 'Stadt Magdeburg',
    product: 'radverkehr',
    slug: 'magdeburg',
    osmRelationIds: [62481],
    map: { lat: 52.1257, lng: 11.6423, zoom: 11 },
    bbox: {
      min: [11.5172379, 52.0237486],
      max: [11.7639936, 52.2283566],
    },
    externalLogoPath: 'https://upload.wikimedia.org/wikipedia/commons/7/73/Wappen_Magdeburg.svg',
    logoWhiteBackgroundRequired: false,
    categories: [
      // The order here specifies the order in the UI
      'poi',
      'bikelanes',
      'roads',
      'surface',
      'lit',
      'mapillary',
    ],
    backgroundSources: defaultBackgroundSources,
    notes: 'osmNotes',
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
  },
  {
    name: 'Brandenburg Beteiligung',
    fullName: 'Land Brandenburg – Version für Beteiligung',
    product: 'radverkehr',
    slug: 'bb-beteiligung',
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
  },
  {
    name: 'Brandenburg Kampagne',
    fullName: 'Kampagne Radinfrastruktur Brandenburg',
    product: 'radverkehr',
    slug: 'bb-kampagne',
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
  },
  {
    slug: 'muenchen',
    name: 'München',
    fullName: 'München',
    product: 'radverkehr',
    osmRelationIds: [62428],
    map: { lat: 48.1566, lng: 11.5492, zoom: 12 },
    bbox: {
      min: [11.360777, 48.0616244],
      max: [11.7229099, 48.2481162],
    },
    logoPath: null,
    logoWhiteBackgroundRequired: false,
    categories: ['bikelanes', 'lit', 'poi', 'roads', 'surface', 'bicycleParking', 'mapillary'],
    backgroundSources: defaultBackgroundSources,
    notes: 'osmNotes',
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
  },
  {
    name: 'Fahrradstellplätze',
    fullName: 'Fahrradstellplätze',
    product: 'radverkehr',
    slug: 'fahrradstellplaetze',
    osmRelationIds: [],
    map: { lat: 51.07, lng: 13.35, zoom: 5 },
    bbox: {
      min: [5.8663153, 47.2701114],
      max: [15.0419309, 55.099161],
    },
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
    hideDownload: false,
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
  },
  {
    slug: 'pankow',
    name: 'Pankow',
    fullName: 'Pankow',
    product: 'fußverkehr',
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
    backgroundSources: [
      ...defaultBackgroundSources,
      'alkis',
      'areal2025',
      'areal2024',
      'areal2023',
      'areal2022',
      'areal2021',
      'areal2020',
      'areal2019',
    ],
    notes: 'atlasNotes',
  },
  {
    slug: 'testing',
    name: 'Testing',
    fullName: 'Test new processing',
    product: 'radverkehr',
    osmRelationIds: [],
    map: { lat: 51.07, lng: 13.35, zoom: 5 },
    bbox: {
      min: [5.8663153, 47.2701114],
      max: [15.0419309, 55.099161],
    },
    logoPath: null,
    logoWhiteBackgroundRequired: false,
    categories: categories.map((t) => t.id),
    backgroundSources: sourcesBackgroundsRaster.map((s) => s.id),
    notes: 'osmNotes',
  },
]
