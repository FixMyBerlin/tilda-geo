import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { z } from 'zod'
import { useOsmNewNoteFeature } from '@/components/regionen/pageRegionSlug/hooks/mapState/userMapNotes'
import { useNewOsmNoteMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useNotesOsmParams'
import { useRegionLoaderData } from '@/components/regionen/pageRegionSlug/hooks/useRegionLoaderData'
import { Textarea } from '@/components/shared/form/fields/Textarea'
import { Form } from '@/components/shared/form/Form'
import { useHasPermissions } from '@/components/shared/hooks/useHasPermissions'
import { buttonStylesOnYellow } from '@/components/shared/links/styles'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'
import { getAppBaseUrl } from '@/components/shared/utils/getAppBaseUrl'
import { createOsmNoteFn } from '@/server/osm/osm.functions'
import { osmOrgUrl, osmTypeIdString } from '../../SidebarInspector/Tools/osmUrls/osmUrls'
import type { OsmApiNotesThreadType } from './schema'
import { useQueryKey } from './utils/useQueryKey'

const OsmNoteSchema = z.object({ comment: z.string().min(1, 'Bitte Hinweistext eingeben.') })

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
          params.delete('osmNote')
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
  const { newOsmNoteMapParam, setNewOsmNoteMapParam } = useNewOsmNoteMapParam()
  const queryClient = useQueryClient()
  const queryKey = useQueryKey()
  const hasPermissions = useHasPermissions()
  const { region } = useRegionLoaderData()
  const searchString = useRouter().state.location.search
  const searchParams = searchString ? new URLSearchParams(searchString) : null
  const osmNewNoteFeature = useOsmNewNoteFeature()
  const commentedFeatureId =
    osmNewNoteFeature?.osmType && osmNewNoteFeature?.osmId
      ? osmTypeIdString(osmNewNoteFeature.osmType, osmNewNoteFeature.osmId)
      : null

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: async (body: string) => {
      if (!newOsmNoteMapParam) throw new Error('No map param')
      return createOsmNoteFn({
        data: {
          lat: newOsmNoteMapParam.lat,
          lon: newOsmNoteMapParam.lng,
          text: body,
        },
      }) as Promise<OsmApiNotesThreadType>
    },
    onSuccess: () => {
      setNewOsmNoteMapParam(null)
      queryClient.invalidateQueries({ queryKey })
    },
  })

  return (
    <section className="">
      <div className="mt-4 flex justify-center">
        <h2 className="z-10 rounded-lg bg-teal-700 px-2 py-1 leading-tight font-semibold text-teal-50">
          2. Hinweis verfassen
        </h2>
      </div>
      <Form
        className="p-4"
        defaultValues={{ comment: '' }}
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
            <p className="leading-snug">
              Bitte beschreiben Sie möglichst genau,{' '}
              {commentedFeatureId ? (
                <>
                  welche Angaben an dem Kartenelemente{' '}
                  <code className="text-xs">{commentedFeatureId}</code> geändert oder ergänzt werden
                  sollen.
                </>
              ) : (
                <>welche Angaben an diesem Ort geändert oder ergänzt werden sollen.</>
              )}{' '}
              Fügen Sie, wenn vorhanden, öffentliche Quellen (z. B. Mapillary-Links) hinzu, die als
              Referenz herangezogen werden können.
            </p>
            <Textarea
              form={form}
              name="comment"
              label="Hinweistext"
              placeholder="Hinweis"
              className="my-3 min-h-48 border-0 bg-gray-50 py-2 leading-tight text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-yellow-600 focus:ring-inset"
              rows={6}
            />
            <div className="flex items-center gap-1 leading-tight">
              <form.Subscribe selector={(s) => s.isSubmitting}>
                {(isSubmitting) => (
                  <button
                    type="submit"
                    className={buttonStylesOnYellow}
                    disabled={isSubmitting || isPending}
                  >
                    Hinweis veröffentlichen
                  </button>
                )}
              </form.Subscribe>
              <span className="ml-1 text-gray-500">auf openstreetmap.org</span>
              {(isPending || form.state.isSubmitting) && <SmallSpinner />}
            </div>
            {error && <p className="text-red-500">{error.message}</p>}
          </>
        )}
      </Form>
    </section>
  )
}
