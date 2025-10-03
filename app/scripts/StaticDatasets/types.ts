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
type MapDataDatasetsSource = {
  /** @desc Whenever we have one dataset multiple time, we need a subid to make them unique */
  subId?: string
  name: string
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
    | 'CC BY-NC-SA 4.0'
    | 'DL-DE/ZERO-2.0' // https://www.govdata.de/dl-de/zero-2-0
    | 'DL-DE/BY-2.0' // https://www.govdata.de/dl-de/by-2-0
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

export type MetaData = {
  regions: RegionSlug[]
  public: boolean
  /** @desc Change the tippecanoe settings  */
  geometricPrecision?: 'mask' | 'regular' | 'high' | null
  /** @desc Which file format to use for map rendering. Default: 'auto' (PMTiles for large files, GeoJSON for small) */
  mapRenderFormat?: 'pmtiles' | 'geojson' | 'auto'
  configs: MapDataDatasetsSource[]
}
