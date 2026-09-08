import type { LayerProps } from 'react-map-gl/maplibre'
import { Layer } from 'react-map-gl/maplibre'
import { buildHighlightLayerProps } from './utils/buildHighlightLayerProps'

export const LayerHighlight = (props: LayerProps) => {
  const layerProps = buildHighlightLayerProps(props)
  if (!layerProps) return null
  return <Layer {...layerProps} />
}
