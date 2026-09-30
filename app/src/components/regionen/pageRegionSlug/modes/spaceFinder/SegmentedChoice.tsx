import type { ReactNode } from 'react'
import { twJoin } from 'tailwind-merge'
import { InfoTooltip } from './InfoTooltip'
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
  /** `[value, label, info?]` triples, rendered left-to-right. `info`, if given, renders as a
   *  small tooltip badge on the option — kept as a sibling of the option button (not nested
   *  inside it), since InfoTooltip itself is a `<button>`. */
  options: readonly (readonly [T, string, ReactNode?])[]
  value: T
  onChange: (value: T) => void
  disabled?: boolean
  /** Container layout classes; defaults to a single flex row. */
  className?: string
}) {
  return (
    <div className={className}>
      {options.map(([val, label, info]) => (
        <div key={val} className="relative flex-1">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(val)}
            className={twJoin(
              'w-full disabled:cursor-not-allowed',
              planningRadioButtonClass(value === val, 'green'),
              disabled && value !== val && 'opacity-50',
              info && 'pr-5',
            )}
          >
            {label}
          </button>
          {info && (
            <span className="absolute top-1/2 right-1 -translate-y-1/2">
              <InfoTooltip>{info}</InfoTooltip>
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
