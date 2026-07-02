import { EyeSlashIcon } from '@heroicons/react/24/outline'
import { twJoin } from 'tailwind-merge'
import {
  type PlanningScoreMode,
  usePlanningHexagonsVisibleParam,
  usePlanningScoreParam,
} from '../hooks/useQueryState/usePlanningParams'

// Tab-like switcher for the three display modes (Issue #3415): the demand
// probability, the buildability probability, or their combination. Colors the
// hexagon layer by the corresponding tile property (see PLANNING_SCORE_PROPERTY).
// A fourth icon-only state switches the hexagon layer off entirely; the color
// mode is preserved so re-selecting a mode restores the previous display.
const MODES: [PlanningScoreMode, string][] = [
  ['bedarf', 'Bedarf'],
  ['bebauung', 'Bebauung'],
  ['kombination', 'Kombination'],
]

export const ScoreModeSwitcher = () => {
  const [mode, setMode] = usePlanningScoreParam()
  const [visible, setVisible] = usePlanningHexagonsVisibleParam()
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500">Anzeige</span>
      <div className="flex gap-1.5">
        {MODES.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setMode(value)
              if (!visible) setVisible(true)
            }}
            className={twJoin(
              'flex-1 rounded border px-2 py-1.5 text-xs font-medium transition-colors',
              visible && mode === value
                ? 'border-green-700 bg-green-700 text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
            )}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setVisible(false)}
          title="Hexagone ausblenden"
          aria-label="Hexagone ausblenden"
          aria-pressed={!visible}
          className={twJoin(
            'rounded border px-2 py-1.5 transition-colors',
            !visible
              ? 'border-green-700 bg-green-700 text-white'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
          )}
        >
          <EyeSlashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
