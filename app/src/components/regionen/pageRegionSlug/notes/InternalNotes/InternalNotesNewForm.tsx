import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import {
  useNewNoteTildaDeeplink,
  useOsmNewNoteFeature,
} from '@/components/regionen/pageRegionSlug/hooks/mapState/userMapNotes'
import { useNewInternalNoteMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useNotesAtlasParams'
import { useRegionSlug } from '@/components/regionen/pageRegionSlug/regionUtils/useRegionSlug'
import { Form } from '@/components/shared/form/Form'
import { Textarea } from '@/components/shared/form/fields/Textarea'
import { TextField } from '@/components/shared/form/fields/TextField'
import { buttonStylesOnYellow } from '@/components/shared/links/styles'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'
import { sanitizeHtml } from '@/components/shared/utils/sanitizeHtml'
import type { CreateNoteInputType } from '@/server/notes/notes.functions'
import { createNoteFn } from '@/server/notes/notes.functions'
import { osmOrgUrl, osmTypeIdString } from '../../SidebarInspector/Tools/osmUrls/osmUrls'
import { useQueryKey } from './utils/useQueryKey'

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
  const queryKey = useQueryKey()
  const { newInternalNoteMapParam, setNewInternalNoteMapParam } = useNewInternalNoteMapParam()
  const regionSlug = useRegionSlug()
  const osmNewNoteFeature = useOsmNewNoteFeature()
  const newNoteTildaDeeplink = useNewNoteTildaDeeplink()
  const commentedFeatureId =
    osmNewNoteFeature?.osmType && osmNewNoteFeature?.osmId
      ? osmTypeIdString(osmNewNoteFeature.osmType, osmNewNoteFeature.osmId)
      : null

  const {
    mutateAsync: createNoteMutation,
    isPending,
    error,
  } = useMutation({
    mutationFn: (input: CreateNoteInputType) => createNoteFn({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      setNewInternalNoteMapParam(null)
    },
  })

  if (!newInternalNoteMapParam || !regionSlug) {
    return null
  }

  return (
    <section className="">
      <div className="mt-4 flex justify-center">
        <h2 className="z-10 rounded-lg bg-teal-700 px-2 py-1 leading-tight font-semibold text-teal-50">
          2. Internen Hinweis verfassen
        </h2>
      </div>
      <Form
        className="p-4"
        showFormErrors={false}
        defaultValues={{ subject: '', body: '' }}
        schema={InternalNoteSchema}
        onSubmit={async (values) => {
          const fullComment = buildFullInternalNoteBody(sanitizeHtml(values.body) ?? '', {
            osmNewNoteFeature: osmNewNoteFeature ?? null,
            commentedFeatureId,
            newNoteTildaDeeplink: newNoteTildaDeeplink ?? '',
          })
          try {
            await createNoteMutation({
              regionSlug,
              subject: sanitizeHtml(values.subject),
              latitude: newInternalNoteMapParam.lat,
              longitude: newInternalNoteMapParam.lng,
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
            <p className="leading-snug">
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
              classNameOverwrite="my-3 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-yellow-600 focus:ring-inset"
              placeholder="Betreff"
              required
            />
            <Textarea
              form={form}
              name="body"
              label="Hinweistext (Markdown)"
              labelSrOnly
              classNameOverwrite="my-3 block min-h-48 w-full rounded-md border-0 bg-gray-50 py-2 leading-tight text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-yellow-600 focus:ring-inset"
              placeholder="Hinweis"
              required
              rows={12}
            />
            <div className="flex items-center gap-1 leading-tight">
              <form.Subscribe selector={(s) => s.isSubmitting}>
                {(isSubmitting) => (
                  <button
                    type="submit"
                    className={buttonStylesOnYellow}
                    disabled={isSubmitting || isPending}
                  >
                    Internen Hinweis speichern
                  </button>
                )}
              </form.Subscribe>
              {(isPending || form.state.isSubmitting) && <SmallSpinner />}
            </div>
            {error ? <p className="text-red-500">{error.message}</p> : null}
          </>
        )}
      </Form>
    </section>
  )
}
