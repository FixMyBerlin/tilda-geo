import { zodResolver } from '@hookform/resolvers/zod'
import { PropsWithoutRef, ReactNode, useState } from 'react'
import { FormProvider, UseFormProps, useForm } from 'react-hook-form'
import { IntlProvider } from 'react-intl'
import { twMerge } from 'tailwind-merge'
import { z } from 'zod'
import { SmallSpinner } from '../Spinner/SmallSpinner'
import { buttonStyles } from '../links/styles'
import { FormError } from './FormError'
import { errorMessageTranslations } from './errorMessageTranslations'

export interface FormProps<S extends z.ZodType<any, any>>
  extends Omit<PropsWithoutRef<JSX.IntrinsicElements['form']>, 'onSubmit'> {
  /** All your form fields */
  children?: ReactNode
  /** Text to display in the submit button */
  submitText?: string
  submitClassName?: string
  schema?: S
  onSubmit: (values: z.infer<S>) => Promise<void | OnSubmitResult>
  initialValues?: UseFormProps<z.infer<S>>['defaultValues']
}

interface OnSubmitResult {
  FORM_ERROR?: string
  [prop: string]: any
}

export const FORM_ERROR = 'FORM_ERROR'

export function Form<S extends z.ZodType<any, any>>({
  children,
  submitText,
  submitClassName,
  schema,
  initialValues,
  onSubmit,
  className,
  ...props
}: FormProps<S>) {
  const ctx = useForm<z.infer<S>>({
    mode: 'onBlur',
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues: initialValues,
  })
  const [formError, setFormError] = useState<string | null>(null)

  return (
    <IntlProvider messages={errorMessageTranslations} locale="de" defaultLocale="de">
      <FormProvider {...ctx}>
        <form
          className={twMerge('space-y-6', className)}
          onSubmit={ctx.handleSubmit(async (values) => {
            const result = (await onSubmit(values)) || {}
            for (const [key, value] of Object.entries(result)) {
              if (key === FORM_ERROR) {
                // For ZodErrors, the message field is not deserialized.
                // We try to parse it here but also make catch edge cases.
                // Learn more at https://github.com/blitz-js/blitz/issues/4059
                if (value.name === 'ZodError' && typeof value.message === 'string') {
                  try {
                    value.message = JSON.parse(value.message)
                  } catch {}
                }
                setFormError(value)
              } else {
                ctx.setError(key as any, {
                  type: 'submit',
                  message: value,
                })
              }
            }
          })}
          {...props}
        >
          {/* Form fields supplied as children are rendered here */}
          {children}

          <FormError formError={formError} />
          {submitText && (
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={ctx.formState.isSubmitting}
                className={submitClassName || buttonStyles}
              >
                {submitText}
              </button>
              {ctx.formState.isSubmitting && <SmallSpinner />}
            </div>
          )}
        </form>
      </FormProvider>
    </IntlProvider>
  )
}

export default Form
