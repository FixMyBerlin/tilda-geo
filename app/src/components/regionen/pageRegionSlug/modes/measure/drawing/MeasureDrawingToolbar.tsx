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
  hasShapes: boolean
  /** The tool that waits for its first click, if any. */
  armedTool: 'line' | 'polygon' | null
  /** Value of the shape being drawn, e.g. `12,4 m`. */
  draftValue: string | undefined
  onFinish: () => void
  onCancel: () => void
}

// Mobile: icon-only squares. Desktop: labeled buttons.
const buttonClassName =
  'relative -ml-px inline-flex size-10 items-center justify-center bg-white text-sm font-semibold text-orange-900 ring-1 ring-orange-900/20 ring-inset first:rounded-l-md last:rounded-r-md hover:bg-orange-50 focus:z-10 sm:size-auto sm:min-h-10 sm:justify-start sm:gap-x-1.5 sm:px-3 sm:py-1.5'

/**
 * What the map itself shows for measuring: the hint for the first step, undo / redo, and the
 * running value with "done" / "cancel" while a shape is drawn (needed on touch screens, where there
 * is no double click or Escape). Starting a shape, help and deleting are in the panel.
 */
export function MeasureDrawingToolbar({
  draw,
  isDrawing,
  hasShapes,
  armedTool,
  draftValue,
  onFinish,
  onCancel,
}: Props) {
  return (
    <>
      <ModeMapToolbarRow>
        {isDrawing && (
          <ModeMapToolbar aria-label="Messung zeichnen">
            {draftValue && (
              <output className="relative inline-flex min-h-10 items-center bg-orange-700 px-3 text-sm font-semibold text-white tabular-nums first:rounded-l-md">
                {draftValue}
              </output>
            )}
            <button
              type="button"
              className={buttonClassName}
              title="Messung abschließen"
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
      {!isDrawing && armedTool === 'line' && (
        <ModeMapHint>
          {hasShapes
            ? 'In die Karte klicken, um eine weitere Linie zu messen.'
            : 'In die Karte klicken, um eine Länge zu messen.'}
        </ModeMapHint>
      )}
      {!isDrawing && armedTool === 'polygon' && (
        <ModeMapHint>In die Karte klicken, um eine Fläche zu messen.</ModeMapHint>
      )}
    </>
  )
}
