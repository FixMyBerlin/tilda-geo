import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'
import { z } from 'zod'
import { useRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useRegion'
import { MarkdownEditorField } from '@/components/shared/form/fields/MarkdownEditorField'
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

  const region = useRegion()
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
            <MarkdownEditorField form={form} name="body" label="Antwort (Markdown)" />
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
