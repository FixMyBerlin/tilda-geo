import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useId, useState } from 'react'
import { z } from 'zod'
import {
  mapControlIconClassName,
  mobileMapIconButtonClassName,
} from '@/components/regionen/pageRegionSlug/mobile/mobileControlButton.const'
import { DeleteConfirmDialog } from '@/components/shared/dialog/DeleteConfirmDialog'
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
  /** Shows a delete button in the dialog footer when given. */
  onDelete?: () => Promise<unknown>
}

/** Author-only comment edit and delete (QA, Prüflisten). Same rule as internal note comments; the server re-checks. */
export const ModeCommentEditButton = ({ authorId, body, mode, onSave, onDelete }: Props) => {
  const formId = useId()
  const [open, setOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
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
        className={mobileMapIconButtonClassName}
      >
        <PencilSquareIcon className={mapControlIconClassName} />
      </button>

      <ModalDialog
        title="Kommentar bearbeiten"
        icon="edit"
        mode={mode}
        buttonCloseName="Abbrechen"
        open={open}
        setOpen={setOpen}
        footerStart={
          onDelete ? (
            <button
              type="button"
              title="Kommentar löschen"
              onClick={() => setDeleteOpen(true)}
              className={notesButtonStyle}
            >
              <TrashIcon className="size-6" />
            </button>
          ) : undefined
        }
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
        {onDelete ? (
          <DeleteConfirmDialog
            open={deleteOpen}
            setOpen={setDeleteOpen}
            title="Kommentar löschen?"
            description="Der Kommentar wird gelöscht. Das lässt sich nicht rückgängig machen."
            onDelete={async () => {
              await onDelete()
              setOpen(false)
            }}
          />
        ) : null}
      </ModalDialog>
    </>
  )
}
