import { Disclosure, DisclosureButton, DisclosurePanel, Transition } from '@headlessui/react'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { twJoin } from 'tailwind-merge'
import type { FactorConfig } from '@/server/planning/planning.functions'
import { updatePlanningScenarioFn } from '@/server/planning/planning.functions'
import { planningScenarioQueryOptions } from '@/server/planning/planningQueryOptions'
import { InfoTooltip } from './InfoTooltip'
import { WEIGHT_GROUPS, WEIGHT_LABELS } from './planningDefaults'
import { SegmentedChoice } from './SegmentedChoice'
import { UserObstaclesField, type UserGeojsonMode } from './UserObstaclesField'
import { WeightScaleLegend, WeightSlider } from './WeightSlider'

const THRESHOLD_FIELDS: { key: keyof FactorConfig; label: string; step: number }[] = [
  { key: 'max_cyclepath_dist_m', label: 'Max. Radwegdistanz (m)', step: 10 },
  { key: 'min_surface_score', label: 'Min. Untergrund-Score', step: 5 },
  { key: 'intersection_radius_m', label: 'Kreuzungs-Radius (m)', step: 5 },
  { key: 'parken_radius_m', label: 'Parken-Radius (m)', step: 5 },
  { key: 'fussgaengerzone_radius_m', label: 'Fußgängerzonen-Radius (m)', step: 5 },
  { key: 'bestand_default_diameter_m', label: 'Bestand: Standard-Durchmesser (m)', step: 5 },
  { key: 'min_score_threshold', label: 'Mindest-Score (Flächensuche)', step: 5 },
]

/**
 * Gewichte-/Vegetations-/Schwellenwert-Formularfelder für ein `FactorConfig`. Ungestylte
 * Präsentationskomponente ohne eigenen State — wird sowohl vom `FactorEditorPanel` (Bearbeiten
 * eines bestehenden Szenarios) als auch von Schritt 3 des `PlanningWizard` (Neuanlage) verwendet.
 */
export const FactorFields = ({
  config,
  setWeight,
  setField,
  setVegetationDirection,
  readOnly = false,
}: {
  config: FactorConfig
  setWeight: (key: string, value: number) => void
  setField: (key: keyof FactorConfig, value: number) => void
  setVegetationDirection: (value: 'positive' | 'negative') => void
  readOnly?: boolean
}) => {
  const weights = config.weights ?? {}
  const vegetationDirection = config.vegetation_direction ?? 'negative'

  return (
    <>
      <div>
        <div className="mb-1 flex items-center gap-1 font-semibold">
          Wichtigkeit der Faktoren
          <InfoTooltip>
            Bestimmen die relative Bedeutung jedes Faktors bei der Standortbewertung — in ganzen
            Stufen von 0 (sehr unwichtig, fließt nicht ein) bis 10 (sehr wichtig).
          </InfoTooltip>
        </div>
        {!readOnly && <WeightScaleLegend />}
        {WEIGHT_GROUPS.map((group) => (
          <div key={group.key} className="mt-2 first:mt-0">
            <div className="mb-0.5 border-b border-gray-200 pb-0.5 text-xs font-semibold text-gray-500 uppercase">
              {group.label}
            </div>
            {group.weights.map((key) => (
              <WeightSlider
                key={key}
                label={WEIGHT_LABELS[key] ?? key}
                weight={weights[key]}
                onChange={(value) => setWeight(key, value)}
                readOnly={readOnly}
              />
            ))}
          </div>
        ))}
      </div>

      <div>
        <div className="mb-1 font-semibold">Vegetation (NDVI)</div>
        <p className="mb-1.5 text-xs text-gray-500">
          „Grün schützen“ zieht je nach Bedeckungsgrad Punkte ab (Gesamtscore nie unter 0), „Grün
          bevorzugen“ vergibt Bonuspunkte. Jede Stufe der Wichtigkeit „Vegetation“ entspricht
          maximal 10 Punkten Effekt; bei 0 ohne Wirkung.
        </p>
        <SegmentedChoice
          options={
            [
              ['negative', 'Grün schützen'],
              ['positive', 'Grün bevorzugen'],
            ] as const
          }
          value={vegetationDirection}
          onChange={setVegetationDirection}
          disabled={readOnly}
        />
      </div>

      <div>
        <div className="mb-1 font-semibold">Schwellenwerte</div>
        {THRESHOLD_FIELDS.map(({ key, label, step }) => (
          <label key={String(key)} className="flex items-center justify-between gap-2 py-0.5">
            <span>{label}</span>
            <input
              type="number"
              step={step}
              value={Number(config[key] ?? 0)}
              disabled={readOnly}
              onChange={(e) => setField(key, Number(e.target.value))}
              className="w-24 rounded border border-gray-300 px-1 py-0.5 text-right disabled:bg-gray-50 disabled:text-gray-500"
            />
          </label>
        ))}
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

  const setField = (key: keyof FactorConfig, value: number) =>
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
            setWeight={setWeight}
            setField={setField}
            setVegetationDirection={setVegetationDirection}
            readOnly={readOnly}
          />

          <UserObstaclesField
            config={config}
            setWeight={setWeight}
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
