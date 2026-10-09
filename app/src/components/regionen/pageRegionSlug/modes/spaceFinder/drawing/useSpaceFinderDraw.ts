import {
  createDrawController,
  createDrawHistory,
  featuresFromGeometry,
  geometryFromFeatures,
  useDraw,
} from '@osm-editor-kit/react-map-gl-draw'
import { useMemo } from 'react'
import {
  useSpaceFinderBoundaryActions,
  useSpaceFinderDrawingActive,
  useSpaceFinderDrawnGeometry,
  useSpaceFinderDrawSession,
} from '../../../hooks/mapState/space-finder-boundary-store'
import { useCurrentMode } from '../../useCurrentMode'

const spaceFinderDrawController = createDrawController()
// The steps of the study area only; the other drawing surfaces keep their own.
const spaceFinderDrawHistory = createDrawHistory()

/**
 * The drawing surface for the study area of a Planungsgebiet: one polygon (or the parts of an
 * existing area), held in the boundary store. It is only enabled while the user draws (`drawingActive`); the first click starts the
 * polygon, afterwards its corners and edges can be changed directly.
 */
export const useSpaceFinderDraw = () => {
  const { isSpaceFinder } = useCurrentMode()
  const drawingActive = useSpaceFinderDrawingActive()
  const drawSession = useSpaceFinderDrawSession()
  const drawnGeometry = useSpaceFinderDrawnGeometry()
  const { setDrawnGeometry } = useSpaceFinderBoundaryActions()

  const value = useMemo(() => featuresFromGeometry(drawnGeometry), [drawnGeometry])

  return useDraw(spaceFinderDrawController, {
    value,
    onChange: (next) => {
      const geometry = geometryFromFeatures(next)
      setDrawnGeometry(
        geometry?.type === 'Polygon' || geometry?.type === 'MultiPolygon' ? geometry : null,
      )
    },
    enabled: isSpaceFinder && drawingActive,
    history: spaceFinderDrawHistory,
    historyKey: `session-${drawSession}`,
    // A new area is one polygon. An existing area with several parts keeps them editable.
    limits: { point: 0, line: 0, ...(value.length > 1 ? {} : { polygon: 1 }) },
    // Matches the ids `featuresFromGeometry` gives the parts.
    createId: () => `part-${value.length}`,
    emptyTool: 'polygon',
    selectSingle: true,
  })
}
