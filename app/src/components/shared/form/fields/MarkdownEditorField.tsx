import type { DeepKeys } from '@tanstack/form-core'
import { twJoin } from 'tailwind-merge'
import { uniqueFormattedFormErrors } from '@/components/shared/form/formatError'
import type { FormApi } from '@/components/shared/form/types'
import { MarkdownEditor } from './MarkdownEditor'
import type { FieldProps } from './sharedStyles'
import { labelClass } from './sharedStyles'

type Props<T extends Record<string, unknown>> = FieldProps & {
  form: FormApi<T>
  name: DeepKeys<T>
  placeholder?: string
  disabled?: boolean
}

export function MarkdownEditorField<T extends Record<string, unknown>>({
  form,
  name,
  label,
  help,
  optional,
  optionalSuffix,
  labelClassNameOverwrite,
  labelSrOnly,
  placeholder,
  disabled,
}: Props<T>) {
  return (
    <form.Field name={name}>
      {(field) => {
        const errors = field.state.meta.errors
        const hasError = Boolean(errors?.length)
        const resolvedLabelClassName =
          labelClassNameOverwrite ?? twJoin(labelClass, labelSrOnly ? 'sr-only' : '')

        return (
          <div>
            <label htmlFor={String(name)} className={resolvedLabelClassName}>
              {label}
              {optional && <> ({optionalSuffix ?? 'optional'})</>}
            </label>
            <MarkdownEditor
              id={String(name)}
              value={String(field.state.value ?? '')}
              onChange={(next) => field.handleChange((_prev) => next as typeof _prev)}
              onBlur={field.handleBlur}
              placeholder={placeholder}
              disabled={disabled}
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
