import { Prettify } from '@/src/app/_components/types/types'
import { RegionSlug } from '@/src/data/regions.const'
import type {
  CircleLayerSpecification,
  FillLayerSpecification,
  HeatmapLayerSpecification,
  LineLayerSpecification,
  RasterSourceSpecification,
  SymbolLayerSpecification,
  VectorSourceSpecification,
} from 'maplibre-gl'
import { translations } from '../_components/SidebarInspector/TagsTable/translations/translations.const'
import { LegendIconTypes } from '../_components/SidebarLayerControls/Legend/LegendIcons/types'
import { MapDataCategoryId } from './mapDataCategories/MapDataCategoryId'
import { SourcesId } from './mapDataSources/sources.const'
import { StyleId, SubcategoryId } from './typeId'

/** @desc: The background tiles, configured in 'sourcesBackgroundsRaster.const.ts' */
export type MapDataBackgroundSource<TIds> = {
  id: TIds
  name: string
  /** @desc URL of the tiles */
  tiles: string
  attributionHtml: string
  /** @desc Show link to the external legend of that map layer. Will replace {z}/{x}/{y} if present  */
  legendUrl?: string
  maxzoom?: RasterSourceSpecification['maxzoom']
  minzoom?: RasterSourceSpecification['minzoom']
  tileSize?: RasterSourceSpecification['tileSize']
}

/** @desc: The data sources, configured in 'sourcesDatasets.const.ts' */
export type MapDataDatasetsSource<TIds> = {
  /** @desc Associate the dataset with a region. This is the only place where we connect object to region, not region to object. But it makes more sence this way. */
  regionKey: RegionSlug[]
  id: TIds | string // TODO the "string" part should go away, if we keep this. Or it should all be "string". This was added during the migration of LegacyStaticDatasets
  /** @desc Whenever we have one dataset multipe time, we need a subid to make them unique */
  subId?: string
  name: string
  description?: string
  attributionHtml: string
  inspector:
    | ({
        enabled: true
        highlightingKey: 'TODO' // This is not implemented, yet
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
  layers: (
    | (CircleLayerSpecification & Required<Pick<CircleLayerSpecification, 'paint'>>)
    | (FillLayerSpecification & Required<Pick<FillLayerSpecification, 'paint'>>)
    | (LineLayerSpecification & Required<Pick<LineLayerSpecification, 'paint'>>)
    | (SymbolLayerSpecification & Required<Pick<SymbolLayerSpecification, 'paint' | 'layout'>>)
    | (HeatmapLayerSpecification & Required<Pick<HeatmapLayerSpecification, 'paint'>>)
  )[]
} & {
  type: 'vector'
  /** @desc Required format is `pmtiles://${DatasetFiles}` */
  url: string
}

export type MapDataSourceInspectorEditor = {
  name: string
  /** @desc `properties[idKey]` will replace `{editor_id}` in the URL */
  idKey?: string
  /** @desc Allowed replacements are `{zoom}`, `{latitude}`, `{longitude}`, `{short_osm_type}`, `{long_osm_type}`, `{editor_id}`, `{osm_id}` */
  urlTemplate: `https://${string}`
}

type MapDataSourceInspector =
  | {
      enabled: true
      /** @desc The key used by the highlighting LayerHighlight component to change the appearance of the selected element */
      highlightingKey: string
      /** @desc A sorted list of keys that we officially document.
       * Keys of type `composit_*` require their own TableRowCell-Component.
       * Keys of type `*__if_present` are only presented if a value is present.
       * (Keys that are not mentioned here are for debugging only.) */
      documentedKeys?: (string | `composit_${string}` | `${string}__if_present`)[]
      editors?: MapDataSourceInspectorEditor[]
    }
  | {
      enabled: false
    }

export type MapDataSourceCalculator =
  | {
      enabled: true
      keys: string[]
      queryLayers: string[]
      /** @desc The key used by the highlighting LayerHighlight component to change the appearance of the selected element */
      highlightingKey: string
    }
  | {
      enabled: false
      keys?: undefined
      queryLayers?: undefined
      highlightingKey?: undefined
    }

export type MapDataOsmIdConfig =
  | undefined
  | { osmType: string; osmId: string }
  | { osmTypeId: string }

/** @desc: Our own vector tile layers configured in 'sources.const.ts' */
export type MapDataSource<TIds> = {
  id: TIds
  /** @desc URL of the vector tiles */
  tiles: string
  /** @desc minzoom:4 (default, see `SIMPLIFY_MIN_ZOOM`) means no data is loaded for 0-4, only from 5+ (zoomed in) data is present
   * @desc `0---4=minzoom->-----maxzoom=14=overzoom->---22` */
  minzoom: VectorSourceSpecification['minzoom']
  /** @desc maxzoom:14 (default, see `SIMPLIFY_MAX_ZOOM`) means data is still visible for 14+ but it uses the data from z=14 (overzoom)
   * @desc `0---4=minzoom->-----maxzoom=14=overzoom->---22` */
  maxzoom: VectorSourceSpecification['maxzoom']
  attributionHtml: string
  licence: 'ODbL' | undefined
  promoteId: VectorSourceSpecification['promoteId'] | undefined
  osmIdConfig: MapDataOsmIdConfig
  /** @desc Inspector: Enable and configure Inspector */
  inspector: MapDataSourceInspector
  /** @desc Inspector: Enable info data on presence */
  // presence: {
  //   enabled: boolean
  // }
  /** @desc Calculator: Enable and configure calculator feature */
  calculator: MapDataSourceCalculator
}

export type StaticMapDataCategory = {
  id: MapDataCategoryId
  name: string
  desc?: string
  subcategories: StaticMapDataSubcategory[]
}

type StaticMapDataSubcategory = FileMapDataSubcategory & {
  id: SubcategoryId
  defaultStyle: 'default' | 'hidden'
  // TODO: We might need to add a "mapOrder" value here to specify that "places" needs to be at the top on the map but at the bottom of the dropdown in the UI
}

export type TBeforeIds =
  | 'housenumber'
  | 'boundary_country_outline'
  | 'boundary_country'
  | 'landuse'
  | 'building'
  // We have some layer without content that can be used as an anchor
  // Modify at https://cloud.maptiler.com/maps/editor?map=08357855-50d4-44e1-ac9f-ea099d9de4a5
  | 'atlas-app-beforeid-above-landuse'
  | 'atlas-app-beforeid-below-road'
  | 'atlas-app-beforeid-below-roadname'
  | 'atlas-app-beforeid-group2'
  | 'atlas-app-beforeid-fallback'
  | 'atlas-app-beforeid-group1'
  | 'atlas-app-beforeid-top'
  | undefined

/** @desc: Thematic "filter" on the raw vector tile data; eg. 'Radinfrastruktur, Oberflächen, Beleuchtung' */
export type FileMapDataSubcategory = {
  id: SubcategoryId
  name: string
  sourceId: SourcesId
  /** @desc Insert layer before / above the given layer ID. The beforeId layer will come after. */
  beforeId?: TBeforeIds
} & (
  | {
      ui: 'dropdown'
      styles: (FileMapDataSubcategoryStyle | FileMapDataSubcategoryHiddenStyle)[]
    }
  | {
      ui: 'checkbox'
      styles: [FileMapDataSubcategoryStyle]
    }
)

/** @desc: Different visual views of the same thematic data; Can contain static filter, eg. "only lines with todos"); eg. 'Default,  Bad infrastructure (only)', 'Where debugging is needed' */
export type FileMapDataSubcategoryStyle = {
  id: StyleId
  name: string
  category?: string
  layers: FileMapDataSubcategoryStyleLayer[]
  legends?: null | FileMapDataSubcategoryStyleLegend[]
}

export type FileMapDataSubcategoryHiddenStyle = {
  id: 'hidden'
  name: string
  category?: never
  layers?: never
  legends?: never
}

/** @desc: The technical glue between sources and styles. The name "layers" is defined by the library we use. */
export type FileMapDataSubcategoryStyleLayer = Prettify<
  (
    | CircleLayerSpecification
    | FillLayerSpecification
    | HeatmapLayerSpecification
    | LineLayerSpecification
    | SymbolLayerSpecification
  ) & {
    'source-layer': string
    /**
     * @default `true`
     * @desc optional `false` will hide the layer from `interactiveLayerIds` */
    interactive?: false
  }
>

/** @desc: Optional legend to explain a given layer */
export type FileMapDataSubcategoryStyleLegend = {
  id: string
  name: string
  /** @description Strings can be Markdown */
  desc?: string[]
  style:
    | {
        type: Exclude<LegendIconTypes, 'line'>
        color: string
        width?: never
        dasharray?: never
      }
    | {
        type: Extract<LegendIconTypes, 'line'>
        color: string
        width?: number
        dasharray?: number[]
      }
}
