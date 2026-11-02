import { Disclosure, DisclosureButton, DisclosurePanel, Transition } from '@headlessui/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useEffectEvent, useState } from 'react'
import { twJoin } from 'tailwind-merge'
import { CollapsibleBoxChevron } from '@/components/shared/CollapsibleBox/CollapsibleBox'
import {
  collapsibleBoxClass,
  collapsibleBoxHeaderClass,
} from '@/components/shared/CollapsibleBox/collapsibleBoxStyles'
import { InfoTooltip } from '@/components/shared/InfoTooltip/InfoTooltip'
import { SegmentedChoice } from '@/components/shared/SegmentedChoice/SegmentedChoice'
import { toastError } from '@/components/shared/toast/toastError'
import { toastSuccess } from '@/components/shared/toast/toastSuccess'
import {
  type UserDataset,
  userDatasetCoverage,
  userDatasetCoverageMessage,
} from '@/lib/planningUserGeojson'
import { factorFingerprint, factorsDiffer } from '@/server/planning/factorFingerprint'
import {
  syncEigendatenWeights,
  type VariantFactorConfig,
} from '@/server/planning/mergeFactorConfig'
import type { FactorConfig } from '@/server/planning/planning.functions'
import { updatePlanningVariantFn } from '@/server/planning/planning.functions'
import {
  planningAreaQueryOptions,
  planningAreasQueryOptions,
  planningVariantQueryOptions,
} from '@/server/planning/planningQueryOptions'
import { useSpaceFinderBoundaryActions } from '../../../hooks/mapState/space-finder-boundary-store'
import { useRegionSlug } from '../../../regionUtils/useRegionSlug'
import { USER_DATASET_MODE_OPTIONS, UserDatasetCoverageHint } from '../area/UserDatasetsField'
import {
  spaceFinderDiscardLinkClass,
  spaceFinderDiscardRowClass,
  spaceFinderFactorHintClass,
  spaceFinderFactorGroupLabelClass,
  spaceFinderFactorGroupRowsClass,
  spaceFinderGroupHeadingClass,
  spaceFinderGroupStyle,
  spaceFinderNumberInputClass,
  spaceFinderParamLabelMutedClass,
} from '../spaceFinderPanelStyles'
import { OepnvCategorySliders } from './OepnvCategorySliders'
import { readOepnvShares, type OepnvShares } from './oepnvShares'
import {
  DEFAULT_FACTOR_TEMPLATE,
  FACTOR_HELP,
  FACTOR_PARAMS,
  GROUP_HELP,
  MIN_SCORE_THRESHOLD_LABEL,
  PARKING_DATA_DEPENDENT_KEYS,
  WEIGHT_GROUPS,
  WEIGHT_LABELS,
} from './spaceFinderDefaults'
import {
  criterionShares,
  groupShare,
  modifierPointRange,
  resolveModifierDirection,
  weightToPoints,
  weightToStep,
} from './weightScale'
import {
  ComingSoonFactorRow,
  CriterionSlider,
  ModifierSlider,
  UnavailableFactorRow,
  WeightScaleLegend,
} from './WeightSlider'
import { ZielortCategorySliders } from './ZielortCategorySliders'
import { readZielortShares, type ZielortShares } from './zielortShares'

/** Note below the parking-data-dependent factors when `parkingDataAvailable` is false —
 * see [[PARKING_DATA_DEPENDENT_KEYS]] in spaceFinderDefaults.ts. */
const PARKING_DATA_HINT = 'Keine Parkdaten für dieses Gebiet verfügbar — Faktor hier deaktiviert.'

const FactorInfo = ({ factorKey, extra }: { factorKey: string; extra?: string }) => {
  const text = [FACTOR_HELP[factorKey], extra].filter(Boolean).join(' ')
  if (!text) return null
  return <InfoTooltip>{text}</InfoTooltip>
}

/** Base of the block headings; each block adds its color (factor groups colored, the rest gray). */
const groupHeadlineBaseClass = twJoin(
  'flex items-baseline justify-between gap-2 border-b pb-0.5',
  spaceFinderGroupHeadingClass,
)

const groupHeadlineClass = twJoin(groupHeadlineBaseClass, 'border-gray-200 text-gray-800')

/**
 * Value text of the "Eigene Daten" chip in the collapsed factors header. With exactly one dataset:
 * for bonus/penalty the points in the direction of effect, for the exclusion modes only the mode
 * name. With several, a single value says nothing — so it shows the count.
 */
const eigendatenChipValue = (config: FactorConfig) => {
  const datasets = config.user_datasets ?? []
  const [dataset] = datasets
  if (datasets.length !== 1 || !dataset) return `${datasets.length} Datensätze`
  const mode = dataset.mode
  if (mode === 'exclude_inside' || mode === 'exclude_outside') {
    return USER_DATASET_MODE_OPTIONS.find(([value]) => value === mode)?.[1] ?? mode
  }
  const points = weightToPoints(config.eigendaten_weights?.[dataset.id])
  return `${mode === 'penalty' ? '−' : '+'}${points}`
}

/** What an exclusion mode does — it has no strength, so this replaces the slider. */
const EIGENDATEN_EXCLUDE_TEXT: Partial<Record<UserDataset['mode'], string>> = {
  exclude_inside: 'Flächen innerhalb dieses Datensatzes werden ausgeschlossen.',
  exclude_outside: 'Nur Flächen innerhalb dieses Datensatzes bleiben zulässig.',
}

/**
 * One "Eigene Daten" dataset in the factors block: name, mode (display only — it belongs to the
 * Planungsgebiet and is set there), strength for bonus/penalty (belongs to the variant) and the
 * note when features lie outside the Planungsgebiet.
 */
const EigendatenDatasetBlock = ({
  dataset,
  studyArea,
  weight,
  setWeight,
  readOnly,
}: {
  dataset: UserDataset
  studyArea: GeoJSON.Geometry | null
  weight: number | undefined
  setWeight: (value: number) => void
  readOnly: boolean
}) => {
  const coverageMessage = userDatasetCoverageMessage(
    userDatasetCoverage(dataset.geojson, studyArea),
  )
  const isSoft = dataset.mode === 'bonus' || dataset.mode === 'penalty'
  const modeLabel =
    USER_DATASET_MODE_OPTIONS.find(([value]) => value === dataset.mode)?.[1] ?? dataset.mode
  return (
    <li className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="min-w-0 truncate font-semibold text-gray-800" title={dataset.name}>
            {dataset.name}
          </span>
          <span
            className="shrink-0 rounded border border-gray-400 bg-white px-1.5 py-px text-[11px] font-semibold text-gray-800"
            title="Der Modus gilt für alle Varianten und wird am Planungsgebiet eingestellt."
          >
            {modeLabel}
          </span>
        </span>
        <span className="shrink-0 text-gray-500 tabular-nums">
          {dataset.geojson.features.length.toLocaleString('de-DE')} Objekte
        </span>
      </div>
      {coverageMessage && <UserDatasetCoverageHint message={coverageMessage} />}
      {!isSoft && EIGENDATEN_EXCLUDE_TEXT[dataset.mode] && (
        <p className="text-xs text-gray-500">{EIGENDATEN_EXCLUDE_TEXT[dataset.mode]}</p>
      )}
      {isSoft && (
        <ModifierSlider
          label="Stärke"
          weight={weight}
          direction={dataset.mode === 'penalty' ? 'negative' : 'positive'}
          onChange={setWeight}
          readOnly={readOnly}
          info={<FactorInfo factorKey="w_eigendaten" />}
        />
      )}
    </li>
  )
}

/**
 * Share of both factor groups in the base score as colored chips — the short form of the group
 * headings for the collapsed factors header. If user datasets are uploaded, their chip (amber,
 * like the "Eigene Daten" block) is added so their effect is visible when collapsed, too.
 */
const GroupShareChips = ({ config }: { config: FactorConfig }) => {
  const shares = criterionShares(config.weights)
  return (
    <div className="flex w-full items-center gap-1.5">
      {WEIGHT_GROUPS.map((group) => (
        <span
          key={group.key}
          className={twJoin(
            'rounded px-1.5 py-0.5 text-[11px] font-medium',
            spaceFinderGroupStyle[group.key].chip,
          )}
        >
          {group.label}{' '}
          <span className="font-bold tabular-nums">
            {Math.round(groupShare(shares, group.criteria))} %
          </span>
        </span>
      ))}
      {(config.user_datasets?.length ?? 0) > 0 && (
        <span
          className={twJoin(
            'rounded px-1.5 py-0.5 text-[11px] font-medium',
            spaceFinderGroupStyle.eigendaten.chip,
          )}
        >
          Eigene Daten <span className="font-bold tabular-nums">{eigendatenChipValue(config)}</span>
        </span>
      )}
    </div>
  )
}

/**
 * Source note below the resident-demand saturation. The value is estimated once per Planungsgebiet
 * from the census (see `censusSaettigung.server.ts`) and applies to all its variants until someone
 * overrides it — hence two states: „automatisch ermittelt" and
 * „von Hand gesetzt, Vorschlag war X".
 */
const AutoSaettigungHint = ({
  config,
  restoreAuto,
  readOnly,
}: {
  config: FactorConfig
  restoreAuto: () => void
  readOnly: boolean
}) => {
  const auto = config.bewohnerbedarf_saettigung_auto_ew
  if (auto == null) return null

  const ewProHa = config.bewohnerbedarf_ew_pro_ha
  if (config.bewohnerbedarf_saettigung_auto) {
    return (
      <p className="text-[11px] leading-snug text-gray-500">
        Automatisch aus dem Zensus im Planungsgebiet ermittelt
        {ewProHa ? ` (${ewProHa.toLocaleString('de-DE')} EW/ha)` : ''} — überschreibbar.
      </p>
    )
  }
  return (
    <p className="text-[11px] leading-snug text-gray-500">
      Von Hand gesetzt. Zensus-Vorschlag: {auto}.{' '}
      {!readOnly && (
        <button
          type="button"
          onClick={restoreAuto}
          className="font-medium text-gray-600 underline hover:text-gray-900"
        >
          Wieder automatisch
        </button>
      )}
    </p>
  )
}

const FactorParamInputs = ({
  factorKey,
  config,
  weight,
  setField,
  restoreAutoSaettigung,
  readOnly,
}: {
  factorKey: string
  config: FactorConfig
  weight: number | undefined
  setField: (key: keyof FactorConfig, value: number | boolean) => void
  restoreAutoSaettigung: () => void
  readOnly: boolean
}) => {
  const params = FACTOR_PARAMS[factorKey]
  if (!params) return null

  const weightOff = weightToStep(weight) === 0 && weightToPoints(weight) === 0

  return params.map(({ key, label, step, min, alwaysEditable }) => {
    const disabled = readOnly || (weightOff && !alwaysEditable)
    return (
      <div key={String(key)} className="space-y-0.5">
        <label className="flex items-center justify-between gap-2">
          <span className={disabled ? spaceFinderParamLabelMutedClass : spaceFinderFactorHintClass}>
            {label}
          </span>
          <input
            type="number"
            step={step}
            min={min}
            value={Number(config[key] ?? 0)}
            disabled={disabled}
            onChange={(e) => {
              const value = Number(e.target.value)
              setField(key, min != null ? Math.max(min, value) : value)
            }}
            className={spaceFinderNumberInputClass}
          />
        </label>
        {key === 'bewohnerbedarf_saettigung_ew' && !disabled && (
          <AutoSaettigungHint
            config={config}
            restoreAuto={restoreAutoSaettigung}
            readOnly={readOnly}
          />
        )}
      </div>
    )
  })
}

/** Weight/threshold form fields (without geometry / user datasets). */
const FactorFields = ({
  config,
  setWeights,
  setField,
  restoreAutoSaettigung,
  setVegetationDirection,
  setPlatzDirection,
  setZielortShares,
  setOepnvShares,
  setEigendatenWeight,
  onReset,
  readOnly = false,
  parkingDataAvailable = true,
}: {
  config: FactorConfig
  setWeights: (weights: Record<string, number>) => void
  setField: (key: keyof FactorConfig, value: number | boolean) => void
  restoreAutoSaettigung: () => void
  setVegetationDirection: (value: 'positive' | 'negative') => void
  setPlatzDirection: (value: 'positive' | 'negative') => void
  setZielortShares: (shares: ZielortShares) => void
  setOepnvShares: (shares: OepnvShares) => void
  setEigendatenWeight: (id: string, value: number) => void
  onReset?: () => void
  readOnly?: boolean
  parkingDataAvailable?: boolean
}) => {
  const weights = config.weights ?? {}
  const vegetationDirection = config.vegetation_direction ?? 'negative'
  const platzDirection = config.platz_direction ?? 'positive'
  const directions = { vegetation: vegetationDirection, platz: platzDirection }
  const userDatasets = config.user_datasets ?? []
  const studyAreaGeometry = (config.study_area as GeoJSON.Geometry | undefined) ?? null
  const setWeightFromWeights = (key: string, value: number) =>
    setWeights({ ...weights, [key]: value })
  const shares = criterionShares(weights)
  const points = modifierPointRange(weights, directions)
  const zielortShares = readZielortShares(config.zielort_category_shares)
  // Open/closed state of the target-location types lives here because the highlight of the whole
  // Zielorte row depends on it (see below) — not just the content below the slider.
  const [zielortCategoriesOpen, setZielortCategoriesOpen] = useState(false)
  const oepnvShares = readOepnvShares(config.oepnv_category_shares)
  // Same pattern as Zielorte, but on the criteria slider w_transit instead of the modifier w_target.
  const [oepnvCategoriesOpen, setOepnvCategoriesOpen] = useState(false)

  return (
    <>
      <div>
        <div className="mb-1 font-semibold">Gewichtung der Faktoren</div>
        {!readOnly && <WeightScaleLegend />}
        {onReset && (
          <div className={twJoin(spaceFinderDiscardRowClass, 'mb-1')}>
            <button type="button" onClick={onReset} className={spaceFinderDiscardLinkClass}>
              Auf Standardwerte zurücksetzen
            </button>
          </div>
        )}
        {WEIGHT_GROUPS.map((group) => (
          // Colored stripe + subtle tint per group: otherwise the long form doesn't show at a
          // glance where demand ends and built environment begins. Same colors as the share
          // chips in the collapsed header.
          <div
            key={group.key}
            className={twJoin(
              'mt-3 rounded-r border-l-[3px] py-1.5 pr-1 pl-2 first:mt-0',
              spaceFinderGroupStyle[group.key].block,
            )}
          >
            <div
              className={twJoin(
                groupHeadlineBaseClass,
                spaceFinderGroupStyle[group.key].headline,
                spaceFinderGroupStyle[group.key].title,
              )}
            >
              <span className="flex items-center gap-1">
                {group.label}
                <InfoTooltip>{GROUP_HELP[group.key]}</InfoTooltip>
              </span>
              <span className="text-xs font-normal text-gray-500 tabular-nums">
                {Math.round(groupShare(shares, group.criteria))} % des Grundscores
              </span>
            </div>

            <div className={twJoin('mt-1.5', spaceFinderFactorGroupLabelClass)}>Kriterien</div>
            <div className={spaceFinderFactorGroupRowsClass}>
              {group.criteria.map((key) => {
                const criterionSlider = (
                  <CriterionSlider
                    label={WEIGHT_LABELS[key] ?? key}
                    weight={weights[key]}
                    sharePct={shares[key] ?? 0}
                    onChange={(value) => setWeightFromWeights(key, value)}
                    readOnly={readOnly}
                    info={<FactorInfo factorKey={key} />}
                    nested={
                      <>
                        <FactorParamInputs
                          factorKey={key}
                          config={config}
                          weight={weights[key]}
                          setField={setField}
                          restoreAutoSaettigung={restoreAutoSaettigung}
                          readOnly={readOnly}
                        />
                        {/* The group split hangs off the ÖPNV slider: it distributes its share
                          across ÖPNV and bikesharing without touching the other factors. */}
                        {key === 'w_transit' && (
                          <OepnvCategorySliders
                            shares={oepnvShares}
                            onChange={setOepnvShares}
                            open={oepnvCategoriesOpen}
                            onOpenChange={setOepnvCategoriesOpen}
                            disabled={readOnly || weightToStep(weights[key]) === 0}
                          />
                        )}
                      </>
                    }
                  />
                )
                // When expanded, the ÖPNV slider and the type sliders visibly belong together,
                // same pattern as Zielorte further down.
                if (key === 'w_transit' && oepnvCategoriesOpen) {
                  return (
                    <div
                      key={key}
                      className="-mx-1 my-1 rounded border border-gray-300 bg-white px-2 py-0.5 shadow-sm"
                    >
                      {criterionSlider}
                    </div>
                  )
                }
                return <div key={key}>{criterionSlider}</div>
              })}
              {group.comingSoon?.map((key) => (
                <ComingSoonFactorRow
                  key={key}
                  label={WEIGHT_LABELS[key] ?? key}
                  info={<FactorInfo factorKey={key} />}
                />
              ))}
            </div>

            <div className={twJoin('mt-2', spaceFinderFactorGroupLabelClass)}>
              Zu- und Abschläge
            </div>
            <div className={spaceFinderFactorGroupRowsClass}>
              {group.modifiers.map(({ key, direction }) => {
                const dataUnavailable =
                  !parkingDataAvailable && PARKING_DATA_DEPENDENT_KEYS.includes(key)
                if (dataUnavailable) {
                  return (
                    <UnavailableFactorRow
                      key={key}
                      label={WEIGHT_LABELS[key] ?? key}
                      info={<FactorInfo factorKey={key} extra={PARKING_DATA_HINT} />}
                    />
                  )
                }
                const slider = (
                  <ModifierSlider
                    label={WEIGHT_LABELS[key] ?? key}
                    weight={weights[key]}
                    direction={resolveModifierDirection(direction, directions)}
                    onChange={(value) => setWeightFromWeights(key, value)}
                    readOnly={readOnly}
                    info={<FactorInfo factorKey={key} />}
                    nested={
                      <>
                        {key === 'w_vegetation' && (
                          <SegmentedChoice
                            options={
                              [
                                ['negative', 'Grün schützen'],
                                ['positive', 'Grün bevorzugen'],
                              ] as const
                            }
                            value={vegetationDirection}
                            onChange={setVegetationDirection}
                            disabled={readOnly || weightToPoints(weights[key]) === 0}
                          />
                        )}
                        {key === 'w_platz' && (
                          <SegmentedChoice
                            options={
                              [
                                ['negative', 'Platz freihalten'],
                                ['positive', 'Belebung bevorzugen'],
                              ] as const
                            }
                            value={platzDirection}
                            onChange={setPlatzDirection}
                            disabled={readOnly || weightToPoints(weights[key]) === 0}
                          />
                        )}
                        <FactorParamInputs
                          factorKey={key}
                          config={config}
                          weight={weights[key]}
                          setField={setField}
                          restoreAutoSaettigung={restoreAutoSaettigung}
                          readOnly={readOnly}
                        />
                        {/* The category split hangs off the Zielorte slider: it distributes its
                          points across the four target-location types without touching the other factors. */}
                        {key === 'w_target' && (
                          <ZielortCategorySliders
                            shares={zielortShares}
                            onChange={setZielortShares}
                            open={zielortCategoriesOpen}
                            onOpenChange={setZielortCategoriesOpen}
                            disabled={readOnly || weightToPoints(weights[key]) === 0}
                          />
                        )}
                      </>
                    }
                  />
                )
                // When expanded, the Zielorte slider and the type sliders visibly belong together: the
                // white card lifts both out of the tinted group block, instead of leaving the types
                // as loose sliders below the factor.
                if (key === 'w_target' && zielortCategoriesOpen) {
                  return (
                    <div
                      key={key}
                      className="-mx-1 my-1 rounded border border-gray-300 bg-white px-2 py-0.5 shadow-sm"
                    >
                      {slider}
                    </div>
                  )
                }
                return <div key={key}>{slider}</div>
              })}
            </div>
          </div>
        ))}
      </div>

      {userDatasets.length > 0 && (
        <div
          className={twJoin(
            'rounded-r border-l-[3px] py-1.5 pr-1 pl-2',
            spaceFinderGroupStyle.eigendaten.block,
          )}
        >
          <div
            className={twJoin(
              groupHeadlineBaseClass,
              spaceFinderGroupStyle.eigendaten.headline,
              spaceFinderGroupStyle.eigendaten.title,
            )}
          >
            <span className="flex items-center gap-1">
              Eigene Daten
              <InfoTooltip>{GROUP_HELP.eigendaten}</InfoTooltip>
            </span>
          </div>
          {/* Only the heading has a rule; spacing separates the datasets. */}
          <ul className="mt-1.5 space-y-3">
            {userDatasets.map((dataset) => (
              <EigendatenDatasetBlock
                key={dataset.id}
                dataset={dataset}
                studyArea={studyAreaGeometry}
                weight={config.eigendaten_weights?.[dataset.id]}
                setWeight={(value) => setEigendatenWeight(dataset.id, value)}
                readOnly={readOnly}
              />
            ))}
          </ul>
        </div>
      )}

      <p className="text-[11px] text-gray-500">
        Zu- und Abschläge zusammen: max.{' '}
        <span className="font-semibold text-black">+{points.plus}</span> /{' '}
        <span className="font-semibold text-black">−{points.minus}</span> Punkte auf den Grundscore.
      </p>

      <div>
        <div className={groupHeadlineClass}>
          <span>Allgemein</span>
        </div>
        <div className="mt-1 space-y-2">
          <label className="flex items-center justify-between gap-2 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              {MIN_SCORE_THRESHOLD_LABEL}
              <InfoTooltip>{FACTOR_HELP.min_score_threshold}</InfoTooltip>
            </div>
            <input
              type="number"
              step={5}
              value={Number(config.min_score_threshold ?? 0)}
              disabled={readOnly}
              onChange={(e) => setField('min_score_threshold', Number(e.target.value))}
              className={spaceFinderNumberInputClass}
            />
          </label>
          <label className="flex items-center gap-1 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={config.exclude_carriageways ?? false}
              disabled={readOnly || !parkingDataAvailable}
              onChange={(e) => setField('exclude_carriageways', e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className={!parkingDataAvailable ? 'text-gray-400' : undefined}>
              Fahrbahnen ausschließen
            </span>
            <InfoTooltip>
              {parkingDataAvailable
                ? 'Straßenflächen werden anhand ihrer erfassten oder geschätzten Breite als Fläche berechnet und aus den Hexagonen ausgeschlossen — dort ist keine Bebauung möglich, unabhängig von den übrigen Faktoren.'
                : PARKING_DATA_HINT}
            </InfoTooltip>
          </label>
        </div>
      </div>
    </>
  )
}

/** How long to wait after the last slider movement before saving. */
const AUTOSAVE_DELAY_MS = 700

/**
 * Edits a variant's factorConfig. Read-only while a job is in flight.
 *
 * Changes save themselves (see auto-save below) — there is no save button.
 * `lastRunConfig` is the frozen factor state of the last run
 * (`PlanningRun.factorConfigSnapshot`) and is the reference point for „Änderungen verwerfen".
 */
export const FactorEditorPanel = (props: {
  variantId: number
  areaId: number
  factorConfig: FactorConfig
  lastRunConfig?: FactorConfig | null
  readOnly?: boolean
  defaultOpen?: boolean
  parkingDataAvailable?: boolean
}) => <FactorEditorPanelForm key={props.variantId} {...props} />

const FactorEditorPanelForm = ({
  variantId,
  areaId,
  factorConfig,
  lastRunConfig,
  readOnly = false,
  defaultOpen = true,
  parkingDataAvailable = true,
}: {
  variantId: number
  areaId: number
  factorConfig: FactorConfig
  lastRunConfig?: FactorConfig | null
  readOnly?: boolean
  defaultOpen?: boolean
  parkingDataAvailable?: boolean
}) => {
  const regionSlug = useRegionSlug()
  const queryClient = useQueryClient()
  const [config, setConfig] = useState<FactorConfig>(factorConfig)
  const [open, setOpen] = useState(defaultOpen)
  const [prevReadOnly, setPrevReadOnly] = useState(readOnly)
  const { setFactorSavePending } = useSpaceFinderBoundaryActions()
  // Fingerprint of the state last sent to the server — comparing it with the current draft drives
  // auto-save, the discard button and the lock on „Neu berechnen".
  const [savedFingerprint, setSavedFingerprint] = useState(() => factorFingerprint(factorConfig))

  if (readOnly !== prevReadOnly) {
    setPrevReadOnly(readOnly)
    setOpen(!readOnly)
  }

  // Area fields (geometry, user datasets, use case, size) are only changed by the area form; the
  // draft here only holds them for display. When a new area state arrives from the server (e.g.
  // another dataset), it is adopted without touching unsaved factors.
  const [syncedAreaConfig, setSyncedAreaConfig] = useState(factorConfig)
  if (
    syncedAreaConfig.study_area !== factorConfig.study_area ||
    syncedAreaConfig.user_datasets !== factorConfig.user_datasets ||
    syncedAreaConfig.use_case !== factorConfig.use_case ||
    syncedAreaConfig.area_size_m2 !== factorConfig.area_size_m2
  ) {
    setSyncedAreaConfig(factorConfig)
    // Sync strengths like the server does (`syncEigendatenWeights`): new datasets get the
    // initial value, removed ones are dropped, unsaved values stay.
    setConfig((c) =>
      syncEigendatenWeights(
        {
          ...c,
          study_area: factorConfig.study_area,
          user_datasets: factorConfig.user_datasets,
          use_case: factorConfig.use_case,
          area_size_m2: factorConfig.area_size_m2,
        },
        factorConfig.user_datasets,
      ),
    )
  }

  const toVariantConfig = (c: FactorConfig) => {
    const { study_area: _sa, user_datasets: _ud, use_case: _uc, area_size_m2: _as, ...rest } = c
    const stripped: VariantFactorConfig = rest
    return stripped
  }

  const mutation = useMutation({
    mutationFn: (next: FactorConfig) =>
      updatePlanningVariantFn({
        data: {
          variantId,
          // `min_area_m2` belongs to the area search filter; the server keeps the stored value.
          factorConfig: toVariantConfig(next),
        },
      }),
    onSuccess: () => {
      toastSuccess('Faktoren gespeichert', { id: 'planning-factors-saved' })
      queryClient.invalidateQueries(planningVariantQueryOptions(variantId))
      queryClient.invalidateQueries(planningAreasQueryOptions(regionSlug))
      queryClient.invalidateQueries(planningAreaQueryOptions(areaId))
    },
    onError: (error) => {
      // Drop the fingerprint: the server doesn't have this state — the next change should trigger
      // a full save attempt again, and „Neu berechnen" stays locked.
      setSavedFingerprint('')
      toastError(error, 'Faktoren konnten nicht gespeichert werden')
    },
  })

  const { mutate } = mutation
  const save = (next: FactorConfig) => {
    setSavedFingerprint(factorFingerprint(next))
    mutate(next)
  }
  const saveDraft = useEffectEvent((next: FactorConfig) => {
    save(next)
  })

  const unsavedFactors = factorFingerprint(config) !== savedFingerprint

  // Auto-save: every factor change saves itself after a short pause. The timer merges
  // dragging a slider into a single write.
  useEffect(
    function autosaveUnsavedFactors() {
      if (readOnly || !unsavedFactors) return
      const timeout = setTimeout(() => saveDraft(config), AUTOSAVE_DELAY_MS)
      return function cancelAutosave() {
        clearTimeout(timeout)
      }
    },
    [config, readOnly, unsavedFactors],
  )

  // No computation may start while something is unsaved or being written.
  useEffect(
    function syncFactorSavePendingToMapStore() {
      setFactorSavePending(unsavedFactors || mutation.isPending)
      return function clearFactorSavePending() {
        setFactorSavePending(false)
      }
    },
    [unsavedFactors, mutation.isPending, setFactorSavePending],
  )

  const setWeights = (weights: Record<string, number>) => setConfig((c) => ({ ...c, weights }))

  const setField = (key: keyof FactorConfig, value: number | boolean) =>
    setConfig((c) => ({
      ...c,
      [key]: value,
      // The census suggestion only applies while the field is untouched — once someone types a
      // number, it is stored as a user value in the variant (see `stripAutoSaettigung`).
      ...(key === 'bewohnerbedarf_saettigung_ew' && { bewohnerbedarf_saettigung_auto: false }),
    }))

  const restoreAutoSaettigung = () =>
    setConfig((c) =>
      c.bewohnerbedarf_saettigung_auto_ew == null
        ? c
        : {
            ...c,
            bewohnerbedarf_saettigung_ew: c.bewohnerbedarf_saettigung_auto_ew,
            bewohnerbedarf_saettigung_auto: true,
          },
    )

  const setVegetationDirection = (value: 'positive' | 'negative') =>
    setConfig((c) => ({ ...c, vegetation_direction: value }))

  const setPlatzDirection = (value: 'positive' | 'negative') =>
    setConfig((c) => ({ ...c, platz_direction: value }))

  const setZielortShares = (shares: ZielortShares) =>
    setConfig((c) => ({ ...c, zielort_category_shares: shares }))

  const setOepnvShares = (shares: OepnvShares) =>
    setConfig((c) => ({ ...c, oepnv_category_shares: shares }))

  // The strength per dataset is part of the variant and goes through its auto-save. Name, mode and
  // geometry of the datasets belong to the Planungsgebiet and are changed in the area form.
  const setEigendatenWeight = (id: string, value: number) =>
    setConfig((c) => ({ ...c, eigendaten_weights: { ...c.eigendaten_weights, [id]: value } }))

  const resetWeightsToDefaults = () => {
    setConfig((c) => ({
      ...c,
      ...DEFAULT_FACTOR_TEMPLATE,
      // For saturation, default means: back to the area's census suggestion. Only where there is
      // none does the worker default value stay.
      bewohnerbedarf_saettigung_ew:
        c.bewohnerbedarf_saettigung_auto_ew ?? c.bewohnerbedarf_saettigung_ew,
      bewohnerbedarf_saettigung_auto: c.bewohnerbedarf_saettigung_auto_ew != null,
      // For "Eigene Daten", default means: the initial strength per dataset.
      eigendaten_weights: syncEigendatenWeights<VariantFactorConfig>({}, c.user_datasets)
        .eigendaten_weights,
      study_area: c.study_area,
      user_datasets: c.user_datasets,
      use_case: c.use_case,
      area_size_m2: c.area_size_m2,
    }))
  }

  // Reference point for „Änderungen verwerfen": the factor state the last run computed with.
  // Before the first run there is no snapshot — then the state when opening the variant applies
  // (after that only „Auf Standardwerte zurücksetzen" remains).
  const [openedWithConfig] = useState(factorConfig)
  const discardBase = lastRunConfig ?? openedWithConfig
  const canDiscard = factorsDiffer(config, discardBase)

  const discardChanges = () => {
    // The variant state comes entirely from the reference point, not layered over the draft: if an
    // optional field is missing there (e.g. `eigendaten_weights` when no strength was set at run
    // time), it must be dropped from the draft too. Only the area fields are kept from the draft.
    const restored: FactorConfig = {
      ...toVariantConfig(discardBase),
      study_area: config.study_area,
      user_datasets: config.user_datasets,
      use_case: config.use_case,
      area_size_m2: config.area_size_m2,
      min_area_m2: factorConfig.min_area_m2,
    }
    setConfig(restored)
    save(restored) // immediately, not after the auto-save pause
  }

  return (
    <Disclosure as="div" className={collapsibleBoxClass(open)}>
      <DisclosureButton
        onClick={() => setOpen((v) => !v)}
        className={collapsibleBoxHeaderClass(open, !open)}
      >
        <div className="flex w-full items-center gap-2">
          <span className="flex-1">Faktoren</span>
          <CollapsibleBoxChevron open={open} />
        </div>
        {/* When collapsed, the weights aren't visible — so the second line shows the share of
            both groups in the base score (like the group headings in the open form). */}
        {!open && <GroupShareChips config={config} />}
      </DisclosureButton>

      <Transition
        show={open}
        enter="transition duration-100 ease-out"
        enterFrom="transform scale-95 opacity-0"
        enterTo="transform scale-100 opacity-100"
        leave="transition duration-75 ease-out"
        leaveFrom="transform scale-100 opacity-100"
        leaveTo="transform scale-95 opacity-0"
      >
        <DisclosurePanel static className="flex flex-col gap-3 p-2.5 text-sm">
          {readOnly && (
            <p className="rounded bg-gray-50 px-2 py-1.5 text-xs text-gray-500">
              Faktoren gesperrt — Berechnung wurde gestartet.
            </p>
          )}

          <FactorFields
            config={config}
            setWeights={setWeights}
            setField={setField}
            restoreAutoSaettigung={restoreAutoSaettigung}
            setVegetationDirection={setVegetationDirection}
            setPlatzDirection={setPlatzDirection}
            setZielortShares={setZielortShares}
            setOepnvShares={setOepnvShares}
            setEigendatenWeight={setEigendatenWeight}
            onReset={readOnly ? undefined : resetWeightsToDefaults}
            readOnly={readOnly}
            parkingDataAvailable={parkingDataAvailable}
          />

          {!readOnly && canDiscard && (
            <div className={spaceFinderDiscardRowClass}>
              <button
                type="button"
                onClick={discardChanges}
                className={spaceFinderDiscardLinkClass}
              >
                Änderungen verwerfen
              </button>
            </div>
          )}
        </DisclosurePanel>
      </Transition>
    </Disclosure>
  )
}
