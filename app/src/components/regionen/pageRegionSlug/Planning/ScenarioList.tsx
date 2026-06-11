import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  createPlanningScenarioFn,
  deletePlanningScenarioFn,
} from '@/server/planning/planning.functions'
import {
  planningScenariosQueryOptions,
  planningScenarioQueryOptions,
} from '@/server/planning/planningQueryOptions'
import { usePlanningScenarioParam } from '../hooks/useQueryState/usePlanningParams'
import { BoundaryPicker } from './BoundaryPicker'
import { FAHRRADBOX_TEMPLATE } from './planningDefaults'

/** Spinner shown while a job is in flight. */
const Spinner = () => (
  <span
    className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
    aria-label="Berechnung läuft"
  />
)

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

/** Create-form shown when "Neues Szenario" is clicked. */
const CreateForm = ({
  regionSlug,
  onCreated,
  onCancel,
}: {
  regionSlug: string
  onCreated: (id: number) => void
  onCancel: () => void
}) => {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [boundaryId, setBoundaryId] = useState<string | null>(null)
  const [studyArea, setStudyArea] = useState<unknown>(null)

  const mutation = useMutation({
    mutationFn: () => {
      if (!studyArea) throw new Error('Bitte ein Gebiet auswählen')
      return createPlanningScenarioFn({
        data: {
          regionSlug,
          title,
          factorConfig: { ...FAHRRADBOX_TEMPLATE, study_area: studyArea },
        },
      })
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries(planningScenariosQueryOptions(regionSlug))
      onCreated(created.id)
    },
  })

  return (
    <div className="flex flex-col gap-2 rounded border border-gray-200 bg-gray-50 p-2">
      <label className="flex flex-col gap-0.5 text-xs text-gray-600">
        Titel
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded border border-gray-300 px-2 py-1 text-sm"
        />
      </label>
      <label className="flex flex-col gap-0.5 text-xs text-gray-600">
        Berechnungsgebiet
        <BoundaryPicker
          value={boundaryId}
          onChange={(id, geom, name) => {
            setBoundaryId(id)
            setStudyArea(geom)
            setTitle(name)
          }}
          regionSlug={regionSlug}
        />
      </label>
      {mutation.isError && (
        <p className="text-xs text-red-600">{String((mutation.error as Error).message)}</p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !studyArea}
          className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {mutation.isPending ? 'Erstellen…' : 'Szenario erstellen'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Abbrechen
        </button>
      </div>
    </div>
  )
}

/** Flat list of the region's scenarios with status icons and delete. */
export const ScenarioList = ({ regionSlug }: { regionSlug: string }) => {
  const queryClient = useQueryClient()
  const [activeScenario, setActiveScenario] = usePlanningScenarioParam()
  const [showCreate, setShowCreate] = useState(false)
  const { data: scenarios } = useQuery(planningScenariosQueryOptions(regionSlug))

  const deleteMutation = useMutation({
    mutationFn: (scenarioId: number) => deletePlanningScenarioFn({ data: { scenarioId } }),
    onSuccess: (_, scenarioId) => {
      queryClient.invalidateQueries(planningScenariosQueryOptions(regionSlug))
      queryClient.removeQueries(planningScenarioQueryOptions(scenarioId))
      if (activeScenario === scenarioId) setActiveScenario(null)
    },
  })

  return (
    <div className="flex flex-col gap-2">
      {!showCreate ? (
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="rounded border border-gray-300 px-2 py-1 text-sm hover:bg-gray-100"
        >
          + Neues Szenario
        </button>
      ) : (
        <CreateForm
          regionSlug={regionSlug}
          onCreated={(id) => {
            setShowCreate(false)
            setActiveScenario(id)
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      <ul className="flex flex-col gap-0.5">
        {(scenarios ?? []).map((scenario) => (
          <li key={scenario.id} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveScenario(scenario.id)}
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
        {(scenarios ?? []).length === 0 && !showCreate && (
          <li className="px-2 py-1 text-sm text-gray-500">Noch keine Szenarien.</li>
        )}
      </ul>
    </div>
  )
}
