import { useMutation, useQueryClient } from '@tanstack/react-query'
import { startTransition, useState } from 'react'
import { useInternalNotesQueryKey } from '@/components/regionen/pageRegionSlug/modes/notes/useInternalNotesQueryKey'
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { NativeForm } from '@/components/shared/form/NativeForm'
import type { UpdateNoteResolvedAtInputType } from '@/server/notes/notes.functions'
import { updateNoteResolvedAtFn } from '@/server/notes/notes.functions'
import type { NoteAndComments } from '@/server/notes/queries/getNoteAndComments.server'
import { ModeStatusSwitch } from '../../ModeStatusSwitch'

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

  return (
    <NativeForm>
      <ModeStatusSwitch
        checked={formResolved}
        onChange={handleSubmit}
        checkedLabel="erledigt"
        uncheckedLabel="offen"
        pending={isLoading}
        title={error?.message ?? note.resolvedAt?.toLocaleString() ?? undefined}
      />
    </NativeForm>
  )
}
