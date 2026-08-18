import type { DeepKeys } from '@tanstack/form-core'
import { twJoin } from 'tailwind-merge'
import { isPartialEnDecimalInput } from '@/components/shared/form/enDecimalInput'
import { uniqueFormattedFormErrors } from '@/components/shared/form/formatError'
import type { FormApi } from '@/components/shared/form/types'
import type { FieldProps } from './sharedStyles'
import { inputBase, inputError, inputNormal, inputReadonly, labelClass } from './sharedStyles'

type Props<T extends Record<string, unknown>> = FieldProps & {
  form: FormApi<T>
  name: DeepKeys<T>
  /** Text input with dot decimals (EN), for coordinates and other geo numbers. */
  decimalEn?: boolean
  type?: 'text' | 'email' | 'password' | 'number'
} & Omit<React.JSX.IntrinsicElements['input'], 'name' | 'form' | 'type'>

export function TextField<T extends Record<string, unknown>>({
  form,
  name,
  label,
  help,
  optional,
  optionalSuffix,
  classNameOverwrite,
  labelClassNameOverwrite,
  labelSrOnly,
  decimalEn = false,
  type = 'text',
  ...inputProps
}: Props<T>) {
  const { readOnly, className, onBlur, ...restInputProps } = inputProps
  const isReadonly = Boolean(readOnly)
  const resolvedType = decimalEn ? 'text' : type
  return (
    <form.Field name={name}>
      {(field) => {
        const errors = field.state.meta.errors
        const hasError = Boolean(errors?.length)
        const autofillIgnoreProps =
          resolvedType === 'password'
            ? {}
            : ({ 'data-1p-ignore': true, 'data-lpignore': true } as const)
        const resolvedLabelClassName =
          labelClassNameOverwrite ?? twJoin(labelClass, labelSrOnly ? 'sr-only' : '')
        const resolvedInputClassName =
          classNameOverwrite ??
          twJoin(
            inputBase,
            isReadonly ? inputReadonly : hasError ? inputError : inputNormal,
            className,
          )
        return (
          <div>
            <label htmlFor={String(name)} className={resolvedLabelClassName}>
              {label}
              {optional && <> ({optionalSuffix ?? 'optional'})</>}
            </label>
            <input
              id={String(name)}
              name={field.name}
              value={String(field.state.value ?? '')}
              onBlur={(event) => {
                field.handleBlur()
                onBlur?.(event)
              }}
              onChange={(e) => {
                const nextValue = decimalEn
                  ? isPartialEnDecimalInput(e.target.value)
                    ? e.target.value
                    : String(field.state.value ?? '')
                  : e.target.value
                field.handleChange((_prev) => nextValue as typeof _prev)
              }}
              type={resolvedType}
              inputMode={decimalEn ? 'decimal' : restInputProps.inputMode}
              lang={decimalEn ? 'en' : restInputProps.lang}
              spellCheck={decimalEn ? false : restInputProps.spellCheck}
              className={resolvedInputClassName}
              aria-invalid={hasError}
              readOnly={readOnly}
              {...autofillIgnoreProps}
              {...restInputProps}
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
