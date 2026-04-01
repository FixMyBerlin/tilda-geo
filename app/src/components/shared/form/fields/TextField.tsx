import type { DeepKeys } from '@tanstack/form-core'
import { twJoin } from 'tailwind-merge'
import { uniqueFormattedFormErrors } from '@/components/shared/form/formatError'
import type { FormApi } from '@/components/shared/form/types'
import type { FieldProps } from './sharedStyles'
import { inputBase, inputError, inputNormal, labelClass } from './sharedStyles'

type Props<T extends Record<string, unknown>> = FieldProps & {
  form: FormApi<T>
  name: DeepKeys<T>
  type?: 'text' | 'email' | 'password' | 'number'
} & Omit<React.JSX.IntrinsicElements['input'], 'name' | 'form'>

export function TextField<T extends Record<string, unknown>>({
  form,
  name,
  label,
  help,
  optional,
  classNameOverwrite,
  labelClassNameOverwrite,
  labelSrOnly,
  type = 'text',
  ...inputProps
}: Props<T>) {
  return (
    <form.Field name={name}>
      {(field) => {
        const errors = field.state.meta.errors
        const hasError = Boolean(errors?.length)
        const autofillIgnoreProps =
          type === 'password' ? {} : ({ 'data-1p-ignore': true, 'data-lpignore': true } as const)
        const resolvedLabelClassName =
          labelClassNameOverwrite ?? twJoin(labelClass, labelSrOnly ? 'sr-only' : '')
        const resolvedInputClassName =
          classNameOverwrite ??
          twJoin(inputBase, hasError ? inputError : inputNormal, inputProps.className)
        return (
          <div>
            <label htmlFor={String(name)} className={resolvedLabelClassName}>
              {label}
              {optional && <> (optional)</>}
            </label>
            <input
              id={String(name)}
              name={field.name}
              value={String(field.state.value ?? '')}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange((_prev) => e.target.value as typeof _prev)}
              type={type}
              className={resolvedInputClassName}
              aria-invalid={hasError}
              {...autofillIgnoreProps}
              {...inputProps}
            />
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
