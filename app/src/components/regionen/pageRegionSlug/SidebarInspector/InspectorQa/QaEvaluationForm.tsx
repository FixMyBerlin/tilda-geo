import { twJoin } from 'tailwind-merge'
import { z } from 'zod'
import { Form } from '@/components/shared/form/Form'
import { formatFormError } from '@/components/shared/form/formatError'
import { Textarea } from '@/components/shared/form/fields/Textarea'
import { buttonStyles } from '@/components/shared/links/styles'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'
import { userStatusOptions } from './qaConfigs'

const schema = z.object({
  userStatus: z.string().min(1, 'Bitte wählen Sie eine Bewertung.'),
  comment: z.string().optional(),
})

type Values = z.infer<typeof schema>

type Props = {
  onSubmit: (values: { userStatus: string; comment?: string }) => void
  isLoading: boolean
}

export const QaEvaluationForm = ({ onSubmit, isLoading }: Props) => {
  return (
    <Form<typeof schema>
      defaultValues={{ userStatus: '', comment: '' } satisfies Values}
      schema={schema}
      onSubmit={async (values) => {
        onSubmit({ userStatus: values.userStatus, comment: values.comment || undefined })
        return undefined
      }}
    >
      {(form) => (
        <>
          <div>
            <h4 className="mb-3 font-semibold text-gray-900">Bewertung hinzufügen</h4>

            <form.Field name="userStatus">
              {(field) => {
                const errors = field.state.meta.errors
                const hasError = Boolean(errors?.length)
                const value = field.state.value ?? ''
                return (
                  <div className="space-y-2">
                    {userStatusOptions.map((option) => (
                      <label
                        key={option.value}
                        className="group flex cursor-pointer items-start rounded-md border border-gray-300 bg-gray-100 p-3 shadow-sm select-none hover:bg-gray-50"
                      >
                        <div className="flex h-5 items-center">
                          <input
                            type="radio"
                            name={field.name}
                            value={option.value}
                            checked={value === option.value}
                            onChange={() => field.handleChange(option.value)}
                            onBlur={field.handleBlur}
                            className={twJoin(
                              'h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500',
                              hasError && 'border-red-800 text-red-500 focus:ring-red-800',
                            )}
                            disabled={isLoading}
                          />
                        </div>
                        <div className="ml-2">
                          <div
                            className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium text-white"
                            style={{ backgroundColor: option.hexColor }}
                          >
                            {option.label}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">{option.description}</div>
                        </div>
                      </label>
                    ))}
                    {hasError && (
                      <div role="alert" className="text-sm text-red-800">
                        {errors?.map((err) => (
                          <p key={formatFormError(err)}>{formatFormError(err)}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }}
            </form.Field>
          </div>

          <Textarea
            form={form}
            name="comment"
            label="Kommentar (Optional, Markdown)"
            optional
            placeholder="Zusätzliche Anmerkungen..."
            rows={3}
            disabled={isLoading}
          />

          <form.Subscribe selector={(s) => s.values.userStatus}>
            {(userStatus) => (
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isLoading || !userStatus}
                  className={twJoin(
                    buttonStyles,
                    'bg-white px-3 py-1',
                    isLoading || !userStatus
                      ? 'cursor-not-allowed border-gray-300 text-gray-400 shadow-sm hover:bg-white'
                      : 'border-gray-400 shadow-md',
                  )}
                >
                  Speichern
                </button>
                {isLoading && <SmallSpinner />}
              </div>
            )}
          </form.Subscribe>
        </>
      )}
    </Form>
  )
}
