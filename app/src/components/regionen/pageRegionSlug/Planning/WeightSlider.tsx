import { twJoin } from 'tailwind-merge'

// Gewichte werden intern als 0–1 gespeichert (so erwartet es der Worker), in der UI aber als
// ganzzahlige Wichtigkeit 0–10 bedient: 0 = sehr unwichtig (fließt nicht ein), 10 = sehr wichtig.
const WEIGHT_STEPS = 10

/** 0–1-Gewicht → ganzzahlige UI-Stufe 0–10 (Altwerte wie 0.15 werden gerundet angezeigt). */
const weightToStep = (weight: number | undefined) =>
  Math.min(WEIGHT_STEPS, Math.max(0, Math.round((weight ?? 0) * WEIGHT_STEPS)))

/** UI-Stufe 0–10 → 0–1-Gewicht. */
const stepToWeight = (step: number) => step / WEIGHT_STEPS

/**
 * Erklärt die Skala einmal pro Gewichte-Block, damit die Bedeutung der Endpunkte sichtbar ist
 * (und nicht an jedem einzelnen Regler wiederholt werden muss).
 */
export const WeightScaleLegend = () => (
  <div className="mb-2 rounded border border-gray-200 bg-gray-50 px-2 py-1.5">
    <div className="flex items-start justify-between gap-3 text-[11px] leading-tight text-gray-500">
      <span>
        <span className="font-semibold text-gray-700">0</span> = sehr unwichtig
        <br />
        (fließt nicht ein)
      </span>
      <span className="text-right">
        <span className="font-semibold text-gray-700">10</span> = sehr wichtig
      </span>
    </div>
  </div>
)

/** Wert-Chip rechts neben dem Faktornamen; bei 0 gedämpft mit Hinweis „geht nicht ein“. */
const WeightBadge = ({ step }: { step: number }) => (
  <span className="flex shrink-0 items-baseline gap-1">
    {step === 0 && <span className="text-[11px] text-gray-400">geht nicht ein</span>}
    <span
      className={twJoin(
        'rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums',
        step === 0 ? 'bg-gray-100 text-gray-400' : 'bg-green-50 text-green-800',
      )}
    >
      {step}
      <span className="font-normal opacity-60">/{WEIGHT_STEPS}</span>
    </span>
  </span>
)

/**
 * Ein Faktor-Regler: Name + Wert-Chip in einer Zeile, darunter der ganzzahlige Slider (0–10).
 * Im `readOnly`-Modus (Berechnung läuft/lief) bleibt nur die kompakte Wertzeile.
 */
export const WeightSlider = ({
  label,
  weight,
  onChange,
  readOnly = false,
}: {
  label: string
  weight: number | undefined
  onChange: (weight: number) => void
  readOnly?: boolean
}) => {
  const step = weightToStep(weight)

  return (
    <div className={readOnly ? 'py-0.5' : 'py-1'}>
      <div className="flex items-baseline justify-between gap-2">
        <span className={twJoin('text-xs', step === 0 ? 'text-gray-400' : 'text-gray-700')}>
          {label}
        </span>
        <WeightBadge step={step} />
      </div>
      {!readOnly && (
        <input
          type="range"
          min={0}
          max={WEIGHT_STEPS}
          step={1}
          value={step}
          aria-label={`${label} — Wichtigkeit 0 (sehr unwichtig) bis 10 (sehr wichtig)`}
          onChange={(e) => onChange(stepToWeight(Number(e.target.value)))}
          className="mt-0.5 w-full accent-green-700"
        />
      )}
    </div>
  )
}
