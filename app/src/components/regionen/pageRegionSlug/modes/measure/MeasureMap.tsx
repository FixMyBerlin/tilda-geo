import { MeasureMapDrawing } from './drawing/MeasureMapDrawing'
import { useMeasureLiveShapes } from './drawing/useMeasureDraw'

/**
 * The map side of the Messen mode: the drawing surface with its labels and the loupe.
 * Mounted by `RegionMap` only in this mode; the values are listed in the mode panel
 * (`PageModeMeasure`).
 */
export const MeasureMap = () => {
  // Includes a drag in progress, so the labels follow the pointer.
  const liveShapes = useMeasureLiveShapes()
  return <MeasureMapDrawing shapes={liveShapes} />
}
