import type { LayerProps } from 'react-map-gl/maplibre'
import { Layer } from 'react-map-gl/maplibre'
import {
  buildDirectionArrowLayers,
  type DirectionArrowLineEntry,
} from './directionArrows/directionArrowLayers'
import { LayerHighlight } from './LayerHighlight'

type Props = {
  entries: (DirectionArrowLineEntry & {
    layerId: string
    highlightLayerId: string
    layerProps: LayerProps
  })[]
}

/**
 * MapLibre stacks layers with the same `beforeId` in the order they mount, and they mount in
 * this order: all layers, then their highlights, then the direction arrows on top.
 */
export const LayersWithHighlights = ({ entries }: Props) => {
  return (
    <>
      {entries.map(({ layerId, layerProps }) => (
        <Layer key={layerId} {...layerProps} />
      ))}
      {entries.map(({ highlightLayerId, layerProps }) => (
        <LayerHighlight key={highlightLayerId} {...layerProps} id={highlightLayerId} />
      ))}
      {buildDirectionArrowLayers(entries).map((layerProps) => (
        <Layer key={layerProps.id} {...layerProps} />
      ))}
    </>
  )
}
