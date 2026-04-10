import type { DeepKeys } from '@tanstack/form-core'
import { twJoin } from 'tailwind-merge'
import { uniqueFormattedFormErrors } from '@/components/shared/form/formatError'
import type { FormApi } from '@/components/shared/form/types'
import type { FieldProps } from './sharedStyles'
import { labelClass } from './sharedStyles'

type Props<T extends Record<string, unknown>> = FieldProps & {
  form: FormApi<T>
  name: DeepKeys<T>
  items: { value: string; label: string; disabled?: boolean; className?: string }[]
}

export function RadioGroup<T extends Record<string, unknown>>({
  form,
  name,
  label,
  help,
  optional,
  optionalSuffix,
  items,
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
              <p className={`mb-4 ${labelClass}`}>
                {label} {optional && <> ({optionalSuffix ?? 'optional'})</>}
              </p>
            )}
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.value}
                  className={twJoin(
                    'flex items-center',
                    item.disabled && 'cursor-not-allowed opacity-60',
                    item.className,
                  )}
                >
                  <input
                    type="radio"
                    id={`${String(name)}-${item.value}`}
                    name={field.name}
                    value={item.value}
                    disabled={item.disabled}
                    checked={value === item.value}
                    onBlur={field.handleBlur}
                    onChange={() => field.handleChange((_prev) => item.value as typeof _prev)}
                    className={twJoin(
                      'h-4 w-4 disabled:cursor-not-allowed',
                      hasError
                        ? 'border-red-800 text-red-500 focus:ring-red-800'
                        : 'border-gray-300 text-blue-600 focus:ring-blue-500',
                    )}
                  />
                  <label
                    htmlFor={`${String(name)}-${item.value}`}
                    className={twJoin(
                      'ml-3 block text-sm font-medium',
                      item.disabled ? 'cursor-not-allowed text-gray-500' : 'text-gray-700',
                    )}
                  >
                    {item.label}
                  </label>
                </div>
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
