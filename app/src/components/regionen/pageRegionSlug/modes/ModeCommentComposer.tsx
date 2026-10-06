import { useState } from 'react'
import { z } from 'zod'
import { MarkdownEditorField } from '@/components/shared/form/fields/MarkdownEditorField'
import { Form } from '@/components/shared/form/Form'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'
import { sanitizeHtml } from '@/components/shared/utils/sanitizeHtml'
import { ComposerDraftAutosave } from './composerDrafts/ComposerDraftAutosave'
import { useComposerDraft } from './composerDrafts/useComposerDraft'
import { ModeFormSubmit } from './ModeFormSubmit'

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
export const ModeCommentComposer = ({ draftId, ...props }: Props) => {
  const [sessionKey, setSessionKey] = useState(0)
  return (
    <ModeCommentComposerSession
      key={`${draftId}-${sessionKey}`}
      draftId={draftId}
      onDraftSessionConsumed={() => setSessionKey((key) => key + 1)}
      {...props}
    />
  )
}

const ModeCommentComposerSession = ({
  draftId,
  label,
  submitLabel,
  onSubmit,
  placeholder,
  labelSrOnly,
  requiredMessage = 'Bitte Kommentar eingeben.',
  onDraftSessionConsumed,
}: Props & { onDraftSessionConsumed: () => void }) => {
  const { isReady, draftValues, saveDraft, clearDraft } = useComposerDraft(draftId)

  if (!isReady) {
    return <SmallSpinner />
  }

  return (
    <Form<CommentValues>
      className="space-y-3"
      defaultValues={{ body: draftValues?.body ?? draftValues?.comment ?? '' }}
      schema={bodySchema(requiredMessage)}
      onSubmit={async (values) => {
        try {
          await onSubmit(sanitizeHtml(values.body))
          clearDraft()
          onDraftSessionConsumed()
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
          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => <ModeFormSubmit label={submitLabel} pending={isSubmitting} />}
          </form.Subscribe>
        </>
      )}
    </Form>
  )
}
