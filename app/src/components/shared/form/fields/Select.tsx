import type { DeepKeys } from '@tanstack/form-core'
import { twJoin } from 'tailwind-merge'
import { uniqueFormattedFormErrors } from '@/components/shared/form/formatError'
import type { FormApi } from '@/components/shared/form/types'
import type { FieldProps } from './sharedStyles'
import { inputBase, inputError, inputNormal, labelClass } from './sharedStyles'

type Props<T extends Record<string, unknown>> = FieldProps & {
  form: FormApi<T>
  name: DeepKeys<T>
  options: [string | number | '', string][]
  onValueChange?: (value: string) => void
}

export function Select<T extends Record<string, unknown>>({
  form,
  name,
  label,
  help,
  optional,
  optionalSuffix,
  options,
  onValueChange,
}: Props<T>) {
  return (
    <form.Field name={name}>
      {(field) => {
        const errors = field.state.meta.errors
        const hasError = Boolean(errors?.length)
        const value = field.state.value ?? ''
        return (
          <div>
            <label htmlFor={String(name)} className={labelClass}>
              {label}
              {optional && <> ({optionalSuffix ?? 'optional'})</>}
            </label>
            <select
              id={String(name)}
              name={field.name}
              value={String(value)}
              onBlur={field.handleBlur}
              onChange={(e) => {
                const nextValue = e.target.value
                field.handleChange((_prev) => nextValue as typeof _prev)
                onValueChange?.(nextValue)
              }}
              className={twJoin(inputBase, 'bg-white', hasError ? inputError : inputNormal)}
              aria-invalid={hasError}
            >
              {options.map(([val, text]) => (
                <option key={String(val)} value={String(val)}>
                  {text}
                </option>
              ))}
            </select>
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
