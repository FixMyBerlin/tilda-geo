import { twJoin } from 'tailwind-merge'
import {
  MODIFIER_MAX_POINTS,
  MODIFIER_POINT_STEP,
  pointsToWeight,
  stepToWeight,
  WEIGHT_STEPS,
  weightToPoints,
  weightToStep,
} from './weightScale'

/**
 * Erklärt beide Rechenarten einmal über dem Faktorenblock: Kriterien teilen sich den Grundscore,
 * Zu-/Abschläge verschieben ihn danach. Ohne diese Unterscheidung ist nicht ablesbar, warum die
 * einen in Prozent und die anderen in Punkten eingestellt werden.
 */
export const WeightScaleLegend = () => (
  <div className="mb-2 space-y-1 rounded border border-gray-200 bg-gray-50 px-2 py-1.5 text-[11px] leading-tight text-gray-500">
    <p>
      <span className="font-semibold text-gray-700">Kriterien</span> ergeben zusammen den Grundscore
      (0–100). Die Wichtigkeit bestimmt nur das Verhältnis zueinander — der tatsächliche Anteil
      steht als Prozentwert daneben.
    </p>
    <p>
      <span className="font-semibold text-gray-700">Zu- und Abschläge</span> verschieben den
      Grundscore anschließend um die eingestellten Punkte. Der Gesamtscore bleibt immer 0–100.
    </p>
  </div>
)

/** Wert-Chip rechts neben dem Faktornamen; bei 0 gedämpft mit Hinweis „geht nicht ein“. */
const FactorBadge = ({ value, muted }: { value: string; muted: boolean }) => (
  <span className="flex shrink-0 items-baseline gap-1">
    {muted && <span className="text-[11px] text-gray-400">geht nicht ein</span>}
    <span
      className={twJoin(
        'rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums',
        muted ? 'bg-gray-100 text-gray-400' : 'bg-green-50 text-green-800',
      )}
    >
      {value}
    </span>
  </span>
)

const FactorRow = ({
  label,
  badge,
  slider,
  muted,
  readOnly,
  info,
  nested,
}: {
  label: string
  badge: React.ReactNode
  slider: React.ReactNode
  muted: boolean
  readOnly: boolean
  info?: React.ReactNode
  nested?: React.ReactNode
}) => (
  <div className={readOnly ? 'py-0.5' : 'py-1'}>
    <div className="flex items-baseline justify-between gap-2">
      <span
        className={twJoin(
          'flex items-center gap-1 text-xs',
          muted ? 'text-gray-400' : 'text-gray-700',
        )}
      >
        {label}
        {info}
      </span>
      {badge}
    </div>
    {!readOnly && slider}
    {nested && <div className="ml-3 space-y-0.5">{nested}</div>}
  </div>
)

/**
 * Platzhalter für einen angekündigten, aber noch nicht integrierten Faktor (z. B. Bewohnerbedarf
 * aus Zensusdaten). Zeigt Label, Info-Tooltip und einen "bald verfügbar"-Hinweis statt eines
 * Reglers — der Faktor lässt sich noch nicht einstellen und fließt in keinen Score ein.
 */
export const ComingSoonFactorRow = ({ label, info }: { label: string; info?: React.ReactNode }) => (
  <FactorRow
    label={label}
    muted
    readOnly
    info={info}
    badge={
      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-400">
        bald verfügbar
      </span>
    }
    slider={null}
  />
)

/**
 * Ein Kriterium: Wichtigkeit 0–10 als Regler, angezeigt wird der daraus abgeleitete Anteil am
 * Grundscore. Die Regler sind voneinander unabhängig — wird einer erhöht, sinken die Anteile der
 * übrigen automatisch, weil der Scorer durch die Gewichtssumme teilt.
 */
export const CriterionSlider = ({
  label,
  weight,
  sharePct,
  onChange,
  readOnly = false,
  info,
  nested,
}: {
  label: string
  weight: number | undefined
  sharePct: number
  onChange: (weight: number) => void
  readOnly?: boolean
  info?: React.ReactNode
  nested?: React.ReactNode
}) => {
  const step = weightToStep(weight)

  return (
    <FactorRow
      label={label}
      muted={step === 0}
      readOnly={readOnly}
      info={info}
      nested={nested}
      badge={
        <span className="flex shrink-0 items-baseline gap-1.5">
          <span className="text-[11px] text-gray-400 tabular-nums">
            {step}/{WEIGHT_STEPS}
          </span>
          <FactorBadge value={`${Math.round(sharePct)} %`} muted={step === 0} />
        </span>
      }
      slider={
        <input
          type="range"
          min={0}
          max={WEIGHT_STEPS}
          step={1}
          value={step}
          aria-label={`${label} — Wichtigkeit 0 (fließt nicht ein) bis ${WEIGHT_STEPS} (sehr wichtig)`}
          onChange={(e) => onChange(stepToWeight(Number(e.target.value)))}
          className="w-full accent-green-700"
        />
      }
    />
  )
}

/**
 * Ein Zu-/Abschlag: eingestellt wird direkt der maximale Effekt in Punkten, den der Faktor auf
 * den Grundscore addiert (`positive`) bzw. von ihm abzieht (`negative`) — genau die Größe, mit
 * der scorer.py rechnet (`w × 100`).
 */
export const ModifierSlider = ({
  label,
  weight,
  direction,
  onChange,
  readOnly = false,
  info,
  nested,
  badge: badgeOverride,
  showSlider = true,
}: {
  label: string
  weight: number | undefined
  direction: 'positive' | 'negative'
  onChange: (weight: number) => void
  readOnly?: boolean
  info?: React.ReactNode
  nested?: React.ReactNode
  badge?: React.ReactNode
  showSlider?: boolean
}) => {
  const points = weightToPoints(weight)
  const sign = direction === 'positive' ? '+' : '−'
  const sliderVisible = showSlider && !readOnly

  return (
    <FactorRow
      label={label}
      muted={showSlider && points === 0}
      readOnly={readOnly}
      info={info}
      nested={nested}
      badge={
        !showSlider
          ? null
          : (badgeOverride ?? (
              <FactorBadge
                value={`${points === 0 ? '' : sign}${points} Pkt.`}
                muted={points === 0}
              />
            ))
      }
      slider={
        sliderVisible ? (
          <input
            type="range"
            min={0}
            max={MODIFIER_MAX_POINTS}
            step={MODIFIER_POINT_STEP}
            value={points}
            aria-label={`${label} — ${direction === 'positive' ? 'Zuschlag' : 'Abschlag'} 0 bis ${MODIFIER_MAX_POINTS} Punkte`}
            onChange={(e) => onChange(pointsToWeight(Number(e.target.value)))}
            className="w-full accent-green-700"
          />
        ) : null
      }
    />
  )
}
