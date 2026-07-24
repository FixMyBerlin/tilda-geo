import type { DeepKeys } from '@tanstack/form-core'
import { twJoin } from 'tailwind-merge'
import { uniqueFormattedFormErrors } from '@/components/shared/form/formatError'
import type { FormApi } from '@/components/shared/form/types'
import type { FieldProps } from './sharedStyles'
import {
  choiceControlClassName,
  choiceOptionClassName,
  choiceOptionListClassName,
  choiceTextClassName,
  labelClass,
} from './sharedStyles'

type RadioItem = {
  value: string
  /** Accessible name (and plain-text fallback). */
  label: string
  labelContent?: React.ReactNode
  disabled?: boolean
  className?: string
}

type Props<T extends Record<string, unknown>> = FieldProps & {
  form: FormApi<T>
  name: DeepKeys<T>
  items: RadioItem[]
  inline?: boolean
}

export function RadioGroup<T extends Record<string, unknown>>({
  form,
  name,
  label,
  help,
  optional,
  optionalSuffix,
  items,
  inline = false,
}: Props<T>) {
  return (
    <form.Field name={name}>
      {(field) => {
        const errors = field.state.meta.errors
        const hasError = Boolean(errors?.length)
        const value = field.state.value ?? ''
        return (
          <div>
            {label && (
              <p className={twJoin(labelClass, inline ? 'mb-2' : 'mb-4')}>
                {label} {optional && <> ({optionalSuffix ?? 'optional'})</>}
              </p>
            )}
            <div
              className={
                inline ? 'flex flex-wrap items-center gap-x-5 gap-y-2' : choiceOptionListClassName
              }
            >
              {items.map((item) => (
                <label
                  key={item.value}
                  htmlFor={`${String(name)}-${item.value}`}
                  className={twJoin(choiceOptionClassName, item.className)}
                >
                  <input
                    type="radio"
                    id={`${String(name)}-${item.value}`}
                    name={field.name}
                    value={item.value}
                    disabled={item.disabled}
                    checked={value === item.value}
                    aria-label={item.label}
                    onBlur={field.handleBlur}
                    onChange={() => field.handleChange((_prev) => item.value as typeof _prev)}
                    className={choiceControlClassName(hasError)}
                  />
                  <span
                    className={choiceTextClassName({
                      disabled: item.disabled,
                      fontNormal: Boolean(item.labelContent),
                    })}
                  >
                    {item.labelContent ?? item.label}
                  </span>
                </label>
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
