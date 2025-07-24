import { ModalDialog } from '@/src/app/_components/Modal/ModalDialog'
import { SmallSpinner } from '@/src/app/_components/Spinner/SmallSpinner'
import { buttonStylesOnYellow, notesButtonStyle } from '@/src/app/_components/links/styles'
import deleteNote from '@/src/server/notes/mutations/deleteNote'
import updateNote from '@/src/server/notes/mutations/updateNote'
import getNoteAndComments, { NoteAndComments } from '@/src/server/notes/queries/getNoteAndComments'
import { getQueryClient, getQueryKey, useMutation } from '@blitzjs/rpc'
import { Field, Label, Switch } from '@headlessui/react'
import { PencilSquareIcon } from '@heroicons/react/20/solid'
import { TrashIcon } from '@heroicons/react/24/outline'
import dompurify from 'dompurify'
import { useState } from 'react'
import { twJoin, twMerge } from 'tailwind-merge'
import { useMapActions } from '../../../_hooks/mapState/useMapState'
import { useQueryKey } from '../../notes/InternalNotes/utils/useQueryKey'
import { useStaticRegion } from '../../regionUtils/useStaticRegion'
import { SvgNotesCheckmark } from '../icons/SvgNotesCheckmark'
import { SvgNotesQuestionmark } from '../icons/SvgNotesQuestionmark'
import { useIsAuthor } from './utils/useIsAuthor'

type Props = { note: NoteAndComments }

export const EditNoteForm = ({ note }: Props) => {
  const [updateNoteMutation, { isLoading, error }] = useMutation(updateNote)
  const { resetInspectorFeatures } = useMapActions()
  const [deleteNoteMutation] = useMutation(deleteNote)
  const [open, setOpen] = useState(false)
  const [formResolved, setFormResolved] = useState(note.resolvedAt !== null)
  const region = useStaticRegion()
  const queryKeyMap = useQueryKey()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const sanitize = (input: string) => (input ? dompurify.sanitize(input) : input)
    updateNoteMutation(
      {
        regionSlug: region!.slug,
        noteId: note.id,
        subject: sanitize(new FormData(event.currentTarget).get('subject')!.toString()),
        body: sanitize(new FormData(event.currentTarget).get('body')!.toString()),
        resolved: formResolved, // Note that for some reason the condition is different here than in <EditNoteResolvedAtForm>
      },
      {
        onSuccess: (note) => {
          const queryKeyInspector = getQueryKey(getNoteAndComments, { id: note.id })
          getQueryClient().invalidateQueries(queryKeyInspector)
          getQueryClient().invalidateQueries(queryKeyMap)
          setOpen(false)
        },
      },
    )
  }

  const isAuthor = useIsAuthor(note.author.id)
  if (!isAuthor) {
    return null
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={notesButtonStyle}>
        <PencilSquareIcon className="size-6" />
      </button>

      <ModalDialog
        title="Hinweis bearbeiten"
        icon="edit"
        buttonCloseName="Abbrechen"
        open={open}
        setOpen={setOpen}
      >
        <form onSubmit={handleSubmit}>
          <label>
            <span className="sr-only">Betreff bearbeiten</span>
            <input
              type="text"
              name="subject"
              className="my-3 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-yellow-600"
              placeholder="Betreff"
              data-1p-ignore
              data-lpignore
              required
              defaultValue={note.subject}
            />
          </label>

          <label>
            <span className="sr-only">Kommentar bearbeiten (Markdown)</span>
            <textarea
              name="body"
              className="my-3 block min-h-28 w-full rounded-md border-0 bg-gray-50 py-2 leading-tight text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-yellow-600"
              placeholder="Kommentar"
              data-1p-ignore
              data-lpignore
              required
              defaultValue={note.body || ''}
            />
          </label>

          <Field as="div" className="flex items-center">
            <Switch
              checked={formResolved}
              onChange={setFormResolved}
              className={twJoin(
                formResolved ? 'bg-yellow-600' : 'bg-gray-200',
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2',
              )}
            >
              <span className="sr-only">Erledigt</span>
              <span
                className={twJoin(
                  formResolved ? 'translate-x-5' : 'translate-x-0',
                  'pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                )}
              >
                <span
                  className={twJoin(
                    formResolved
                      ? 'opacity-0 duration-100 ease-out'
                      : 'opacity-100 duration-200 ease-in',
                    'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity',
                  )}
                  aria-hidden="true"
                >
                  <SvgNotesQuestionmark className="size-5 text-sky-700" />
                </span>
                <span
                  className={twJoin(
                    formResolved
                      ? 'opacity-100 duration-200 ease-in'
                      : 'opacity-0 duration-100 ease-out',
                    'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity',
                  )}
                  aria-hidden="true"
                >
                  <SvgNotesCheckmark className="size-5 text-sky-700" />
                </span>
              </span>
            </Switch>
            <Label as="span" className="ml-3 text-sm">
              {formResolved ? 'ist erledigt' : 'ist offen'}
            </Label>
          </Field>

          <div className="mt-6 flex items-center justify-between leading-tight">
            <div className="flex items-center gap-1">
              <button type="submit" className={buttonStylesOnYellow} disabled={isLoading}>
                Änderung speichern
              </button>
              {isLoading && <SmallSpinner />}
            </div>

            <button
              type="button"
              title="Hinweis löschen"
              onClick={async () => {
                if (window.confirm('Sind Sie sicher, dass Sie diesen Hinweis löschen möchten?')) {
                  try {
                    setOpen(false)
                    await deleteNoteMutation({
                      regionSlug: region!.slug,
                      noteId: note.id,
                    })
                    resetInspectorFeatures()
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
