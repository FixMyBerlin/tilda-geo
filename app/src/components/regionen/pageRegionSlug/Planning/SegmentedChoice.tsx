import { twJoin } from 'tailwind-merge'
import { planningRadioButtonClass } from './planningPanelStyles'

/**
 * Segmented button group for picking one value from a small fixed set. Extracted
 * from the vegetation-direction switch so it can be shared by the vegetation
 * direction (2 options) and the user-obstacle mode (4 options).
 */
export function SegmentedChoice<T extends string>({
  options,
  value,
  onChange,
  disabled = false,
  className = 'flex gap-1.5',
}: {
  /** `[value, label]` pairs, rendered left-to-right. */
  options: readonly (readonly [T, string])[]
  value: T
  onChange: (value: T) => void
  disabled?: boolean
  /** Container layout classes; defaults to a single flex row. */
  className?: string
}) {
  return (
    <div className={className}>
      {options.map(([val, label]) => (
        <button
          key={val}
          type="button"
          disabled={disabled}
          onClick={() => onChange(val)}
          className={twJoin(
            'flex-1 disabled:cursor-not-allowed',
            planningRadioButtonClass(value === val, 'green'),
            disabled && value !== val && 'opacity-50',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
