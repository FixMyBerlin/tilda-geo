import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { useHasPermissions } from '@/components/shared/hooks/useHasPermissions'
import type { CreateNoteCommentInputType } from '@/server/notes/notes.functions'
import { createNoteCommentFn } from '@/server/notes/notes.functions'
import { noteCommentDraftId } from '../../composerDrafts/composerDraftIds'
import { ModeCommentComposer } from '../../ModeCommentComposer'

type Props = {
  noteId: number
}

export const NewNoteCommentForm = ({ noteId }: Props) => {
  const queryClient = useQueryClient()
  const region = useRegion()
  const hasPermissions = useHasPermissions()

  const { mutateAsync: createNoteCommentMutation } = useMutation({
    mutationFn: (input: CreateNoteCommentInputType) => createNoteCommentFn({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', 'getNoteAndComments', { id: noteId }] })
    },
  })

  if (!hasPermissions) {
    return null
  }

  return (
    <ModeCommentComposer
      draftId={noteCommentDraftId(noteId)}
      label="Antwort (Markdown)"
      submitLabel="Antwort speichern"
      requiredMessage="Bitte Antwort eingeben."
      onSubmit={async (body) => {
        await createNoteCommentMutation({
          regionSlug: region.slug,
          noteId,
          body,
        })
      }}
    />
  )
}
