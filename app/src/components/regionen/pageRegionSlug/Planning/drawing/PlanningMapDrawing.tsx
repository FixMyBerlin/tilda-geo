import { useEffect, useRef } from 'react'
import { useControl } from 'react-map-gl/maplibre'
import { usePlanningBoundaryState } from '../../hooks/mapState/usePlanningBoundaryState'
import { PlanningMapDrawingControl } from './PlanningMapDrawingControl'

/**
 * Mounts the TerraDraw study-area drawing control. Render this only while the user is actively
 * drawing (mount = start a fresh polygon); writes the drawn geometry into the shared planning
 * boundary store, which the create form reads as the study_area.
 */
function PlanningMapDrawingControlMount() {
  const setDrawnGeometry = usePlanningBoundaryState((s) => s.setDrawnGeometry)
  const handlersRef = useRef({ onGeometryChange: setDrawnGeometry })
  useEffect(() => {
    handlersRef.current.onGeometryChange = setDrawnGeometry
  })

  useControl(
    () =>
      new PlanningMapDrawingControl({
        getHandlers: () => handlersRef.current,
      }),
    { position: 'top-left' },
  )

  return null
}

/** Mounts the drawing control only while the user is actively drawing a study area. */
export function PlanningMapDrawing() {
  const drawingActive = usePlanningBoundaryState((s) => s.drawingActive)
  if (!drawingActive) return null
  return <PlanningMapDrawingControlMount />
}
