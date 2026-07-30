import type { ReactNode } from 'react'
import { twJoin } from 'tailwind-merge'
import { choiceCheckboxClassName, choiceOptionClassName, choiceTextClassName } from './sharedStyles'

type Props = {
  id: string
  name?: string
  checked: boolean
  disabled?: boolean
  hasError?: boolean
  ariaLabel: string
  label: ReactNode
  className?: string
  fontNormal?: boolean
  onBlur?: () => void
  onChange: (checked: boolean) => void
}

export function ChoiceCheckbox({
  id,
  name,
  checked,
  disabled,
  hasError = false,
  ariaLabel,
  label,
  className,
  fontNormal = true,
  onBlur,
  onChange,
}: Props) {
  return (
    <label htmlFor={id} className={twJoin(choiceOptionClassName, className)}>
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.checked)}
        className={choiceCheckboxClassName(hasError)}
      />
      <span
        className={choiceTextClassName({
          disabled,
          fontNormal,
        })}
      >
        {label}
      </span>
    </label>
  )
}
