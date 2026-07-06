import { Switch } from '@headlessui/react'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { bbox } from '@turf/turf'
import { useEffect } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { twJoin } from 'tailwind-merge'
import type { FactorConfig } from '@/server/planning/planning.functions'
import { planningScenarioQueryOptions } from '@/server/planning/planningQueryOptions'
import { usePlanningBoundaryState } from '../hooks/mapState/usePlanningBoundaryState'
import {
  usePlanningAreaFilterParam,
  usePlanningMinAreaParam,
  usePlanningModeParam,
  usePlanningRunParam,
  usePlanningScenarioParam,
} from '../hooks/useQueryState/usePlanningParams'
import { FactorEditorPanel } from './FactorEditorPanel'
import { RunButton } from './RunButton'
import { ScenarioList } from './ScenarioList'
import { ScoreModeSwitcher } from './ScoreModeSwitcher'

const routeApi = getRouteApi('/regionen/$regionSlug')

/** Quick on/off toggle for the on-demand vegetation (NDVI) result layer. */
const VegetationToggle = () => {
  const vegetationOn = usePlanningBoundaryState((s) => s.vegetationVisible)
  const setVegetationOn = usePlanningBoundaryState((s) => s.setVegetationVisible)
  return (
    <label className="flex items-center justify-between gap-2 rounded border border-gray-200 px-2.5 py-2 text-sm">
      <span className="font-medium text-gray-800">Vegetationsflächen</span>
      <Switch
        checked={vegetationOn}
        onChange={setVegetationOn}
        className={twJoin(
          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors',
          vegetationOn ? 'bg-green-700' : 'bg-gray-300',
        )}
      >
        <span
          className={twJoin(
            'inline-block size-4 translate-y-0.5 rounded-full bg-white transition-transform',
            vegetationOn ? 'translate-x-[1.125rem]' : 'translate-x-0.5',
          )}
        />
      </Switch>
    </label>
  )
}

/**
 * Zielgröße-Filter für die Flächensuche: dunkelt Hexagone ab, deren
 * zusammenhängende Fläche (`cluster_area_m2`, Connected-Component-Labeling im
 * Worker über `min_score_threshold`) die eingegebene Mindestgröße nicht
 * erreicht (siehe SourcesLayersPlanning). Reiner Client-Filter auf einer
 * bereits persistierten Tile-Spalte, kein neuer Lauf nötig. Die Checkbox
 * schaltet den Filter unabhängig vom eingegebenen Wert aus, sodass man
 * jederzeit zur ungefilterten Ansicht (alle Hexagone gleich eingefärbt)
 * zurückkommt, ohne die Fläche neu eingeben zu müssen.
 */
const MinAreaFilter = () => {
  const [filterOn, setFilterOn] = usePlanningAreaFilterParam()
  const [minArea, setMinArea] = usePlanningMinAreaParam()
  return (
    <div className="flex items-center justify-between gap-2 rounded border border-gray-200 px-2.5 py-2 text-sm">
      <label className="flex items-center gap-2 font-medium text-gray-800">
        <input
          type="checkbox"
          checked={filterOn}
          onChange={(e) => setFilterOn(e.target.checked)}
          className="rounded border-gray-300"
        />
        Gesuchte Fläche (m²)
      </label>
      <input
        type="number"
        min={0}
        step={5}
        placeholder="aus"
        disabled={!filterOn}
        value={minArea > 0 ? minArea : ''}
        onChange={(e) => setMinArea(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))}
        className="w-20 rounded border border-gray-300 px-1 py-0.5 text-right disabled:bg-gray-50 disabled:text-gray-400"
      />
    </div>
  )
}

const ScenarioDetail = ({ scenarioId, regionSlug }: { scenarioId: number; regionSlug: string }) => {
  const [, setRun] = usePlanningRunParam()
  const { mainMap: map } = useMap()
  const setBoundaryHighlightGeom = usePlanningBoundaryState((s) => s.setBoundaryHighlightGeom)
  const setVegetationAttribution = usePlanningBoundaryState((s) => s.setVegetationAttribution)
  const { data: scenario } = useQuery(planningScenarioQueryOptions(scenarioId))

  // Show the scenario's latest result on the map when it is opened.
  useEffect(() => {
    if (scenario?.currentRunId != null) setRun(scenario.currentRunId)
  }, [scenario?.currentRunId, setRun])

  // Propagate the CIR source attribution to the map store so SourcesLayersPlanning
  // can pass it to MapLibre's <Source> (shows in AttributionControl when layer is on).
  useEffect(() => {
    if (!scenario) return
    setVegetationAttribution(scenario.runs[0]?.cirAttribution ?? null)
    return () => setVegetationAttribution(null)
  }, [scenario, setVegetationAttribution])

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

  // Scenario is locked (read-only) only while a run is in flight. Once the latest
  // job is DONE/FAILED, factors become editable again so the same study area can
  // be recomputed with different factors via the run button ("Neu berechnen").
  const latestJob = scenario.jobs[0] ?? null
  const isLocked = latestJob?.status === 'QUEUED' || latestJob?.status === 'RUNNING'

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

      <RunButton scenarioId={scenarioId} regionSlug={regionSlug} latestJob={latestJob} />

      <FactorEditorPanel
        scenarioId={scenarioId}
        factorConfig={scenario.factorConfig as FactorConfig}
        readOnly={isLocked}
      />

      {scenario.runs[0] && (
        <div className="text-xs text-gray-600">
          Letzter Lauf:{' '}
          {scenario.runs[0].status === 'COMPLETE'
            ? `${scenario.runs[0].hexCount ?? 0} Hexagone`
            : scenario.runs[0].status}
        </div>
      )}

      {scenario.runs[0]?.status === 'COMPLETE' && <ScoreModeSwitcher />}

      {scenario.runs[0]?.status === 'COMPLETE' && <MinAreaFilter />}

      {scenario.runs[0]?.status === 'COMPLETE' && (scenario.runs[0].vegCount ?? 0) > 0 && (
        <VegetationToggle />
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
