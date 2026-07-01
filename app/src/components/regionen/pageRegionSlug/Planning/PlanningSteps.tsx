import { twJoin } from 'tailwind-merge'

// Die 10 fachlichen Schritte eines Laufs, in Reihenfolge. Müssen mit
// SCORING_STEPS im planning-worker (flaechenfinder/scorer.py) übereinstimmen.
export const SCORING_STEPS = [
  'Vegetationsflächen berechnen',
  'H3-Gitter generieren',
  'Radwege laden',
  'Hindernisse & Untergrund laden',
  'ÖPNV-Haltestellen laden',
  'Zielorte bewerten',
  'Hangneigung berechnen',
  'Vegetationsabdeckung verschneiden',
  'MCE-Score berechnen',
  'Ergebnisse speichern',
] as const

// Index (0-basiert) des Schritts, der übersprungen wird, wenn w_vegetation=0 ist.
const VEGETATION_STEP_INDEX = 0

/**
 * Leitet den aktuell laufenden Schritt (1..SCORING_STEPS.length) aus dem
 * Job-Fortschritt ab. Der Worker schreibt das progressLabel als
 * "n/total · Name…"; nur die Vorbereitungsphase (~0–2 %) hat kein solches
 * Präfix.
 *   0                      → noch kein Schritt aktiv (Vorbereitung)
 *   1..SCORING_STEPS.length → dieser Schritt läuft gerade / ist fertig
 */
export function deriveScoringStep(
  status: string,
  progress: number | null | undefined,
  progressLabel: string | null | undefined,
): number {
  if (status === 'DONE') return SCORING_STEPS.length
  const match = progressLabel?.match(/^(\d+)\/\d+/)
  if (match?.[1]) return Number.parseInt(match[1], 10)
  return 0
}

/**
 * Checkliste der Scoring-Schritte mit Hervorhebung des aktuellen Schritts.
 * `vegetationSkipped` (aus dem Gewicht w_vegetation der Szenario-Konfiguration
 * abgeleitet) zeigt den Vegetations-Schritt statt mit Nummer/Haken mit einem
 * eigenen "übersprungen"-Icon an, weil dieser Schritt bei Gewicht 0 im Worker
 * gar nicht ausgeführt wird.
 */
export const PlanningSteps = ({
  currentStep,
  vegetationSkipped = false,
}: {
  currentStep: number
  vegetationSkipped?: boolean
}) => {
  return (
    <ol className="mt-2 flex flex-col gap-1">
      {SCORING_STEPS.map((label, i) => {
        const step = i + 1
        const skipped = vegetationSkipped && i === VEGETATION_STEP_INDEX
        const done = step < currentStep
        const active = step === currentStep
        return (
          <li key={label} className="flex items-center gap-2 text-xs">
            <span
              title={skipped ? 'Übersprungen (Vegetations-Gewicht ist 0)' : undefined}
              className={twJoin(
                'flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
                skipped && 'bg-gray-100 text-gray-400',
                !skipped && done && 'bg-green-600 text-white',
                !skipped && active && 'bg-blue-600 text-white',
                !skipped && !done && !active && 'bg-gray-200 text-gray-500',
              )}
            >
              {skipped ? '–' : done ? '✓' : step}
            </span>
            <span
              className={twJoin(
                skipped && 'text-gray-400 italic',
                !skipped && done && 'text-gray-500',
                !skipped && active && 'font-medium text-gray-900',
                !skipped && !done && !active && 'text-gray-400',
              )}
            >
              {label}
              {skipped ? ' (übersprungen)' : ''}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
