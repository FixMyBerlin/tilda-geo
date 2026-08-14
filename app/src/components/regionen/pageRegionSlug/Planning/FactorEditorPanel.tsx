import { Disclosure, DisclosureButton, DisclosurePanel, Transition } from '@headlessui/react'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { twJoin } from 'tailwind-merge'
import type { FactorConfig } from '@/server/planning/planning.functions'
import { updatePlanningScenarioFn } from '@/server/planning/planning.functions'
import { planningScenarioQueryOptions } from '@/server/planning/planningQueryOptions'
import { InfoTooltip } from './InfoTooltip'
import {
  FACTOR_HELP,
  FACTOR_PARAMS,
  GROUP_HELP,
  WEIGHT_GROUPS,
  WEIGHT_LABELS,
} from './planningDefaults'
import { planningNumberInputClass } from './planningPanelStyles'
import { SegmentedChoice } from './SegmentedChoice'
import { UserObstaclesField, type UserGeojsonMode } from './UserObstaclesField'
import {
  criterionShares,
  groupShare,
  modifierPointRange,
  resolveModifierDirection,
  weightToPoints,
  weightToStep,
} from './weightScale'
import { CriterionSlider, ModifierSlider, WeightScaleLegend } from './WeightSlider'

const FactorInfo = ({ factorKey }: { factorKey: string }) => {
  const text = FACTOR_HELP[factorKey]
  if (!text) return null
  return <InfoTooltip>{text}</InfoTooltip>
}

const groupHeadlineClass =
  'flex items-baseline justify-between gap-2 border-b border-gray-200 pb-0.5 text-sm font-bold text-gray-800'

const FactorParamInputs = ({
  factorKey,
  config,
  weight,
  setField,
  readOnly,
}: {
  factorKey: string
  config: FactorConfig
  weight: number | undefined
  setField: (key: keyof FactorConfig, value: number | boolean) => void
  readOnly: boolean
}) => {
  const params = FACTOR_PARAMS[factorKey]
  if (!params) return null

  const weightOff = weightToStep(weight) === 0 && weightToPoints(weight) === 0

  return params.map(({ key, label, step, alwaysEditable }) => {
    const disabled = readOnly || (weightOff && !alwaysEditable)
    return (
      <label
        key={String(key)}
        className="flex items-center justify-between gap-2 text-xs text-gray-600"
      >
        <span className={disabled ? 'text-gray-400' : ''}>{label}</span>
        <input
          type="number"
          step={step}
          value={Number(config[key] ?? 0)}
          disabled={disabled}
          onChange={(e) => setField(key, Number(e.target.value))}
          className={planningNumberInputClass}
        />
      </label>
    )
  })
}

/**
 * Gewichte-/Vegetations-/Schwellenwert-Formularfelder für ein `FactorConfig`. Ungestylte
 * Präsentationskomponente ohne eigenen State — wird sowohl vom `FactorEditorPanel` (Bearbeiten
 * eines bestehenden Szenarios) als auch von Schritt 3 des `PlanningWizard` (Neuanlage) verwendet.
 */
export const FactorFields = ({
  config,
  setWeights,
  setWeight,
  setField,
  setVegetationDirection,
  setUserGeojson,
  setUserGeojsonMode,
  readOnly = false,
}: {
  config: FactorConfig
  setWeights: (weights: Record<string, number>) => void
  setWeight: (key: string, value: number) => void
  setField: (key: keyof FactorConfig, value: number | boolean) => void
  setVegetationDirection: (value: 'positive' | 'negative') => void
  setUserGeojson: (geojson: GeoJSON.FeatureCollection | undefined) => void
  setUserGeojsonMode: (mode: UserGeojsonMode) => void
  readOnly?: boolean
}) => {
  const weights = config.weights ?? {}
  const vegetationDirection = config.vegetation_direction ?? 'negative'
  const setWeightFromWeights = (key: string, value: number) =>
    setWeights({ ...weights, [key]: value })
  const shares = criterionShares(weights)
  const points = modifierPointRange(weights, vegetationDirection)

  return (
    <>
      <div>
        <div className="mb-1 font-semibold">Gewichtung der Faktoren</div>
        {!readOnly && <WeightScaleLegend />}
        {WEIGHT_GROUPS.map((group) => (
          <div key={group.key} className="mt-3 first:mt-0">
            <div className={groupHeadlineClass}>
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
                    readOnly={readOnly}
                  />
                }
              />
            ))}

            <div className="mt-1.5 text-[11px] tracking-wide text-gray-400 uppercase">
              Zu- und Abschläge
            </div>
            {group.modifiers.map(({ key, direction }) => (
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
                        readOnly={readOnly}
                      />
                    </>
                  ) : (
                    <FactorParamInputs
                      factorKey={key}
                      config={config}
                      weight={weights[key]}
                      setField={setField}
                      readOnly={readOnly}
                    />
                  )
                }
              />
            ))}
          </div>
        ))}
        <p className="mt-2 text-[11px] text-gray-500">
          Zu- und Abschläge zusammen: max. <span className="font-semibold">+{points.plus}</span> /{' '}
          <span className="font-semibold">−{points.minus}</span> Punkte auf den Grundscore.
        </p>

        <div className="mt-3">
          <div className={groupHeadlineClass}>
            <span className="flex items-center gap-1">
              Eigene Daten
              <InfoTooltip>{GROUP_HELP.eigendaten}</InfoTooltip>
            </span>
          </div>
          <div className="mt-1">
            <UserObstaclesField
              config={config}
              setWeight={setWeight}
              setUserGeojson={setUserGeojson}
              setUserGeojsonMode={setUserGeojsonMode}
              readOnly={readOnly}
            />
          </div>
        </div>
      </div>

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
              disabled={readOnly}
              onChange={(e) => setField('exclude_carriageways', e.target.checked)}
              className="rounded border-gray-300"
            />
            Fahrbahnen ausschließen
            <InfoTooltip>
              Straßenflächen werden anhand ihrer erfassten oder geschätzten Breite als Fläche
              berechnet und aus den Hexagonen ausgeschlossen — dort ist keine Bebauung möglich,
              unabhängig von den übrigen Faktoren.
            </InfoTooltip>
          </label>
        </div>
      </div>
    </>
  )
}

/** Edits a scenario's factorConfig (weights + thresholds). Read-only once a job exists. */
export const FactorEditorPanel = ({
  scenarioId,
  factorConfig,
  readOnly = false,
}: {
  scenarioId: number
  factorConfig: FactorConfig
  readOnly?: boolean
}) => {
  const queryClient = useQueryClient()
  const [config, setConfig] = useState<FactorConfig>(factorConfig)
  const [open, setOpen] = useState(true)
  const prevReadOnly = useRef(readOnly)

  useEffect(() => {
    // Collapse when a run starts (locks factors); re-open when it finishes and
    // factors become editable again, so recomputing with new factors is discoverable.
    if (!prevReadOnly.current && readOnly) setOpen(false)
    else if (prevReadOnly.current && !readOnly) setOpen(true)
    prevReadOnly.current = readOnly
  }, [readOnly])

  const mutation = useMutation({
    mutationFn: () => updatePlanningScenarioFn({ data: { scenarioId, factorConfig: config } }),
    onSuccess: () => queryClient.invalidateQueries(planningScenarioQueryOptions(scenarioId)),
  })

  const setWeight = (key: string, value: number) =>
    setConfig((c) => ({ ...c, weights: { ...c.weights, [key]: value } }))

  const setWeights = (weights: Record<string, number>) => setConfig((c) => ({ ...c, weights }))

  const setField = (key: keyof FactorConfig, value: number | boolean) =>
    setConfig((c) => ({ ...c, [key]: value }))

  const setVegetationDirection = (value: 'positive' | 'negative') =>
    setConfig((c) => ({ ...c, vegetation_direction: value }))

  const setUserGeojson = (geojson: GeoJSON.FeatureCollection | undefined) =>
    setConfig((c) => ({ ...c, user_geojson: geojson }))
  const setUserGeojsonMode = (mode: UserGeojsonMode) =>
    setConfig((c) => ({ ...c, user_geojson_mode: mode }))

  return (
    <Disclosure as="div" className="rounded border border-gray-200">
      <DisclosureButton
        as="div"
        onClick={() => setOpen((v) => !v)}
        className={twJoin(
          'flex w-full cursor-pointer items-center justify-between px-2.5 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50',
          open ? 'border-b border-gray-200' : '',
        )}
      >
        <span>Faktoren</span>
        <ChevronRightIcon
          className={twJoin('size-4 text-gray-500 transition-transform', open ? 'rotate-90' : '')}
        />
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
            setWeight={setWeight}
            setField={setField}
            setVegetationDirection={setVegetationDirection}
            setUserGeojson={setUserGeojson}
            setUserGeojsonMode={setUserGeojsonMode}
            readOnly={readOnly}
          />

          {!readOnly && (
            <>
              <button
                type="button"
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="rounded bg-gray-800 px-3 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-50"
              >
                {mutation.isPending ? 'Speichern…' : 'Faktoren speichern'}
              </button>
              {mutation.isSuccess && <span className="text-xs text-green-700">Gespeichert ✓</span>}
            </>
          )}
        </DisclosurePanel>
      </Transition>
    </Disclosure>
  )
}
