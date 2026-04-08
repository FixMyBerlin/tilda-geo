import {
  lineString as turfLineString,
  multiLineString as turfMultiLineString,
  multiPolygon as turfMultiPolygon,
  pointOnFeature,
  polygon as turfPolygon,
} from '@turf/turf'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { LayerProps } from 'react-map-gl/maplibre'
import { Layer, Source, useControl } from 'react-map-gl/maplibre'
import { useMapLoaded } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { jurlStringify } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/v1/jurlParseStringify'
import { CalculatorDrawingToolbar } from './CalculatorDrawingToolbar'
import { CalculatorMapDrawingControl } from './CalculatorMapDrawingControl'
import { CALCULATOR_TERRA_COLORS } from './calculatorTerraDrawConfig'
import type { CalculatorUrlDrawMode } from './calculatorUrlDrawMode'
import type { DrawArea } from './drawAreaTypes'

type Props = {
  drawAreas: DrawArea[]
  drawMode: CalculatorUrlDrawMode
  onUserGeometryChange: (areas: DrawArea[]) => void
  onUserDrawModeChange: (mode: CalculatorUrlDrawMode) => void
  getFeatureLabel?: (args: { area: DrawArea; index: number }) => string | undefined
}

const getLabelPointForGeometry = (geometry: GeoJSON.Geometry) => {
  switch (geometry.type) {
    case 'Point':
      return geometry.coordinates
    case 'LineString': {
      const feature = pointOnFeature(turfLineString(geometry.coordinates))
      return feature.geometry.coordinates
    }
    case 'Polygon': {
      const feature = pointOnFeature(turfPolygon(geometry.coordinates))
      return feature.geometry.coordinates
    }
    case 'MultiPolygon': {
      const feature = pointOnFeature(turfMultiPolygon(geometry.coordinates))
      return feature.geometry.coordinates
    }
    case 'MultiLineString': {
      const feature = pointOnFeature(turfMultiLineString(geometry.coordinates))
      return feature.geometry.coordinates
    }
    default:
      return null
  }
}

export function CalculatorMapDrawing({
  drawAreas,
  drawMode,
  onUserGeometryChange,
  onUserDrawModeChange,
  getFeatureLabel,
}: Props) {
  const mapLoaded = useMapLoaded()
  const [controlReady, setControlReady] = useState(false)
  const lastSyncedSerializedRef = useRef('')
  const drawAreasRef = useRef(drawAreas)
  drawAreasRef.current = drawAreas
  const drawModeRef = useRef(drawMode)
  drawModeRef.current = drawMode
  const handlersRef = useRef({ onUserGeometryChange })
  handlersRef.current = { onUserGeometryChange }

  const control = useControl(
    () =>
      new CalculatorMapDrawingControl({
        getHandlers: () => handlersRef.current,
        setLastSyncedDrawSerialized: (serialized) => {
          lastSyncedSerializedRef.current = serialized
        },
        onReady: (readyControl) => {
          const currentDrawAreas = drawAreasRef.current
          readyControl.replaceFromUrl(currentDrawAreas)
          readyControl.setDrawMode(drawModeRef.current)
          lastSyncedSerializedRef.current = jurlStringify(currentDrawAreas)
          setControlReady(true)
        },
      }),
    { position: 'top-left' },
  )

  const drawSerialized = useMemo(() => jurlStringify(drawAreas), [drawAreas])
  const labelsGeojson = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point, { label: string }>>(() => {
    if (!getFeatureLabel) return { type: 'FeatureCollection', features: [] }
    const features = drawAreas
      .map((area, index) => {
        const label = getFeatureLabel({ area, index })
        if (!label) return null

        const position = getLabelPointForGeometry(area.geometry)
        if (!position) return null

        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: position },
          properties: { label },
        } satisfies GeoJSON.Feature<GeoJSON.Point, { label: string }>
      })
      .filter((feature): feature is GeoJSON.Feature<GeoJSON.Point, { label: string }> =>
        Boolean(feature),
      )
    return { type: 'FeatureCollection', features }
  }, [drawAreas, getFeatureLabel])

  useEffect(
    function syncTerraDrawGeometryFromUrl() {
      if (!mapLoaded || !controlReady || !control.getReady()) return
      if (drawSerialized === lastSyncedSerializedRef.current) return
      control.replaceFromUrl(drawAreas)
      lastSyncedSerializedRef.current = drawSerialized
    },
    [mapLoaded, controlReady, control, drawAreas, drawSerialized],
  )

  return (
    <>
      {labelsGeojson.features.length > 0 && (
        <Source id="calculator-draw-labels-source" type="geojson" data={labelsGeojson}>
          <Layer
            {...({
              id: 'calculator-draw-labels',
              type: 'symbol',
              layout: {
                'text-field': ['get', 'label'],
                'text-size': 11,
                'text-allow-overlap': true,
                'text-font': ['Noto Sans Regular'],
                'text-anchor': 'center',
              },
              paint: {
                'text-color': '#ffffff',
                'text-halo-color': CALCULATOR_TERRA_COLORS.unselected,
                'text-halo-width': 1.5,
                'text-halo-blur': 0.5,
              },
            } satisfies LayerProps)}
          />
        </Source>
      )}
      <CalculatorDrawingToolbar
        drawMode={drawMode}
        canEdit={drawAreas.length > 0}
        onDrawModeChange={(mode) => {
          const appliedMode = control.setDrawMode(mode)
          onUserDrawModeChange(appliedMode)
        }}
        onDelete={() => control.deleteSelectionOrAll()}
      />
    </>
  )
}
