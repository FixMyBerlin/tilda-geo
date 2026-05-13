import type { FormValidateOrFn } from '@tanstack/form-core'
import { useForm } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { twMerge } from 'tailwind-merge'
import type { z } from 'zod'
import { FormActionBar } from '@/components/shared/form/FormActionBar'
import { uniqueFormattedFormErrors } from '@/components/shared/form/formatError'
import type { FormApi } from '@/components/shared/form/types'
import { buttonStyles } from '@/components/shared/links/styles'
import { isProd } from '@/components/shared/utils/isEnv'

export type SubmitResult<T = Record<string, unknown>> =
  | { success: true; message?: string; redirect?: string }
  | {
      success: false
      message: string
      errors?: Partial<Record<Extract<keyof T, string>, string[]>>
    }

function applyFieldErrors(
  form: { setFieldMeta: unknown; state: { values: unknown } },
  errors: Partial<Record<string, string[]>> | undefined,
) {
  if (!errors) return
  const values = form.state.values
  if (typeof values !== 'object' || values === null) return
  const setFieldMeta = form.setFieldMeta as (
    field: string,
    updater: (prev: { errors?: string[] }) => { errors: string[] },
  ) => void
  for (const key of Object.keys(errors)) {
    if (!(key in values)) continue
    const messages = errors[key]
    if (!messages?.length) continue
    setFieldMeta(key, (prev) => ({
      ...prev,
      errors: messages,
    }))
  }
}

/** Use schema input shape for field values (differs from `z.infer` when the schema uses `.transform()`). */
type FormProps<T extends z.ZodTypeAny> = {
  actionBarRight?: ReactNode
  defaultValues: z.input<T>
  schema: T
  onSubmit: (values: z.input<T>) => undefined | Promise<SubmitResult<z.input<T>> | undefined>
  children: (form: FormApi<z.input<T>>) => ReactNode
  className?: string
  submitLabel?: string
  submitClassName?: string
  showFormErrors?: boolean
}

export function Form<T extends z.ZodTypeAny>({
  actionBarRight,
  defaultValues,
  schema,
  onSubmit,
  submitLabel,
  submitClassName,
  showFormErrors = true,
  children,
  className,
}: FormProps<T>) {
  const navigate = useNavigate()
  const [submitMessage, setSubmitMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const form = useForm<
    z.input<T>,
    undefined,
    FormValidateOrFn<z.input<T>>,
    undefined,
    undefined,
    undefined,
    FormValidateOrFn<z.input<T>>,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined
  >({
    defaultValues,
    validators: {
      onChange: schema,
      onSubmit: schema,
    },
    onSubmit: async ({ value }) => {
      setSubmitMessage(null)
      const result = await onSubmit(value)
      if (!result) return
      if (result.success) {
        form.reset(value)
        setSubmitMessage({ type: 'success', text: result.message ?? 'Gespeichert.' })
        if (result.redirect) {
          navigate({ to: result.redirect })
        }
        return
      }
      if (!isProd) {
        console.info('[Form] submit rejected', {
          message: result.message,
          fieldErrors: result.errors,
          values: value,
        })
      }
      setSubmitMessage({ type: 'error', text: result.message })
      applyFieldErrors(form, result.errors)
    },
  })

  return (
    <form
      method="post"
      className={twMerge('space-y-6', className)}
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
    >
      {children(form as FormApi<z.input<T>>)}

      {showFormErrors ? (
        <form.Subscribe selector={(s) => s.errors}>
          {(errors) => {
            const lines = uniqueFormattedFormErrors(errors)
            if (lines.length === 0) return null
            if (!isProd) {
              console.info('[Form] validation errors (client)', {
                raw: errors,
                formattedLines: lines,
              })
            }
            return (
              <div className="text-sm text-red-600" role="alert">
                {lines.map((msg) => (
                  <p key={msg}>{msg}</p>
                ))}
              </div>
            )
          }}
        </form.Subscribe>
      ) : null}

      {submitMessage && (
        <div
          className={`text-sm ${submitMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}
          role={submitMessage.type === 'error' ? 'alert' : 'status'}
        >
          {submitMessage.text}
        </div>
      )}

      {submitLabel && (
        <FormActionBar
          left={
            <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
              {([canSubmit, isSubmitting]) => (
                <button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className={submitClassName ?? buttonStyles}
                >
                  {isSubmitting ? '…' : submitLabel}
                </button>
              )}
            </form.Subscribe>
          }
          right={actionBarRight}
        />
      )}
    </form>
  )
}
