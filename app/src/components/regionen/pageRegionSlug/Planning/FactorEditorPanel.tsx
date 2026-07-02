import { Disclosure, DisclosureButton, DisclosurePanel, Transition } from '@headlessui/react'
import { ChevronRightIcon, InformationCircleIcon } from '@heroicons/react/20/solid'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { twJoin } from 'tailwind-merge'
import type { FactorConfig } from '@/server/planning/planning.functions'
import { updatePlanningScenarioFn } from '@/server/planning/planning.functions'
import { planningScenarioQueryOptions } from '@/server/planning/planningQueryOptions'
import { WEIGHT_GROUPS, WEIGHT_LABELS } from './planningDefaults'

const THRESHOLD_FIELDS: { key: keyof FactorConfig; label: string; step: number }[] = [
  { key: 'max_cyclepath_dist_m', label: 'Max. Radwegdistanz (m)', step: 10 },
  { key: 'min_clearance_m', label: 'Min. Hindernisabstand (m)', step: 0.5 },
  { key: 'min_surface_score', label: 'Min. Untergrund-Score', step: 5 },
  { key: 'intersection_radius_m', label: 'Kreuzungs-Radius (m)', step: 5 },
  { key: 'parken_radius_m', label: 'Parken-Radius (m)', step: 5 },
]

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

  const weights = config.weights ?? {}

  const setWeight = (key: string, value: number) =>
    setConfig((c) => ({ ...c, weights: { ...c.weights, [key]: value } }))

  const setField = (key: keyof FactorConfig, value: number) =>
    setConfig((c) => ({ ...c, [key]: value }))

  const vegetationDirection = config.vegetation_direction ?? 'negative'
  const setVegetationDirection = (value: 'positive' | 'negative') =>
    setConfig((c) => ({ ...c, vegetation_direction: value }))

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

          <div>
            <div className="mb-1 flex items-center gap-1 font-semibold">
              Gewichte
              <span className="group relative">
                <InformationCircleIcon className="size-4 cursor-default text-gray-400" />
                <span className="pointer-events-none absolute top-0 left-5 z-10 w-56 rounded bg-gray-800 px-2 py-1.5 text-xs font-normal text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  Bestimmen die relative Bedeutung jedes Faktors bei der Standortbewertung.
                </span>
              </span>
            </div>
            {WEIGHT_GROUPS.map((group) => (
              <div key={group.key} className="mt-1.5 first:mt-0">
                <div className="text-xs font-semibold text-gray-500 uppercase">{group.label}</div>
                {group.weights.map((key) => (
                  <div
                    key={key}
                    className={
                      readOnly
                        ? 'flex items-center justify-between py-0.5'
                        : 'flex flex-col gap-0.5 py-1'
                    }
                  >
                    <span className="text-xs text-gray-600">{WEIGHT_LABELS[key] ?? key}</span>
                    {readOnly ? (
                      <span className="text-xs tabular-nums">
                        {Math.round((weights[key] ?? 0) * 100)}&thinsp;%
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.05}
                          value={weights[key] ?? 0}
                          onChange={(e) => setWeight(key, Number(e.target.value))}
                          className="flex-1"
                        />
                        <span className="w-9 shrink-0 text-right tabular-nums">
                          {Math.round((weights[key] ?? 0) * 100)}&thinsp;%
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div>
            <div className="mb-1 font-semibold">Vegetation (NDVI)</div>
            <p className="mb-1.5 text-xs text-gray-500">
              „Grün schützen“ zieht je nach Bedeckungsgrad Punkte ab (Gesamtscore nie unter 0),
              „Grün bevorzugen“ vergibt Bonuspunkte. Das Gewicht „Vegetation“ ist der maximale
              Effekt in Punkten; bei 0 ohne Wirkung.
            </p>
            <div className="flex gap-1.5">
              {(
                [
                  ['negative', 'Grün schützen'],
                  ['positive', 'Grün bevorzugen'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  disabled={readOnly}
                  onClick={() => setVegetationDirection(value)}
                  className={twJoin(
                    'flex-1 rounded border px-2 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed',
                    vegetationDirection === value
                      ? 'border-green-700 bg-green-700 text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
                    readOnly && vegetationDirection !== value && 'opacity-50',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
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
