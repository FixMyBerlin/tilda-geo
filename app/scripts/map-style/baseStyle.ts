import path from 'node:path'
import { LAYER_POSITIONS } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/utils/beforeId'
import { MAPTILER_API_KEY } from '@/components/regionen/pageRegionSlug/Map/utils/maptilerApiKey.const'

// Edit the style at https://cloud.maptiler.com/maps/editor?map=08357855-50d4-44e1-ac9f-ea099d9de4a5
const BASE_STYLE_URL = `https://api.maptiler.com/maps/08357855-50d4-44e1-ac9f-ea099d9de4a5/style.json?key=${MAPTILER_API_KEY}`

export const BASE_STYLE_PATH = path.join(
  import.meta.dir,
  '../../src/server/api/map-style/style.json',
)

type BaseStyle = { layers: { id: string }[] }

export const fetchBaseStyle = async () => {
  const response = await fetch(BASE_STYLE_URL, { signal: AbortSignal.timeout(10_000) })
  if (!response.ok) {
    throw new Error(`Maptiler answered ${response.status} ${response.statusText}`)
  }
  return (await response.json()) as BaseStyle
}

export const readLocalBaseStyle = async () => {
  return (await Bun.file(BASE_STYLE_PATH).json()) as BaseStyle
}

/** The layers our own layers are placed below; without them the layer order breaks. */
export const missingAnchorLayers = (style: BaseStyle) => {
  const layerIds = new Set(style.layers.map((layer) => layer.id))
  return LAYER_POSITIONS.filter((id) => !layerIds.has(id))
}

export const isSameStyle = (a: BaseStyle, b: BaseStyle) => {
  return JSON.stringify(a) === JSON.stringify(b)
}
