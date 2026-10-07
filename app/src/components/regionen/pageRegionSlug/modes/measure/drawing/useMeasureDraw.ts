import {
  createDrawController,
  createDrawHistory,
  useDraw,
  useDrawPreview,
  type DrawFeature,
} from '@osm-editor-kit/react-map-gl-draw'
import { useCurrentMode } from '@/components/regionen/pageRegionSlug/modes/useCurrentMode'
import {
  isMeasureArea,
  isMeasureLine,
  MEASURE_PRECISION,
  measureAreaId,
  measureLineId,
  type MeasureShape,
} from '../measureModeParam'
import { useMeasureShapes } from '../useMeasureShapes'

const measureDrawController = createDrawController()
// One history for all lines and areas together: a step back undoes the last change, whichever
// shape it was made on. Other drawing surfaces (Summieren, Prüflisten) keep their own.
const measureDrawHistory = createDrawHistory()

const isMeasureShape = (feature: DrawFeature): feature is MeasureShape =>
  isMeasureLine(feature) || isMeasureArea(feature)

/**
 * The drawing surface of the Messen mode. The shapes live in the URL (`measure`); a change
 * arrives here once per finished edit, so every edit is one URL update and one step to undo.
 * Change the shapes from outside the map with `replace()`, so that is a step as well.
 */
export const useMeasureDraw = () => {
  const { shapes, setShapes } = useMeasureShapes()
  // In the Messen mode pointer gestures on the map belong to drawing (see RegionMap).
  const { isMeasure: enabled } = useCurrentMode()

  return useDraw(measureDrawController, {
    value: shapes,
    onChange: (next) => setShapes(next.filter(isMeasureShape)),
    enabled,
    history: measureDrawHistory,
    limits: { point: 0 },
    // A length is the common case: the first click starts a line. Areas start from the panel.
    emptyTool: 'line',
    precision: MEASURE_PRECISION,
    // Matches the id the new shape gets when it is read back from the URL. The shape that is
    // being finished is still the draft when the id is asked for.
    createId: () =>
      measureDrawController.store.getState().draft?.type === 'polygon'
        ? measureAreaId(shapes.filter(isMeasureArea).length)
        : measureLineId(shapes.filter(isMeasureLine).length),
  })
}

/** The shapes as drawn right now, including a drag that is not in the URL yet. */
export const useMeasureLiveShapes = () => {
  const { shapes } = useMeasureShapes()
  return useDrawPreview(measureDrawController, shapes).filter(isMeasureShape)
}
