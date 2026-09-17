import { PencilSquareIcon } from '@heroicons/react/20/solid'
import { useId, useState } from 'react'
import { z } from 'zod'
import { MarkdownEditorField } from '@/components/shared/form/fields/MarkdownEditorField'
import { Form } from '@/components/shared/form/Form'
import { notesButtonStyle } from '@/components/shared/links/styles'
import { ModalDialog } from '@/components/shared/Modal/ModalDialog'
import { captureModalOpenOrigin } from '@/components/shared/motion/modalOpenOrigin'
import { ModeFormSubmit } from './ModeFormSubmit'
import type { ModeAccentMode } from './modeIdentity'
import { useIsAuthor } from './notes/detail/utils/useIsAuthor'

const EditCommentSchema = z.object({
  body: z.string().min(1, 'Bitte Kommentar eingeben.'),
})

type Props = {
  authorId: string
  body: string
  mode: ModeAccentMode
  onSave: (body: string) => Promise<unknown>
}

/** Author-only comment edit (QA, Prüflisten). Same rule as internal note comments; the server re-checks. */
export const ModeCommentEditButton = ({ authorId, body, mode, onSave }: Props) => {
  const formId = useId()
  const [open, setOpen] = useState(false)
  const isAuthor = useIsAuthor(authorId)
  if (!isAuthor) return null

  return (
    <>
      <button
        type="button"
        title="Kommentar bearbeiten"
        onClick={(event) => {
          captureModalOpenOrigin(event.currentTarget)
          setOpen(true)
        }}
        className={notesButtonStyle}
      >
        <PencilSquareIcon className="size-5" />
      </button>

      <ModalDialog
        title="Kommentar bearbeiten"
        icon="edit"
        mode={mode}
        buttonCloseName="Abbrechen"
        open={open}
        setOpen={setOpen}
        primaryAction={
          <ModeFormSubmit
            label="Änderung speichern"
            form={formId}
            buttonClassName="w-full sm:w-auto"
          />
        }
      >
        <Form
          id={formId}
          defaultValues={{ body }}
          schema={EditCommentSchema}
          onSubmit={async (values) => {
            try {
              await onSave(values.body)
              setOpen(false)
              return { success: true }
            } catch (error) {
              return {
                success: false,
                message: error instanceof Error ? error.message : String(error),
              }
            }
          }}
        >
          {(form) => (
            <MarkdownEditorField
              form={form}
              name="body"
              label="Kommentar bearbeiten (Markdown)"
              placeholder="Kommentar"
            />
          )}
        </Form>
      </ModalDialog>
    </>
  )
}
