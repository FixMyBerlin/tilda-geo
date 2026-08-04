import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { deletePlanningScenarioFn } from '@/server/planning/planning.functions'
import {
  planningScenariosQueryOptions,
  planningScenarioQueryOptions,
} from '@/server/planning/planningQueryOptions'
import {
  usePlanningRunParam,
  usePlanningScenarioParam,
} from '../hooks/useQueryState/usePlanningParams'
import { CollapsibleBox } from './CollapsibleBox'
import { PlanningWizard } from './PlanningWizard'
import { Spinner } from './Spinner'

type Scenario = {
  id: number
  title: string
  currentRunId: number | null
  jobs: { status: string }[]
}

/** Status icon: spinner while running, green checkmark when done. */
const StatusIcon = ({ scenario }: { scenario: Scenario }) => {
  const jobStatus = scenario.jobs[0]?.status
  if (jobStatus === 'QUEUED' || jobStatus === 'RUNNING') return <Spinner />
  if (scenario.currentRunId != null)
    return (
      <span className="font-bold text-green-600" title="Berechnung abgeschlossen">
        ✓
      </span>
    )
  return null
}

/** Inline confirm-delete button. */
const DeleteButton = ({ onConfirm }: { onConfirm: () => void }) => {
  const [confirm, setConfirm] = useState(false)
  if (confirm) {
    return (
      <span className="flex items-center gap-1">
        <button
          type="button"
          onClick={onConfirm}
          className="rounded bg-red-600 px-1.5 py-0.5 text-xs text-white hover:bg-red-700"
        >
          Löschen
        </button>
        <button
          type="button"
          onClick={() => setConfirm(false)}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Abbrechen
        </button>
      </span>
    )
  }
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        setConfirm(true)
      }}
      className="rounded px-1 py-0.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
      title="Szenario löschen"
    >
      🗑
    </button>
  )
}

/** Flat list of the region's scenarios with status icons and delete. */
export const ScenarioList = ({ regionSlug }: { regionSlug: string }) => {
  const queryClient = useQueryClient()
  const [activeScenario, setActiveScenario] = usePlanningScenarioParam()
  const [, setRun] = usePlanningRunParam()
  const [showCreate, setShowCreate] = useState(false)
  const { data: scenarios } = useQuery({
    ...planningScenariosQueryOptions(regionSlug),
    refetchInterval: (query) => {
      const hasInFlight = query.state.data?.some(
        (s) => s.jobs[0]?.status === 'QUEUED' || s.jobs[0]?.status === 'RUNNING',
      )
      return hasInFlight ? 2000 : false
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (scenarioId: number) => deletePlanningScenarioFn({ data: { scenarioId } }),
    onSuccess: (_, scenarioId) => {
      queryClient.invalidateQueries(planningScenariosQueryOptions(regionSlug))
      queryClient.removeQueries(planningScenarioQueryOptions(scenarioId))
      if (activeScenario === scenarioId) setActiveScenario(null)
    },
  })

  const hasScenarios = (scenarios ?? []).length > 0

  return (
    <div className="flex flex-col gap-2">
      {hasScenarios ? (
        <CollapsibleBox title="Szenarien">
          <ul className="flex flex-col gap-0.5">
            {scenarios!.map((scenario) => (
              <li key={scenario.id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false)
                    setActiveScenario(scenario.id)
                  }}
                  className={`flex min-w-0 flex-1 items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-gray-100 ${
                    activeScenario === scenario.id ? 'bg-blue-50 font-medium' : ''
                  }`}
                >
                  <span className="w-4 shrink-0 text-center">
                    <StatusIcon scenario={scenario} />
                  </span>
                  <span className="shrink-0 text-xs text-gray-400">#{scenario.id}</span>
                  <span className="truncate">{scenario.title}</span>
                </button>
                <DeleteButton onConfirm={() => deleteMutation.mutate(scenario.id)} />
              </li>
            ))}
          </ul>
        </CollapsibleBox>
      ) : (
        !showCreate && <p className="px-1 text-sm text-gray-500">Noch keine Szenarien.</p>
      )}

      {!showCreate ? (
        <button
          type="button"
          onClick={() => {
            setActiveScenario(null)
            setRun(null)
            setShowCreate(true)
          }}
          className="rounded border border-gray-300 px-2 py-1 text-sm hover:bg-gray-100"
        >
          + Szenario hinzufügen
        </button>
      ) : (
        <PlanningWizard
          regionSlug={regionSlug}
          onCreated={(id) => {
            setShowCreate(false)
            setActiveScenario(id)
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}
