import { Field, Label, Switch } from '@headlessui/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { startTransition, useState } from 'react'
import { twJoin } from 'tailwind-merge'
import { useInternalNotesQueryKey } from '@/components/regionen/pageRegionSlug/modes/notes/useInternalNotesQueryKey'
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { SvgNotesCheckmark } from '@/components/regionen/pageRegionSlug/SidebarInspector/icons/SvgNotesCheckmark'
import { SvgNotesQuestionmark } from '@/components/regionen/pageRegionSlug/SidebarInspector/icons/SvgNotesQuestionmark'
import { NativeForm } from '@/components/shared/form/NativeForm'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'
import type { UpdateNoteResolvedAtInputType } from '@/server/notes/notes.functions'
import { updateNoteResolvedAtFn } from '@/server/notes/notes.functions'
import type { NoteAndComments } from '@/server/notes/queries/getNoteAndComments.server'

type Props = { note: NonNullable<NoteAndComments> }

export const EditNoteResolvedAtForm = ({ note }: Props) => {
  const queryClient = useQueryClient()
  const queryKeyMap = useInternalNotesQueryKey()
  const region = useRegion()
  const [formResolved, setFormResolved] = useState(note.resolvedAt !== null)

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
    startTransition(() => {
      setFormResolved(state)
    })
    updateNoteMutation({
      regionSlug: region.slug,
      noteId: note.id,
      resolved: !formResolved, // true represets the left side of the switch which is 'open'
    })
  }

  const statusLabel = formResolved ? 'erledigt' : 'offen'

  return (
    <NativeForm>
      <Field
        as="div"
        className="flex items-center gap-1.5 text-sm"
        title={error?.message ?? note.resolvedAt?.toLocaleString() ?? undefined}
      >
        <Label className="w-16 shrink-0 text-right">{statusLabel}</Label>
        <span className="relative inline-flex shrink-0">
          <Switch
            checked={formResolved}
            onChange={handleSubmit}
            className={twJoin(
              formResolved ? 'bg-yellow-600' : 'bg-gray-200',
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-white focus:ring-offset-0 focus:outline-none',
            )}
          >
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
          {isLoading ? (
            <span className="pointer-events-none absolute top-1/2 -right-5 -translate-y-1/2">
              <SmallSpinner />
            </span>
          ) : null}
        </span>
      </Field>
    </NativeForm>
  )
}
