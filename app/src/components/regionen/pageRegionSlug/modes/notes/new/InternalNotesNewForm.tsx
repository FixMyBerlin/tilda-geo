import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useMap } from 'react-map-gl/maplibre'
import { twJoin } from 'tailwind-merge'
import { z } from 'zod'
import {
  useNewNoteTildaDeeplink,
  useOsmNewNoteFeature,
  useOsmNotesActions,
} from '@/components/regionen/pageRegionSlug/hooks/mapState/userMapNotes'
import { useNewInternalNoteMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useNotesAtlasParams'
import { useRegionSlug } from '@/components/regionen/pageRegionSlug/regionUtils/useRegionSlug'
import {
  osmOrgUrl,
  osmTypeIdString,
} from '@/components/regionen/pageRegionSlug/SidebarInspector/Tools/osmUrls/osmUrls'
import { MarkdownEditorField } from '@/components/shared/form/fields/MarkdownEditorField'
import { TextField } from '@/components/shared/form/fields/TextField'
import { Form } from '@/components/shared/form/Form'
import { buttonStylesOnYellow, buttonStylesSecondary } from '@/components/shared/links/styles'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'
import { sanitizeHtml } from '@/components/shared/utils/sanitizeHtml'
import type { CreateNoteInputType } from '@/server/notes/notes.functions'
import { createNoteFn } from '@/server/notes/notes.functions'
import { ComposerDraftAutosave } from '../../composerDrafts/ComposerDraftAutosave'
import { internalNewNoteDraftId } from '../../composerDrafts/composerDraftIds'
import { toComposerDraftStringValues } from '../../composerDrafts/composerDraftStorage'
import {
  confirmDiscardComposerDraft,
  useComposerDraft,
} from '../../composerDrafts/useComposerDraft'
import { modePanelMutedClassName } from '../../modePanel.const'
import { useInternalNotesQueryKey } from '../useInternalNotesQueryKey'

const InternalNoteSchema = z.object({
  subject: z.string().min(1, 'Betreff fehlt.'),
  body: z.string().min(1, 'Hinweistext fehlt.'),
})

function buildFullInternalNoteBody(
  userBody: string,
  opts: {
    osmNewNoteFeature: { osmType: string; osmId: number } | null
    commentedFeatureId: string | null
    newNoteTildaDeeplink: string
  },
) {
  let featureFooter = ''
  if (opts.osmNewNoteFeature?.osmType && opts.osmNewNoteFeature?.osmId && opts.commentedFeatureId) {
    const footerFeatureOsmUrl = osmOrgUrl({
      osmType: opts.osmNewNoteFeature.osmType as 'way' | 'node' | 'relation',
      osmId: opts.osmNewNoteFeature.osmId,
    })
    featureFooter = `\n---\nDieser Hinweis bezieht sich auf ${opts.commentedFeatureId} – [TILDA](${opts.newNoteTildaDeeplink}), [OSM](${footerFeatureOsmUrl})`
  }
  return `${userBody}\n${featureFooter}`
}

export const InternalNotesNewForm = () => {
  const queryClient = useQueryClient()
  const queryKey = useInternalNotesQueryKey()
  const { newInternalNoteMapParam, setNewInternalNoteMapParam } = useNewInternalNoteMapParam()
  const { mainMap } = useMap()
  const regionSlug = useRegionSlug()
  const osmNewNoteFeature = useOsmNewNoteFeature()
  const newNoteTildaDeeplink = useNewNoteTildaDeeplink()
  const { setOsmNewNoteFeature } = useOsmNotesActions()
  const commentedFeatureId =
    osmNewNoteFeature?.osmType && osmNewNoteFeature?.osmId
      ? osmTypeIdString(osmNewNoteFeature.osmType, osmNewNoteFeature.osmId)
      : null

  const draftId = internalNewNoteDraftId(regionSlug)
  const { isReady, draftValues, saveDraft, clearDraft } = useComposerDraft(draftId)

  const {
    mutateAsync: createNoteMutation,
    isPending,
    error,
  } = useMutation({
    mutationFn: (input: CreateNoteInputType) => createNoteFn({ data: input }),
    onSuccess: () => {
      clearDraft()
      queryClient.invalidateQueries({ queryKey })
      setNewInternalNoteMapParam(null)
      setOsmNewNoteFeature(undefined)
    },
  })

  const closeCompose = () => {
    setNewInternalNoteMapParam(null)
    setOsmNewNoteFeature(undefined)
  }

  if (!newInternalNoteMapParam || !regionSlug) {
    return null
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
      <Form
        className="space-y-3.5 sm:space-y-6"
        showFormErrors={false}
        key={draftId}
        defaultValues={{
          subject: draftValues?.subject ?? '',
          body: draftValues?.body ?? '',
        }}
        schema={InternalNoteSchema}
        onSubmit={async (values) => {
          const center = mainMap?.getCenter()
          if (!center) {
            return { success: false, message: 'Keine Kartenposition verfügbar.' }
          }
          const fullComment = buildFullInternalNoteBody(sanitizeHtml(values.body) ?? '', {
            osmNewNoteFeature: osmNewNoteFeature ?? null,
            commentedFeatureId,
            newNoteTildaDeeplink: newNoteTildaDeeplink ?? '',
          })
          try {
            await createNoteMutation({
              regionSlug,
              subject: sanitizeHtml(values.subject),
              latitude: center.lat,
              longitude: center.lng,
              body: fullComment,
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
            <ComposerDraftAutosave form={form} saveDraft={saveDraft} />
            <p className={modePanelMutedClassName}>
              Interne Hinweise sind nur für angemeldete Nutzer:innen sichtbar, die für diese Region
              freigeschaltet wurden.{' '}
              {commentedFeatureId ? (
                <>
                  Dieser Hinweis bezieht sich auf{' '}
                  <code className="text-xs">{commentedFeatureId}</code>.
                </>
              ) : null}
            </p>
            <TextField
              form={form}
              name="subject"
              label="Betreff"
              labelSrOnly
              classNameOverwrite="my-1.5 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-yellow-600 focus:ring-inset sm:my-3"
              placeholder="Betreff"
              required
            />
            <MarkdownEditorField
              form={form}
              name="body"
              label="Hinweistext (Markdown)"
              labelSrOnly
              placeholder="Hinweis"
            />
            <div className="flex gap-2">
              <form.Subscribe selector={(s) => s.isSubmitting}>
                {(isSubmitting) => (
                  <button
                    type="submit"
                    className={twJoin(
                      buttonStylesOnYellow,
                      'inline-flex min-w-0 flex-1 items-center justify-center gap-2',
                    )}
                    disabled={isSubmitting || isPending}
                  >
                    Speichern
                    {(isPending || isSubmitting) && <SmallSpinner />}
                  </button>
                )}
              </form.Subscribe>
              <button
                type="button"
                className={twJoin(buttonStylesSecondary, 'shrink-0')}
                onClick={() => {
                  if (
                    !confirmDiscardComposerDraft(toComposerDraftStringValues(form.state.values))
                  ) {
                    return
                  }
                  clearDraft()
                  closeCompose()
                }}
              >
                Abbrechen
              </button>
            </div>
            {error ? <p className="text-red-500">{error.message}</p> : null}
          </>
        )}
      </Form>
    </section>
  )
}
