import { Disclosure, DisclosureButton, DisclosurePanel, Transition } from '@headlessui/react'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { twJoin } from 'tailwind-merge'
import type { FactorConfig } from '@/server/planning/planning.functions'
import { updatePlanningScenarioFn } from '@/server/planning/planning.functions'
import { planningScenarioQueryOptions } from '@/server/planning/planningQueryOptions'
import { WEIGHT_LABELS } from './planningDefaults'

const THRESHOLD_FIELDS: { key: keyof FactorConfig; label: string; step: number }[] = [
  { key: 'max_cyclepath_dist_m', label: 'Max. Radwegdistanz (m)', step: 10 },
  { key: 'min_clearance_m', label: 'Min. Hindernisabstand (m)', step: 0.5 },
  { key: 'min_surface_score', label: 'Min. Untergrund-Score', step: 5 },
  { key: 'min_score_threshold', label: 'MCE-Schwelle Potentialflächen', step: 5 },
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
    if (!prevReadOnly.current && readOnly) setOpen(false)
    prevReadOnly.current = readOnly
  }, [readOnly])

  const mutation = useMutation({
    mutationFn: () => updatePlanningScenarioFn({ data: { scenarioId, factorConfig: config } }),
    onSuccess: () => queryClient.invalidateQueries(planningScenarioQueryOptions(scenarioId)),
  })

  const weights = config.weights ?? {}

  const setWeight = (key: string, value: number) =>
    setConfig((c) => ({ ...c, weights: { ...(c.weights ?? {}), [key]: value } }))

  const setField = (key: keyof FactorConfig, value: number) =>
    setConfig((c) => ({ ...c, [key]: value }))

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
            <div className="mb-1 font-semibold">Gewichte</div>
            {Object.entries(WEIGHT_LABELS).map(([key, label]) => (
              <label key={key} className="flex items-center justify-between gap-2 py-0.5">
                <span>{label}</span>
                <span className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={weights[key] ?? 0}
                    disabled={readOnly}
                    onChange={(e) => setWeight(key, Number(e.target.value))}
                  />
                  <span className="w-8 text-right tabular-nums">
                    {(weights[key] ?? 0).toFixed(2)}
                  </span>
                </span>
              </label>
            ))}
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
            <label className="flex items-center justify-between gap-2 py-0.5">
              <span>H3-Auflösung</span>
              <input
                type="number"
                min={6}
                max={15}
                value={Number(config.h3_resolution ?? 13)}
                disabled={readOnly}
                onChange={(e) => setField('h3_resolution', Number(e.target.value))}
                className="w-24 rounded border border-gray-300 px-1 py-0.5 text-right disabled:bg-gray-50 disabled:text-gray-500"
              />
            </label>
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
