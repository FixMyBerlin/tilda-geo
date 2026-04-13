import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'
import { z } from 'zod'
import { useStaticRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useStaticRegion'
import { Textarea } from '@/components/shared/form/fields/Textarea'
import { Form } from '@/components/shared/form/Form'
import { useHasPermissions } from '@/components/shared/hooks/useHasPermissions'
import { buttonStylesOnYellow } from '@/components/shared/links/styles'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'
import { sanitizeHtml } from '@/components/shared/utils/sanitizeHtml'
import type { CreateNoteCommentInputType } from '@/server/notes/notes.functions'
import { createNoteCommentFn } from '@/server/notes/notes.functions'

const NewNoteCommentSchema = z.object({
  body: z.string().min(1, 'Bitte Antwort eingeben.'),
})

type Props = {
  noteId: number
}

export const NewNoteCommentForm = ({ noteId }: Props) => {
  const queryClient = useQueryClient()
  const resetFormRef = useRef<(() => void) | null>(null)

  const {
    mutateAsync: createNoteCommentMutation,
    isPending,
    error,
  } = useMutation({
    mutationFn: (input: CreateNoteCommentInputType) => createNoteCommentFn({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', 'getNoteAndComments', { id: noteId }] })
      resetFormRef.current?.()
    },
  })

  const region = useStaticRegion()
  const hasPermissions = useHasPermissions()

  if (!hasPermissions) {
    return null
  }

  return (
    <Form
      defaultValues={{ body: '' }}
      schema={NewNoteCommentSchema}
      onSubmit={async (values) => {
        try {
          await createNoteCommentMutation({
            regionSlug: region.slug,
            noteId,
            body: sanitizeHtml(values.body),
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
      {(form) => {
        resetFormRef.current = () => form.reset()
        return (
          <>
            <Textarea
              form={form}
              name="body"
              label="Antwort (Markdown)"
              className="block min-h-28 border-0 bg-gray-50 py-2 leading-tight text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-yellow-600 focus:ring-inset"
              rows={5}
            />
            <div className="mt-3 flex items-center gap-1 leading-tight">
              <form.Subscribe selector={(s) => s.isSubmitting}>
                {(isSubmitting) => (
                  <button
                    type="submit"
                    className={buttonStylesOnYellow}
                    disabled={isSubmitting || isPending}
                  >
                    Antwort speichern
                  </button>
                )}
              </form.Subscribe>
              {(isPending || form.state.isSubmitting) && <SmallSpinner />}
            </div>
            {error ? <p className="text-red-500">{error.message}</p> : null}
          </>
        )
      }}
    </Form>
  )
}
