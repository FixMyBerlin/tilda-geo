import { getAllTildaLayerEntries } from '@/components/regionen/pageRegionSlug/Map/SourcesAndLayers/sortLayers/getAllTildaLayerEntries'

/** The layer keys of all TILDA layers in the code, in config order. */
export const TILDA_LAYER_KEYS = getAllTildaLayerEntries().map((layer) => layer.layerKey)

const TILDA_LAYER_KEY_SET = new Set(TILDA_LAYER_KEYS)

/** True when `layerKeys` are exactly the layers of the code. */
export const hasEveryTildaLayer = (layerKeys: string[]) =>
  layerKeys.length === TILDA_LAYER_KEY_SET.size &&
  new Set(layerKeys).size === layerKeys.length &&
  layerKeys.every((layerKey) => TILDA_LAYER_KEY_SET.has(layerKey))
