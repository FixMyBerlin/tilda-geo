import type {
  FileMapDataSubcategory,
  FileMapDataSubcategoryStyleLayer,
  TBeforeIds,
} from '@/components/regionen/pageRegionSlug/mapData/types'

// We place our layers between given Maptiler Layer IDs:
// Key: LayerType – we group our data based on layer type.
// Value: Maptiler Layer ID that our layers are placed on top of.
// BUT: We only use this for our "default" background.

//    For custom raster backgrounds we place all our data on top.
const layerOrder: Record<string, TBeforeIds> = {
  symbol: 'housenumber', // Icon + Label
  circle: 'housenumber', // Points
  heatmap: 'housenumber',
  line: 'boundary_country',
  fill: 'landuse',
}

type Props = {
  backgroundId: string | undefined
  subcategoryBeforeId: FileMapDataSubcategory['beforeId']
  layerType: FileMapDataSubcategoryStyleLayer['type']
}

export const beforeId = ({ backgroundId, subcategoryBeforeId, layerType }: Props) => {
  // For all custom background (non 'default'), set beforeId=undefined which puts them at the top
  if (backgroundId !== 'default') return undefined
  if (!backgroundId) return undefined

  // If a specific subcategory.beforeId is given (which might be `undefined`), take that
  // … otherwise pick the beforeId base on layer.type.
  return subcategoryBeforeId || layerOrder[layerType]
}
