import { SmallSpinner } from '@/src/app/_components/Spinner/SmallSpinner'
import { buttonStylesOnYellow } from '@/src/app/_components/links/styles'
import createNote from '@/src/server/notes/mutations/createNote'
import { getQueryClient, useMutation } from '@blitzjs/rpc'
import dompurify from 'dompurify'
import {
  useNewNoteTildaDeeplink,
  useOsmNewNoteFeature,
} from '../../../_hooks/mapState/userMapNotes'
import { useNewInternalNoteMapParam } from '../../../_hooks/useQueryState/useNotesAtlasParams'
import { osmOrgUrl, osmTypeIdString } from '../../SidebarInspector/Tools/osmUrls/osmUrls'
import { useRegionSlug } from '../../regionUtils/useRegionSlug'
import { useQueryKey } from './utils/useQueryKey'

export const InternalNotesNewForm = () => {
  const [createNoteMutation, { isLoading, error }] = useMutation(createNote)
  const { newInternalNoteMapParam, setNewInternalNoteMapParam } = useNewInternalNoteMapParam()
  const regionSlug = useRegionSlug()
  const queryKey = useQueryKey()
  const osmNewNoteFeature = useOsmNewNoteFeature()
  const newNoteTildaDeeplink = useNewNoteTildaDeeplink()
  const commentedFeatureId =
    osmNewNoteFeature?.osmType && osmNewNoteFeature?.osmId
      ? osmTypeIdString(osmNewNoteFeature.osmType, osmNewNoteFeature.osmId)
      : null

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!newInternalNoteMapParam || !regionSlug) {
      return
    }

    const sanitize = (input: string | undefined) => (input ? dompurify.sanitize(input) : input)

    // Text snippets for comment on a specific feature
    let featureFooter = ''
    if (osmNewNoteFeature?.osmType && osmNewNoteFeature?.osmId) {
      const footerFeatureOsmUrl = osmOrgUrl({
        osmType: osmNewNoteFeature.osmType,
        osmId: osmNewNoteFeature.osmId,
      })
      featureFooter = `\n---\nDieser Hinweis bezieht sich auf ${commentedFeatureId} – [TILDA](${newNoteTildaDeeplink}), [OSM](${footerFeatureOsmUrl})`
    }

    const userCommentText =
      sanitize(new FormData(event.currentTarget).get('body')?.toString()) || undefined
    const fullComment = `${userCommentText}\n${featureFooter}`

    createNoteMutation(
      {
        regionSlug,
        subject: sanitize(new FormData(event.currentTarget).get('subject')!.toString())!,
        latitude: newInternalNoteMapParam.lat,
        longitude: newInternalNoteMapParam.lng,
        body: fullComment,
      },
      {
        onSuccess: () => {
          getQueryClient().invalidateQueries(queryKey)
          setNewInternalNoteMapParam(null)
        },
      },
    )
  }

  return (
    <section className="">
      <div className="mt-4 flex justify-center">
        <h2 className="z-10 rounded-lg bg-teal-700 px-2 py-1 leading-tight font-semibold text-teal-50">
          2. Internen Hinweis verfassen
        </h2>
      </div>
      <form className="p-4" onSubmit={handleSubmit}>
        <p className="leading-snug">
          Interne Hinweise sind nur für angemeldete Nutzer:innen sichtbar, die für diese Region
          freigeschaltet wurden.{' '}
          {commentedFeatureId ? (
            <>
              Dieser Hinweis bezieht sich auf <code className="text-xs">{commentedFeatureId}</code>.
            </>
          ) : null}
        </p>
        <label>
          <span className="sr-only">Betreff</span>
          <input
            type="text"
            name="subject"
            className="my-3 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-yellow-600 focus:ring-inset"
            placeholder="Betreff"
            data-1p-ignore
            data-lpignore
            required
          />
        </label>
        <label>
          <span className="sr-only">Hinweistext (Markdown)</span>
          <textarea
            name="body"
            className="my-3 block min-h-48 w-full rounded-md border-0 bg-gray-50 py-2 leading-tight text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-yellow-600 focus:ring-inset"
            placeholder="Hinweis"
            data-1p-ignore
            data-lpignore
            required
          />
        </label>
        <div className="flex items-center gap-1 leading-tight">
          <button type="submit" className={buttonStylesOnYellow} disabled={isLoading}>
            Internen Hinweis speichern
          </button>
          {isLoading && <SmallSpinner />}
        </div>
        {/* @ts-expect-errors TODO Research how the error message is provided by Blitz */}
        {error ? <p className="text-red-500">{error.message}</p> : null}
      </form>
    </section>
  )
}
