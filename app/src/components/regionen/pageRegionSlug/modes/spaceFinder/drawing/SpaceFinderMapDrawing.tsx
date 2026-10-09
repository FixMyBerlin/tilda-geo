import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { DrawLayers } from '@osm-editor-kit/react-map-gl-draw'
import {
  useSpaceFinderDrawingActive,
  useSpaceFinderDrawnGeometry,
} from '../../../hooks/mapState/space-finder-boundary-store'
import { ModeMapHint, ModeMapToolbar, ModeMapToolbarRow } from '../../ModeMapHint'
import { ModeMapUndoRedo } from '../../ModeMapUndoRedo'
import { spaceFinderDrawStyles } from './spaceFinderDrawStyles'
import { useSpaceFinderDraw } from './useSpaceFinderDraw'

// Mobile: icon-only squares. Desktop: labeled buttons.
const buttonClassName =
  'relative -ml-px inline-flex size-10 items-center justify-center bg-white text-sm font-semibold text-emerald-900 ring-1 ring-emerald-900/20 ring-inset first:rounded-l-md last:rounded-r-md hover:bg-emerald-50 focus:z-10 sm:size-auto sm:min-h-10 sm:justify-start sm:gap-x-1.5 sm:px-3 sm:py-1.5'

/**
 * Map drawing for the study area: the polygon, the first-step hint, undo / redo and "done" /
 * "cancel" while the polygon is drawn (needed on touch screens). Rendered only while the user
 * draws; the geometry lives in the boundary store, which the create form reads.
 */
export function SpaceFinderMapDrawing() {
  const drawingActive = useSpaceFinderDrawingActive()
  const drawnGeometry = useSpaceFinderDrawnGeometry()
  const draw = useSpaceFinderDraw()

  if (!drawingActive) return null

  return (
    <>
      <DrawLayers draw={draw} id="space-finder-draw" styles={spaceFinderDrawStyles} />
      <ModeMapToolbarRow>
        {draw.isDrawing && (
          <ModeMapToolbar aria-label="Gebiet zeichnen">
            <button
              type="button"
              className={buttonClassName}
              title="Gebiet abschließen"
              onClick={draw.finish}
            >
              <CheckIcon className="size-5 shrink-0" aria-hidden />
              <span className="hidden sm:inline">Fertig</span>
            </button>
            <button
              type="button"
              className={buttonClassName}
              title="Zeichnen abbrechen"
              onClick={draw.cancel}
            >
              <XMarkIcon className="size-5 shrink-0" aria-hidden />
              <span className="hidden sm:inline">Abbrechen</span>
            </button>
          </ModeMapToolbar>
        )}
        <ModeMapUndoRedo draw={draw} />
      </ModeMapToolbarRow>
      {/* Gone with the first click. */}
      {!draw.isDrawing && !drawnGeometry && (
        <ModeMapHint>In die Karte klicken, um das Gebiet zu zeichnen.</ModeMapHint>
      )}
    </>
  )
}
