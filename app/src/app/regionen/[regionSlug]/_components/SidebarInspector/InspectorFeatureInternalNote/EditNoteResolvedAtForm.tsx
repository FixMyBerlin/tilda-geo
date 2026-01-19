import { SmallSpinner } from '@/src/app/_components/Spinner/SmallSpinner'
import updateNoteResolvedAt from '@/src/server/notes/mutations/updateNoteResolvedAt'
import getNoteAndComments, { NoteAndComments } from '@/src/server/notes/queries/getNoteAndComments'
import { getQueryClient, getQueryKey, useMutation } from '@blitzjs/rpc'
import { Field, Label, Switch } from '@headlessui/react'
import { useEffect, useState } from 'react'
import { twJoin } from 'tailwind-merge'
import { useQueryKey } from '../../notes/InternalNotes/utils/useQueryKey'
import { useStaticRegion } from '../../regionUtils/useStaticRegion'
import { SvgNotesCheckmark } from '../icons/SvgNotesCheckmark'
import { SvgNotesQuestionmark } from '../icons/SvgNotesQuestionmark'

type Props = { note: NoteAndComments }

export const EditNoteResolvedAtForm = ({ note }: Props) => {
  const [updateNoteMutation, { isLoading, error }] = useMutation(updateNoteResolvedAt)
  const [formResolved, setFormResolved] = useState(note.resolvedAt !== null)
  const region = useStaticRegion()
  const queryKeyMap = useQueryKey()

  // note.resolvedAt can be changed by EditNoteForm which triggers
  // a refetch of `note` outside, which triggers a rerender. However that is not enough to
  // update the setFormResolved initial state. As a quick workaround we update the state here:
  useEffect(() => {
    setFormResolved(note.resolvedAt !== null)
  }, [note?.resolvedAt])

  const handleSubmit = async (state: boolean) => {
    setFormResolved(state)
    updateNoteMutation(
      {
        regionSlug: region!.slug,
        noteId: note.id,
        resolved: !formResolved, // true represets the left side of the switch which is 'open'
      },
      {
        onSuccess: (note) => {
          const queryKeyInspector = getQueryKey(getNoteAndComments, { id: note.id })
          getQueryClient().invalidateQueries(queryKeyInspector)
          getQueryClient().invalidateQueries(queryKeyMap)
        },
      },
    )
  }

  return (
    <form>
      <Field
        as="div"
        className="mt-3 flex items-center gap-1.5 text-sm"
        title={note?.resolvedAt?.toLocaleString()}
      >
        <span>Status:</span>{' '}
        <Switch
          checked={formResolved}
          onChange={handleSubmit}
          className={twJoin(
            formResolved ? 'bg-yellow-600' : 'bg-gray-200',
            'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:outline-none',
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
        <Label as="span">
          <span className="sr-only">Dieser Hinweis ist </span>
          {formResolved ? 'erledigt' : 'offen'}
          <span className="sr-only">.</span>
        </Label>
        {isLoading && <SmallSpinner />}
      </Field>

      {/* @ts-expect-errors TODO Research how the error message is provided by Blitz */}
      {error ? <p className="text-red-500">{error.message}</p> : null}
    </form>
  )
}
