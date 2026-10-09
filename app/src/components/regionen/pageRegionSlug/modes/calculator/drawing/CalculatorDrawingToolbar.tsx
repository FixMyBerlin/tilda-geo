import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { DrawInstance } from '@osm-editor-kit/react-map-gl-draw'
import {
  ModeMapHint,
  ModeMapToolbar,
  ModeMapToolbarRow,
} from '@/components/regionen/pageRegionSlug/modes/ModeMapHint'
import { ModeMapUndoRedo } from '@/components/regionen/pageRegionSlug/modes/ModeMapUndoRedo'

type Props = {
  draw: DrawInstance
  isDrawing: boolean
  hasAreas: boolean
  /** A further area was requested from the panel and waits for its first click. */
  isAddingArea: boolean
  onFinish: () => void
  onCancel: () => void
}

// Mobile: icon-only squares. Desktop: labeled buttons.
const buttonClassName =
  'relative -ml-px inline-flex size-10 items-center justify-center bg-white text-sm font-semibold text-fuchsia-900 ring-1 ring-fuchsia-900/20 ring-inset first:rounded-l-md last:rounded-r-md hover:bg-fuchsia-50 focus:z-10 sm:size-auto sm:min-h-10 sm:justify-start sm:gap-x-1.5 sm:px-3 sm:py-1.5'

/**
 * What the map itself shows for drawing: the hint for the first step, undo / redo, and "done" /
 * "cancel" while an area is being drawn (needed on touch screens, where there is no double
 * click or Escape). Everything else is in the panel: a further area and help in its header
 * (`CalculatorPanelActions`), deleting next to each area in the result.
 */
export function CalculatorDrawingToolbar({
  draw,
  isDrawing,
  hasAreas,
  isAddingArea,
  onFinish,
  onCancel,
}: Props) {
  return (
    <>
      <ModeMapToolbarRow>
        {isDrawing && (
          <ModeMapToolbar aria-label="Fläche zeichnen">
            <button
              type="button"
              className={buttonClassName}
              title="Fläche abschließen"
              onClick={onFinish}
            >
              <CheckIcon className="size-5 shrink-0" aria-hidden />
              <span className="hidden sm:inline">Fertig</span>
            </button>
            <button
              type="button"
              className={buttonClassName}
              title="Zeichnen abbrechen"
              onClick={onCancel}
            >
              <XMarkIcon className="size-5 shrink-0" aria-hidden />
              <span className="hidden sm:inline">Abbrechen</span>
            </button>
          </ModeMapToolbar>
        )}
        <ModeMapUndoRedo draw={draw} />
      </ModeMapToolbarRow>

      {/* Gone with the first click. */}
      {!isDrawing && !hasAreas && (
        <ModeMapHint>
          In die Karte klicken, um eine Fläche zu zeichnen und ihre Werte zu summieren.
        </ModeMapHint>
      )}
      {!isDrawing && hasAreas && isAddingArea && (
        <ModeMapHint>In die Karte klicken, um eine weitere Fläche zu zeichnen.</ModeMapHint>
      )}
    </>
  )
}
