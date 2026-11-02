import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { z } from 'zod'
import { Textarea } from '@/components/shared/form/fields/Textarea'
import { Form } from '@/components/shared/form/Form'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'
import type { UpdateOsmNoteInputType } from '@/server/osm/osm.functions'
import { updateOsmNoteFn } from '@/server/osm/osm.functions'
import { ComposerDraftAutosave } from '../../composerDrafts/ComposerDraftAutosave'
import { osmNoteCommentDraftId } from '../../composerDrafts/composerDraftIds'
import { useComposerDraft } from '../../composerDrafts/useComposerDraft'
import { ModeFormSubmit } from '../../ModeFormSubmit'
import { modePanelMutedClassName } from '../../modePanel.const'
import { ModeStatusSwitch } from '../../ModeStatusSwitch'
import { osmNotesQueryKey } from '../osmNotesQueryOptions'
import type { OsmApiNotesThreadType } from '../osmNotesSchema'
import { useOsmNotesBbox } from '../useOsmNotesBbox'

type Props = { thread: OsmApiNotesThreadType }

type CommentValues = { comment: string }

// Only used by the submit button (open notes); close/reopen read the textarea directly.
const CommentSchema = z.object({ comment: z.string().trim().min(1, 'Bitte Kommentar eingeben.') })

/** Submit comments (open notes only); the switch closes/reopens and sends the textarea text along. */
export const OsmNoteCommentForm = ({ thread }: Props) => {
  const queryClient = useQueryClient()
  const queryKey = osmNotesQueryKey(useOsmNotesBbox())
  const draftId = osmNoteCommentDraftId(thread.id)
  // Bumped after every success to remount the form with a blank textarea.
  const [sessionKey, setSessionKey] = useState(0)
  const { isReady, draftValues, saveDraft, clearDraft } = useComposerDraft(draftId)
  const updateOsmNote = useMutation({
    mutationFn: (input: UpdateOsmNoteInputType) => updateOsmNoteFn({ data: input }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey })
    },
  })

  // Optimistic while a close/reopen and the following refetch are in flight.
  const isClosed =
    updateOsmNote.isPending && updateOsmNote.variables.action !== 'comment'
      ? updateOsmNote.variables.action === 'close'
      : thread.status === 'closed'

  const resetAfterSuccess = () => {
    clearDraft()
    setSessionKey((key) => key + 1)
  }

  if (!isReady) {
    return (
      <section className="px-4 py-3">
        <SmallSpinner />
      </section>
    )
  }

  return (
    <section className="px-4 py-3">
      <Form<CommentValues>
        key={`${draftId}-${sessionKey}`}
        className="space-y-3.5 sm:space-y-6"
        defaultValues={{ comment: draftValues?.comment ?? '' }}
        schema={CommentSchema}
        onSubmit={async (values) => {
          try {
            await updateOsmNote.mutateAsync({
              noteId: thread.id,
              action: 'comment',
              text: values.comment,
            })
            resetAfterSuccess()
            return { success: true, resetValues: { comment: '' } }
          } catch (e) {
            return { success: false, message: e instanceof Error ? e.message : String(e) }
          }
        }}
      >
        {(form) => (
          <>
            <ComposerDraftAutosave form={form} saveDraft={saveDraft} />
            <Textarea
              form={form}
              name="comment"
              label={isClosed ? 'Optionaler Kommentar zum Wiedereröffnen' : 'Kommentar'}
              labelSrOnly={!isClosed}
              placeholder="Kommentar"
              className="min-h-20 border-0 bg-gray-50 py-2 leading-tight text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-yellow-600 focus:ring-inset"
              rows={3}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <ModeStatusSwitch
                checked={isClosed}
                checkedLabel="geschlossen"
                uncheckedLabel="offen"
                pending={updateOsmNote.isPending}
                onChange={(nextClosed) =>
                  updateOsmNote.mutate(
                    {
                      noteId: thread.id,
                      action: nextClosed ? 'close' : 'reopen',
                      text: form.state.values.comment,
                    },
                    { onSuccess: resetAfterSuccess },
                  )
                }
              />
              {!isClosed && (
                <form.Subscribe selector={(s) => s.isSubmitting}>
                  {(isSubmitting) => (
                    <ModeFormSubmit
                      label="Kommentar veröffentlichen"
                      pending={isSubmitting || updateOsmNote.isPending}
                    />
                  )}
                </form.Subscribe>
              )}
            </div>
            <p className={modePanelMutedClassName}>
              Wird öffentlich auf openstreetmap.org gespeichert.
            </p>
            {/* Comment errors already show in the Form alert. */}
            {updateOsmNote.error && updateOsmNote.variables?.action !== 'comment' && (
              <p className="text-red-500">{updateOsmNote.error.message}</p>
            )}
          </>
        )}
      </Form>
    </section>
  )
}
