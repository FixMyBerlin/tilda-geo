import { Field, Switch as HeadlessSwitch, Label } from '@headlessui/react'
import { PencilSquareIcon } from '@heroicons/react/20/solid'
import { TrashIcon } from '@heroicons/react/24/outline'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { twJoin, twMerge } from 'tailwind-merge'
import { z } from 'zod'
import { useMapActions } from '@/components/regionen/pageRegionSlug/hooks/mapState/useMapState'
import { useStaticRegion } from '@/components/regionen/pageRegionSlug/regionUtils/useStaticRegion'
import { Form } from '@/components/shared/form/Form'
import { Textarea } from '@/components/shared/form/fields/Textarea'
import { TextField } from '@/components/shared/form/fields/TextField'
import { buttonStylesOnYellow, notesButtonStyle } from '@/components/shared/links/styles'
import { ModalDialog } from '@/components/shared/Modal/ModalDialog'
import { SmallSpinner } from '@/components/shared/Spinner/SmallSpinner'
import { sanitizeHtml } from '@/components/shared/utils/sanitizeHtml'
import type { DeleteNoteInputType, UpdateNoteInputType } from '@/server/notes/notes.functions'
import { deleteNoteFn, updateNoteFn } from '@/server/notes/notes.functions'
import type { NoteAndComments } from '@/server/notes/queries/getNoteAndComments.server'
import { useQueryKey } from '../../notes/InternalNotes/utils/useQueryKey'
import { SvgNotesCheckmark } from '../icons/SvgNotesCheckmark'
import { SvgNotesQuestionmark } from '../icons/SvgNotesQuestionmark'
import { useIsAuthor } from './utils/useIsAuthor'

const EditNoteSchema = z.object({
  subject: z.string().min(1, 'Betreff fehlt.'),
  body: z.string(),
  resolved: z.boolean(),
})

type Props = { note: NonNullable<NoteAndComments> }

export const EditNoteForm = ({ note }: Props) => {
  const queryClient = useQueryClient()
  const queryKeyMap = useQueryKey()
  const [open, setOpen] = useState(false)
  const region = useStaticRegion()
  const { clearInspectorFeatures } = useMapActions()

  const {
    mutateAsync: updateNoteMutation,
    isPending,
    error,
  } = useMutation({
    mutationFn: (input: UpdateNoteInputType) => updateNoteFn({ data: input }),
    onSuccess: (updatedNote: { id: number }) => {
      queryClient.invalidateQueries({
        queryKey: ['notes', 'getNoteAndComments', { id: updatedNote.id }],
      })
      queryClient.invalidateQueries({ queryKey: queryKeyMap })
      setOpen(false)
    },
  })
  const { mutate: deleteNoteMutation } = useMutation({
    mutationFn: (input: DeleteNoteInputType) => deleteNoteFn({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeyMap })
    },
  })

  const isAuthor = useIsAuthor(note.author?.id ?? '')

  if (!isAuthor) return null

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={notesButtonStyle}>
        <PencilSquareIcon className="size-6" />
      </button>

      <ModalDialog
        title="Hinweis bearbeiten"
        icon="edit"
        buttonCloseName="Abbrechen"
        open={open}
        setOpen={setOpen}
      >
        <Form
          defaultValues={{
            subject: note.subject,
            body: note.body ?? '',
            resolved: note.resolvedAt !== null,
          }}
          schema={EditNoteSchema}
          onSubmit={async (values) => {
            try {
              await updateNoteMutation({
                regionSlug: region.slug,
                noteId: note.id,
                subject: sanitizeHtml(values.subject),
                body: sanitizeHtml(values.body),
                resolved: values.resolved,
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
              <TextField
                form={form}
                name="subject"
                label="Betreff bearbeiten"
                placeholder="Betreff"
                className="my-3 border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-yellow-600 focus:ring-inset"
              />
              <Textarea
                form={form}
                name="body"
                label="Kommentar bearbeiten (Markdown)"
                placeholder="Kommentar"
                className="my-3 min-h-28 border-0 bg-gray-50 py-2 leading-tight text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-yellow-600 focus:ring-inset"
                rows={6}
              />

              <form.Field name="resolved">
                {(field) => {
                  const formResolved = Boolean(field.state.value)
                  return (
                    <Field as="div" className="flex items-center">
                      <HeadlessSwitch
                        checked={formResolved}
                        onChange={() => field.handleChange((prev) => !prev)}
                        className={twJoin(
                          formResolved ? 'bg-yellow-600' : 'bg-gray-200',
                          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:outline-none',
                        )}
                      >
                        <span className="sr-only">Erledigt</span>
                        <span
                          className={twJoin(
                            formResolved ? 'translate-x-5' : 'translate-x-0',
                            'pointer-events-none relative inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                          )}
                        >
                          <span
                            className={twJoin(
                              formResolved
                                ? 'opacity-0 duration-100 ease-out'
                                : 'opacity-100 duration-200 ease-in',
                              'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity',
                            )}
                            aria-hidden="true"
                          >
                            <SvgNotesQuestionmark className="size-5 text-sky-700" />
                          </span>
                          <span
                            className={twJoin(
                              formResolved
                                ? 'opacity-100 duration-200 ease-in'
                                : 'opacity-0 duration-100 ease-out',
                              'absolute inset-0 flex h-full w-full items-center justify-center transition-opacity',
                            )}
                            aria-hidden="true"
                          >
                            <SvgNotesCheckmark className="size-5 text-sky-700" />
                          </span>
                        </span>
                      </HeadlessSwitch>
                      <Label as="span" className="ml-3 text-sm">
                        {formResolved ? 'ist erledigt' : 'ist offen'}
                      </Label>
                    </Field>
                  )
                }}
              </form.Field>

              <div className="mt-6 flex items-center justify-between leading-tight">
                <div className="flex items-center gap-1">
                  <form.Subscribe selector={(s) => s.isSubmitting}>
                    {(isSubmitting) => (
                      <button
                        type="submit"
                        className={buttonStylesOnYellow}
                        disabled={isSubmitting || isPending}
                      >
                        Änderung speichern
                      </button>
                    )}
                  </form.Subscribe>
                  {isPending && <SmallSpinner />}
                </div>

                <button
                  type="button"
                  title="Hinweis löschen"
                  onClick={() => {
                    if (
                      window.confirm('Sind Sie sicher, dass Sie diesen Hinweis löschen möchten?')
                    ) {
                      try {
                        setOpen(false)
                        deleteNoteMutation({
                          regionSlug: region.slug,
                          noteId: note.id,
                        })
                        clearInspectorFeatures()
                      } catch (err) {
                        window.alert(String(err))
                        console.error(err)
                      }
                    }
                  }}
                  className={twMerge(notesButtonStyle, 'hover:bg-orange-400')}
                >
                  <TrashIcon className="size-6" />
                </button>
              </div>

              {error ? <p className="text-red-500">{error.message}</p> : null}
            </>
          )}
        </Form>
      </ModalDialog>
    </>
  )
}
