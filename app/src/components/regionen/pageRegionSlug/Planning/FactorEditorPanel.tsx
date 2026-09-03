import { Disclosure, DisclosureButton, DisclosurePanel, Transition } from '@headlessui/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { twJoin } from 'tailwind-merge'
import { toastError } from '@/components/shared/toast/toastError'
import type { FactorConfig, VariantFactorConfig } from '@/server/planning/planning.functions'
import { updatePlanningAreaFn, updatePlanningVariantFn } from '@/server/planning/planning.functions'
import {
  planningAreaQueryOptions,
  planningVariantQueryOptions,
} from '@/server/planning/planningQueryOptions'
import { usePlanningBoundaryState } from '../hooks/mapState/usePlanningBoundaryState'
import { DisclosureChevron } from './CollapsibleBox'
import { factorFingerprint, factorsDiffer } from './factorFingerprint'
import { InfoTooltip } from './InfoTooltip'
import {
  DEFAULT_FACTOR_TEMPLATE,
  FACTOR_HELP,
  FACTOR_PARAMS,
  GROUP_HELP,
  PARKING_DATA_DEPENDENT_KEYS,
  WEIGHT_GROUPS,
  WEIGHT_LABELS,
} from './planningDefaults'
import {
  planningDisclosureBoxClass,
  planningDisclosureHeaderClass,
  planningGroupStyle,
  planningNumberInputClass,
} from './planningPanelStyles'
import { SegmentedChoice } from './SegmentedChoice'
import { USER_GEOJSON_MODES, type UserGeojsonMode } from './UserObstaclesField'
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

/** Hinweis unter den Parkdaten-abhängigen Faktoren, wenn `parkingDataAvailable` false ist —
 * siehe [[PARKING_DATA_DEPENDENT_KEYS]] in planningDefaults.ts. */
const PARKING_DATA_HINT = 'Keine Parkdaten für dieses Gebiet verfügbar — Faktor hier deaktiviert.'

const FactorInfo = ({ factorKey, extra }: { factorKey: string; extra?: string }) => {
  const text = [FACTOR_HELP[factorKey], extra].filter(Boolean).join(' ')
  if (!text) return null
  return <InfoTooltip>{text}</InfoTooltip>
}

/** Basis der Blocküberschriften; die Farbe kommt je Block dazu (Faktorgruppen farbig, Rest grau). */
const groupHeadlineBaseClass =
  'flex items-baseline justify-between gap-2 border-b pb-0.5 text-sm font-bold'

const groupHeadlineClass = twJoin(groupHeadlineBaseClass, 'border-gray-200 text-gray-800')

/**
 * Anteil beider Faktorgruppen am Grundscore als farbige Chips — die Kurzfassung der
 * Gruppenüberschriften für den zugeklappten Faktoren-Kopf.
 */
const GroupShareChips = ({ weights }: { weights: Record<string, number> | undefined }) => {
  const shares = criterionShares(weights)
  return (
    <div className="flex w-full items-center gap-1.5">
      {WEIGHT_GROUPS.map((group) => (
        <span
          key={group.key}
          className={twJoin(
            'rounded px-1.5 py-0.5 text-[11px] font-medium',
            planningGroupStyle[group.key].chip,
          )}
        >
          {group.label}{' '}
          <span className="font-bold tabular-nums">
            {Math.round(groupShare(shares, group.criteria))} %
          </span>
        </span>
      ))}
    </div>
  )
}

/**
 * Herkunftshinweis unter der Bewohnerbedarf-Sättigung. Der Wert wird je Planungsgebiet einmal aus
 * dem Zensus geschätzt (siehe `censusSaettigung.server.ts`) und gilt für alle seine Varianten,
 * solange ihn niemand überschreibt — deshalb zwei Zustände: „automatisch ermittelt" und
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
        <label className="flex items-center justify-between gap-2 text-xs text-gray-600">
          <span className={disabled ? 'text-gray-400' : ''}>{label}</span>
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
            className={planningNumberInputClass}
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

/** Gewichte-/Schwellen-Formularfelder (ohne Geometrie / eigene Flächen). */
const FactorFields = ({
  config,
  setWeights,
  setField,
  restoreAutoSaettigung,
  setVegetationDirection,
  setUserGeojsonMode,
  onReset,
  readOnly = false,
  parkingDataAvailable = true,
}: {
  config: FactorConfig
  setWeights: (weights: Record<string, number>) => void
  setField: (key: keyof FactorConfig, value: number | boolean) => void
  restoreAutoSaettigung: () => void
  setVegetationDirection: (value: 'positive' | 'negative') => void
  setUserGeojsonMode: (mode: UserGeojsonMode) => void
  onReset?: () => void
  readOnly?: boolean
  parkingDataAvailable?: boolean
}) => {
  const weights = config.weights ?? {}
  const vegetationDirection = config.vegetation_direction ?? 'negative'
  const eigendatenMode = (config.user_geojson_mode ?? 'bonus') as UserGeojsonMode
  const setWeightFromWeights = (key: string, value: number) =>
    setWeights({ ...weights, [key]: value })
  const shares = criterionShares(weights)
  const points = modifierPointRange(weights, vegetationDirection)

  return (
    <>
      <div>
        <div className="mb-1 font-semibold">Gewichtung der Faktoren</div>
        {!readOnly && <WeightScaleLegend />}
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="mb-1 text-xs font-medium text-gray-500 hover:text-gray-800"
          >
            Auf Standardwerte zurücksetzen
          </button>
        )}
        {WEIGHT_GROUPS.map((group) => (
          // Farbiger Streifen + zarte Tönung je Gruppe: im langen Formular ist sonst nicht auf
          // einen Blick zu sehen, wo Bedarf aufhört und Bebauung anfängt. Gleiche Farben wie die
          // Anteil-Chips im zugeklappten Kopf.
          <div
            key={group.key}
            className={twJoin(
              'mt-3 rounded-r border-l-[3px] py-1.5 pr-1 pl-2 first:mt-0',
              planningGroupStyle[group.key].block,
            )}
          >
            <div className={twJoin(groupHeadlineBaseClass, planningGroupStyle[group.key].headline)}>
              <span className="flex items-center gap-1">
                {group.label}
                <InfoTooltip>{GROUP_HELP[group.key]}</InfoTooltip>
              </span>
              <span className="text-xs font-normal text-gray-500 tabular-nums">
                {Math.round(groupShare(shares, group.criteria))} % des Grundscores
              </span>
            </div>

            <div className="mt-1 text-[11px] tracking-wide text-gray-400 uppercase">Kriterien</div>
            {group.criteria.map((key) => (
              <CriterionSlider
                key={key}
                label={WEIGHT_LABELS[key] ?? key}
                weight={weights[key]}
                sharePct={shares[key] ?? 0}
                onChange={(value) => setWeightFromWeights(key, value)}
                readOnly={readOnly}
                info={<FactorInfo factorKey={key} />}
                nested={
                  <FactorParamInputs
                    factorKey={key}
                    config={config}
                    weight={weights[key]}
                    setField={setField}
                    restoreAutoSaettigung={restoreAutoSaettigung}
                    readOnly={readOnly}
                  />
                }
              />
            ))}
            {group.comingSoon?.map((key) => (
              <ComingSoonFactorRow
                key={key}
                label={WEIGHT_LABELS[key] ?? key}
                info={<FactorInfo factorKey={key} />}
              />
            ))}

            <div className="mt-1.5 text-[11px] tracking-wide text-gray-400 uppercase">
              Zu- und Abschläge
            </div>
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
              return (
                <ModifierSlider
                  key={key}
                  label={WEIGHT_LABELS[key] ?? key}
                  weight={weights[key]}
                  direction={resolveModifierDirection(direction, vegetationDirection)}
                  onChange={(value) => setWeightFromWeights(key, value)}
                  readOnly={readOnly}
                  info={<FactorInfo factorKey={key} />}
                  nested={
                    key === 'w_vegetation' ? (
                      <>
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
                        <FactorParamInputs
                          factorKey={key}
                          config={config}
                          weight={weights[key]}
                          setField={setField}
                          restoreAutoSaettigung={restoreAutoSaettigung}
                          readOnly={readOnly}
                        />
                      </>
                    ) : (
                      <FactorParamInputs
                        factorKey={key}
                        config={config}
                        weight={weights[key]}
                        setField={setField}
                        restoreAutoSaettigung={restoreAutoSaettigung}
                        readOnly={readOnly}
                      />
                    )
                  }
                />
              )
            })}
          </div>
        ))}
        <p className="mt-2 text-[11px] text-gray-500">
          Zu- und Abschläge zusammen: max.{' '}
          <span className="font-semibold text-black">+{points.plus}</span> /{' '}
          <span className="font-semibold text-black">−{points.minus}</span> Punkte auf den
          Grundscore.
        </p>
      </div>

      {config.user_geojson != null && (
        <div>
          <div className={groupHeadlineClass}>
            <span className="flex items-center gap-1">
              Eigene Daten
              <InfoTooltip>{GROUP_HELP.eigendaten}</InfoTooltip>
            </span>
          </div>
          <div className="mt-1">
            <SegmentedChoice
              options={USER_GEOJSON_MODES}
              value={eigendatenMode}
              onChange={setUserGeojsonMode}
              disabled={readOnly}
              className="grid grid-cols-2 gap-1.5"
            />
          </div>
          {(eigendatenMode === 'bonus' || eigendatenMode === 'penalty') && (
            <ModifierSlider
              label="Stärke"
              weight={weights.w_eigendaten}
              direction={eigendatenMode === 'penalty' ? 'negative' : 'positive'}
              onChange={(value) => setWeightFromWeights('w_eigendaten', value)}
              readOnly={readOnly}
              info={<FactorInfo factorKey="w_eigendaten" />}
            />
          )}
        </div>
      )}

      <div>
        <div className={groupHeadlineClass}>
          <span>Allgemein</span>
        </div>
        <div className="mt-1 space-y-2">
          <label className="flex items-center justify-between gap-2 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              Mindest-Score (Flächensuche)
              <InfoTooltip>{FACTOR_HELP.min_score_threshold}</InfoTooltip>
            </div>
            <input
              type="number"
              step={5}
              value={Number(config.min_score_threshold ?? 0)}
              disabled={readOnly}
              onChange={(e) => setField('min_score_threshold', Number(e.target.value))}
              className={planningNumberInputClass}
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

/** Wie lange nach der letzten Reglerbewegung gewartet wird, bevor gespeichert wird. */
const AUTOSAVE_DELAY_MS = 700

/**
 * Edits a variant's factorConfig. Read-only while a job is in flight.
 *
 * Änderungen speichern sich selbst (siehe Auto-Save unten) — es gibt keinen Speichern-Button.
 * `lastRunConfig` ist der eingefrorene Faktorenstand des letzten Laufs
 * (`PlanningRun.factorConfigSnapshot`) und dient als Bezugspunkt für „Änderungen verwerfen".
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
  const queryClient = useQueryClient()
  const [config, setConfig] = useState<FactorConfig>(factorConfig)
  const [open, setOpen] = useState(defaultOpen)
  const prevReadOnly = useRef(readOnly)
  const setFactorSavePending = usePlanningBoundaryState((s) => s.setFactorSavePending)
  // Fingerprint des Stands, der zuletzt an den Server geschickt wurde — der Vergleich mit dem
  // aktuellen Entwurf steuert Auto-Save, Verwerfen-Button und die Sperre von „Neu berechnen".
  const [savedFingerprint, setSavedFingerprint] = useState(() => factorFingerprint(factorConfig))

  useEffect(() => {
    if (!prevReadOnly.current && readOnly) setOpen(false)
    else if (prevReadOnly.current && !readOnly) setOpen(true)
    prevReadOnly.current = readOnly
  }, [readOnly])

  const toVariantConfig = (c: FactorConfig): VariantFactorConfig => {
    const {
      study_area: _sa,
      user_geojson: _ug,
      user_geojson_mode: _ugm,
      use_case: _uc,
      area_size_m2: _as,
      ...rest
    } = c
    return rest
  }

  const mutation = useMutation({
    mutationFn: (next: FactorConfig) =>
      updatePlanningVariantFn({
        data: {
          variantId,
          // `min_area_m2` wird außerhalb dieses Formulars (Flächensuche-Filter) gepflegt —
          // immer der frische Prop-Wert, damit der lokale Entwurf ihn nicht zurückdreht.
          factorConfig: toVariantConfig({ ...next, min_area_m2: factorConfig.min_area_m2 }),
        },
      }),
    onSuccess: () => {
      toast.success('Faktoren gespeichert', { id: 'planning-factors-saved' })
      queryClient.invalidateQueries(planningVariantQueryOptions(variantId))
    },
    onError: (error) => {
      // Fingerprint verwerfen: der Server hat den Stand nicht — die nächste Änderung soll wieder
      // einen vollständigen Speicherversuch auslösen, und „Neu berechnen" bleibt gesperrt.
      setSavedFingerprint('')
      toastError(error, 'Faktoren konnten nicht gespeichert werden')
    },
  })

  const { mutate } = mutation
  const save = useCallback(
    (next: FactorConfig) => {
      setSavedFingerprint(factorFingerprint(next))
      mutate(next)
    },
    [mutate],
  )

  const unsavedFactors = factorFingerprint(config) !== savedFingerprint

  // Auto-Save: jede Faktorenänderung speichert sich nach kurzer Ruhepause von selbst. Der Timer
  // fasst das Ziehen eines Reglers zu einem einzigen Schreibvorgang zusammen.
  useEffect(() => {
    if (readOnly || !unsavedFactors) return
    const timeout = setTimeout(() => save(config), AUTOSAVE_DELAY_MS)
    return () => clearTimeout(timeout)
  }, [config, readOnly, unsavedFactors, save])

  // Solange etwas ungespeichert ist oder gerade geschrieben wird, darf keine Berechnung starten.
  useEffect(() => {
    setFactorSavePending(unsavedFactors || mutation.isPending)
    return () => setFactorSavePending(false)
  }, [unsavedFactors, mutation.isPending, setFactorSavePending])

  const setWeights = (weights: Record<string, number>) => setConfig((c) => ({ ...c, weights }))

  const setField = (key: keyof FactorConfig, value: number | boolean) =>
    setConfig((c) => ({
      ...c,
      [key]: value,
      // Der Zensus-Vorschlag gilt nur, solange das Feld unangetastet ist — sobald jemand eine Zahl
      // eintippt, wird sie als Nutzerwert in der Variante gespeichert (siehe `stripAutoSaettigung`).
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

  // `user_geojson_mode` gehört zum Planungsgebiet (nicht zur Variante, siehe `toVariantConfig`
  // oben) — er geht deshalb an eine eigene Mutation und wirkt auf alle Varianten dieses
  // Planungsgebiets, statt wie die Gewichte über den Auto-Save der Variante zu laufen.
  const eigendatenModeMutation = useMutation({
    mutationFn: (mode: UserGeojsonMode) =>
      updatePlanningAreaFn({ data: { areaId, userGeojson: undefined, userGeojsonMode: mode } }),
    onSuccess: () => {
      queryClient.invalidateQueries(planningAreaQueryOptions(areaId))
      queryClient.invalidateQueries(planningVariantQueryOptions(variantId))
    },
  })

  const setUserGeojsonMode = (mode: UserGeojsonMode) => {
    setConfig((c) => ({ ...c, user_geojson_mode: mode }))
    eigendatenModeMutation.mutate(mode)
  }

  const resetWeightsToDefaults = () => {
    setConfig((c) => ({
      ...c,
      ...DEFAULT_FACTOR_TEMPLATE,
      // Standard heißt für die Sättigung: zurück auf den Zensus-Vorschlag des Gebiets. Nur wo es
      // keinen gibt, bleibt der Wert aus dem Worker-Default stehen.
      bewohnerbedarf_saettigung_ew:
        c.bewohnerbedarf_saettigung_auto_ew ?? c.bewohnerbedarf_saettigung_ew,
      bewohnerbedarf_saettigung_auto: c.bewohnerbedarf_saettigung_auto_ew != null,
      study_area: c.study_area,
      user_geojson: c.user_geojson,
      user_geojson_mode: c.user_geojson_mode,
      use_case: c.use_case,
      area_size_m2: c.area_size_m2,
    }))
  }

  // Bezugspunkt für „Änderungen verwerfen": der Faktorenstand, mit dem der letzte Lauf gerechnet
  // hat. Vor dem ersten Lauf gibt es keinen Snapshot — dann gilt der Stand beim Öffnen der
  // Variante (danach bleibt nur „Auf Standardwerte zurücksetzen").
  const [openedWithConfig] = useState(factorConfig)
  const discardBase = lastRunConfig ?? openedWithConfig
  const canDiscard = factorsDiffer(config, discardBase)

  const discardChanges = () => {
    const restored: FactorConfig = {
      ...config,
      ...toVariantConfig(discardBase),
      min_area_m2: factorConfig.min_area_m2,
    }
    setConfig(restored)
    save(restored) // sofort, nicht erst nach der Auto-Save-Pause
  }

  return (
    <Disclosure as="div" className={planningDisclosureBoxClass(open)}>
      <DisclosureButton
        as="div"
        onClick={() => setOpen((v) => !v)}
        className={planningDisclosureHeaderClass(open, !open)}
      >
        <div className="flex w-full items-center gap-2">
          <span className="flex-1">Faktoren</span>
          <DisclosureChevron open={open} />
        </div>
        {/* Zugeklappt ist nicht zu sehen, wie die Gewichte stehen — die zweite Zeile zeigt
            deshalb den Anteil beider Gruppen am Grundscore (wie die Gruppenüberschriften im
            geöffneten Formular). */}
        {!open && <GroupShareChips weights={config.weights} />}
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
            setUserGeojsonMode={setUserGeojsonMode}
            onReset={readOnly ? undefined : resetWeightsToDefaults}
            readOnly={readOnly}
            parkingDataAvailable={parkingDataAvailable}
          />

          {!readOnly && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={discardChanges}
                disabled={!canDiscard}
                className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-default disabled:opacity-40"
              >
                Änderungen verwerfen
              </button>
              <span className="text-xs text-gray-500">
                {unsavedFactors || mutation.isPending
                  ? 'Speichern…'
                  : 'Änderungen werden automatisch gespeichert'}
              </span>
            </div>
          )}
        </DisclosurePanel>
      </Transition>
    </Disclosure>
  )
}
