import { useState } from 'react'
import { twJoin } from 'tailwind-merge'

// The 14 domain steps of a run, in order. Must match SCORING_STEPS in the
// planning-worker (flaechenfinder/scorer.py).
const SCORING_STEPS = [
  'Vegetationsflächen berechnen',
  'H3-Gitter generieren',
  'Radwege laden',
  'Gebäude laden',
  'Bewohnerbedarf laden (Zensus)',
  'ÖPNV + Bikesharing laden',
  'Kreuzungen laden',
  'KFZ-Parkflächen laden',
  'Zielorte laden',
  'Hangneigung berechnen',
  'Vegetationsabdeckung verschneiden',
  'Eigene Daten verschneiden',
  'MCE-Score berechnen',
  'Ergebnisse speichern',
] as const

// The controlling factor weight(s) per step (0-based, same index as
// SCORING_STEPS). Empty array = structural step without weight (always runs).
// A step counts as "without weight" if ALL listed weights are 0.
// Step 4 loads buildings (hard exclusion, always runs, no weight).
const STEP_WEIGHT_KEYS: string[][] = [
  ['w_vegetation'], //  1 Vegetationsflächen berechnen
  [], //                2 H3-Gitter generieren
  ['w_cyclepath'], //   3 Radwege laden
  [], //                    4 Gebäude laden
  ['w_bewohnerbedarf'], //  5 Bewohnerbedarf laden (Zensus)
  ['w_transit'], //         6 ÖPNV + Bikesharing laden
  ['w_intersection', 'w_fussgaengerzone'], // 7 Kreuzungen & Fußgängerzonen laden
  ['w_parken'], //          8 KFZ-Parkflächen laden
  ['w_target'], //          9 Zielorte laden
  ['w_slope'], //           10 Hangneigung berechnen
  ['w_vegetation'], //      11 Vegetationsabdeckung verschneiden
  ['w_eigendaten'], //      12 Eigene Daten verschneiden (special case, see stepDisplay)
  [], //                    13 MCE-Score berechnen
  [], //                    14 Ergebnisse speichern
]

// 0-based index of the user datasets step: runs as soon as the area has datasets,
// otherwise it is skipped.
const USER_DATASETS_STEP_INDEX = 11

// The collapsible block groups all factor steps (1-based step numbers 3–12).
// Steps 1/2 (vegetation pre-phase, H3) and 13/14 (MCE, save) stay top-level.
const LOAD_GROUP = { firstStep: 3, lastStep: 12, label: 'Eingangsdaten & Faktoren' }

type StepDisplay = {
  done: boolean
  active: boolean
  /** Weight 0 → not executed at all. */
  skipped: boolean
}

/**
 * Derives the currently running step (1..SCORING_STEPS.length) from the job
 * progress. The worker writes the progressLabel as "n/total · Name…"; only the
 * preparation phase (~0–2 %) has no such prefix.
 *   0                      → no step active yet (preparation)
 *   1..SCORING_STEPS.length → this step is running / done
 */
export function deriveScoringStep(
  status: string,
  progress: number | null | undefined,
  progressLabel: string | null | undefined,
) {
  if (status === 'DONE') return SCORING_STEPS.length
  const match = progressLabel?.match(/^(\d+)\/\d+/)
  if (match?.[1]) return Number.parseInt(match[1], 10)
  return 0
}

/** State of a single step (0-based index) from currentStep + weights. */
function stepDisplay(
  i: number,
  currentStep: number,
  weights: Record<string, number> | undefined,
  hasUserDatasets?: boolean,
) {
  const step = i + 1
  const keys = STEP_WEIGHT_KEYS[i] ?? []
  const structural = keys.length === 0
  const weightZero = !structural && keys.every((k) => !(weights?.[k] ?? 0))
  const base = { done: step < currentStep, active: step === currentStep }

  // User datasets step: the distance computation (scorer.py) runs for every dataset,
  // regardless of mode and strength (those only matter in the MCE step).
  if (i === USER_DATASETS_STEP_INDEX) return { ...base, skipped: !hasUserDatasets }

  return { ...base, skipped: weightZero }
}

/** Status marker (circle/dot) left of the step name. */
const StepMarker = ({
  d,
  numbered,
}: {
  d: StepDisplay
  /** Top-level: step number in a circle; inside the block: dot marker. */
  numbered?: number
}) => {
  const label = d.skipped ? '–' : d.done ? '✓' : (numbered ?? '')
  return (
    <span
      title={d.skipped ? 'Übersprungen (Gewicht ist 0)' : undefined}
      className={twJoin(
        'flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
        d.skipped && 'bg-gray-100 text-gray-400',
        !d.skipped && d.done && 'bg-green-600 text-white',
        !d.skipped && d.active && 'bg-blue-600 text-white',
        !d.skipped && !d.done && !d.active && 'bg-gray-200 text-gray-500',
      )}
    >
      {label}
    </span>
  )
}

/** One step row (top-level or as a child in the block). */
const StepRow = ({ label, d, numbered }: { label: string; d: StepDisplay; numbered?: number }) => {
  return (
    <li className="flex items-center gap-2 text-xs">
      <StepMarker d={d} numbered={numbered} />
      <span
        className={twJoin(
          d.skipped && 'text-gray-400 italic',
          !d.skipped && d.done && 'text-gray-500',
          !d.skipped && d.active && 'font-medium text-gray-900',
          !d.skipped && !d.done && !d.active && 'text-gray-400',
        )}
      >
        {label}
        {d.skipped ? ' (übersprungen)' : ''}
      </span>
    </li>
  )
}

/**
 * Collapsible block grouping the factor steps (indices childIndices).
 * Opens automatically while one of its steps runs and closes once the block is
 * done – a manual click overrides this.
 */
const CollapsibleStepGroup = ({
  label,
  childIndices,
  currentStep,
  weights,
  hasUserDatasets,
}: {
  label: string
  childIndices: number[]
  currentStep: number
  weights: Record<string, number> | undefined
  hasUserDatasets?: boolean
}) => {
  const firstStep = childIndices[0]! + 1
  const lastStep = childIndices[childIndices.length - 1]! + 1
  const active = currentStep >= firstStep && currentStep <= lastStep
  const done = currentStep > lastStep

  // null = automatic (open while active); a click sets a fixed value.
  const [open, setOpen] = useState<boolean | null>(null)
  const effectiveOpen = open ?? active

  const pos = Math.min(Math.max(currentStep - firstStep + 1, 1), childIndices.length)

  return (
    <li className="text-xs">
      <button
        type="button"
        onClick={() => setOpen(!effectiveOpen)}
        className="flex w-full items-center gap-2 text-left"
      >
        <span
          className={twJoin(
            'flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
            done && 'bg-green-600 text-white',
            active && 'bg-blue-600 text-white',
            !done && !active && 'bg-gray-200 text-gray-500',
          )}
        >
          {done ? '✓' : active ? '●' : ''}
        </span>
        <span
          className={twJoin(
            done && 'text-gray-500',
            active && 'font-medium text-gray-900',
            !done && !active && 'text-gray-400',
          )}
        >
          {label}
        </span>
        {active ? (
          <span className="text-gray-400 tabular-nums">
            {pos}/{childIndices.length}
          </span>
        ) : null}
        <span className="ml-auto text-gray-400">{effectiveOpen ? '▾' : '▸'}</span>
      </button>
      {effectiveOpen ? (
        <ol className="mt-1 ml-2 flex flex-col gap-1 border-l border-gray-200 pl-3">
          {childIndices.map((i) => (
            <StepRow
              key={SCORING_STEPS[i]}
              label={SCORING_STEPS[i]!}
              d={stepDisplay(i, currentStep, weights, hasUserDatasets)}
            />
          ))}
        </ol>
      ) : null}
    </li>
  )
}

/**
 * Checklist of the scoring steps, highlighting the current step. The factor
 * steps (3–12) are grouped in a collapsible block. `weights` (the scenario's
 * factor weights) marks a step with weight 0 as "übersprungen".
 */
export const SpaceFinderRunSteps = ({
  currentStep,
  weights,
  hasUserDatasets,
}: {
  currentStep: number
  weights?: Record<string, number>
  hasUserDatasets?: boolean
}) => {
  const groupIndices = Array.from(
    { length: LOAD_GROUP.lastStep - LOAD_GROUP.firstStep + 1 },
    (_, k) => LOAD_GROUP.firstStep - 1 + k,
  )
  const groupStart = LOAD_GROUP.firstStep - 1

  return (
    <ol className="mt-2 flex flex-col gap-1">
      {SCORING_STEPS.map((label, i) => {
        // Render the block once at the first group step's position;
        // skip the remaining group indices in the loop.
        if (i === groupStart) {
          return (
            <CollapsibleStepGroup
              key="load-group"
              label={LOAD_GROUP.label}
              childIndices={groupIndices}
              currentStep={currentStep}
              weights={weights}
              hasUserDatasets={hasUserDatasets}
            />
          )
        }
        if (i > groupStart && i <= LOAD_GROUP.lastStep - 1) return null

        return (
          <StepRow
            key={label}
            label={label}
            numbered={i + 1}
            d={stepDisplay(i, currentStep, weights, hasUserDatasets)}
          />
        )
      })}
    </ol>
  )
}
