import { twJoin } from 'tailwind-merge'
import { ModeMapToolbar } from '../../ModeMapHint'
import type { ReviewComposeType } from './review-draw-store'

type Props = {
  type: ReviewComposeType
  isDrawing: boolean
  onTypeChange: (type: ReviewComposeType) => void
  onFinish: () => void
  onCancel: () => void
}

const OPTIONS: { type: ReviewComposeType; label: string }[] = [
  { type: 'point', label: 'Punkt' },
  { type: 'line', label: 'Linie' },
  { type: 'polygon', label: 'Fläche' },
]

export const reviewToolbarButtonClassName = ({
  active = false,
  disabled = false,
}: { active?: boolean; disabled?: boolean } = {}) =>
  twJoin(
    '-ml-px inline-flex min-h-10 items-center gap-1.5 px-3 py-1.5 text-sm font-semibold ring-1 ring-inset first:rounded-l-md last:rounded-r-md focus:z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500',
    active
      ? 'bg-yellow-400 text-gray-900 ring-yellow-400'
      : disabled
        ? 'cursor-not-allowed bg-white text-gray-400 ring-gray-300'
        : 'bg-white text-gray-700 ring-gray-300 hover:bg-yellow-50',
  )

/** Compose-only toolbar: pick a geometry type for a new review entry. Hidden in entry detail. */
export const ReviewDrawingToolbar = ({
  type,
  isDrawing,
  onTypeChange,
  onFinish,
  onCancel,
}: Props) => (
  <ModeMapToolbar aria-label="Neuen Eintrag zeichnen">
    {OPTIONS.map((option) => (
      <button
        key={option.type}
        type="button"
        aria-pressed={type === option.type}
        onClick={() => onTypeChange(option.type)}
        className={reviewToolbarButtonClassName({ active: type === option.type })}
      >
        {option.label}
      </button>
    ))}
    {/* Lines and areas also finish with a double click; the buttons help on touch screens. */}
    {isDrawing && (
      <>
        <button type="button" onClick={onFinish} className={reviewToolbarButtonClassName()}>
          Fertig
        </button>
        <button type="button" onClick={onCancel} className={reviewToolbarButtonClassName()}>
          Abbrechen
        </button>
      </>
    )}
  </ModeMapToolbar>
)
