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
import {
  criterionShares,
  groupShare,
  modifierPointRange,
  resolveModifierDirection,
} from './weightScale'
import { CriterionSlider, ModifierSlider, WeightScaleLegend } from './WeightSlider'

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
  // Die Regler sind voneinander unabhängig: der Scorer normiert die Kriterien selbst (Division
  // durch die Gewichtssumme), es gibt also keine Summe, die die UI einhalten müsste.
  const setWeight = (key: string, value: number) => setWeights({ ...weights, [key]: value })
  const shares = criterionShares(weights)
  const points = modifierPointRange(weights, vegetationDirection)

  return (
    <>
      <div>
        <div className="mb-1 flex items-center gap-1 font-semibold">
          Gewichtung der Faktoren
          <InfoTooltip>
            Kriterien bewerten jeden Ort mit 0–100 Punkten; ihre Wichtigkeit bestimmt, mit welchem
            Anteil sie in den Grundscore eingehen (nur das Verhältnis zueinander zählt). Zu- und
            Abschläge verschieben den Grundscore danach um die eingestellten Punkte. 0 bedeutet in
            beiden Fällen, dass ein Faktor nicht einfließt.
          </InfoTooltip>
        </div>
        {!readOnly && <WeightScaleLegend />}
        {WEIGHT_GROUPS.map((group) => (
          <div key={group.key} className="mt-3 first:mt-0">
            <div className="flex items-baseline justify-between gap-2 border-b border-gray-200 pb-0.5 text-xs font-semibold text-gray-500 uppercase">
              <span>{group.label}</span>
              <span className="normal-case tabular-nums">
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
                onChange={(value) => setWeight(key, value)}
                readOnly={readOnly}
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
                onChange={(value) => setWeight(key, value)}
                readOnly={readOnly}
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
        <div className="mb-1 font-semibold">Vegetation (NDVI)</div>
        <p className="mb-1.5 text-xs text-gray-500">
          „Grün schützen“ zieht je nach Bedeckungsgrad Punkte ab (Gesamtscore nie unter 0), „Grün
          bevorzugen“ vergibt Bonuspunkte. Wie viele Punkte, steht beim Zu-/Abschlag „Vegetation“ in
          der Gruppe Bebauung; bei 0 Punkten ohne Wirkung.
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

      <div>
        <label className="flex items-center gap-1 font-medium text-gray-800">
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
