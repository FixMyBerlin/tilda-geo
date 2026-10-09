import { measureShapesFromParam, measureShapesToParam, type MeasureShape } from './measureModeParam'
import { useMeasureModeParam } from './useMeasureModeParam'

/** The measured lines and areas of the Messen mode (`measure.lines`, `measure.areas`). */
export const useMeasureShapes = () => {
  const { measureMode, setMeasureModeParam } = useMeasureModeParam()
  const shapes: MeasureShape[] = measureShapesFromParam(measureMode)

  // Not throttled: `shapes` is read back from the URL, so a delayed write hands callers a
  // stale value. Callers pass settled edits only (see `useMeasureDraw`).
  const setShapes = (next: MeasureShape[]) => {
    setMeasureModeParam({ ...measureMode, ...measureShapesToParam(next) })
  }

  return { shapes, setShapes }
}
