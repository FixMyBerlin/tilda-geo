import { useState } from 'react'
import { twJoin } from 'tailwind-merge'

// Die 12 fachlichen Schritte eines Laufs, in Reihenfolge. Müssen mit
// SCORING_STEPS im planning-worker (flaechenfinder/scorer.py) übereinstimmen.
export const SCORING_STEPS = [
  'Vegetationsflächen berechnen',
  'H3-Gitter generieren',
  'Radwege laden',
  'Hindernisse & Untergrund laden',
  'ÖPNV-Haltestellen laden',
  'Kreuzungen laden',
  'KFZ-Parkflächen laden',
  'Zielorte bewerten',
  'Hangneigung berechnen',
  'Vegetationsabdeckung verschneiden',
  'MCE-Score berechnen',
  'Ergebnisse speichern',
] as const

// Das steuernde Faktor-Gewicht je Schritt (0-basiert, index-gleich zu
// SCORING_STEPS). Leeres Array = struktureller Schritt ohne Gewicht (läuft
// immer). Ein Schritt gilt als „ohne Gewicht", wenn ALLE genannten Gewichte 0
// sind (Hindernisse: erst wenn weder Hindernisfreiheit noch Untergrund zählen).
const STEP_WEIGHT_KEYS: string[][] = [
  ['w_vegetation'], //  1 Vegetationsflächen berechnen
  [], //                2 H3-Gitter generieren
  ['w_cyclepath'], //   3 Radwege laden
  ['w_clearance', 'w_surface'], // 4 Hindernisse & Untergrund laden
  ['w_transit'], //     5 ÖPNV-Haltestellen laden
  ['w_intersection'], // 6 Kreuzungen laden
  ['w_parken'], //      7 KFZ-Parkflächen laden
  ['w_target'], //      8 Zielorte bewerten
  ['w_slope'], //       9 Hangneigung berechnen
  ['w_vegetation'], //  10 Vegetationsabdeckung verschneiden
  [], //                11 MCE-Score berechnen
  [], //                12 Ergebnisse speichern
]

// Schritte, deren Ausgabe zusätzlich den harten Ausschluss steuert
// (scorer.py::exclusion). Diese laufen auch bei Gewicht 0 weiter – sie werden
// dann nicht „übersprungen", sondern „nur Ausschluss" markiert.
const EXCLUSION_STEP_INDICES = new Set([2, 3, 8]) // Radwege, Hindernisse, Hangneigung

// Der ausklappbare Block fasst alle Faktor-Schritte zusammen (1-basierte
// Schrittnummern 3–10). Schritt 1/2 (Vegetationsvorphase, H3) und 11/12
// (MCE, Speichern) bleiben top-level.
const LOAD_GROUP = { firstStep: 3, lastStep: 10, label: 'Eingangsdaten & Faktoren' }

type StepDisplay = {
  done: boolean
  active: boolean
  /** Gewicht 0 & entkoppelt → wird gar nicht ausgeführt. */
  skipped: boolean
  /** Gewicht 0 & ausschluss-gekoppelt → läuft weiter, trägt aber keine Punkte bei. */
  exclusionOnly: boolean
}

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

/** Zustand eines einzelnen Schritts (0-basierter Index) aus currentStep + Gewichten. */
function stepDisplay(
  i: number,
  currentStep: number,
  weights: Record<string, number> | undefined,
): StepDisplay {
  const step = i + 1
  const keys = STEP_WEIGHT_KEYS[i] ?? []
  const structural = keys.length === 0
  const weightZero = !structural && keys.every((k) => !(weights?.[k] ?? 0))
  const excluded = EXCLUSION_STEP_INDICES.has(i)
  return {
    done: step < currentStep,
    active: step === currentStep,
    skipped: weightZero && !excluded,
    exclusionOnly: weightZero && excluded,
  }
}

/** Der Status-Marker (Kreis/Punkt) links neben dem Schrittnamen. */
const StepMarker = ({
  d,
  numbered,
}: {
  d: StepDisplay
  /** Top-level: Schrittnummer im Kreis; im Block: Punkt-Marker. */
  numbered?: number
}) => {
  const label = d.skipped ? '–' : d.done ? '✓' : (numbered ?? '')
  return (
    <span
      title={
        d.skipped
          ? 'Übersprungen (Gewicht ist 0)'
          : d.exclusionOnly
            ? 'Läuft nur für den harten Ausschluss (trägt keine Punkte bei)'
            : undefined
      }
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

/** Eine Schrittzeile (top-level oder als Kind im Block). */
const StepRow = ({ label, d, numbered }: { label: string; d: StepDisplay; numbered?: number }) => {
  const muted = d.skipped || d.exclusionOnly
  return (
    <li className="flex items-center gap-2 text-xs">
      <StepMarker d={d} numbered={numbered} />
      <span
        className={twJoin(
          d.skipped && 'text-gray-400 italic',
          !d.skipped && d.exclusionOnly && 'text-gray-500',
          !muted && d.done && 'text-gray-500',
          !muted && d.active && 'font-medium text-gray-900',
          !muted && !d.done && !d.active && 'text-gray-400',
        )}
      >
        {label}
        {d.skipped ? ' (übersprungen)' : ''}
        {d.exclusionOnly ? ' (nur Ausschluss)' : ''}
      </span>
    </li>
  )
}

/**
 * Ausklappbarer Block, der die Faktor-Schritte (Indizes childIndices)
 * zusammenfasst. Klappt automatisch auf, solange einer seiner Schritte läuft,
 * und wieder zu, sobald der Block fertig ist – ein manueller Klick übersteuert.
 */
const CollapsibleStepGroup = ({
  label,
  childIndices,
  currentStep,
  weights,
}: {
  label: string
  childIndices: number[]
  currentStep: number
  weights: Record<string, number> | undefined
}) => {
  const firstStep = childIndices[0]! + 1
  const lastStep = childIndices[childIndices.length - 1]! + 1
  const active = currentStep >= firstStep && currentStep <= lastStep
  const done = currentStep > lastStep

  // null = automatisch (offen solange aktiv); ein Klick setzt einen festen Wert.
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
              d={stepDisplay(i, currentStep, weights)}
            />
          ))}
        </ol>
      ) : null}
    </li>
  )
}

/**
 * Checkliste der Scoring-Schritte mit Hervorhebung des aktuellen Schritts. Die
 * Faktor-Schritte (3–10) sind in einem ausklappbaren Block zusammengefasst.
 * `weights` (Faktor-Gewichte des Szenarios) steuert je Schritt, ob er als
 * „übersprungen" (Gewicht 0, entkoppelt) bzw. „nur Ausschluss" (Gewicht 0,
 * ausschluss-gekoppelt) markiert wird.
 */
export const PlanningSteps = ({
  currentStep,
  weights,
}: {
  currentStep: number
  weights?: Record<string, number>
}) => {
  const groupIndices = Array.from(
    { length: LOAD_GROUP.lastStep - LOAD_GROUP.firstStep + 1 },
    (_, k) => LOAD_GROUP.firstStep - 1 + k,
  )
  const groupStart = LOAD_GROUP.firstStep - 1

  return (
    <ol className="mt-2 flex flex-col gap-1">
      {SCORING_STEPS.map((label, i) => {
        // An der Position des ersten Gruppen-Schritts einmal den Block rendern;
        // die restlichen Gruppen-Indizes im Loop überspringen.
        if (i === groupStart) {
          return (
            <CollapsibleStepGroup
              key="load-group"
              label={LOAD_GROUP.label}
              childIndices={groupIndices}
              currentStep={currentStep}
              weights={weights}
            />
          )
        }
        if (i > groupStart && i <= LOAD_GROUP.lastStep - 1) return null

        return (
          <StepRow
            key={label}
            label={label}
            numbered={i + 1}
            d={stepDisplay(i, currentStep, weights)}
          />
        )
      })}
    </ol>
  )
}
