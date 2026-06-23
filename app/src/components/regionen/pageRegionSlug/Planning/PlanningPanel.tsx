import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { bbox } from '@turf/turf'
import { useEffect } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import type { FactorConfig } from '@/server/planning/planning.functions'
import { planningScenarioQueryOptions } from '@/server/planning/planningQueryOptions'
import { usePlanningBoundaryState } from '../hooks/mapState/usePlanningBoundaryState'
import {
  usePlanningModeParam,
  usePlanningRunParam,
  usePlanningScenarioParam,
} from '../hooks/useQueryState/usePlanningParams'
import { FactorEditorPanel } from './FactorEditorPanel'
import { RunButton } from './RunButton'
import { ScenarioList } from './ScenarioList'

const routeApi = getRouteApi('/regionen/$regionSlug')

const ScenarioDetail = ({ scenarioId, regionSlug }: { scenarioId: number; regionSlug: string }) => {
  const [, setRun] = usePlanningRunParam()
  const { mainMap: map } = useMap()
  const setBoundaryHighlightGeom = usePlanningBoundaryState((s) => s.setBoundaryHighlightGeom)
  const { data: scenario } = useQuery(planningScenarioQueryOptions(scenarioId))

  // Show the scenario's latest result on the map when it is opened.
  useEffect(() => {
    if (scenario?.currentRunId != null) setRun(scenario.currentRunId)
  }, [scenario?.currentRunId, setRun])

  // Outline the scenario's study area (border only, no fill) and fly to it on open.
  const studyArea = (scenario?.factorConfig as FactorConfig | undefined)?.study_area
  useEffect(() => {
    if (!studyArea) return
    setBoundaryHighlightGeom(studyArea as object, { filled: false })
    if (map) {
      const [minLng, minLat, maxLng, maxLat] = bbox({
        type: 'Feature',
        geometry: studyArea as any,
        properties: {},
      })
      map.fitBounds([minLng, minLat, maxLng, maxLat], { padding: 60, duration: 800 })
    }
    return () => setBoundaryHighlightGeom(null)
  }, [studyArea, map, setBoundaryHighlightGeom])

  if (!scenario) return null

  // Scenario is locked (read-only) once any job has been created.
  const isLocked = scenario.jobs.length > 0
  const latestJob = scenario.jobs[0] ?? null

  return (
    <div className="flex flex-col gap-3 border-t border-gray-200 pt-3">
      <h3 className="font-semibold">
        <span className="mr-1 text-xs font-normal text-gray-400">#{scenario.id}</span>
        {scenario.title}
      </h3>
      <p className="text-xs text-gray-400">
        Erstellt:{' '}
        {new Date(scenario.createdAt).toLocaleString('de-DE', {
          dateStyle: 'short',
          timeStyle: 'short',
        })}
      </p>

      {!isLocked && <RunButton scenarioId={scenarioId} regionSlug={regionSlug} latestJob={null} />}
      {isLocked && (
        <RunButton scenarioId={scenarioId} regionSlug={regionSlug} latestJob={latestJob} />
      )}

      <FactorEditorPanel
        scenarioId={scenarioId}
        factorConfig={scenario.factorConfig as FactorConfig}
        readOnly={isLocked}
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
      {activeScenario != null && (
        <ScenarioDetail scenarioId={activeScenario} regionSlug={regionSlug} />
      )}
    </div>
  )
}
