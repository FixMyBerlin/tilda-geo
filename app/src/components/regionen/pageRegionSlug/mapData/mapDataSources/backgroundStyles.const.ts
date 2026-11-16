import type { LayerPosition } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/utils/beforeId'

/**
 * The vector basemap styles a region can use (`Region.backgroundStyle`).
 * Each style is downloaded with `bun run map-style-update` to `src/server/api/map-style/styles/<id>.json`
 * and served by `/api/map-style/<id>`.
 */
export const BACKGROUND_STYLES = {
  atlas: {
    label: 'Atlas',
    maptilerMapId: '08357855-50d4-44e1-ac9f-ea099d9de4a5',
    /** The vector source of the style; our 3D buildings read its `building` layer. */
    source: 'openmaptiles',
    buildingHeight: { height: 'render_height', minHeight: 'render_min_height' },
    /** The style has every `LAYER_POSITIONS` layer itself. */
    anchorsBefore: {},
  },
  dataviz: {
    label: 'Datenvisualisierung',
    maptilerMapId: '01a1c5e0-876a-739e-a609-6781d8f2a207',
    source: 'maptiler_planet_v4',
    buildingHeight: { height: 'height', minHeight: 'height_min' },
    // The style lacks these `LAYER_POSITIONS` layers. The download inserts an empty layer of
    // that id right below the given layer, in the same place as in the Atlas style.
    anchorsBefore: {
      landuse: 'atlas-app-beforeid-above-landuse',
      building: 'Building',
      boundary_country_outline: 'Country border',
      boundary_country: 'Country border',
      housenumber: 'atlas-app-beforeid-group2',
    },
  },
} as const satisfies Record<
  string,
  {
    label: string
    maptilerMapId: string
    source: string
    buildingHeight: { height: string; minHeight: string }
    anchorsBefore: Partial<Record<LayerPosition, string>>
  }
>

export type BackgroundStyleId = keyof typeof BACKGROUND_STYLES
export const BACKGROUND_STYLE_IDS = Object.keys(BACKGROUND_STYLES) as [
  BackgroundStyleId,
  ...BackgroundStyleId[],
]

/** Default of new regions; existing regions keep `atlas` (see the migration). */
export const DEFAULT_BACKGROUND_STYLE_ID = 'dataviz' satisfies BackgroundStyleId

export const isBackgroundStyleId = (value: string): value is BackgroundStyleId =>
  Object.hasOwn(BACKGROUND_STYLES, value)

export const maptilerEditorUrl = (id: BackgroundStyleId) =>
  `https://cloud.maptiler.com/maps/${BACKGROUND_STYLES[id].maptilerMapId}/`
