import type { DeepKeys } from '@tanstack/form-core'
import { twJoin } from 'tailwind-merge'
import { uniqueFormattedFormErrors } from '@/components/shared/form/formatError'
import type { FormApi } from '@/components/shared/form/types'
import { labelClass } from './sharedStyles'

type Props<T extends Record<string, unknown>> = {
  form: FormApi<T>
  name: DeepKeys<T>
  label: string
  disabled?: boolean
}

/** Hex color (`#rrggbb`) via the browser's native color picker, with the value shown next to it. */
export function ColorField<T extends Record<string, unknown>>({
  form,
  name,
  label,
  disabled,
}: Props<T>) {
  return (
    <form.Field name={name}>
      {(field) => {
        const errors = field.state.meta.errors
        const hasError = Boolean(errors?.length)
        const value = String(field.state.value ?? '')
        return (
          <div>
            <label htmlFor={String(name)} className={labelClass}>
              {label}
            </label>
            <div className="flex h-[38px] items-center gap-2">
              {/* Round swatch (Tailwind Plus color picker), the native picker sits invisibly on top. */}
              <span
                className={twJoin(
                  'relative flex size-8 shrink-0 rounded-full outline -outline-offset-1 outline-black/10',
                  'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-blue-500',
                  hasError && 'outline-2 outline-offset-2 outline-red-800',
                )}
                style={{ backgroundColor: value }}
              >
                <input
                  id={String(name)}
                  name={field.name}
                  type="color"
                  value={value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange((_prev) => e.target.value as typeof _prev)}
                  className="absolute inset-0 size-full cursor-pointer appearance-none rounded-full opacity-0 disabled:cursor-not-allowed"
                  disabled={disabled}
                  aria-invalid={hasError}
                />
              </span>
              <span className="font-mono text-sm text-gray-600">{value}</span>
            </div>
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
