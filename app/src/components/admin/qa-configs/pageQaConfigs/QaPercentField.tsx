import type { DeepKeys } from '@tanstack/form-core'
import type { ReactNode } from 'react'
import { twJoin } from 'tailwind-merge'
import {
  inputBase,
  inputError,
  inputNormal,
  labelClass,
} from '@/components/shared/form/fields/sharedStyles'
import { uniqueFormattedFormErrors } from '@/components/shared/form/formatError'
import type { FormApi } from '@/components/shared/form/types'

type Props<T extends Record<string, unknown>> = {
  form: FormApi<T>
  name: DeepKeys<T>
  label: string
  help?: ReactNode
}

/**
 * Percent number input (0–100) with a visible "%" suffix. The field value stays the percent
 * string the admin typed — `schemas.ts` converts it to the stored 0–1 fraction at the form/schema
 * boundary (see `qaThresholdCalculations.ts`), so this component never sees the fraction.
 */
export function QaPercentField<T extends Record<string, unknown>>({
  form,
  name,
  label,
  help,
}: Props<T>) {
  return (
    <form.Field name={name}>
      {(field) => {
        const errors = field.state.meta.errors
        const hasError = Boolean(errors?.length)
        return (
          <div>
            <label htmlFor={String(name)} className={labelClass}>
              {label}
            </label>
            {/* `relative` wraps only the input, so the "%" suffix lines up with its own box
                regardless of label/help height — no magic offsets needed. */}
            <div className="relative max-w-40">
              <input
                id={String(name)}
                name={field.name}
                value={String(field.state.value ?? '')}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange((_prev) => e.target.value as typeof _prev)}
                type="number"
                step={1}
                min={0}
                max={100}
                inputMode="decimal"
                aria-invalid={hasError}
                data-1p-ignore
                data-lpignore
                className={twJoin(inputBase, hasError ? inputError : inputNormal, 'pr-8')}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-500"
              >
                %
              </span>
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
