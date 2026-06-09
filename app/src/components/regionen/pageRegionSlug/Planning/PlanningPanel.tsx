import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useEffect } from 'react'
import {
  createChildPlanningScenarioFn,
  type FactorConfig,
} from '@/server/planning/planning.functions'
import {
  planningScenarioQueryOptions,
  planningScenariosQueryOptions,
} from '@/server/planning/planningQueryOptions'
import {
  usePlanningModeParam,
  usePlanningRunParam,
  usePlanningScenarioParam,
} from '../hooks/useQueryState/usePlanningParams'
import { FactorEditorPanel } from './FactorEditorPanel'
import { RunButton } from './RunButton'
import { ScenarioList } from './ScenarioList'

const routeApi = getRouteApi('/regionen/$regionSlug')

const ScenarioDetail = ({ scenarioId }: { scenarioId: number }) => {
  const queryClient = useQueryClient()
  const [, setRun] = usePlanningRunParam()
  const [, setActiveScenario] = usePlanningScenarioParam()
  const { regionSlug } = routeApi.useParams()
  const { data: scenario } = useQuery(planningScenarioQueryOptions(scenarioId))

  // Show the scenario's latest result on the map when it is opened.
  useEffect(() => {
    if (scenario?.currentRunId != null) setRun(scenario.currentRunId)
  }, [scenario?.currentRunId, setRun])

  const childMutation = useMutation({
    mutationFn: () =>
      createChildPlanningScenarioFn({
        data: { parentId: scenarioId, title: `${scenario?.title ?? 'Szenario'} (Variante)` },
      }),
    onSuccess: (created) => {
      queryClient.invalidateQueries(planningScenariosQueryOptions(regionSlug))
      setActiveScenario(created.id)
    },
  })

  if (!scenario) return null

  return (
    <div className="flex flex-col gap-3 border-t border-gray-200 pt-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{scenario.title}</h3>
        <button
          type="button"
          onClick={() => childMutation.mutate()}
          disabled={childMutation.isPending}
          className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100 disabled:opacity-50"
          title="Neues Szenario auf Basis dieses Datenstands"
        >
          Darauf aufbauen
        </button>
      </div>

      <RunButton scenarioId={scenarioId} />

      <FactorEditorPanel
        scenarioId={scenarioId}
        factorConfig={scenario.factorConfig as FactorConfig}
      />

      {scenario.runs[0] && (
        <div className="text-xs text-gray-600">
          Letzter Lauf:{' '}
          {scenario.runs[0].status === 'COMPLETE'
            ? `${scenario.runs[0].areaCount ?? 0} Potentialflächen, ${scenario.runs[0].hexCount ?? 0} Hexagone`
            : scenario.runs[0].status}
        </div>
      )}
    </div>
  )
}

/** Planning-mode entry button + interactive panel. Renders nothing intrusive in the viewer. */
export const PlanningPanel = () => {
  const [planningMode, setPlanningMode] = usePlanningModeParam()
  const [activeScenario, setActiveScenario] = usePlanningScenarioParam()
  const [, setRun] = usePlanningRunParam()
  const { regionSlug } = routeApi.useParams()

  // Entry/exit is driven by the topbar toggle (PlanningModeToggle); the panel only
  // renders the interactive UI while the mode is active.
  if (!planningMode) return null

  const close = () => {
    setPlanningMode(false)
    setActiveScenario(null)
    setRun(null)
  }

  return (
    <div className="pointer-events-auto absolute top-2.5 left-[17rem] z-30 flex max-h-[calc(100vh-8rem)] w-80 flex-col gap-3 overflow-auto rounded bg-white p-3 shadow-lg">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">Planungsmodus</h2>
        <button type="button" onClick={close} className="text-gray-500 hover:text-gray-800">
          ✕
        </button>
      </div>
      <ScenarioList regionSlug={regionSlug} />
      {activeScenario != null && <ScenarioDetail scenarioId={activeScenario} />}
    </div>
  )
}
