import { twJoin } from 'tailwind-merge'
import { z } from 'zod'
import { MarkdownEditorField } from '@/components/shared/form/fields/MarkdownEditorField'
import { Form } from '@/components/shared/form/Form'
import { formatFormError } from '@/components/shared/form/formatError'
import { buttonStyles } from '@/components/shared/links/styles'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'
import { ComposerDraftAutosave } from '../../composerDrafts/ComposerDraftAutosave'
import { userStatusOptions } from './qaConfigs'

const schema = z.object({
  userStatus: z.string().min(1, 'Bitte wählen Sie eine Bewertung.'),
  comment: z.string().optional(),
})

type Values = z.infer<typeof schema>

type Props = {
  onSubmit: (values: { userStatus: string; comment?: string }) => void
  isLoading: boolean
  draftId: string
  defaultValues: Values
  saveDraft: (values: Record<string, string>) => void
}

export const QaEvaluationForm = ({
  onSubmit,
  isLoading,
  draftId,
  defaultValues,
  saveDraft,
}: Props) => {
  return (
    <Form<Values>
      key={draftId}
      defaultValues={defaultValues}
      schema={schema}
      className="space-y-3"
      onSubmit={async (values) => {
        onSubmit({ userStatus: values.userStatus, comment: values.comment || undefined })
        return undefined
      }}
    >
      {(form) => (
        <>
          <ComposerDraftAutosave form={form} saveDraft={saveDraft} />
          <div>
            <h4 className="mb-2 font-medium text-gray-900">Bewertung hinzufügen</h4>

            <form.Field name="userStatus">
              {(field) => {
                const errors = field.state.meta.errors
                const hasError = Boolean(errors?.length)
                const value = field.state.value ?? ''
                return (
                  <div className="space-y-2">
                    <div
                      role="radiogroup"
                      aria-label="Bewertung"
                      className={twJoin(
                        'isolate flex flex-col divide-y overflow-hidden rounded-md border bg-white shadow-sm',
                        hasError
                          ? 'divide-red-800 border-red-800'
                          : 'divide-gray-300 border-gray-300',
                      )}
                    >
                      {userStatusOptions.map((option) => {
                        const selected = value === option.value
                        return (
                          <label
                            key={option.value}
                            className={twJoin(
                              'flex cursor-pointer items-start gap-2 p-3 select-none focus-within:relative focus-within:z-10',
                              selected ? 'bg-yellow-50' : 'hover:bg-gray-50',
                            )}
                          >
                            <input
                              type="radio"
                              name={field.name}
                              value={option.value}
                              checked={selected}
                              onChange={() => field.handleChange(option.value)}
                              onBlur={field.handleBlur}
                              className={twJoin(
                                'mt-0.5 h-4 w-4 shrink-0 border-gray-300 text-yellow-600 focus:ring-brand',
                                hasError && 'border-red-800 text-red-500 focus:ring-red-800',
                              )}
                              disabled={isLoading}
                            />
                            <div className="min-w-0">
                              <div
                                className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium text-white"
                                style={{ backgroundColor: option.hexColor }}
                              >
                                {option.label}
                              </div>
                              <div className="mt-1 leading-tight text-gray-500">
                                {option.description}
                              </div>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                    {hasError && (
                      <div role="alert" className="text-red-800">
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

          <div className="space-y-2">
            <MarkdownEditorField
              form={form}
              name="comment"
              label="Kommentar (Markdown)"
              optional
              placeholder="Zusätzliche Anmerkungen..."
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
          </div>
        </>
      )}
    </Form>
  )
}
