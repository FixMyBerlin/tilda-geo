import { Switch } from '@headlessui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { bbox } from '@turf/turf'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { twJoin } from 'tailwind-merge'
import {
  areaInputsDiffer,
  comparableRunSnapshot,
  factorsDiffer,
  outdatedBannerReason,
} from '@/server/planning/factorFingerprint'
import { areaInputFromRow } from '@/server/planning/mergeFactorConfig'
import type { FactorConfig } from '@/server/planning/planning.functions'
import { updatePlanningVariantFn } from '@/server/planning/planning.functions'
import {
  planningAreaQueryOptions,
  planningAreasQueryOptions,
  planningVariantQueryOptions,
} from '@/server/planning/planningQueryOptions'
import { usePlanningBoundaryState } from '../hooks/mapState/usePlanningBoundaryState'
import { useSpaceFinderModeParam } from '../modes/spaceFinder/useSpaceFinderModeParam'
import { useSpaceFinderSelection } from '../modes/spaceFinder/useSpaceFinderSelection'
import { AreaContextBar } from './AreaContextBar'
import { PlanningCandidateToggle } from './candidates/PlanningCandidateToggle'
import { FactorEditorPanel } from './FactorEditorPanel'
import { InfoTooltip } from './InfoTooltip'
import { planningNumberInputClass } from './planningPanelStyles'
import { RunButton } from './RunButton'
import { ScoreModeSwitcher } from './ScoreModeSwitcher'
import { VariantList } from './VariantList'

const routeApi = getRouteApi('/regionen/$regionSlug')

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
 * Zielgrößen-Filter der Flächensuche. Der gespeicherte Wert gehört zur Variante
 * (`factorConfig.min_area_m2`, beim Anlegen des Planungsgebiets aus dessen Flächengröße
 * vorbelegt) und wird beim Verlassen des Felds gespeichert.
 * `ff.minArea` hält den in der Karte wirksamen Wert (0/fehlend = Filter aus, D7), damit sie
 * schon beim Tippen reagiert; der lokale Zustand hält die Zahl auch sichtbar, während der
 * Filter per Checkbox ausgeschaltet ist (das leert `ff.minArea`, nicht das Eingabefeld).
 */
const MinAreaFilterForm = ({
  variantId,
  savedMinArea,
}: {
  variantId: number
  savedMinArea: number
}) => {
  const queryClient = useQueryClient()
  const { spaceFinderMode, setSpaceFinderModeParam } = useSpaceFinderModeParam()
  const urlMinArea = spaceFinderMode.minArea ?? 0
  const filterOn = urlMinArea > 0
  const [minArea, setLocalMinArea] = useState(savedMinArea)
  const lastSaved = useRef(savedMinArea)

  // Beim Öffnen einer Variante deren gespeicherten Wert einmalig in die Karte übernehmen
  // (die Komponente ist je Variante gekeyed); spätere Tipp-Eingaben bleiben unangetastet.
  const initialized = useRef(false)
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    if (savedMinArea !== urlMinArea) {
      setSpaceFinderModeParam({ ...spaceFinderMode, minArea: savedMinArea || undefined })
    }
  }, [savedMinArea, urlMinArea, spaceFinderMode, setSpaceFinderModeParam])

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

  const setFilterOn = (checked: boolean) => {
    setSpaceFinderModeParam({
      ...spaceFinderMode,
      minArea: checked ? minArea || undefined : undefined,
    })
  }

  const setMinArea = (value: number) => {
    setLocalMinArea(value)
    setSpaceFinderModeParam({ ...spaceFinderMode, minArea: value > 0 ? value : undefined })
  }

  return (
    <div className="flex flex-col gap-2 rounded border border-gray-200 px-2.5 py-2 text-sm">
      <div className="flex items-center justify-between gap-2">
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
      <PlanningCandidateToggle />
    </div>
  )
}

const MinAreaFilter = (props: { variantId: number; savedMinArea: number }) => (
  <MinAreaFilterForm key={props.variantId} {...props} />
)

const VariantDetail = ({ variantId, regionSlug }: { variantId: number; regionSlug: string }) => {
  const setVegetationAttribution = usePlanningBoundaryState((s) => s.setVegetationAttribution)
  const setUserObstaclesGeom = usePlanningBoundaryState((s) => s.setUserObstaclesGeom)
  const { data: variant } = useQuery(planningVariantQueryOptions(variantId))

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
  // `stale` kann Gebiet und Faktoren bedeuten — die Texte kommen deshalb aus zwei Vergleichen.
  // Faktoren: Alt-Snapshots ohne Auto-Schwelle erst re-mergen. Gebiet: Roh-Snapshot, sonst würde
  // der Merge das heutige Gebiet auf den alten Lauf schreiben und die Änderung verschlucken.
  const comparableSnapshot = comparableRunSnapshot(lastRunConfig, areaInputFromRow(variant.area))
  const currentConfig = variant.factorConfig as FactorConfig
  const outdatedReason =
    hasCompleteRun && !isLocked
      ? outdatedBannerReason(
          factorsDiffer(currentConfig, comparableSnapshot),
          areaInputsDiffer(currentConfig, lastRunConfig),
        )
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
        regionSlug={regionSlug}
        factorConfig={variant.factorConfig as FactorConfig}
        lastRunConfig={comparableSnapshot}
        readOnly={isLocked}
        defaultOpen={factorsDefaultOpen}
        parkingDataAvailable={variant.parkingDataAvailable}
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

/**
 * Flächenfinder panel body: rendered inside the mode's `ModePanel` (`PageModeSpaceFinder`), which
 * owns the panel chrome (header, resizable width, scroll container). The former floating/draggable
 * panel and its collapse state are gone (D3/D5 — phase 3 does the full panel-body redesign); this
 * is the first port of the existing sections, unchanged in behavior.
 */
export const SpaceFinderPanelBody = () => {
  const { regionSlug } = routeApi.useParams()
  const [showCreate, setShowCreate] = useState(false)
  const [pendingCreatedAreaId, setPendingCreatedAreaId] = useState<number | null>(null)
  const { mainMap: map } = useMap()
  const setBoundaryHighlightGeom = usePlanningBoundaryState((s) => s.setBoundaryHighlightGeom)
  const setLastFittedBoundaryKey = usePlanningBoundaryState((s) => s.setLastFittedBoundaryKey)

  // Area id is always derived from the active variant (D7) — there is no separate area URL key.
  const { variantId: activeVariant, areaId: activeArea, variant } = useSpaceFinderSelection()

  const { data: areas } = useQuery(planningAreasQueryOptions(regionSlug))
  const waitingForCreatedArea =
    pendingCreatedAreaId != null &&
    (activeArea !== pendingCreatedAreaId || !areas?.some((a) => a.id === pendingCreatedAreaId))
  const creatingArea = showCreate || waitingForCreatedArea

  const { data: area } = useQuery({
    ...planningAreaQueryOptions(activeArea!),
    enabled: activeArea != null,
  })

  const studyArea =
    (area?.studyArea as GeoJSON.Geometry | undefined) ??
    ((variant?.factorConfig as FactorConfig | undefined)?.study_area as
      | GeoJSON.Geometry
      | undefined)

  // Outline lives on the panel body (not VariantDetail) so it stays on the map while switching
  // variants of the same planungsgebiet.
  useEffect(
    function syncStudyAreaOutline() {
      // While creating, AreaFormFields / the wizard own the highlight — do not re-apply
      // the previous area's studyArea. Missing geometry while an area is selected means
      // the query is still in flight; keep the current outline instead of flashing it off.
      if (creatingArea) return
      if (activeArea == null) {
        setBoundaryHighlightGeom(null)
        return
      }
      if (!studyArea) return
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
    },
    [creatingArea, activeArea, studyArea, map, setBoundaryHighlightGeom, setLastFittedBoundaryKey],
  )

  // Clear the outline when leaving the mode — the component unmounts with the route (there is no
  // more "planning mode off while the map stays mounted" state to guard against here).
  useEffect(() => () => setBoundaryHighlightGeom(null), [setBoundaryHighlightGeom])

  if (
    pendingCreatedAreaId != null &&
    activeArea === pendingCreatedAreaId &&
    areas?.some((a) => a.id === pendingCreatedAreaId)
  ) {
    setPendingCreatedAreaId(null)
  }

  return (
    <div className="flex flex-col gap-3">
      <AreaContextBar
        regionSlug={regionSlug}
        creating={creatingArea}
        pendingCreatedAreaId={pendingCreatedAreaId}
        onShowCreate={setShowCreate}
        onPendingCreatedAreaId={setPendingCreatedAreaId}
      />
      {!creatingArea && (
        <>
          <VariantList regionSlug={regionSlug} />
          {activeVariant != null && (
            <VariantDetail variantId={activeVariant} regionSlug={regionSlug} />
          )}
        </>
      )}
    </div>
  )
}
