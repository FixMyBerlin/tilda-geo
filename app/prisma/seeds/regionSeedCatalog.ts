import type { MapDataCategoryId } from '@/components/regionen/pageRegionSlug/mapData/mapDataCategories/MapDataCategoryId'
import type { ExportId } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/exports/exports.const'
import type { SourcesRasterIds } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/sourcesBackgroundsRaster.const'
import { RegionNotesMode, RegionProduct, RegionStatus } from '@/prisma/generated/client'
import type { RegionMaskConfig } from '@/server/regions/regionConfigMapper.server'
import type { RegionGeoJsonBBox } from '@/server/regions/regionGeoJson'
import type { RegionWriteInput } from '@/server/regions/regionWriteSchema'

type SeedRegionEntry = {
  slug: string
  config: RegionWriteInput
  mask?: RegionMaskConfig
}

const defaultBackgroundSources = [
  'mapnik',
  'esri',
  'maptiler-satellite',
  'cyclosm',
  'opentopomap',
] satisfies SourcesRasterIds[]

const cityParkraumBackgroundSources = [
  ...defaultBackgroundSources,
  'strassenbefahrung',
  'alkis',
  'brandenburg-dop20',
  'brandenburg-aktualitaet',
  'parkraumkarte_neukoelln',
] satisfies SourcesRasterIds[]

const regionalNetworkBackgroundSources = [
  'brandenburg-dop20',
  'brandenburg-aktualitaet',
  ...defaultBackgroundSources,
] satisfies SourcesRasterIds[]

const defaultRadverkehrExports = [
  'bikelanes',
  'bikeroutes',
  'roads',
  'roadsPathClasses',
  'poiClassification',
  'places',
  'publicTransport',
] satisfies ExportId[]

const regionalNetworkExports = [
  ...defaultRadverkehrExports,
  'bicycleParking_points',
] satisfies ExportId[]

const minimalCategories = ['roads', 'mapillary'] satisfies MapDataCategoryId[]

const baseRegionConfig = {
  product: RegionProduct.radverkehr,
  notes: RegionNotesMode.osmNotes,
  showSearch: false,
  logoWhiteBackgroundRequired: false,
  headerLogoId: null,
  bbox: null,
  cacheWarming: null,
  backgroundSources: [...defaultBackgroundSources],
  exports: [] as ExportId[],
  navigationLinks: [],
  contractId: null,
} satisfies Omit<
  RegionWriteInput,
  | 'slug'
  | 'name'
  | 'fullName'
  | 'promoted'
  | 'status'
  | 'mapLat'
  | 'mapLng'
  | 'mapZoom'
  | 'categories'
>

const withDownloads = (
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number,
  exports: ExportId[],
) => ({
  bbox: [minLng, minLat, maxLng, maxLat] as RegionGeoJsonBBox,
  exports,
})

/**
 * Seed regions for local / CI:
 * - `dev-*` — status/download fixtures (no production client names)
 * - production-like PUBLIC regions — radinfra / bb-kampagne / parkraum for E2E and local
 */
export const seedRegionCatalog: SeedRegionEntry[] = [
  {
    slug: 'dev-status-public',
    config: {
      ...baseRegionConfig,
      slug: 'dev-status-public',
      name: 'Öffentlich (Dev)',
      fullName: 'Dev-Region: Status öffentlich, nicht gelistet',
      promoted: false,
      status: RegionStatus.PUBLIC,
      notes: RegionNotesMode.internalNotes,
      mapLat: 52.5,
      mapLng: 13.4,
      mapZoom: 10,
      categories: [...minimalCategories],
    },
  },
  {
    slug: 'dev-status-private',
    config: {
      ...baseRegionConfig,
      slug: 'dev-status-private',
      name: 'Privat (Dev)',
      fullName: 'Dev-Region: Status privat',
      promoted: false,
      status: RegionStatus.PRIVATE,
      mapLat: 52.5,
      mapLng: 13.4,
      mapZoom: 10,
      categories: [...minimalCategories],
    },
  },
  {
    slug: 'dev-status-closed',
    config: {
      ...baseRegionConfig,
      slug: 'dev-status-closed',
      name: 'Deaktiviert (Dev)',
      fullName: 'Dev-Region: Status deaktiviert (mit BBox/Exports für Admin-Download-E2E)',
      promoted: false,
      status: RegionStatus.DEACTIVATED,
      mapLat: 52.5,
      mapLng: 13.4,
      mapZoom: 10,
      categories: [...minimalCategories],
      ...withDownloads(13.3579, 52.2095, 13.825, 52.4784, [...defaultRadverkehrExports]),
    },
  },
  {
    slug: 'dev-status-promoted',
    config: {
      ...baseRegionConfig,
      slug: 'dev-status-promoted',
      name: 'Gelistet (Dev)',
      fullName: 'Dev-Region: öffentlich und auf /regionen gelistet',
      promoted: true,
      status: RegionStatus.PUBLIC,
      mapLat: 52.5,
      mapLng: 13.4,
      mapZoom: 10,
      categories: [...minimalCategories],
    },
  },
  {
    slug: 'dev-downloads-enabled',
    config: {
      ...baseRegionConfig,
      slug: 'dev-downloads-enabled',
      name: 'Downloads an (Dev)',
      fullName: 'Dev-Region: BBox und Export-Assignments gesetzt',
      promoted: false,
      status: RegionStatus.PUBLIC,
      mapLat: 52.35,
      mapLng: 13.61,
      mapZoom: 12,
      categories: ['poi', 'bikelanes', 'roads', 'mapillary'],
      ...withDownloads(13.3579, 52.2095, 13.825, 52.4784, [...regionalNetworkExports]),
    },
  },
  {
    slug: 'dev-downloads-disabled',
    config: {
      ...baseRegionConfig,
      slug: 'dev-downloads-disabled',
      name: 'Downloads aus (Dev)',
      fullName: 'Dev-Region: keine BBox, keine Export-Assignments',
      promoted: false,
      status: RegionStatus.PUBLIC,
      mapLat: 52.5,
      mapLng: 13.4,
      mapZoom: 10,
      categories: [...minimalCategories],
    },
  },
  {
    slug: 'dev-template-national-catalog',
    config: {
      ...baseRegionConfig,
      slug: 'dev-template-national-catalog',
      name: 'Nationaler Katalog (Dev)',
      fullName: 'Dev-Template: nationaler Radverkehrs-Katalog mit Spezial-Kategorien',
      promoted: true,
      status: RegionStatus.PUBLIC,
      showSearch: true,
      mapLat: 51.07,
      mapLng: 13.35,
      mapZoom: 6,
      categories: [
        'radinfra_bikelanes',
        'radinfra_surface',
        'radinfra_width',
        'radinfra_oneway',
        'radinfra_trafficSigns',
        'radinfra_currentness',
        'radinfra_campagins',
        'radinfra_mapillary',
      ],
      cacheWarming: {
        minZoom: 5,
        maxZoom: 8,
        tables: ['bikelanes', 'todos_lines'],
      },
      navigationLinks: [
        {
          name: 'Projekt-Website',
          internalPath: null,
          externalUrl: 'https://example.com/national-catalog',
          sortOrder: 0,
        },
        {
          name: 'Mitmachen',
          internalPath: null,
          externalUrl: 'https://example.com/national-catalog/mitmachen',
          sortOrder: 1,
        },
      ],
    },
  },
  {
    slug: 'dev-template-parkraum-city',
    config: {
      ...baseRegionConfig,
      slug: 'dev-template-parkraum-city',
      name: 'Stadt-Parkraum (Dev)',
      fullName: 'Dev-Template: städtisches Parkraum-Produkt mit statischen Datensätzen',
      promoted: true,
      status: RegionStatus.PUBLIC,
      product: RegionProduct.parkraum,
      mapLat: 52.507,
      mapLng: 13.367,
      mapZoom: 11.8,
      backgroundSources: [...cityParkraumBackgroundSources],
      categories: ['parkingTilda', 'parkingLars', 'mapillary'],
      ...withDownloads(13.0883, 52.3382, 13.7611, 52.6755, [
        'parkings',
        'parkings_no',
        'parkings_separate',
      ]),
    },
    mask: {
      maskOsmRelationIds: [62422],
      maskBufferKm: 0.5,
    },
  },
  {
    slug: 'dev-template-regional-network',
    config: {
      ...baseRegionConfig,
      slug: 'dev-template-regional-network',
      name: 'Regionalnetz (Dev)',
      fullName: 'Dev-Template: mehrere Gemeinden, breites Kategorie-Set und Downloads',
      promoted: true,
      status: RegionStatus.PUBLIC,
      mapLat: 52.35,
      mapLng: 13.61,
      mapZoom: 12,
      backgroundSources: [...regionalNetworkBackgroundSources],
      categories: ['poi', 'bikelanes', 'roads', 'surface', 'lit', 'bicycleParking', 'mapillary'],
      ...withDownloads(13.3579, 52.2095, 13.825, 52.4784, [...regionalNetworkExports]),
    },
    mask: {
      maskOsmRelationIds: [55775, 55773, 55774, 55776, 5583556, 55772],
      maskBufferKm: 10,
    },
  },
  {
    slug: 'dev-unassigned',
    config: {
      ...baseRegionConfig,
      slug: 'dev-unassigned',
      name: 'Ohne Auftrag (Dev)',
      fullName: 'Dev-Region: kein RegionContract zugewiesen',
      promoted: false,
      status: RegionStatus.PRIVATE,
      mapLat: 52.5,
      mapLng: 13.4,
      mapZoom: 10,
      categories: [...minimalCategories],
    },
  },

  // —— Production-like PUBLIC (logos via admin) ——
  {
    slug: 'radinfra',
    config: {
      ...baseRegionConfig,
      slug: 'radinfra',
      name: 'radinfra.de',
      fullName: 'radinfra.de – Radinfrastruktur Deutschland',
      promoted: true,
      status: RegionStatus.PUBLIC,
      showSearch: true,
      mapLat: 51.07,
      mapLng: 13.35,
      mapZoom: 6,
      categories: [
        'radinfra_bikelanes',
        'radinfra_surface',
        'radinfra_width',
        'radinfra_oneway',
        'radinfra_trafficSigns',
        'radinfra_currentness',
        'radinfra_campagins',
        'radinfra_mapillary',
      ],
      cacheWarming: {
        minZoom: 5,
        maxZoom: 8,
        tables: ['bikelanes', 'todos_lines'],
      },
      navigationLinks: [
        {
          name: 'Was ist radinfra.de',
          internalPath: null,
          externalUrl: 'https://radinfra.de/',
          sortOrder: 0,
        },
        {
          name: 'Mithelfen',
          internalPath: null,
          externalUrl: 'https://radinfra.de/mitmachen/',
          sortOrder: 1,
        },
      ],
    },
  },
  {
    slug: 'bb-kampagne',
    config: {
      ...baseRegionConfig,
      slug: 'bb-kampagne',
      name: 'Brandenburg Kampagne',
      fullName: 'Kampagne Radinfrastruktur Brandenburg',
      promoted: true,
      status: RegionStatus.PUBLIC,
      showSearch: true,
      mapLat: 52.3968,
      mapLng: 13.0342,
      mapZoom: 11,
      logoWhiteBackgroundRequired: true,
      categories: ['bikelanes', 'roads', 'surface', 'boundaries', 'mapillary'],
      backgroundSources: [...regionalNetworkBackgroundSources],
    },
    mask: {
      maskOsmRelationIds: [62504],
      maskBufferKm: 1,
    },
  },
  {
    slug: 'parkraum',
    config: {
      ...baseRegionConfig,
      slug: 'parkraum',
      name: 'Parkraum',
      fullName: 'Parkraumanalyse',
      promoted: true,
      status: RegionStatus.PUBLIC,
      product: RegionProduct.parkraum,
      mapLat: 52.4918,
      mapLng: 13.4261,
      mapZoom: 13.5,
      categories: ['parkingLars', 'mapillary'],
      backgroundSources: [...cityParkraumBackgroundSources],
    },
  },
  {
    slug: 'parkraum-berlin',
    config: {
      ...baseRegionConfig,
      slug: 'parkraum-berlin',
      name: 'Parkraum Berlin',
      fullName: 'Parkraum Berlin',
      promoted: true,
      status: RegionStatus.PUBLIC,
      product: RegionProduct.parkraum,
      mapLat: 52.507,
      mapLng: 13.367,
      mapZoom: 11.8,
      categories: ['parkingTilda', 'parkingLars', 'mapillary'],
      backgroundSources: [...cityParkraumBackgroundSources],
    },
    mask: {
      maskOsmRelationIds: [62422],
      maskBufferKm: 0.5,
    },
  },
  {
    slug: 'parkraum-berlin-euvm',
    config: {
      ...baseRegionConfig,
      slug: 'parkraum-berlin-euvm',
      name: 'Parkraum Berlin eUVM',
      fullName: 'Parkraum Berlin eUVM',
      promoted: true,
      status: RegionStatus.PUBLIC,
      product: RegionProduct.parkraum,
      showSearch: true,
      mapLat: 52.507,
      mapLng: 13.367,
      mapZoom: 11.8,
      notes: RegionNotesMode.internalNotes,
      categories: ['parkingTilda', 'roads', 'mapillary'],
      backgroundSources: [...cityParkraumBackgroundSources],
      ...withDownloads(13.0883, 52.3382, 13.7611, 52.6755, [
        'parkings',
        'off_street_parking_areas',
        'off_street_parking_points',
        'parkings_no',
        'parkings_separate',
      ]),
    },
    mask: {
      maskOsmRelationIds: [62422],
      maskBufferKm: 0.5,
    },
  },
]
