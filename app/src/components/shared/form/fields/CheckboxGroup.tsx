import type { DeepKeys } from '@tanstack/form-core'
import { twJoin } from 'tailwind-merge'
import { uniqueFormattedFormErrors } from '@/components/shared/form/formatError'
import type { FormApi } from '@/components/shared/form/types'
import { parseCommaList } from '@/shared/orderedList/commaList'
import { ChoiceCheckbox } from './ChoiceCheckbox'
import type { FieldProps } from './sharedStyles'
import { choiceOptionListClassName, labelClass } from './sharedStyles'

type CheckboxOption = {
  value: string
  label: string
  disabled?: boolean
}

type Props<T extends Record<string, unknown>> = FieldProps & {
  form: FormApi<T>
  name: DeepKeys<T>
  options: CheckboxOption[]
  columns?: 1 | 2
}

export function CheckboxGroup<T extends Record<string, unknown>>({
  form,
  name,
  label,
  help,
  optional,
  optionalSuffix,
  options,
  columns = 2,
}: Props<T>) {
  return (
    <form.Field name={name}>
      {(field) => {
        const errors = field.state.meta.errors
        const hasError = Boolean(errors?.length)
        const selected = parseCommaList(String(field.state.value ?? ''))

        const toggle = (optionValue: string) => {
          const next = selected.includes(optionValue)
            ? selected.filter((value) => value !== optionValue)
            : [...selected, optionValue]
          field.handleChange((_prev) => next.join(', ') as typeof _prev)
        }

        return (
          <div>
            {label && (
              <p className={twJoin(labelClass, 'mb-2')}>
                {label} {optional && <> ({optionalSuffix ?? 'optional'})</>}
              </p>
            )}
            <div
              className={twJoin(columns === 2 ? 'columns-2 gap-x-4' : choiceOptionListClassName)}
            >
              {options.map((option) => (
                <ChoiceCheckbox
                  key={option.value}
                  id={`${String(name)}-${option.value}`}
                  name={field.name}
                  checked={selected.includes(option.value)}
                  disabled={option.disabled}
                  hasError={hasError}
                  ariaLabel={option.label}
                  label={option.label}
                  className={columns === 2 ? 'mb-2 break-inside-avoid' : undefined}
                  onBlur={field.handleBlur}
                  onChange={() => toggle(option.value)}
                />
              ))}
            </div>
            {help && <p className="mt-2 text-sm text-gray-500">{help}</p>}
            {hasError && (
              <div role="alert" className="mt-1 text-sm text-red-800">
                {uniqueFormattedFormErrors(errors).map((msg) => (
                  <p key={msg}>{msg}</p>
                ))}
              </div>
            )}
          </div>
        )
      }}
    </form.Field>
  )
}
