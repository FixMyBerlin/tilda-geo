import { Switch } from '@headlessui/react'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { bbox } from '@turf/turf'
import { useEffect, useState } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { twJoin } from 'tailwind-merge'
import type { FactorConfig } from '@/server/planning/planning.functions'
import {
  planningAreaQueryOptions,
  planningVariantQueryOptions,
} from '@/server/planning/planningQueryOptions'
import { usePlanningBoundaryState } from '../hooks/mapState/usePlanningBoundaryState'
import {
  usePlanningAreaFilterParam,
  usePlanningAreaParam,
  usePlanningMinAreaParam,
  usePlanningModeParam,
  usePlanningRunParam,
  usePlanningVariantParam,
} from '../hooks/useQueryState/usePlanningParams'
import { AreaContextBar } from './AreaContextBar'
import { FactorEditorPanel } from './FactorEditorPanel'
import { PLANNING_PANEL_WIDTH, planningNumberInputClass } from './planningPanelStyles'
import { RunButton } from './RunButton'
import { ScoreModeSwitcher } from './ScoreModeSwitcher'
import { VariantList } from './VariantList'
import { VariantTitleField } from './VariantTitleField'

const routeApi = getRouteApi('/regionen/$regionSlug')

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

const CarriagewaysToggle = () => {
  const carriagewaysOn = usePlanningBoundaryState((s) => s.carriagewaysVisible)
  const setCarriagewaysOn = usePlanningBoundaryState((s) => s.setCarriagewaysVisible)
  return (
    <label className="flex items-center justify-between gap-2 rounded border border-gray-200 px-2.5 py-2 text-sm">
      <span className="font-medium text-gray-800">Fahrbahnen</span>
      <Switch
        checked={carriagewaysOn}
        onChange={setCarriagewaysOn}
        className={twJoin(
          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors',
          carriagewaysOn ? 'bg-amber-700' : 'bg-gray-300',
        )}
      >
        <span
          className={twJoin(
            'inline-block size-4 translate-y-0.5 rounded-full bg-white transition-transform',
            carriagewaysOn ? 'translate-x-[1.125rem]' : 'translate-x-0.5',
          )}
        />
      </Switch>
    </label>
  )
}

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
        onChange={(e) =>
          setMinArea(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))
        }
        className={planningNumberInputClass}
      />
    </div>
  )
}

const VariantDetail = ({ variantId, regionSlug }: { variantId: number; regionSlug: string }) => {
  const [, setRun] = usePlanningRunParam()
  const setVegetationAttribution = usePlanningBoundaryState((s) => s.setVegetationAttribution)
  const setUserObstaclesGeom = usePlanningBoundaryState((s) => s.setUserObstaclesGeom)
  const { data: variant } = useQuery(planningVariantQueryOptions(variantId))

  useEffect(() => {
    if (variant?.currentRunId != null) setRun(variant.currentRunId)
    else setRun(null)
  }, [variant?.currentRunId, setRun])

  useEffect(() => {
    if (!variant) return
    setVegetationAttribution(variant.runs[0]?.cirAttribution ?? null)
    return () => setVegetationAttribution(null)
  }, [variant, setVegetationAttribution])

  const userGeojson = (variant?.factorConfig as FactorConfig | undefined)?.user_geojson
  useEffect(() => {
    setUserObstaclesGeom((userGeojson as object | undefined) ?? null)
    return () => setUserObstaclesGeom(null)
  }, [userGeojson, setUserObstaclesGeom])

  if (!variant) return null

  const latestJob = variant.jobs[0] ?? null
  const latestRun = variant.runs[0] ?? null
  const isLocked = latestJob?.status === 'QUEUED' || latestJob?.status === 'RUNNING'
  const hasCompleteRun = latestRun?.status === 'COMPLETE'
  const factorsDefaultOpen = !hasCompleteRun

  return (
    <div className="flex flex-col gap-3 border-t border-gray-200 pt-3">
      {latestRun?.stale && (
        <p className="rounded bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
          Gebiet geändert — Ergebnis veraltet. Bitte neu berechnen.
        </p>
      )}

      <VariantTitleField
        variantId={variantId}
        title={variant.title}
        regionSlug={regionSlug}
        readOnly={isLocked}
      />

      <RunButton variantId={variantId} regionSlug={regionSlug} latestJob={latestJob} />

      <FactorEditorPanel
        variantId={variantId}
        factorConfig={variant.factorConfig as FactorConfig}
        readOnly={isLocked}
        defaultOpen={factorsDefaultOpen}
      />

      {latestRun && (
        <div className="text-xs text-gray-600">
          Letzter Lauf:{' '}
          {latestRun.status === 'COMPLETE'
            ? `${latestRun.hexCount ?? 0} Hexagone`
            : latestRun.status}
        </div>
      )}

      {hasCompleteRun && <ScoreModeSwitcher />}
      {hasCompleteRun && <MinAreaFilter />}
      {hasCompleteRun && (latestRun?.vegCount ?? 0) > 0 && <VegetationToggle />}
      {hasCompleteRun &&
        (variant.factorConfig as FactorConfig | undefined)?.exclude_carriageways && (
          <CarriagewaysToggle />
        )}
    </div>
  )
}

/** Planning-mode entry button + interactive panel. */
export const PlanningPanel = () => {
  const [planningMode] = usePlanningModeParam()
  const [activeArea, setActiveArea] = usePlanningAreaParam()
  const [activeVariant] = usePlanningVariantParam()
  const panelCollapsed = usePlanningBoundaryState((s) => s.panelCollapsed)
  const setPanelCollapsed = usePlanningBoundaryState((s) => s.setPanelCollapsed)
  const { regionSlug } = routeApi.useParams()
  const [creatingArea, setCreatingArea] = useState(false)
  const { mainMap: map } = useMap()
  const setBoundaryHighlightGeom = usePlanningBoundaryState((s) => s.setBoundaryHighlightGeom)
  const setLastFittedBoundaryKey = usePlanningBoundaryState((s) => s.setLastFittedBoundaryKey)

  const { data: variant } = useQuery({
    ...planningVariantQueryOptions(activeVariant!),
    enabled: activeVariant != null,
  })

  const { data: area } = useQuery({
    ...planningAreaQueryOptions(activeArea!),
    enabled: activeArea != null,
  })

  // Resolve area from variant when only legacy planningScenario URL is set.
  useEffect(() => {
    if (variant?.area?.id != null && activeArea == null) setActiveArea(variant.area.id)
  }, [variant?.area?.id, activeArea, setActiveArea])

  const studyArea =
    (area?.studyArea as GeoJSON.Geometry | undefined) ??
    ((variant?.factorConfig as FactorConfig | undefined)?.study_area as
      | GeoJSON.Geometry
      | undefined)

  // Outline lives on the panel (not VariantDetail) so it stays on the map when the
  // panel is collapsed or while switching variants of the same planungsgebiet.
  useEffect(() => {
    if (!planningMode) {
      setBoundaryHighlightGeom(null)
      return
    }
    if (creatingArea || !studyArea) return
    setBoundaryHighlightGeom(studyArea, { filled: false })
    if (map) {
      const [minLng, minLat, maxLng, maxLat] = bbox({
        type: 'Feature',
        geometry: studyArea,
        properties: {},
      })
      const boundaryKey = [minLng, minLat, maxLng, maxLat].map((v) => v.toFixed(6)).join(',')
      if (usePlanningBoundaryState.getState().lastFittedBoundaryKey !== boundaryKey) {
        setLastFittedBoundaryKey(boundaryKey)
        map.fitBounds([minLng, minLat, maxLng, maxLat], { padding: 60, duration: 800 })
      }
    }
  }, [
    planningMode,
    creatingArea,
    studyArea,
    map,
    setBoundaryHighlightGeom,
    setLastFittedBoundaryKey,
  ])

  if (!planningMode) return null

  const areaTitle = area?.title ?? variant?.area?.title
  const variantTitle = variant?.title
  const expandPanel = () => {
    if (panelCollapsed) setPanelCollapsed(false)
  }

  return (
    <div
      className={twJoin(
        'pointer-events-auto absolute top-2.5 left-[17rem] z-30 flex max-h-[calc(100vh-8rem)] flex-col gap-3 overflow-auto rounded bg-white p-3 shadow-lg',
        PLANNING_PANEL_WIDTH,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={expandPanel}
          disabled={!panelCollapsed}
          className={twJoin(
            'min-w-0 flex-1 text-left',
            panelCollapsed && 'cursor-pointer rounded hover:bg-gray-50',
          )}
        >
          <h2 className="font-bold">Flächenfinder</h2>
          {panelCollapsed && (areaTitle || variantTitle) && (
            <p className="truncate text-sm text-gray-600">
              {areaTitle}
              {variantTitle ? ` · ${variantTitle}` : ''}
            </p>
          )}
        </button>
        <button
          type="button"
          onClick={() => setPanelCollapsed(!panelCollapsed)}
          aria-label={panelCollapsed ? 'Flächenfinder ausklappen' : 'Flächenfinder einklappen'}
          className="shrink-0 text-gray-500 hover:text-gray-800"
        >
          <ChevronRightIcon
            className={twJoin('size-4 transition-transform', panelCollapsed ? '' : 'rotate-90')}
          />
        </button>
      </div>
      {!panelCollapsed && (
        <>
          <AreaContextBar regionSlug={regionSlug} onCreatingChange={setCreatingArea} />
          {!creatingArea && (
            <>
              <VariantList regionSlug={regionSlug} />
              {activeVariant != null && (
                <VariantDetail variantId={activeVariant} regionSlug={regionSlug} />
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
