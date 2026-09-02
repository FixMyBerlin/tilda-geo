import { Switch } from '@headlessui/react'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { bbox } from '@turf/turf'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { twJoin } from 'tailwind-merge'
import type { FactorConfig } from '@/server/planning/planning.functions'
import { updatePlanningVariantFn } from '@/server/planning/planning.functions'
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
import { factorsDiffer } from './factorFingerprint'
import { InfoTooltip } from './InfoTooltip'
import { PLANNING_PANEL_WIDTH, planningNumberInputClass } from './planningPanelStyles'
import { RunButton } from './RunButton'
import { ScoreModeSwitcher } from './ScoreModeSwitcher'
import { useDraggableMapPanel } from './useDraggableMapPanel'
import { VariantList } from './VariantList'

const routeApi = getRouteApi('/regionen/$regionSlug')

const DragGripIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden="true">
    {[3, 8, 13].flatMap((cy) =>
      [3, 8, 13].map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={1.35} />),
    )}
  </svg>
)

/**
 * Ein/Aus-Schalter für einen der Kontroll-Layer der Karte (Vegetation, Fahrbahnen,
 * Eigene Daten). Die Schalterfarbe entspricht der Layer-Farbe in der Karte,
 * siehe SourcesLayersPlanning.
 */
const LayerToggle = ({
  label,
  checked,
  onChange,
  onColorClass,
  info,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  onColorClass: string
  info?: ReactNode
}) => (
  <label className="flex items-center justify-between gap-2 rounded border border-gray-200 px-2.5 py-2 text-sm">
    <span className="flex items-center gap-1 font-medium text-gray-800">
      {label}
      {info && <InfoTooltip>{info}</InfoTooltip>}
    </span>
    <Switch
      checked={checked}
      onChange={onChange}
      className={twJoin(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors',
        checked ? onColorClass : 'bg-gray-300',
      )}
    >
      <span
        className={twJoin(
          'inline-block size-4 translate-y-0.5 rounded-full bg-white transition-transform',
          checked ? 'translate-x-[1.125rem]' : 'translate-x-0.5',
        )}
      />
    </Switch>
  </label>
)

const VegetationToggle = () => {
  const vegetationOn = usePlanningBoundaryState((s) => s.vegetationVisible)
  const setVegetationOn = usePlanningBoundaryState((s) => s.setVegetationVisible)
  return (
    <LayerToggle
      label="Vegetationsflächen"
      checked={vegetationOn}
      onChange={setVegetationOn}
      onColorClass="bg-green-700"
    />
  )
}

const CarriagewaysToggle = () => {
  const carriagewaysOn = usePlanningBoundaryState((s) => s.carriagewaysVisible)
  const setCarriagewaysOn = usePlanningBoundaryState((s) => s.setCarriagewaysVisible)
  return (
    <LayerToggle
      label="Fahrbahnen"
      checked={carriagewaysOn}
      onChange={setCarriagewaysOn}
      onColorClass="bg-amber-700"
      info="Die Fahrbahnbreiten sind Schätzungen auf Basis der in OpenStreetMap erfassten Straßen und können von der tatsächlichen Breite abweichen. Sofern die tatsächliche Breite in den Daten enthalten ist, wird diese verwendet."
    />
  )
}

const CensusToggle = () => {
  const censusOn = usePlanningBoundaryState((s) => s.censusVisible)
  const setCensusOn = usePlanningBoundaryState((s) => s.setCensusVisible)
  return (
    <LayerToggle
      label="Zensus-Einwohner"
      checked={censusOn}
      onChange={setCensusOn}
      onColorClass="bg-blue-700"
      info="Die Einwohnerpunkte aus dem Zensus 2022 (Destatis, auf Gebäude verteilt), die in den Faktor „Bewohnerbedarf“ eingehen. Punktgröße und -farbe zeigen die Einwohnerzahl, ab Zoom 17 auch als Zahl. Nur eine Anzeige in der Karte — das Ausblenden ändert die Berechnung nicht."
    />
  )
}

const UserObstaclesToggle = () => {
  const userObstaclesOn = usePlanningBoundaryState((s) => s.userObstaclesVisible)
  const setUserObstaclesOn = usePlanningBoundaryState((s) => s.setUserObstaclesVisible)
  return (
    <LayerToggle
      label="Eigene Daten"
      checked={userObstaclesOn}
      onChange={setUserObstaclesOn}
      onColorClass="bg-violet-700"
      info="Die für diese Variante hochgeladene GeoJSON-Datei. Nur eine Anzeige in der Karte — das Ausblenden ändert die Berechnung nicht."
    />
  )
}

/**
 * Zielgrößen-Filter der Flächensuche. Der Wert gehört zur Variante
 * (`factorConfig.min_area_m2`, beim Anlegen des Planungsgebiets aus dessen Flächengröße
 * vorbelegt) und wird beim Verlassen des Felds gespeichert.
 * Der URL-Param hält den in der Karte wirksamen Wert, damit sie schon beim Tippen reagiert.
 */
const MinAreaFilterForm = ({
  variantId,
  savedMinArea,
}: {
  variantId: number
  savedMinArea: number
}) => {
  const queryClient = useQueryClient()
  const [filterOn, setFilterOn] = usePlanningAreaFilterParam()
  const [minArea, setMinArea] = usePlanningMinAreaParam()
  const lastSaved = useRef(savedMinArea)

  // Beim Öffnen einer Variante deren gespeicherten Wert einmalig in die Karte übernehmen
  // (die Komponente ist je Variante gekeyed); spätere Tipp-Eingaben bleiben unangetastet.
  const initialized = useRef(false)
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    if (savedMinArea !== minArea) setMinArea(savedMinArea)
  }, [savedMinArea, minArea, setMinArea])

  const mutation = useMutation({
    mutationFn: (value: number) =>
      updatePlanningVariantFn({ data: { variantId, minAreaM2: value } }),
    onSuccess: (_, value) => {
      lastSaved.current = value
      queryClient.invalidateQueries(planningVariantQueryOptions(variantId))
    },
  })

  const save = () => {
    if (minArea !== lastSaved.current) mutation.mutate(minArea)
  }

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
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
        }}
        className={planningNumberInputClass}
      />
    </div>
  )
}

const MinAreaFilter = (props: { variantId: number; savedMinArea: number }) => (
  <MinAreaFilterForm key={props.variantId} {...props} />
)

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
  const lastRunConfig = (latestRun?.factorConfigSnapshot as FactorConfig | undefined) ?? null
  // Warum das Ergebnis nicht mehr zu den Eingaben passt: das Planungsgebiet wurde bearbeitet
  // (`stale`, vom Server gepflegt) oder die Faktoren wurden seit dem Lauf geändert — sie speichern
  // sich sofort, gerechnet wird aber erst auf Klick.
  const outdatedReason = latestRun?.stale
    ? 'Planungsgebiet geändert'
    : hasCompleteRun &&
        !isLocked &&
        factorsDiffer(variant.factorConfig as FactorConfig, lastRunConfig)
      ? 'Faktoren geändert'
      : null

  // Ob am Ende überhaupt ein Layer-Schalter erscheint: ScoreModeSwitcher, Vegetation,
  // Fahrbahnen und Zensus hängen alle an hasCompleteRun, nur Eigene-Daten nicht.
  const showLayerSection = hasCompleteRun || userGeojson != null

  return (
    <div className="flex flex-col gap-3 border-t border-gray-200 pt-3">
      {outdatedReason && (
        <p className="rounded bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
          {outdatedReason} — Ergebnis veraltet. Bitte neu berechnen.
        </p>
      )}

      {hasCompleteRun && (
        <MinAreaFilter
          variantId={variantId}
          savedMinArea={(variant.factorConfig as FactorConfig | undefined)?.min_area_m2 ?? 0}
        />
      )}

      <FactorEditorPanel
        variantId={variantId}
        areaId={variant.area.id}
        factorConfig={variant.factorConfig as FactorConfig}
        lastRunConfig={lastRunConfig}
        readOnly={isLocked}
        defaultOpen={factorsDefaultOpen}
      />

      <RunButton variantId={variantId} regionSlug={regionSlug} latestJob={latestJob} />

      {showLayerSection && (
        <div className="flex flex-col gap-2 border-t border-gray-200 pt-3">
          <span className="text-xs font-bold text-gray-500">Layer</span>
          {hasCompleteRun && <ScoreModeSwitcher />}
          {hasCompleteRun && (latestRun?.vegCount ?? 0) > 0 && <VegetationToggle />}
          {hasCompleteRun &&
            (variant.factorConfig as FactorConfig | undefined)?.exclude_carriageways && (
              <CarriagewaysToggle />
            )}
          {/* Aus dem Lauf-Snapshot, nicht aus der aktuellen Konfiguration: die Kacheln
              werden auf das Planungsgebiet DIESES Laufs zugeschnitten (siehe
              planning_census), der Schalter soll also genau dann erscheinen, wenn der
              Bewohnerbedarf tatsächlich mitgerechnet wurde. */}
          {hasCompleteRun && (lastRunConfig?.weights?.w_bewohnerbedarf ?? 0) > 0 && (
            <CensusToggle />
          )}
          {/* Ohne hasCompleteRun-Bedingung: die eigenen Daten liegen im Client und werden
              schon vor dem ersten Lauf in der Karte gezeigt (siehe UserObstaclesLayer). */}
          {userGeojson != null && <UserObstaclesToggle />}
        </div>
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
  const { panelRef, dragging, panelStyle, defaultPositionClassName, headerDragProps } =
    useDraggableMapPanel(planningMode)
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
  const collapsedTrail = panelCollapsed && (areaTitle || variantTitle)
  const hasCompleteRun = variant?.runs[0]?.status === 'COMPLETE'

  return (
    <div
      ref={panelRef}
      style={panelStyle}
      className={twJoin(
        'pointer-events-auto absolute z-10 flex max-h-[calc(100%-1.25rem)] flex-col overflow-hidden rounded bg-white shadow-lg',
        defaultPositionClassName,
        PLANNING_PANEL_WIDTH,
      )}
    >
      <div
        {...headerDragProps}
        title="Flächenfinder verschieben"
        className={twJoin(
          'group/drag flex shrink-0 cursor-grab touch-none items-center justify-between gap-2 px-3 py-2 select-none',
          'hover:bg-gray-50',
          dragging && 'cursor-grabbing bg-gray-50',
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <DragGripIcon className="size-4 shrink-0 text-gray-400 group-hover/drag:text-gray-600" />
          <h2 className="font-bold">Flächenfinder</h2>
        </div>
        <button
          type="button"
          data-drag-ignore
          onPointerDown={(event) => event.stopPropagation()}
          onClick={() => setPanelCollapsed(!panelCollapsed)}
          aria-label={panelCollapsed ? 'Flächenfinder ausklappen' : 'Flächenfinder einklappen'}
          className="shrink-0 cursor-pointer text-gray-500 hover:text-gray-800"
        >
          <ChevronRightIcon
            className={twJoin('size-4 transition-transform', panelCollapsed ? '' : 'rotate-90')}
          />
        </button>
      </div>
      {collapsedTrail && (
        <button
          type="button"
          data-drag-ignore
          onClick={() => setPanelCollapsed(false)}
          aria-label="Flächenfinder ausklappen"
          className="shrink-0 cursor-pointer border-t border-gray-200 px-3 py-2 text-left hover:bg-gray-50"
        >
          <ol className="flex min-w-0 items-center">
            {areaTitle && (
              <li className="min-w-0">
                <span
                  className={twJoin(
                    'block truncate text-sm font-medium',
                    variantTitle ? 'text-gray-500' : 'text-gray-700',
                  )}
                >
                  {areaTitle}
                </span>
              </li>
            )}
            {variantTitle && (
              <li className="flex min-w-0 items-center">
                {areaTitle && (
                  <ChevronRightIcon aria-hidden="true" className="size-5 shrink-0 text-gray-400" />
                )}
                <span
                  className={twJoin(
                    'min-w-0 truncate text-sm font-medium text-gray-700',
                    areaTitle && 'ml-1',
                  )}
                >
                  {variantTitle}
                </span>
              </li>
            )}
          </ol>
        </button>
      )}
      {panelCollapsed && hasCompleteRun && (
        <div className="shrink-0 border-t border-gray-200 px-3 py-2">
          <ScoreModeSwitcher compact />
        </div>
      )}
      {!panelCollapsed && (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto px-3 pt-1 pb-3">
          <AreaContextBar regionSlug={regionSlug} onCreatingChange={setCreatingArea} />
          {!creatingArea && (
            <>
              <VariantList regionSlug={regionSlug} />
              {activeVariant != null && (
                <VariantDetail variantId={activeVariant} regionSlug={regionSlug} />
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
