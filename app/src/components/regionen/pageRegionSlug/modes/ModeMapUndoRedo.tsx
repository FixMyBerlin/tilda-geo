import { ArrowUturnLeftIcon, ArrowUturnRightIcon } from '@heroicons/react/24/outline'
import type { DrawInstance } from '@osm-editor-kit/react-map-gl-draw'
import { twJoin } from 'tailwind-merge'
import { ModeMapToolbar } from './ModeMapHint'

type Props = { draw: Pick<DrawInstance, 'canUndo' | 'canRedo' | 'undo' | 'redo'> }

const buttonClassName = (disabled: boolean) =>
  twJoin(
    '-ml-px inline-flex size-10 items-center justify-center bg-white ring-1 ring-gray-300 ring-inset first:rounded-l-md last:rounded-r-md focus:z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500',
    disabled ? 'cursor-not-allowed text-gray-300' : 'text-gray-700 hover:bg-gray-50',
  )

/**
 * Undo and redo for the drawing surface of a mode, as its own group in the `ModeMapToolbarRow`.
 * The steps belong to that surface (`createDrawHistory`), so every mode undoes on its own. The
 * keys (Cmd/Ctrl+Z, Shift+Cmd/Ctrl+Z) come from the surface's `<DrawLayers>`.
 */
export const ModeMapUndoRedo = ({ draw }: Props) => (
  <ModeMapToolbar aria-label="Änderungen an der Geometrie">
    <button
      type="button"
      title="Rückgängig (Strg/⌘ + Z)"
      aria-label="Rückgängig"
      disabled={!draw.canUndo}
      onClick={draw.undo}
      className={buttonClassName(!draw.canUndo)}
    >
      <ArrowUturnLeftIcon className="size-5" aria-hidden />
    </button>
    <button
      type="button"
      title="Wiederherstellen (Strg/⌘ + Umschalt + Z)"
      aria-label="Wiederherstellen"
      disabled={!draw.canRedo}
      onClick={draw.redo}
      className={buttonClassName(!draw.canRedo)}
    >
      <ArrowUturnRightIcon className="size-5" aria-hidden />
    </button>
  </ModeMapToolbar>
)
