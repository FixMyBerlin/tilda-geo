import { useState } from 'react'
import { z } from 'zod'
import { MarkdownEditorField } from '@/components/shared/form/fields/MarkdownEditorField'
import { Form } from '@/components/shared/form/Form'
import { buttonStylesOnYellow } from '@/components/shared/links/styles'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'
import { sanitizeHtml } from '@/components/shared/utils/sanitizeHtml'
import { ComposerDraftAutosave } from './composerDrafts/ComposerDraftAutosave'
import { useComposerDraft } from './composerDrafts/useComposerDraft'

const bodySchema = (requiredMessage: string) =>
  z.object({
    body: z.string().trim().min(1, requiredMessage),
  })

type CommentValues = { body: string }

type Props = {
  draftId: string
  label: string
  submitLabel: string
  onSubmit: (body: string) => Promise<void>
  placeholder?: string
  labelSrOnly?: boolean
  requiredMessage?: string
}

/**
 * Markdown comment box with draft autosave. Used for TILDA note replies, Prüfeintrag comments,
 * and the same editor as QA / new-note bodies (`MarkdownEditorField`).
 */
export const ModeCommentComposer = ({
  draftId,
  label,
  submitLabel,
  onSubmit,
  placeholder,
  labelSrOnly,
  requiredMessage = 'Bitte Kommentar eingeben.',
}: Props) => {
  const [sessionKey, setSessionKey] = useState(0)
  const { isReady, draftValues, saveDraft, clearDraft } = useComposerDraft(draftId, sessionKey)

  if (!isReady) {
    return <SmallSpinner />
  }

  return (
    <Form<CommentValues>
      key={`${draftId}-${sessionKey}`}
      className="space-y-3"
      defaultValues={{ body: draftValues?.body ?? draftValues?.comment ?? '' }}
      schema={bodySchema(requiredMessage)}
      onSubmit={async (values) => {
        try {
          await onSubmit(sanitizeHtml(values.body))
          clearDraft()
          setSessionKey((key) => key + 1)
          return { success: true, resetValues: { body: '' } }
        } catch (error) {
          return {
            success: false,
            message: error instanceof Error ? error.message : String(error),
          }
        }
      }}
    >
      {(form) => (
        <>
          <ComposerDraftAutosave form={form} saveDraft={saveDraft} />
          <MarkdownEditorField
            form={form}
            name="body"
            label={label}
            labelSrOnly={labelSrOnly}
            placeholder={placeholder}
          />
          <div className="flex items-center gap-1 leading-tight">
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <button type="submit" className={buttonStylesOnYellow} disabled={isSubmitting}>
                  {submitLabel}
                </button>
              )}
            </form.Subscribe>
          </div>
        </>
      )}
    </Form>
  )
}
