import { Field, Label, Switch } from '@headlessui/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { twJoin } from 'tailwind-merge'
import { z } from 'zod'
import { SvgNotesCheckmark } from '@/components/regionen/pageRegionSlug/SidebarInspector/icons/SvgNotesCheckmark'
import { SvgNotesQuestionmark } from '@/components/regionen/pageRegionSlug/SidebarInspector/icons/SvgNotesQuestionmark'
import { Textarea } from '@/components/shared/form/fields/Textarea'
import { Form } from '@/components/shared/form/Form'
import { buttonStylesOnYellow } from '@/components/shared/links/styles'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'
import { updateOsmNoteFn } from '@/server/osm/osm.functions'
import { ComposerDraftAutosave } from '../../composerDrafts/ComposerDraftAutosave'
import { osmNoteCommentDraftId } from '../../composerDrafts/composerDraftIds'
import { useComposerDraft } from '../../composerDrafts/useComposerDraft'
import { modePanelMutedClassName } from '../../modePanel.const'
import { toOsmFeaturePoint } from '../osmNotesQueryOptions'
import type { OsmApiNotesThreadType, OsmFeatureCollectionType } from '../osmNotesSchema'
import { useOsmNotesQueryKey } from '../useOsmNotesQueryKey'

type Props = { thread: OsmApiNotesThreadType }

type CommentValues = { comment: string }

// Only used by the submit button (open notes); close/reopen read the textarea directly.
const CommentSchema = z.object({ comment: z.string().min(1, 'Bitte Kommentar eingeben.') })

/**
 * Comment / close / reopen for a single OSM note, via OSM API v0.6 and the same OAuth
 * `write_notes` token used for creating notes. The textarea and the status switch share one
 * form: submitting the button comments (open notes only), toggling the switch closes/reopens
 * and sends along whatever text is currently in the textarea.
 */
export const OsmNoteCommentForm = ({ thread }: Props) => {
  const queryClient = useQueryClient()
  const queryKey = useOsmNotesQueryKey()
  const draftId = osmNoteCommentDraftId(thread.id)
  // Bumped after every successful submit/toggle to remount the form with a blank textarea.
  const [sessionKey, setSessionKey] = useState(0)
  const { isReady, draftValues, saveDraft, clearDraft } = useComposerDraft(draftId, sessionKey)
  const { mutateAsync, isPending, error, variables } = useMutation({
    mutationFn: (input: { action: 'comment' | 'close' | 'reopen'; text?: string }) =>
      updateOsmNoteFn({ data: { noteId: thread.id, ...input } }),
    onSuccess: (updated) => {
      const feature = toOsmFeaturePoint(updated)
      queryClient.setQueryData<OsmFeatureCollectionType>(queryKey, (old) =>
        old
          ? { ...old, features: old.features.map((f) => (f.id === feature.id ? feature : f)) }
          : old,
      )
      queryClient.invalidateQueries({ queryKey })
    },
  })

  // Optimistic while a close/reopen is in flight; otherwise the (query cache) thread status.
  const isClosed =
    isPending && variables?.action !== 'comment'
      ? variables?.action === 'close'
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
            await mutateAsync({ action: 'comment', text: values.comment })
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
              <OsmNoteStatusSwitch
                isClosed={isClosed}
                isPending={isPending}
                onToggle={async (nextClosed) => {
                  // Read the current textarea value at toggle time (outside the submit flow).
                  const text = form.state.values.comment?.trim()
                  try {
                    await mutateAsync({
                      action: nextClosed ? 'close' : 'reopen',
                      text: text || undefined,
                    })
                    resetAfterSuccess()
                  } catch {
                    // Shown via the mutation `error` below; the switch falls back to thread.status.
                  }
                }}
              />
              {!isClosed && (
                <form.Subscribe selector={(s) => s.isSubmitting}>
                  {(isSubmitting) => (
                    <button
                      type="submit"
                      className={twJoin(
                        buttonStylesOnYellow,
                        'inline-flex items-center justify-center gap-2',
                      )}
                      disabled={isSubmitting || isPending}
                    >
                      Kommentar veröffentlichen
                      {(isPending || isSubmitting) && <SmallSpinner />}
                    </button>
                  )}
                </form.Subscribe>
              )}
            </div>
            <p className={modePanelMutedClassName}>
              Wird öffentlich auf openstreetmap.org gespeichert.
            </p>
            {error && <p className="text-red-500">{error.message}</p>}
          </>
        )}
      </Form>
    </section>
  )
}

type SwitchProps = {
  isClosed: boolean
  isPending: boolean
  onToggle: (nextClosed: boolean) => void
}

/** Status switch, copied from `EditNoteResolvedAtForm` (offen / geschlossen instead of offen/erledigt). */
const OsmNoteStatusSwitch = ({ isClosed, isPending, onToggle }: SwitchProps) => (
  <Field as="div" className="flex items-center gap-1.5 text-sm">
    <span>Status:</span>
    <Switch
      checked={isClosed}
      disabled={isPending}
      onChange={onToggle}
      className={twJoin(
        isClosed ? 'bg-yellow-600' : 'bg-gray-200',
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60',
      )}
    >
      <span className="sr-only">Status</span>
      <span
        className={twJoin(
          isClosed ? 'translate-x-5' : 'translate-x-0',
          'pointer-events-none relative inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
        )}
      >
        <span
          className={twJoin(
            isClosed ? 'opacity-0 duration-100 ease-out' : 'opacity-100 duration-200 ease-in',
            'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity',
          )}
          aria-hidden="true"
        >
          <SvgNotesQuestionmark className="size-5 text-sky-700" />
        </span>
        <span
          className={twJoin(
            isClosed ? 'opacity-100 duration-200 ease-in' : 'opacity-0 duration-100 ease-out',
            'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity',
          )}
          aria-hidden="true"
        >
          <SvgNotesCheckmark className="size-5 text-sky-700" />
        </span>
      </span>
    </Switch>
    <Label as="span">
      {isClosed ? 'geschlossen' : 'offen'}
      <span className="sr-only">.</span>
    </Label>
    {isPending && <SmallSpinner />}
  </Field>
)
