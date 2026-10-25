import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useMap } from 'react-map-gl/maplibre'
import { z } from 'zod'
import {
  useOsmNewNoteFeature,
  useOsmNotesActions,
} from '@/components/regionen/pageRegionSlug/hooks/mapState/userMapNotes'
import { useNotesComposePin } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useNotesComposePin'
import { useRegionLoaderData } from '@/components/regionen/pageRegionSlug/hooks/useRegionLoaderData'
import {
  osmOrgUrl,
  osmTypeIdString,
} from '@/components/regionen/pageRegionSlug/SidebarInspector/Tools/osmUrls/osmUrls'
import { Textarea } from '@/components/shared/form/fields/Textarea'
import { Form } from '@/components/shared/form/Form'
import { useHasPermissions } from '@/components/shared/hooks/useHasPermissions'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'
import { getAppBaseUrl } from '@/components/shared/utils/getAppBaseUrl'
import { createOsmNoteFn } from '@/server/osm/osm.functions'
import { searchParamsRegistry } from '@/shared/regionen/searchParamsRegistry'
import { ComposerDraftAutosave } from '../../composerDrafts/ComposerDraftAutosave'
import { osmNewNoteDraftId } from '../../composerDrafts/composerDraftIds'
import { toComposerDraftStringValues } from '../../composerDrafts/composerDraftStorage'
import {
  confirmDiscardComposerDraft,
  useComposerDraft,
} from '../../composerDrafts/useComposerDraft'
import { ModeFormSubmit } from '../../ModeFormSubmit'
import { modePanelMutedClassName } from '../../modePanel.const'
import { compactNotesModeParam, zodNotesModeParam } from '../notesModeParam'
import { osmNotesQueryKey } from '../osmNotesQueryOptions'
import { useOsmNotesBbox } from '../useOsmNotesBbox'

const OsmNoteSchema = z.object({ comment: z.string().min(1, 'Bitte Hinweistext eingeben.') })

const stripNotesComposePin = (params: URLSearchParams) => {
  const notesKey = searchParamsRegistry.notes
  const raw = params.get(notesKey)
  if (!raw) return
  try {
    const parsed = zodNotesModeParam.safeParse(JSON.parse(raw))
    if (!parsed.success) return
    const compact = compactNotesModeParam({ ...parsed.data, new: undefined })
    if (compact) params.set(notesKey, JSON.stringify(compact))
    else params.delete(notesKey)
  } catch {
    // leave notes as-is if it is not JSON
  }
}

function buildFullComment(
  userComment: string,
  opts: {
    hasPermissions: boolean
    regionSlug: string
    regionStatus: string
    searchParams: URLSearchParams | null
    osmNewNoteFeature: { osmType: string; osmId: number } | null
    commentedFeatureId: string | null
  },
) {
  const footerMemberHashtag = opts.hasPermissions ? `#${opts.regionSlug}-member` : '#visitor'
  const footerUrl =
    opts.regionStatus === 'PUBLIC'
      ? (() => {
          const params = opts.searchParams
            ? new URLSearchParams(opts.searchParams.toString())
            : new URLSearchParams()
          stripNotesComposePin(params)
          const paramString = params.toString()
          return paramString
            ? getAppBaseUrl(`/regionen/${opts.regionSlug}?${paramString}`, 'production')
            : getAppBaseUrl(`/regionen/${opts.regionSlug}`, 'production')
        })()
      : getAppBaseUrl(undefined, 'production')
  const footerWiki = 'https://osm.wiki/FixMyCity_GmbH/TILDA'
  const footer = `\n--\n#TILDA ${footerMemberHashtag} ${footerUrl} ${footerWiki}`

  let featureFooter = ''
  if (opts.osmNewNoteFeature?.osmType && opts.osmNewNoteFeature?.osmId && opts.commentedFeatureId) {
    const footerFeatureOsmUrl = osmOrgUrl({
      osmType: opts.osmNewNoteFeature.osmType as 'way' | 'node' | 'relation',
      osmId: opts.osmNewNoteFeature.osmId,
    })
    featureFooter = `\n--\nDieser Hinweis bezieht sich auf ${footerFeatureOsmUrl} `
  }

  return `${userComment}\n${featureFooter}${footer}`
}

export const OsmNotesNewForm = () => {
  const { composePin, clearComposeParams } = useNotesComposePin()
  const { mainMap } = useMap()
  const queryClient = useQueryClient()
  const queryKey = osmNotesQueryKey(useOsmNotesBbox())
  const hasPermissions = useHasPermissions()
  const { region } = useRegionLoaderData()
  const searchStr = useRouter().state.location.searchStr
  const searchParams = searchStr ? new URLSearchParams(searchStr) : null
  const osmNewNoteFeature = useOsmNewNoteFeature()
  const { setOsmNewNoteFeature } = useOsmNotesActions()
  const commentedFeatureId =
    osmNewNoteFeature?.osmType && osmNewNoteFeature?.osmId
      ? osmTypeIdString(osmNewNoteFeature.osmType, osmNewNoteFeature.osmId)
      : null

  const draftId = osmNewNoteDraftId(region.slug)
  const { isReady, draftValues, saveDraft, clearDraft } = useComposerDraft(draftId)

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: async (body: string) => {
      const center = mainMap?.getCenter()
      if (!center) throw new Error('No map center')
      return createOsmNoteFn({
        data: {
          lat: center.lat,
          lon: center.lng,
          text: body,
        },
      })
    },
    onSuccess: () => {
      clearDraft()
      clearComposeParams()
      setOsmNewNoteFeature(undefined)
      queryClient.invalidateQueries({ queryKey })
    },
  })

  if (!composePin) return null

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
        key={draftId}
        defaultValues={{ comment: draftValues?.comment ?? '' }}
        schema={OsmNoteSchema}
        onSubmit={async (values) => {
          const fullComment = buildFullComment(values.comment, {
            hasPermissions,
            regionSlug: region.slug,
            regionStatus: region.status,
            searchParams,
            osmNewNoteFeature: osmNewNoteFeature ?? null,
            commentedFeatureId,
          })
          try {
            await mutateAsync(fullComment)
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
            <div className="space-y-2">
              <p className={modePanelMutedClassName}>
                Bitte beschreiben Sie möglichst genau,{' '}
                {commentedFeatureId ? (
                  <>
                    welche Angaben an dem Kartenelemente{' '}
                    <code className="text-xs">{commentedFeatureId}</code> geändert oder ergänzt
                    werden sollen.
                  </>
                ) : (
                  <>welche Angaben an diesem Ort geändert oder ergänzt werden sollen.</>
                )}{' '}
                Fügen Sie, wenn vorhanden, öffentliche Quellen (z. B. Mapillary-Links) hinzu, die
                als Referenz herangezogen werden können.
              </p>
              <Textarea
                form={form}
                name="comment"
                label="Hinweistext"
                labelSrOnly
                placeholder="Hinweis"
                className="min-h-28 border-0 bg-gray-50 py-2 leading-tight text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-yellow-600 focus:ring-inset sm:min-h-48"
                rows={4}
              />
            </div>
            <div className="flex flex-col gap-2">
              <form.Subscribe selector={(s) => s.isSubmitting}>
                {(isSubmitting) => (
                  <ModeFormSubmit
                    label="Veröffentlichen"
                    pending={isSubmitting || isPending}
                    cancel={{
                      onClick: () => {
                        if (
                          !confirmDiscardComposerDraft(
                            toComposerDraftStringValues(form.state.values),
                          )
                        ) {
                          return
                        }
                        clearDraft()
                        clearComposeParams()
                        setOsmNewNoteFeature(undefined)
                      },
                    }}
                  />
                )}
              </form.Subscribe>
              <p className={modePanelMutedClassName}>
                Wird öffentlich auf openstreetmap.org gespeichert.
              </p>
            </div>
            {error && <p className="text-red-500">{error.message}</p>}
          </>
        )}
      </Form>
    </section>
  )
}
