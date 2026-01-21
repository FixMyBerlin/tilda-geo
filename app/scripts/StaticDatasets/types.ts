import { translations } from '@/src/app/regionen/[regionSlug]/_components/SidebarInspector/TagsTable/translations/translations.const'
import { StaticDatasetCategoryKey } from '@/src/app/regionen/[regionSlug]/_mapData/mapDataStaticDatasetCategories/staticDatasetCategories.const'
import {
  FileMapDataSubcategoryStyleLegend,
  MapDataOsmIdConfig,
  MapDataSourceInspectorEditor,
} from '@/src/app/regionen/[regionSlug]/_mapData/types'
import { RegionSlug } from '@/src/data/regions.const'
import { CircleLayer, FillLayer, HeatmapLayer, LineLayer, SymbolLayer } from 'react-map-gl/maplibre'

// a modified version of MapDataDatasetsSource from '../../src/app/regionen/[regionSlug]/_mapData/types'
type MapDataDatasetsSourceBase = {
  /** @desc Whenever we have one dataset multiple time, we need a subid to make them unique */
  subId?: string
  name: string
  layers: (
    | Omit<CircleLayer & Required<Pick<CircleLayer, 'paint'>> & { beforeId?: string }, 'source'>
    | Omit<FillLayer & Required<Pick<FillLayer, 'paint'>> & { beforeId?: string }, 'source'>
    | Omit<LineLayer & Required<Pick<LineLayer, 'paint'>> & { beforeId?: string }, 'source'>
    | Omit<
        SymbolLayer & Required<Pick<SymbolLayer, 'paint' | 'layout'>> & { beforeId?: string },
        'source'
      >
    | Omit<HeatmapLayer & Required<Pick<HeatmapLayer, 'paint'>> & { beforeId?: string }, 'source'>
  )[]
}

type MapDataDatasetsSource = MapDataDatasetsSourceBase & {
  /** @desc A quick-n-dirty way to get type safety for categories. The prefix is just to make type safety per region (or cluster of regions) possible. */
  category: StaticDatasetCategoryKey | null
  updatedAt?: string
  description?: string
  /** @desc A link to the source or a description of how the data was created */
  dataSourceMarkdown?: string
  /** @desc Entity that has to be named as creator (c) of the data on the map an at the dataset */
  attributionHtml: string
  /** @desc Licence Shortcode */
  licence?:
    | undefined
    | 'ODbL'
    | 'CC Zero'
    | 'CC BY 2.0'
    | 'CC BY 3.0'
    | 'CC BY 4.0'
    | 'CC BY-SA 4.0'
    | 'CC BY-NC-SA 4.0'
    | 'DL-DE/ZERO-2.0' // https://www.govdata.de/dl-de/zero-2-0
    | 'DL-DE/BY-2.0' // https://www.govdata.de/dl-de/by-2-0
    | 'Alle Rechte vorbehalten' // Explicit proprietary licence
  /** @desc Are the data OSM compatible due to the licence itself or an explicit waiver */
  licenceOsmCompatible?: undefined | 'licence' | 'waiver' | 'no'
  osmIdConfig?: MapDataOsmIdConfig
  inspector:
    | ({
        enabled: true
        /** @desc Array of key strings OR `false` to list all available keys */
        documentedKeys: string[] | false
        editors?: MapDataSourceInspectorEditor[]
      } & (
        | { disableTranslations?: false; translations: typeof translations }
        | { disableTranslations: true; translations?: never }
      ))
    | {
        enabled: false
      }
  legends?: null | FileMapDataSubcategoryStyleLegend[]
}

// System layer variant - minimal properties, hidden from UI, always active
type MapDataDatasetsSourceSystemLayer = MapDataDatasetsSourceBase & {
  attributionHtml: string
  inspector: { enabled: false }
  category: undefined
  updatedAt: undefined
  description: undefined
  dataSourceMarkdown: undefined
  licence: undefined
  licenceOsmCompatible: undefined
  osmIdConfig: undefined
  legends: undefined
}

export type MapDataSourceExternalRenderFormat = 'pmtiles' | 'geojson'
export type MetaData =
  | {
      regions: RegionSlug[]
      public: boolean
      /** @desc Hide download links from non-admin users. When true, only admins can see download links */
      hideDownloadLink?: boolean
      /** @desc System layers are hidden from UI but always active on the map. When false or undefined, configs must be user-selectable datasets. */
      systemLayer?: false | undefined
      /** @desc Data source type: source data local file from disk (Github) and S3 on the server */
      dataSourceType: 'local'
      /** @desc Change the tippecanoe settings  */
      geometricPrecision?: 'mask' | 'regular' | 'high' | null
      /** @desc Which file format to use for map rendering. Default: 'auto' (PMTiles for large files, GeoJSON for small) */
      mapRenderFormat?: 'pmtiles' | 'geojson' | 'auto'
      /** @desc Configuration for user-selectable datasets */
      configs: MapDataDatasetsSource[]
    }
  | {
      regions: RegionSlug[]
      public: true
      hideDownloadLink: true
      /** @desc System layers are hidden from UI but always active on the map. When true, configs must be system layer configs. */
      systemLayer: true
      /** @desc Data source type: source data local file from disk (Github) and S3 on the server */
      dataSourceType: 'local'
      /** @desc Change the tippecanoe settings  */
      geometricPrecision?: 'mask' | 'regular' | 'high' | null
      /** @desc Which file format to use for map rendering. Default: 'auto' (PMTiles for large files, GeoJSON for small) */
      mapRenderFormat?: 'pmtiles' | 'geojson'
      /** @desc Configuration for system layers (masks, etc.) - minimal properties, always active */
      configs: MapDataDatasetsSourceSystemLayer[]
    }
  | {
      regions: RegionSlug[]
      public: boolean
      /** @desc Hide download links from non-admin users. When true, only admins can see download links */
      hideDownloadLink?: boolean
      /** @desc System layers are hidden from UI but always active on the map. When false or undefined, configs must be user-selectable datasets. */
      systemLayer?: false | undefined
      /** @desc Data source type: external URL and cached in Docker (file cache) */
      dataSourceType: 'external'
      /** @desc URL of the external data source */
      externalSourceUrl: string
      /** @desc Cache TTL in seconds (e.g., 86400 for daily, 3600 for hourly, 60 for minutely) */
      cacheTtlSeconds: number
      /** @desc File format of the external source. Must match the format available at externalSourceUrl. Cannot be 'auto' since format is fixed by external source. */
      mapRenderFormat: MapDataSourceExternalRenderFormat
      /** @desc Configuration for user-selectable datasets. External sources cannot be system layers. */
      configs: MapDataDatasetsSource[]
    }
