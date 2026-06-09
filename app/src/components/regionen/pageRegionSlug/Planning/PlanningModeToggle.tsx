import {
  usePlanningModeParam,
  usePlanningRunParam,
  usePlanningScenarioParam,
} from '../hooks/useQueryState/usePlanningParams'

/** Topbar mode selector. "Betrachten" = standard viewer; "Flächenfinder" = planning mode. */
export const PlanningModeToggle = () => {
  const [planningMode, setPlanningMode] = usePlanningModeParam()
  const [, setActiveScenario] = usePlanningScenarioParam()
  const [, setRun] = usePlanningRunParam()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value === 'flaechenfinder'
    setPlanningMode(next)
    if (!next) {
      setActiveScenario(null)
      setRun(null)
    }
  }

  return (
    <select
      value={planningMode ? 'flaechenfinder' : 'betrachten'}
      onChange={handleChange}
      className="cursor-pointer rounded-md bg-gray-700 px-3 py-2 text-sm font-medium text-gray-100 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
    >
      <option value="betrachten">Betrachten</option>
      <option value="flaechenfinder">Flächenfinder</option>
    </select>
  )
}
