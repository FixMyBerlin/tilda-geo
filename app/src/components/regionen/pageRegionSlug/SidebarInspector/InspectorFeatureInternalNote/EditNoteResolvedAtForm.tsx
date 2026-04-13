import { Field, Label, Switch } from '@headlessui/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { startTransition, useEffect, useState } from 'react'
import { twJoin } from 'tailwind-merge'
import { useStaticRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useStaticRegion'
import { NativeForm } from '@/components/shared/form/NativeForm'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'
import type { UpdateNoteResolvedAtInputType } from '@/server/notes/notes.functions'
import { updateNoteResolvedAtFn } from '@/server/notes/notes.functions'
import type { NoteAndComments } from '@/server/notes/queries/getNoteAndComments.server'
import { useQueryKey } from '../../notes/InternalNotes/utils/useQueryKey'
import { SvgNotesCheckmark } from '../icons/SvgNotesCheckmark'
import { SvgNotesQuestionmark } from '../icons/SvgNotesQuestionmark'

type Props = { note: NonNullable<NoteAndComments> }

export const EditNoteResolvedAtForm = ({ note }: Props) => {
  const queryClient = useQueryClient()
  const queryKeyMap = useQueryKey()
  const region = useStaticRegion()
  const resolvedFromNote = note.resolvedAt !== null
  const [userInteracted, setUserInteracted] = useState(false)
  const [formResolved, setFormResolved] = useState(resolvedFromNote)

  useEffect(
    function syncFormResolvedFromIncomingNote() {
      if (!userInteracted) {
        startTransition(() => {
          setFormResolved(resolvedFromNote)
        })
      }
    },
    [resolvedFromNote, userInteracted],
  )

  const {
    mutate: updateNoteMutation,
    isPending: isLoading,
    error,
  } = useMutation({
    mutationFn: (input: UpdateNoteResolvedAtInputType) => updateNoteResolvedAtFn({ data: input }),
    onSuccess: (updatedNote: { id: number }) => {
      queryClient.invalidateQueries({
        queryKey: ['notes', 'getNoteAndComments', { id: updatedNote.id }],
      })
      queryClient.invalidateQueries({ queryKey: queryKeyMap })
    },
  })

  const handleSubmit = (state: boolean) => {
    setUserInteracted(true)
    setFormResolved(state)
    updateNoteMutation({
      regionSlug: region.slug,
      noteId: note.id,
      resolved: !formResolved, // true represets the left side of the switch which is 'open'
    })
  }

  return (
    <NativeForm>
      <Field
        as="div"
        className="mt-3 flex items-center gap-1.5 text-sm"
        title={note.resolvedAt?.toLocaleString()}
      >
        <span>Status:</span>{' '}
        <Switch
          checked={formResolved}
          onChange={handleSubmit}
          className={twJoin(
            formResolved ? 'bg-yellow-600' : 'bg-gray-200',
            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:outline-none',
          )}
        >
          <span className="sr-only">Erledigt</span>
          <span
            className={twJoin(
              formResolved ? 'translate-x-5' : 'translate-x-0',
              'pointer-events-none relative inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
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

      {error ? <p className="text-red-500">{error.message}</p> : null}
    </NativeForm>
  )
}
