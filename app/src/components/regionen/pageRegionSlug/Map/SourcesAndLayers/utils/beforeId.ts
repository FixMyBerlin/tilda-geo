import type {
  AtlasAppAnchorId,
  FileMapDataSubcategory,
  FileMapDataSubcategoryStyleLayer,
  TBeforeIds,
} from '@/components/regionen/pageRegionSlug/mapData/types'

export type LayerPosition = NonNullable<TBeforeIds>

/**
 * The layers of the Maptiler style that our layers are placed below (`beforeId`), from the bottom
 * of the map to the top. tests/smoke/map-layer-order.spec.ts checks the order against the style.
 */
export const LAYER_POSITIONS = [
  'landuse',
  'atlas-app-beforeid-above-landuse',
  'atlas-app-beforeid-below-road',
  'building',
  'boundary_country_outline',
  'boundary_country',
  'atlas-app-beforeid-below-roadname',
  'housenumber',
  'atlas-app-beforeid-group2',
  'atlas-app-beforeid-fallback',
  'atlas-app-beforeid-group1',
  'atlas-app-beforeid-top',
] as const satisfies LayerPosition[]

export const layerPositionRank = (position: LayerPosition) => LAYER_POSITIONS.indexOf(position)

// We place our layers between given Maptiler Layer IDs:
// Key: LayerType – we group our data based on layer type.
// Value: Maptiler Layer ID that our layers are placed below.
const positionByLayerType: Record<FileMapDataSubcategoryStyleLayer['type'], LayerPosition> = {
  symbol: 'housenumber', // Icon + Label
  circle: 'housenumber', // Points
  heatmap: 'housenumber',
  line: 'boundary_country',
  fill: 'landuse',
}

type Props = {
  layer: Pick<FileMapDataSubcategoryStyleLayer, 'type' | 'beforeId'>
  subcategoryBeforeId: FileMapDataSubcategory['beforeId']
  /** The position from /admin/layer-order. */
  adminBeforeId?: AtlasAppAnchorId
}

/** Precedence: admin > layer config > subcategory config > default of the layer type. */
export const layerPosition = ({ layer, subcategoryBeforeId, adminBeforeId }: Props) => {
  return adminBeforeId ?? layer.beforeId ?? subcategoryBeforeId ?? positionByLayerType[layer.type]
}

// All raster backgrounds are layers right below this one, see <LayersRasterBackgrounds>.
const RASTER_BACKGROUND_POSITION = 'atlas-app-beforeid-below-roadname'

/**
 * A raster background covers the basemap below it. A layer whose position is below the raster
 * background moves right above it there; layers that share a `beforeId` stack in mount order.
 */
export const beforeIdOnBackground = (position: LayerPosition, backgroundId: string | undefined) => {
  if (backgroundId === 'default') return position
  return layerPositionRank(position) < layerPositionRank(RASTER_BACKGROUND_POSITION)
    ? RASTER_BACKGROUND_POSITION
    : position
}
