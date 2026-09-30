import { Switch } from '@headlessui/react'
import { PencilSquareIcon } from '@heroicons/react/24/outline'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { twJoin } from 'tailwind-merge'
import { formatDate } from '@/components/shared/date/formatDate'
import { frenchQuote } from '@/components/shared/text/Quotes'
import { studyAreaSizeKm2 } from '@/lib/planningStudyAreaLimit'
import {
  areaInputsDiffer,
  comparableRunSnapshot,
  factorsDiffer,
  outdatedBannerReason,
} from '@/server/planning/factorFingerprint'
import { areaInputFromRow } from '@/server/planning/mergeFactorConfig'
import type { FactorConfig, getPlanningVariantFn } from '@/server/planning/planning.functions'
import { updatePlanningVariantFn } from '@/server/planning/planning.functions'
import { planningVariantQueryOptions } from '@/server/planning/planningQueryOptions'
import { usePlanningBoundaryState } from '../../hooks/mapState/usePlanningBoundaryState'
import { modePanelMutedClassName } from '../modePanel.const'
import { CollapsibleBox } from './CollapsibleBox'
import { FactorEditorPanel } from './factors/FactorEditorPanel'
import { InfoTooltip } from './InfoTooltip'
import { planningNumberInputClass } from './planningPanelStyles'
import { JobStatusBadge } from './run/JobStatusBadge'
import { ScoreModeSwitcher } from './ScoreModeSwitcher'
import { SpaceFinderCandidatesSection } from './SpaceFinderCandidatesSection'
import { useSpaceFinderModeParam } from './useSpaceFinderModeParam'

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

type PlanningVariantDetail = Awaited<ReturnType<typeof getPlanningVariantFn>>

/** »Planungsgebiet«: name, km², Eigene Daten yes/no — a pencil opens the area editor detail view. */
const AreaSummarySection = ({
  variant,
  editable,
}: {
  variant: PlanningVariantDetail
  editable: boolean
}) => {
  const { spaceFinderMode, setSpaceFinderModeParam } = useSpaceFinderModeParam()
  const area = variant.area
  const km2 = area.studyArea
    ? studyAreaSizeKm2(area.studyArea as unknown as GeoJSON.Geometry)
    : null

  return (
    <CollapsibleBox title="Planungsgebiet" defaultOpen={false}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-gray-800">{frenchQuote(area.title)}</span>
        {editable && (
          <button
            type="button"
            onClick={() => setSpaceFinderModeParam({ ...spaceFinderMode, edit: 'area' })}
            title="Planungsgebiet bearbeiten"
            aria-label="Planungsgebiet bearbeiten"
            className="shrink-0 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          >
            <PencilSquareIcon className="size-4" />
          </button>
        )}
      </div>
      <div className="flex flex-col gap-1 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Größe</span>
          <span>{km2 != null ? `${km2.toFixed(2)} km²` : '–'}</span>
        </div>
        <div className="flex justify-between">
          <span>Eigene Daten</span>
          <span>{area.userGeojson != null ? 'Ja' : 'Nein'}</span>
        </div>
      </div>
    </CollapsibleBox>
  )
}

/** Status line (D5): run state, outdated reason, progress while running. */
const StatusSection = ({ variant }: { variant: PlanningVariantDetail }) => {
  const latestJob = variant.jobs[0] ?? null
  const latestRun = variant.runs[0] ?? null
  const isLocked = latestJob?.status === 'QUEUED' || latestJob?.status === 'RUNNING'
  const hasCompleteRun = latestRun?.status === 'COMPLETE'
  const lastRunConfig = (latestRun?.factorConfigSnapshot as FactorConfig | undefined) ?? null
  const comparableSnapshot = comparableRunSnapshot(lastRunConfig, areaInputFromRow(variant.area))
  const currentConfig = variant.factorConfig as FactorConfig
  const outdatedReason =
    hasCompleteRun && !isLocked
      ? outdatedBannerReason(
          factorsDiffer(currentConfig, comparableSnapshot),
          areaInputsDiffer(currentConfig, lastRunConfig),
        )
      : null

  return (
    <div className="flex flex-col gap-2 px-4 py-2">
      {outdatedReason && (
        <p className="rounded bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
          {outdatedReason} — Ergebnis veraltet. Bitte neu berechnen.
        </p>
      )}
      {latestJob != null && <JobStatusBadge jobId={latestJob.id} variantId={variant.id} />}
      {latestJob == null && hasCompleteRun && !outdatedReason && (
        <p className="text-xs text-green-700">✓ Ergebnis vom {formatDate(latestRun.createdAt)}</p>
      )}
      {latestJob == null && !hasCompleteRun && (
        <p className={modePanelMutedClassName}>Noch nicht berechnet.</p>
      )}
    </div>
  )
}

/** »Ergebnis« (only with a complete run): score mode, opacity, Gesuchte-Fläche filter, layer toggles. */
const ResultSection = ({ variant }: { variant: PlanningVariantDetail }) => {
  const latestRun = variant.runs[0] ?? null
  const lastRunConfig = (latestRun?.factorConfigSnapshot as FactorConfig | undefined) ?? null
  const factorConfig = variant.factorConfig as FactorConfig

  return (
    <CollapsibleBox title="Ergebnis">
      <MinAreaFilter variantId={variant.id} savedMinArea={factorConfig?.min_area_m2 ?? 0} />
      <ScoreModeSwitcher />
      {(latestRun?.vegCount ?? 0) > 0 && <VegetationToggle />}
      {factorConfig?.exclude_carriageways && <CarriagewaysToggle />}
      {/* Aus dem Lauf-Snapshot, nicht aus der aktuellen Konfiguration: die Kacheln werden auf das
          Planungsgebiet DIESES Laufs zugeschnitten (siehe planning_census), der Schalter soll also
          genau dann erscheinen, wenn der Bewohnerbedarf tatsächlich mitgerechnet wurde. */}
      {(lastRunConfig?.weights?.w_bewohnerbedarf ?? 0) > 0 && <CensusToggle />}
    </CollapsibleBox>
  )
}

/**
 * Flächenfinder panel body (D5): status line, Planungsgebiet summary, Faktoren, Ergebnis (only with
 * a complete run) and Auswahl — collapsible sections, no list, replacing the former
 * `SpaceFinderPanelBody`/`VariantDetail`. The Eigene-Daten layer toggle is independent of
 * `hasCompleteRun` (uploaded data shows on the map before the first run) and therefore lives
 * outside `ResultSection`, same as before.
 */
export const SpaceFinderBody = ({
  regionSlug,
  variantId,
  editable = true,
}: {
  regionSlug: string
  variantId: number
  /**
   * Desktop only (D10): hides Faktoren editing, the run button (footer, handled by the caller)
   * and candidate selection behind a short notice. Status, Planungsgebiet summary and Ergebnis
   * (view-only controls) stay visible.
   */
  editable?: boolean
}) => {
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

  return (
    <div className="flex flex-col">
      <StatusSection variant={variant} />
      <div className="flex flex-col gap-3 p-3">
        <AreaSummarySection variant={variant} editable={editable} />
        {editable ? (
          <FactorEditorPanel
            variantId={variant.id}
            areaId={variant.area.id}
            regionSlug={regionSlug}
            factorConfig={variant.factorConfig as FactorConfig}
            lastRunConfig={comparableRunSnapshot(
              (latestRun?.factorConfigSnapshot as FactorConfig | undefined) ?? null,
              areaInputFromRow(variant.area),
            )}
            readOnly={isLocked}
            defaultOpen={!hasCompleteRun}
            parkingDataAvailable={variant.parkingDataAvailable}
          />
        ) : (
          <p
            className={twJoin(
              'rounded border border-gray-200 px-2.5 py-2',
              modePanelMutedClassName,
            )}
          >
            Faktoren und Berechnung nur am Desktop bearbeitbar.
          </p>
        )}
        {hasCompleteRun && <ResultSection variant={variant} />}
        {userGeojson != null && (
          <CollapsibleBox title="Eigene Daten" defaultOpen={false}>
            <UserObstaclesToggle />
          </CollapsibleBox>
        )}
        {editable && variant.currentRunId != null && (
          <SpaceFinderCandidatesSection variantId={variant.id} />
        )}
      </div>
    </div>
  )
}
