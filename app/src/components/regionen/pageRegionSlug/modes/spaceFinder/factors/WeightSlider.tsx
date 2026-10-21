import { twJoin } from 'tailwind-merge'
import {
  spaceFinderFactorActiveTextClass,
  spaceFinderFactorMutedTextClass,
} from '../spaceFinderPanelStyles'
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
 * Explains both calculation kinds once above the factor block: criteria share the base score,
 * modifiers (bonuses/penalties) shift it afterwards. Without this distinction it is unclear why
 * some are set in percent and others in points.
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

/** Value chip to the right of the factor name; muted at 0 with the hint „geht nicht ein“. */
const FactorBadge = ({
  value,
  muted,
  valueClassName = 'bg-green-50 text-green-900',
}: {
  value: string
  muted: boolean
  valueClassName?: string
}) => (
  <span className="flex shrink-0 items-baseline gap-1">
    {muted && <span className="text-[11px] text-gray-400">geht nicht ein</span>}
    <span
      className={twJoin(
        'rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums',
        muted ? 'bg-gray-100 text-gray-400' : valueClassName,
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
          muted ? spaceFinderFactorMutedTextClass : spaceFinderFactorActiveTextClass,
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
 * Placeholder for an announced but not yet integrated factor (e.g. resident demand from census
 * data). Shows label, info tooltip and a "bald verfügbar" hint instead of a slider — the factor
 * cannot be configured yet and does not feed into any score.
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
 * Row for a factor that is implemented but has no data for this Planungsgebiet (e.g.
 * parking/intersections/pedestrian zones outside the parking topic bboxes, see
 * `parkingDataAvailability.server.ts`). Like `ComingSoonFactorRow`, just with a different hint
 * text — the factor is implemented, only without data here.
 */
export const UnavailableFactorRow = ({
  label,
  info,
}: {
  label: string
  info?: React.ReactNode
}) => (
  <FactorRow
    label={label}
    muted
    readOnly
    info={info}
    badge={
      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-400">
        keine Daten
      </span>
    }
    slider={null}
  />
)

/**
 * A criterion: importance 0–10 as a slider; shown is the derived share of the base score. The
 * sliders are independent — raising one automatically lowers the others' shares because the
 * scorer divides by the weight sum.
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
          <span
            className={twJoin(
              'text-[11px] tabular-nums',
              step === 0 ? 'text-gray-400' : 'text-gray-500',
            )}
          >
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
 * A modifier (bonus/penalty): set directly as the maximum effect in points that the factor adds
 * to (`positive`) or subtracts from (`negative`) the base score — exactly the quantity scorer.py
 * uses (`w × 100`).
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
                valueClassName="bg-green-50 text-black"
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
