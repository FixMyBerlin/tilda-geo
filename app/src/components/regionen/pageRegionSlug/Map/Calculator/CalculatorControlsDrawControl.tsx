import MapboxDraw from '@mapbox/mapbox-gl-draw'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import React from 'react'
import type { ControlPosition, MapRef } from 'react-map-gl/maplibre'
import { useControl } from 'react-map-gl/maplibre'
import { drawControlStyle } from './drawControlStyle'

// Work around styling issues until MapboxDraw is updated
// Required for MapLibre GL compatibility (MapLibre uses 'maplibregl-*' instead of 'mapboxgl-*' CSS classes)
// https://github.com/maplibre/maplibre-gl-js/issues/2601#issuecomment-1599769714
// https://maplibre.org/maplibre-gl-js/docs/examples/mapbox-gl-draw/
// @ts-expect-error - MapboxDraw constants are not fully typed
MapboxDraw.constants.classes.CANVAS = 'maplibregl-canvas'
// @ts-expect-error - MapboxDraw constants are not fully typed
MapboxDraw.constants.classes.CONTROL_BASE = 'maplibregl-ctrl'
// @ts-expect-error - MapboxDraw constants are not fully typed
MapboxDraw.constants.classes.CONTROL_PREFIX = 'maplibregl-ctrl-'
// @ts-expect-error - MapboxDraw constants are not fully typed
MapboxDraw.constants.classes.CONTROL_GROUP = 'maplibregl-ctrl-group'
// @ts-expect-error - MapboxDraw constants are not fully typed
MapboxDraw.constants.classes.ATTRIBUTION = 'maplibregl-ctrl-attrib'

export type DrawArea = Omit<GeoJSON.Feature<GeoJSON.Polygon, []>, 'id'> & {
  id: string
}

export type DrawControlProps = ConstructorParameters<typeof MapboxDraw>[0] & {
  position?: ControlPosition
  /** React 19: ref as regular prop */
  ref?: React.Ref<MapboxDraw | undefined>
  onCreate?: (event: { features: DrawArea[] }) => void
  onUpdate?: (event: { features: DrawArea[]; action: string }) => void
  onDelete?: (event: { features: DrawArea[] }) => void
}

// Thanks at https://github.com/visgl/react-map-gl/discussions/2053#discussioncomment-4225133
export function CalculatorControlsDrawControl({
  ref,
  onCreate,
  onUpdate,
  onDelete,
  position,
  ...props
}: DrawControlProps) {
  const handleCreate = (event: { features: DrawArea[] }) => {
    onCreate?.(event)
  }
  const handleUpdate = (event: { features: DrawArea[]; action: string }) => {
    onUpdate?.(event)
  }
  const handleDelete = (event: { features: DrawArea[] }) => {
    onDelete?.(event)
  }

  // @ts-expect-error - Type mismatch after updating @types/mapbox__mapbox-gl-draw from 1.4.6 to 1.4.7 or maplibre from 4.5.0 to 4.7.0
  const drawRef = useControl<MapboxDraw>(
    () => {
      // onCreate – MapboxDraw added to UI
      return new MapboxDraw({
        ...props,
        styles: drawControlStyle,
      })
    },
    ({ map }: { map: MapRef }) => {
      // onAdd – MapboxDraw initialized
      map.on('draw.create', handleCreate)
      map.on('draw.update', handleUpdate)
      map.on('draw.delete', handleDelete)
    },
    ({ map }: { map: MapRef }) => {
      // onRemove – MapboxDraw removed to UI / cleanup
      map.off('draw.create', handleCreate)
      map.off('draw.update', handleUpdate)
      map.off('draw.delete', handleDelete)
    },
    {
      position,
    },
  )

  // TODO: Solve as part of https://github.com/FixMyBerlin/private-issues/issues/1775

  React.useImperativeHandle(ref, () => drawRef, [drawRef]) // This way I exposed drawRef outside the component

  return null
}
