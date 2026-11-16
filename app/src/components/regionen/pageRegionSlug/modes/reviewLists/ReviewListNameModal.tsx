import { useId } from 'react'
import { twJoin } from 'tailwind-merge'
import { z } from 'zod'
import { ColorField } from '@/components/shared/form/fields/ColorField'
import { TextField } from '@/components/shared/form/fields/TextField'
import { Form } from '@/components/shared/form/Form'
import { buttonStylesOnYellow } from '@/components/shared/links/styles'
import { ModalDialog } from '@/components/shared/Modal/ModalDialog'
import {
  DEFAULT_REVIEW_LIST_STATUS_STYLES,
  REVIEW_STATUSES,
  ReviewListStatusStylesSchema,
} from '@/shared/reviewLists/reviewListStatusStyles'

const ListSchema = z.object({
  name: z.string().trim().min(1, 'Name fehlt.'),
  statusStyles: ReviewListStatusStylesSchema,
})

type ListValues = z.infer<typeof ListSchema>

type Kind = 'create' | 'rename'

type Props = {
  kind: Kind | null
  defaultValues?: ListValues
  isPending: boolean
  onClose: () => void
  onSubmit: (values: ListValues) => Promise<void>
}

const COPY = {
  create: {
    title: 'Neue Prüfliste',
    submitLabel: 'Anlegen',
    successMessage: 'Prüfliste angelegt.',
  },
  rename: {
    title: 'Prüfliste bearbeiten',
    submitLabel: 'Speichern',
    successMessage: 'Prüfliste gespeichert.',
  },
} as const

/** Create a review list (name only) or edit its name, status labels and map colors. */
export const ReviewListNameModal = ({
  kind,
  defaultValues = { name: '', statusStyles: DEFAULT_REVIEW_LIST_STATUS_STYLES },
  isPending,
  onClose,
  onSubmit,
}: Props) => {
  const formId = useId()
  const copy = kind ? COPY[kind] : COPY.create

  return (
    <ModalDialog
      title={copy.title}
      icon="reviewList"
      mode="reviewLists"
      buttonCloseName="Abbrechen"
      open={kind !== null}
      setOpen={(next) => {
        if (!next) onClose()
      }}
      primaryAction={
        kind ? (
          <button
            type="submit"
            form={formId}
            disabled={isPending}
            className={twJoin(buttonStylesOnYellow, 'inline-flex w-full justify-center sm:w-auto')}
          >
            {copy.submitLabel}
          </button>
        ) : null
      }
    >
      {kind ? (
        <Form
          id={formId}
          key={kind}
          defaultValues={defaultValues}
          schema={ListSchema}
          onSubmit={async (values) => {
            try {
              await onSubmit(values)
              onClose()
              return { success: true, message: copy.successMessage }
            } catch (error) {
              return {
                success: false,
                message: error instanceof Error ? error.message : String(error),
              }
            }
          }}
        >
          {(form) => (
            <div className="space-y-4">
              <TextField
                form={form}
                name="name"
                label="Name"
                placeholder="z. B. Problematische Kreuzungen"
                disabled={isPending}
              />
              {kind === 'rename'
                ? REVIEW_STATUSES.map((status) => (
                    <div key={status} className="grid grid-cols-[1fr_9rem] gap-3">
                      <TextField
                        form={form}
                        name={`statusStyles.${status}.label`}
                        label={`Status-Button „${DEFAULT_REVIEW_LIST_STATUS_STYLES[status].label}“`}
                        disabled={isPending}
                      />
                      <ColorField
                        form={form}
                        name={`statusStyles.${status}.color`}
                        label="Kartenfarbe"
                        disabled={isPending}
                      />
                    </div>
                  ))
                : null}
            </div>
          )}
        </Form>
      ) : null}
    </ModalDialog>
  )
}
