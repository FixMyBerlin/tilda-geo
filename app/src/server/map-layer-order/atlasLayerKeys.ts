import { getAllAtlasLayerEntries } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/sortLayers/getAllAtlasLayerEntries'

/** The layer keys of all Atlas-Geo layers in the code, in config order. */
export const ATLAS_LAYER_KEYS = getAllAtlasLayerEntries().map((layer) => layer.layerKey)

const ATLAS_LAYER_KEY_SET = new Set(ATLAS_LAYER_KEYS)

/** True when `layerKeys` are exactly the layers of the code. */
export const hasEveryAtlasLayer = (layerKeys: string[]) =>
  layerKeys.length === ATLAS_LAYER_KEY_SET.size &&
  new Set(layerKeys).size === layerKeys.length &&
  layerKeys.every((layerKey) => ATLAS_LAYER_KEY_SET.has(layerKey))
