import { twJoin } from 'tailwind-merge'
import {
  type PlanningScoreMode,
  usePlanningScoreParam,
} from '../hooks/useQueryState/usePlanningParams'

// Tab-like switcher for the three display modes (Issue #3415): the demand
// probability, the buildability probability, or their combination. Colors the
// hexagon layer by the corresponding tile property (see PLANNING_SCORE_PROPERTY).
const MODES: [PlanningScoreMode, string][] = [
  ['bedarf', 'Bedarf'],
  ['bebauung', 'Bebauung'],
  ['kombination', 'Kombination'],
]

export const ScoreModeSwitcher = () => {
  const [mode, setMode] = usePlanningScoreParam()
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500">Anzeige</span>
      <div className="flex gap-1.5">
        {MODES.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={twJoin(
              'flex-1 rounded border px-2 py-1.5 text-xs font-medium transition-colors',
              mode === value
                ? 'border-green-700 bg-green-700 text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
