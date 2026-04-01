const suffix = '--highlight'

export function getLayerHighlightId(layerId: string) {
  return `${layerId}${suffix}`
}

export function isLayerHighlightId(layerId: string) {
  return layerId.endsWith(suffix)
}
