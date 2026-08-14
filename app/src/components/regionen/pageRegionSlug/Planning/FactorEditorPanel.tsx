import { Disclosure, DisclosureButton, DisclosurePanel, Transition } from '@headlessui/react'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { twJoin } from 'tailwind-merge'
import type { FactorConfig, VariantFactorConfig } from '@/server/planning/planning.functions'
import { updatePlanningVariantFn } from '@/server/planning/planning.functions'
import { planningVariantQueryOptions } from '@/server/planning/planningQueryOptions'
import { InfoTooltip } from './InfoTooltip'
import {
  DEFAULT_FACTOR_TEMPLATE,
  FACTOR_HELP,
  FACTOR_PARAMS,
  GROUP_HELP,
  PLANNING_USE_CASES,
  type PlanningUseCase,
  WEIGHT_GROUPS,
  WEIGHT_LABELS,
} from './planningDefaults'
import { planningNumberInputClass } from './planningPanelStyles'
import { SegmentedChoice } from './SegmentedChoice'
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

/** Gewichte-/Schwellen-Formularfelder (ohne Geometrie / eigene Flächen). */
const FactorFields = ({
  config,
  setWeights,
  setField,
  setVegetationDirection,
  readOnly = false,
}: {
  config: FactorConfig
  setWeights: (weights: Record<string, number>) => void
  setField: (key: keyof FactorConfig, value: number | boolean) => void
  setVegetationDirection: (value: 'positive' | 'negative') => void
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

const UseCaseFields = ({
  config,
  setUseCase,
  setAreaSizeM2,
  readOnly,
}: {
  config: FactorConfig
  setUseCase: (key: PlanningUseCase) => void
  setAreaSizeM2: (value: number | null) => void
  readOnly: boolean
}) => {
  const useCase = (config.use_case as PlanningUseCase | undefined) ?? 'fahrradbox'
  const areaSizeM2 = (config.area_size_m2 as number | null | undefined) ?? null

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-gray-700">Art & Größe der gesuchten Fläche</div>
      <div className="grid grid-cols-2 gap-1.5">
        {PLANNING_USE_CASES.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            disabled={readOnly}
            onClick={() => {
              setUseCase(key)
              const defaultAreaM2 = PLANNING_USE_CASES.find((u) => u.key === key)?.defaultAreaM2
              if (defaultAreaM2 != null) setAreaSizeM2(defaultAreaM2)
            }}
            className={twJoin(
              'rounded border px-2 py-1.5 text-xs font-medium transition-colors disabled:opacity-50',
              useCase === key
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <label className="flex items-center justify-between gap-2 text-xs text-gray-600">
        <span>Flächengröße (m²)</span>
        <input
          type="number"
          min={0}
          step={1}
          disabled={readOnly}
          value={areaSizeM2 ?? ''}
          onChange={(e) => setAreaSizeM2(e.target.value === '' ? null : Number(e.target.value))}
          className={planningNumberInputClass}
        />
      </label>
    </div>
  )
}

/** Edits a variant's factorConfig. Read-only while a job is in flight. */
export const FactorEditorPanel = (props: {
  variantId: number
  factorConfig: FactorConfig
  readOnly?: boolean
  defaultOpen?: boolean
}) => <FactorEditorPanelForm key={props.variantId} {...props} />

const FactorEditorPanelForm = ({
  variantId,
  factorConfig,
  readOnly = false,
  defaultOpen = true,
}: {
  variantId: number
  factorConfig: FactorConfig
  readOnly?: boolean
  defaultOpen?: boolean
}) => {
  const queryClient = useQueryClient()
  const [config, setConfig] = useState<FactorConfig>(factorConfig)
  const [open, setOpen] = useState(defaultOpen)
  const prevReadOnly = useRef(readOnly)

  useEffect(() => {
    if (!prevReadOnly.current && readOnly) setOpen(false)
    else if (prevReadOnly.current && !readOnly) setOpen(true)
    prevReadOnly.current = readOnly
  }, [readOnly])

  const toVariantConfig = (c: FactorConfig): VariantFactorConfig => {
    const { study_area: _sa, user_geojson: _ug, user_geojson_mode: _ugm, ...rest } = c
    return rest
  }

  const mutation = useMutation({
    mutationFn: () =>
      updatePlanningVariantFn({ data: { variantId, factorConfig: toVariantConfig(config) } }),
    onSuccess: () => queryClient.invalidateQueries(planningVariantQueryOptions(variantId)),
  })

  const setWeights = (weights: Record<string, number>) => setConfig((c) => ({ ...c, weights }))

  const setField = (key: keyof FactorConfig, value: number | boolean) =>
    setConfig((c) => ({ ...c, [key]: value }))

  const setVegetationDirection = (value: 'positive' | 'negative') =>
    setConfig((c) => ({ ...c, vegetation_direction: value }))

  const setUseCase = (key: PlanningUseCase) => setConfig((c) => ({ ...c, use_case: key }))

  const setAreaSizeM2 = (value: number | null) => setConfig((c) => ({ ...c, area_size_m2: value }))

  const resetWeightsToDefaults = () => {
    setConfig((c) => ({
      ...c,
      ...DEFAULT_FACTOR_TEMPLATE,
      use_case: c.use_case,
      area_size_m2: c.area_size_m2,
      study_area: c.study_area,
      user_geojson: c.user_geojson,
      user_geojson_mode: c.user_geojson_mode,
    }))
  }

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

          <UseCaseFields
            config={config}
            setUseCase={setUseCase}
            setAreaSizeM2={setAreaSizeM2}
            readOnly={readOnly}
          />

          <FactorFields
            config={config}
            setWeights={setWeights}
            setField={setField}
            setVegetationDirection={setVegetationDirection}
            readOnly={readOnly}
          />

          {!readOnly && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="rounded bg-gray-800 px-3 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-50"
              >
                {mutation.isPending ? 'Speichern…' : 'Faktoren speichern'}
              </button>
              <button
                type="button"
                onClick={resetWeightsToDefaults}
                className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Auf Standardwerte zurücksetzen
              </button>
              {mutation.isSuccess && <span className="text-xs text-green-700">Gespeichert ✓</span>}
            </div>
          )}
        </DisclosurePanel>
      </Transition>
    </Disclosure>
  )
}
