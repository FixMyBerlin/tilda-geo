import { useEffect, useMemo, useRef, useState } from 'react'
import { useControl } from 'react-map-gl/maplibre'
import { useMapLoaded } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { jurlStringify } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/v1/jurlParseStringify'
import { CalculatorDrawingToolbar } from './CalculatorDrawingToolbar'
import { CalculatorMapDrawingControl } from './CalculatorMapDrawingControl'
import type { CalculatorUrlDrawMode } from './calculatorUrlDrawMode'
import type { DrawArea } from './drawAreaTypes'

type Props = {
  drawAreas: DrawArea[]
  drawMode: CalculatorUrlDrawMode
  onUserGeometryChange: (areas: DrawArea[]) => void
  onUserDrawModeChange: (mode: CalculatorUrlDrawMode) => void
}

export function CalculatorMapDrawing({
  drawAreas,
  drawMode,
  onUserGeometryChange,
  onUserDrawModeChange,
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
    <CalculatorDrawingToolbar
      drawMode={drawMode}
      canEdit={drawAreas.length > 0}
      onDrawModeChange={(mode) => {
        const appliedMode = control.setDrawMode(mode)
        onUserDrawModeChange(appliedMode)
      }}
      onDelete={() => control.deleteSelectionOrAll()}
    />
  )
}
