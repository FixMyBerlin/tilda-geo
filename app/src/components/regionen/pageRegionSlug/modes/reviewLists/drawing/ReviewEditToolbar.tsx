import { PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { twJoin } from 'tailwind-merge'
import type { ReviewGeometryFamily } from './reviewGeometryParts'
import { REVIEW_DRAW_MODE, type ReviewDrawMode } from './reviewTerraDrawConfig'

type Props = {
  mode: ReviewDrawMode
  family: ReviewGeometryFamily | null
  onModeChange: (mode: ReviewDrawMode) => void
  onDeletePart: () => void
  canDeletePart: boolean
}

const DELETE_DISABLED_TITLE =
  'Der Eintrag braucht mindestens eine Geometrie – nutzen Sie den Löschen-Button oben, um den ganzen Eintrag zu löschen.'

const segmentClassName = (active: boolean, disabled: boolean) =>
  twJoin(
    '-ml-px inline-flex min-h-10 items-center gap-1.5 px-3 py-1.5 text-sm font-semibold ring-1 ring-inset focus:z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500',
    active
      ? 'bg-yellow-400 text-gray-900 ring-yellow-400'
      : disabled
        ? 'cursor-not-allowed bg-white text-gray-400 ring-gray-300'
        : 'bg-white text-gray-700 ring-gray-300 hover:bg-yellow-50',
  )

/** Edit-session toolbar: select, add a part of the same family, or delete the selected part. */
export const ReviewEditToolbar = ({
  mode,
  family,
  onModeChange,
  onDeletePart,
  canDeletePart,
}: Props) => {
  const addMode = family ? REVIEW_DRAW_MODE[family] : null
  const canAddPart = addMode !== null

  return (
    <div className="pointer-events-auto absolute top-[10px] left-1/2 isolate z-1000 inline-flex -translate-x-1/2 rounded-md shadow-xs">
      <button
        type="button"
        aria-pressed={mode === REVIEW_DRAW_MODE.select}
        onClick={() => onModeChange(REVIEW_DRAW_MODE.select)}
        className={twJoin(
          segmentClassName(mode === REVIEW_DRAW_MODE.select, false),
          'rounded-l-md',
        )}
      >
        <PencilIcon className="size-4" aria-hidden />
        Ändern
      </button>
      <button
        type="button"
        aria-pressed={addMode !== null && mode === addMode}
        disabled={!canAddPart}
        onClick={() => {
          if (!addMode) return
          onModeChange(addMode)
        }}
        className={segmentClassName(addMode !== null && mode === addMode, !canAddPart)}
      >
        <PlusIcon className="size-4" aria-hidden />
        Teil hinzufügen
      </button>
      <button
        type="button"
        disabled={!canDeletePart}
        title={canDeletePart ? undefined : DELETE_DISABLED_TITLE}
        onClick={onDeletePart}
        className={twJoin(segmentClassName(false, !canDeletePart), 'rounded-r-md')}
      >
        <TrashIcon className="size-4" aria-hidden />
        Teil löschen
      </button>
    </div>
  )
}
