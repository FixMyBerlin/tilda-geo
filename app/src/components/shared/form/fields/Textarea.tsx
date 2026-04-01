import type { DeepKeys } from '@tanstack/form-core'
import { twJoin } from 'tailwind-merge'
import { uniqueFormattedFormErrors } from '@/components/shared/form/formatError'
import type { FormApi } from '@/components/shared/form/types'
import type { FieldProps } from './sharedStyles'
import { inputBase, inputError, inputNormal, labelClass } from './sharedStyles'

type Props<T extends Record<string, unknown>> = FieldProps & {
  form: FormApi<T>
  name: DeepKeys<T>
} & Omit<React.JSX.IntrinsicElements['textarea'], 'name' | 'form'>

export function Textarea<T extends Record<string, unknown>>({
  form,
  name,
  label,
  help,
  optional,
  classNameOverwrite,
  labelClassNameOverwrite,
  labelSrOnly,
  ...textareaProps
}: Props<T>) {
  const { className, ...restTextareaProps } = textareaProps
  return (
    <form.Field name={name}>
      {(field) => {
        const errors = field.state.meta.errors
        const hasError = Boolean(errors?.length)
        const resolvedLabelClassName =
          labelClassNameOverwrite ?? twJoin(labelClass, labelSrOnly ? 'sr-only' : '')
        const resolvedTextareaClassName =
          classNameOverwrite ?? twJoin(inputBase, hasError ? inputError : inputNormal, className)
        return (
          <div>
            <label htmlFor={String(name)} className={resolvedLabelClassName}>
              {label}
              {optional && <> (optional)</>}
            </label>
            <textarea
              id={String(name)}
              name={field.name}
              value={String(field.state.value ?? '')}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange((_prev) => e.target.value as typeof _prev)}
              className={resolvedTextareaClassName}
              aria-invalid={hasError}
              data-1p-ignore
              data-lpignore
              {...restTextareaProps}
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
