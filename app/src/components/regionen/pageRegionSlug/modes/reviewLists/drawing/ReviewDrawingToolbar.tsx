import { twJoin } from 'tailwind-merge'
import type { ReviewDrawMode } from './reviewTerraDrawConfig'

type Props = {
  mode: ReviewDrawMode
  onModeChange: (mode: ReviewDrawMode) => void
}

const OPTIONS: { mode: ReviewDrawMode; label: string }[] = [
  { mode: 'point', label: 'Punkt' },
  { mode: 'linestring', label: 'Linie' },
  { mode: 'polygon', label: 'Fläche' },
]

/** Compose-only toolbar: pick a geometry type for a new review entry. Hidden in entry detail. */
export const ReviewDrawingToolbar = ({ mode, onModeChange }: Props) => (
  <div className="pointer-events-auto absolute top-[10px] left-1/2 isolate z-1000 inline-flex -translate-x-1/2 rounded-md shadow-xs">
    {OPTIONS.map((option, index) => (
      <button
        key={option.mode}
        type="button"
        aria-pressed={mode === option.mode}
        onClick={() => onModeChange(option.mode)}
        className={twJoin(
          '-ml-px inline-flex min-h-10 items-center px-3 py-1.5 text-sm font-semibold ring-1 ring-inset focus:z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500',
          index === 0 && 'rounded-l-md',
          index === OPTIONS.length - 1 && 'rounded-r-md',
          mode === option.mode
            ? 'bg-yellow-400 text-gray-900 ring-yellow-400'
            : 'bg-white text-gray-700 ring-gray-300 hover:bg-yellow-50',
        )}
      >
        {option.label}
      </button>
    ))}
  </div>
)
