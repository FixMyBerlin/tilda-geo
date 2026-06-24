import { twJoin } from 'tailwind-merge'

// Die 7 fachlichen Schritte des Scorings, in Reihenfolge. Müssen mit
// SCORING_STEPS im planning-worker (flaechenfinder/scorer.py) übereinstimmen.
export const SCORING_STEPS = [
  'H3-Gitter generieren',
  'Radwege laden',
  'Hindernisse & Untergrund laden',
  'ÖPNV-Haltestellen laden',
  'Zielorte bewerten',
  'Hangneigung & Vegetation berechnen',
  'MCE-Score berechnen',
] as const

/**
 * Leitet den aktuell laufenden Schritt (1–7) aus dem Job-Fortschritt ab.
 * Der Worker schreibt das progressLabel als "n/total · Name"; vor- und
 * nachgelagerte Phasen (Vorbereitung, Vegetation, Speichern) haben kein
 * solches Präfix.
 *   0                      → noch kein Scoring-Schritt aktiv (Vorbereitung)
 *   1..7                   → dieser Schritt läuft gerade
 *   SCORING_STEPS.length+1 → alle Schritte fertig (Speichern/Fertig)
 */
export function deriveScoringStep(
  status: string,
  progress: number | null | undefined,
  progressLabel: string | null | undefined,
): number {
  if (status === 'DONE') return SCORING_STEPS.length + 1
  const match = progressLabel?.match(/^(\d+)\/\d+/)
  if (match) return Number.parseInt(match[1], 10)
  // Nach dem letzten Schritt folgt "Ergebnisse speichern" (~92 %).
  if (progress != null && progress >= 90) return SCORING_STEPS.length + 1
  return 0
}

/** Checkliste der 7 Scoring-Schritte mit Hervorhebung des aktuellen Schritts. */
export const PlanningSteps = ({ currentStep }: { currentStep: number }) => {
  return (
    <ol className="mt-2 flex flex-col gap-1">
      {SCORING_STEPS.map((label, i) => {
        const step = i + 1
        const done = step < currentStep
        const active = step === currentStep
        return (
          <li key={label} className="flex items-center gap-2 text-xs">
            <span
              className={twJoin(
                'flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
                done && 'bg-green-600 text-white',
                active && 'bg-blue-600 text-white',
                !done && !active && 'bg-gray-200 text-gray-500',
              )}
            >
              {done ? '✓' : step}
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
          </li>
        )
      })}
    </ol>
  )
}
