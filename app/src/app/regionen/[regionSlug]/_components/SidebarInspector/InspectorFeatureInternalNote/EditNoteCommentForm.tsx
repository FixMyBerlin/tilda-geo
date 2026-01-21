import { ModalDialog } from '@/src/app/_components/Modal/ModalDialog'
import { SmallSpinner } from '@/src/app/_components/Spinner/SmallSpinner'
import { buttonStylesOnYellow, notesButtonStyle } from '@/src/app/_components/links/styles'
import deleteNoteComment from '@/src/server/notes/mutations/deleteNoteComment'
import updateNoteComment from '@/src/server/notes/mutations/updateNoteComment'
import getNoteAndComments, { NoteComment } from '@/src/server/notes/queries/getNoteAndComments'
import { getQueryClient, getQueryKey, useMutation } from '@blitzjs/rpc'
import { PencilSquareIcon } from '@heroicons/react/20/solid'
import { TrashIcon } from '@heroicons/react/24/outline'
import dompurify from 'dompurify'
import { useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { useQueryKey } from '../../notes/InternalNotes/utils/useQueryKey'
import { useStaticRegion } from '../../regionUtils/useStaticRegion'
import { useIsAuthor } from './utils/useIsAuthor'
type Props = { comment: NoteComment }

export const EditNoteCommentForm = ({ comment }: Props) => {
  const [updateNoteCommentMutation, { isLoading, error }] = useMutation(updateNoteComment)
  const [deleteNoteCommentMutation] = useMutation(deleteNoteComment)
  const [open, setOpen] = useState(false)
  const region = useStaticRegion()
  // Keys to ping the queries to rerun
  const queryKeyInspector = getQueryKey(getNoteAndComments, { id: comment.noteId })
  const queryKeyMap = useQueryKey()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const sanitize = (input: string) => (input ? dompurify.sanitize(input) : input)
    updateNoteCommentMutation(
      {
        regionSlug: region!.slug,
        commentId: comment.id,
        body: sanitize(new FormData(event.currentTarget).get('body')!.toString()),
      },
      {
        onSuccess: () => {
          getQueryClient().invalidateQueries(queryKeyInspector)
          getQueryClient().invalidateQueries(queryKeyMap)
          setOpen(false)
        },
      },
    )
  }

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
        <form onSubmit={handleSubmit}>
          <label>
            <span className="sr-only">Antwort bearbeiten (Markdown)</span>
            <textarea
              name="body"
              className="my-3 block min-h-28 w-full rounded-md border-0 bg-gray-50 py-2 leading-tight text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-yellow-600 focus:ring-inset"
              data-1p-ignore
              data-lpignore
              defaultValue={comment.body}
              required
            />
          </label>

          <div className="mt-6 flex items-center justify-between leading-tight">
            <div className="flex items-center gap-1">
              <button type="submit" className={buttonStylesOnYellow} disabled={isLoading}>
                Änderung speichern
              </button>
              {isLoading && <SmallSpinner />}
            </div>

            <button
              type="button"
              title="Kommentar löschen"
              onClick={async () => {
                if (window.confirm('Sind Sie sicher, dass Sie diesen Kommentar löschen möchten?')) {
                  try {
                    setOpen(false)
                    await deleteNoteCommentMutation({
                      regionSlug: region!.slug,
                      commentId: comment.id,
                    })
                    getQueryClient().invalidateQueries(queryKeyInspector)
                    getQueryClient().invalidateQueries(queryKeyMap)
                  } catch (error: any) {
                    window.alert(error.toString())
                    console.error(error)
                  }
                }
              }}
              className={twMerge(notesButtonStyle, 'hover:bg-orange-400')}
            >
              <TrashIcon className="size-6" />
            </button>
          </div>

          {/* @ts-expect-errors TODO Research how the error message is provided by Blitz */}
          {error ? <p className="text-red-500">{error.message}</p> : null}
        </form>
      </ModalDialog>
    </>
  )
}
