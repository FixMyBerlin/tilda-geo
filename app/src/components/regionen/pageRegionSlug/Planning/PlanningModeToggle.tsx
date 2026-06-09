import { twJoin } from 'tailwind-merge'
import {
  usePlanningModeParam,
  usePlanningRunParam,
  usePlanningScenarioParam,
} from '../hooks/useQueryState/usePlanningParams'

/** Topbar toggle that enters/leaves the interactive planning mode (`?planning=1`). */
export const PlanningModeToggle = () => {
  const [planningMode, setPlanningMode] = usePlanningModeParam()
  const [, setActiveScenario] = usePlanningScenarioParam()
  const [, setRun] = usePlanningRunParam()

  const toggle = () => {
    const next = !planningMode
    setPlanningMode(next)
    if (!next) {
      setActiveScenario(null)
      setRun(null)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={planningMode}
      className={twJoin(
        planningMode
          ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300'
          : 'bg-gray-700 text-gray-100 hover:bg-gray-600 hover:text-white',
        'flex shrink-0 items-center rounded-md px-3 py-2 text-sm leading-none font-medium',
      )}
    >
      🗺️ Planung
    </button>
  )
}
