import { twJoin } from 'tailwind-merge'
import {
  usePlanningModeParam,
  useSetPlanningSelection,
} from '../hooks/useQueryState/usePlanningParams'

const TABS: [flaechenfinder: boolean, label: string][] = [
  [false, 'Betrachten'],
  [true, 'Flächenfinder'],
]

/** Topbar mode selector. "Betrachten" = standard viewer; "Flächenfinder" = planning mode. */
export const PlanningModeToggle = () => {
  const [planningMode, setPlanningMode] = usePlanningModeParam()
  const setPlanningSelection = useSetPlanningSelection()

  const handleSelect = (next: boolean) => {
    if (next) {
      setPlanningMode(true)
      return
    }
    setPlanningSelection({ area: null, variant: null, run: null, planning: false })
  }

  return (
    <div
      role="tablist"
      aria-label="Kartenmodus"
      className="flex gap-0.5 rounded-md bg-gray-700 p-1"
    >
      {TABS.map(([value, label]) => {
        const selected = Boolean(planningMode) === value
        return (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => handleSelect(value)}
            className={twJoin(
              'cursor-pointer rounded px-3 py-1.5 text-sm font-medium transition-colors focus:ring-2 focus:ring-yellow-400 focus:outline-none',
              selected ? 'bg-gray-100 text-gray-900' : 'text-gray-100 hover:bg-gray-600',
            )}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
