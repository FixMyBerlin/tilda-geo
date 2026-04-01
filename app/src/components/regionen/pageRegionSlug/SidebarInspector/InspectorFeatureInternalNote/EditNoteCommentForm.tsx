import { PencilSquareIcon } from '@heroicons/react/20/solid'
import { TrashIcon } from '@heroicons/react/24/outline'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { z } from 'zod'
import { useStaticRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useStaticRegion'
import { Form } from '@/components/shared/form/Form'
import { Textarea } from '@/components/shared/form/fields/Textarea'
import { buttonStylesOnYellow, notesButtonStyle } from '@/components/shared/links/styles'
import { ModalDialog } from '@/components/shared/Modal/ModalDialog'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'
import { sanitizeHtml } from '@/components/shared/utils/sanitizeHtml'
import type {
  DeleteNoteCommentInputType,
  UpdateNoteCommentInputType,
} from '@/server/notes/notes.functions'
import { deleteNoteCommentFn, updateNoteCommentFn } from '@/server/notes/notes.functions'
import type { NoteComment } from '@/server/notes/queries/getNoteAndComments.server'
import { useQueryKey } from '../../notes/InternalNotes/utils/useQueryKey'
import { useIsAuthor } from './utils/useIsAuthor'

const EditNoteCommentSchema = z.object({
  body: z.string().min(1, 'Bitte Antwort eingeben.'),
})

type Props = { comment: NoteComment }

export const EditNoteCommentForm = ({ comment }: Props) => {
  const queryClient = useQueryClient()
  const queryKeyMap = useQueryKey()
  const [open, setOpen] = useState(false)
  const region = useStaticRegion()

  const {
    mutateAsync: updateNoteCommentMutation,
    isPending,
    error,
  } = useMutation({
    mutationFn: (input: UpdateNoteCommentInputType) => updateNoteCommentFn({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['notes', 'getNoteAndComments', { id: comment.noteId }],
      })
      queryClient.invalidateQueries({ queryKey: queryKeyMap })
      setOpen(false)
    },
  })
  const { mutate: deleteNoteCommentMutation } = useMutation({
    mutationFn: (input: DeleteNoteCommentInputType) => deleteNoteCommentFn({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['notes', 'getNoteAndComments', { id: comment.noteId }],
      })
      queryClient.invalidateQueries({ queryKey: queryKeyMap })
    },
  })

  const isAuthor = useIsAuthor(comment.author.id)
  if (!isAuthor) {
    return null
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={notesButtonStyle}>
        <PencilSquareIcon className="size-6" />
      </button>

      <ModalDialog
        title="Antwort bearbeiten"
        icon="edit"
        buttonCloseName="Abbrechen"
        open={open}
        setOpen={setOpen}
      >
        <Form
          defaultValues={{ body: comment.body }}
          schema={EditNoteCommentSchema}
          onSubmit={async (values) => {
            try {
              await updateNoteCommentMutation({
                regionSlug: region.slug,
                commentId: comment.id,
                body: sanitizeHtml(values.body) ?? values.body,
              })
              return { success: true }
            } catch (e) {
              return {
                success: false,
                message: e instanceof Error ? e.message : String(e),
              }
            }
          }}
        >
          {(form) => (
            <>
              <Textarea
                form={form}
                name="body"
                label="Antwort bearbeiten (Markdown)"
                placeholder="Antwort"
                className="my-3 min-h-28 border-0 bg-gray-50 py-2 leading-tight text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-yellow-600 focus:ring-inset"
                rows={6}
              />

              <div className="mt-6 flex items-center justify-between leading-tight">
                <div className="flex items-center gap-1">
                  <form.Subscribe selector={(s) => s.isSubmitting}>
                    {(isSubmitting) => (
                      <button
                        type="submit"
                        className={buttonStylesOnYellow}
                        disabled={isSubmitting || isPending}
                      >
                        Änderung speichern
                      </button>
                    )}
                  </form.Subscribe>
                  {isPending && <SmallSpinner />}
                </div>

                <button
                  type="button"
                  title="Kommentar löschen"
                  onClick={() => {
                    if (
                      window.confirm('Sind Sie sicher, dass Sie diesen Kommentar löschen möchten?')
                    ) {
                      try {
                        setOpen(false)
                        deleteNoteCommentMutation({
                          regionSlug: region.slug,
                          commentId: comment.id,
                        })
                      } catch (err) {
                        window.alert(String(err))
                        console.error(err)
                      }
                    }
                  }}
                  className={twMerge(notesButtonStyle, 'hover:bg-orange-400')}
                >
                  <TrashIcon className="size-6" />
                </button>
              </div>

              {error ? <p className="text-red-500">{error.message}</p> : null}
            </>
          )}
        </Form>
      </ModalDialog>
    </>
  )
}
