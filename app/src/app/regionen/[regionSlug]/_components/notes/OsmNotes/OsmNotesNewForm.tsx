import { SmallSpinner } from '@/src/app/_components/Spinner/SmallSpinner'
import { buttonStylesOnYellow } from '@/src/app/_components/links/styles'
import { appBaseUrl } from '@/src/app/_components/utils/appBaseUrl.const'
import { getOsmApiUrl } from '@/src/app/_components/utils/getOsmUrl'
import { useHasPermissions } from '@/src/app/_hooks/useHasPermissions'
import { useSession } from '@blitzjs/auth'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { useOsmNewNoteFeature } from '../../../_hooks/mapState/userMapNotes'
import { useNewOsmNoteMapParam } from '../../../_hooks/useQueryState/useNotesOsmParams'
import { osmOrgUrl, osmTypeIdString } from '../../SidebarInspector/Tools/osmUrls/osmUrls'
import { useRegion } from '../../regionUtils/useRegion'
import { OsmApiNotesThreadType } from './schema'
import { useQueryKey } from './utils/useQueryKey'

export const OsmNotesNewForm = () => {
  const session = useSession()
  const { newOsmNoteMapParam, setNewOsmNoteMapParam } = useNewOsmNoteMapParam()
  const osmNewNoteFeature = useOsmNewNoteFeature()

  const queryClient = useQueryClient()
  const apiUrl = getOsmApiUrl('/notes.json')
  const queryKey = useQueryKey()
  const { mutate, isPending, error } = useMutation({
    mutationFn: async (body: string) => {
      const post = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.osmToken}`,
        },
        body: JSON.stringify({
          lat: newOsmNoteMapParam!.lat,
          lon: newOsmNoteMapParam!.lng,
          text: body,
        }),
      })
      const data = (await post.json()) as OsmApiNotesThreadType
      return data
    },
    onSuccess: (_data) => {
      setNewOsmNoteMapParam(null)
      return queryClient.invalidateQueries({ queryKey })
    },
  })

  const hasPermissions = useHasPermissions()
  const region = useRegion()
  const searchParams = useSearchParams()
  const commentedFeatureId =
    osmNewNoteFeature?.osmType && osmNewNoteFeature?.osmId
      ? osmTypeIdString(osmNewNoteFeature.osmType, osmNewNoteFeature.osmId)
      : null
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    // Text snippes for regular comment
    const footerMemberHashtag = hasPermissions ? `#${region.slug}-member` : '#visitor'

    const footerUrl = region.public
      ? (() => {
          // Recreate the current URL with all params except the osmNotes(=true)
          const params = new URLSearchParams(searchParams?.toString())
          params.delete('osmNote')
          const paramString = params.toString()
          return paramString
            ? `${appBaseUrl.production}/regionen/${region.slug}?${paramString}`
            : `${appBaseUrl.production}/regionen/${region.slug}`
        })()
      : appBaseUrl.production
    const footerWiki = 'https://osm.wiki/FixMyCity_GmbH/TILDA'
    const footer = `\n--\n#TILDA ${footerMemberHashtag} ${footerUrl} ${footerWiki}`

    // Text snippets for comment on a specific feature
    let featureFooter = ''
    if (osmNewNoteFeature?.osmType && osmNewNoteFeature?.osmId) {
      const footerFeatureOsmUrl = osmOrgUrl({
        osmType: osmNewNoteFeature.osmType,
        osmId: osmNewNoteFeature.osmId,
      })
      const footerFeatureUrl = '' // TODO Add later once the direct link feature is rolled out
      // const footerFeatureUrl = region.public
      //   ? `${footerUrl}?map=${newOsmNoteMapParam}&f=${commentedFeatureId}`
      //   : ''
      featureFooter = commentedFeatureId
        ? `\n--\nDieser Hinweis bezieht sich auf ${footerFeatureOsmUrl} ${footerFeatureUrl}`
        : ''
    }

    const userCommentText = new FormData(event.currentTarget).get('comment')
    const fullComment = `${userCommentText}\n${featureFooter}${footer}`

    mutate(fullComment)
  }

  return (
    <section className="">
      <div className="mt-4 flex justify-center">
        <h2 className="z-10 rounded-lg bg-teal-700 px-2 py-1 font-semibold leading-tight text-teal-50">
          2. Hinweis verfassen
        </h2>
      </div>
      <form className="p-4" onSubmit={handleSubmit}>
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
        <label>
          <span className="sr-only">Hinweistext</span>
          <textarea
            name="comment"
            className="my-3 block min-h-48 w-full rounded-md border-0 bg-gray-50 py-2 leading-tight text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-yellow-600"
            placeholder="Hinweis"
            data-1p-ignore
            data-lpignore
            required
          />
        </label>
        <div className="flex items-center gap-1 leading-tight">
          <button type="submit" className={buttonStylesOnYellow} disabled={isPending}>
            Hinweis veröffentlichen
          </button>
          <span className="ml-1 text-gray-500">auf openstreetmap.org</span>
          {isPending && <SmallSpinner />}
        </div>
        {error && <p className="text-red-500">{error.message}</p>}
      </form>
    </section>
  )
}
