import { useEffect, useRef } from 'react'
import { useControl } from 'react-map-gl/maplibre'
import { useSpaceFinderBoundaryState } from '../../../hooks/mapState/useSpaceFinderBoundaryState'
import { SpaceFinderMapDrawingControl } from './SpaceFinderMapDrawingControl'

/**
 * Mounts the TerraDraw study-area drawing control. Render this only while the user is actively
 * drawing (mount = start a fresh polygon); writes the drawn geometry into the shared planning
 * boundary store, which the create form reads as the study_area.
 */
function SpaceFinderMapDrawingControlMount() {
  const setDrawnGeometry = useSpaceFinderBoundaryState((s) => s.setDrawnGeometry)
  const setPolygonDrawInProgress = useSpaceFinderBoundaryState((s) => s.setPolygonDrawInProgress)
  const handlersRef = useRef({
    onGeometryChange: setDrawnGeometry,
    onDrawingStateChange: setPolygonDrawInProgress,
  })
  useEffect(() => {
    handlersRef.current.onGeometryChange = setDrawnGeometry
    handlersRef.current.onDrawingStateChange = setPolygonDrawInProgress
  })

  // Reset the flag when the control unmounts (e.g. "Zeichnen beenden" pressed before the
  // polygon was ever finished), so data-layer clicks are re-enabled.
  useEffect(() => () => setPolygonDrawInProgress(false), [setPolygonDrawInProgress])

  useControl(
    () =>
      new SpaceFinderMapDrawingControl({
        getHandlers: () => handlersRef.current,
      }),
    { position: 'top-left' },
  )

  return null
}

/** Mounts the drawing control only while the user is actively drawing a study area. */
export function SpaceFinderMapDrawing() {
  const drawingActive = useSpaceFinderBoundaryState((s) => s.drawingActive)
  if (!drawingActive) return null
  return <SpaceFinderMapDrawingControlMount />
}
