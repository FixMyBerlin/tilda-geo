import { useId } from 'react'
import { twJoin } from 'tailwind-merge'
import { z } from 'zod'
import { TextField } from '@/components/shared/form/fields/TextField'
import { Form } from '@/components/shared/form/Form'
import { buttonStylesOnYellow } from '@/components/shared/links/styles'
import { ModalDialog } from '@/components/shared/Modal/ModalDialog'

const NameSchema = z.object({
  name: z.string().trim().min(1, 'Name fehlt.'),
})

type Kind = 'create' | 'rename'

type Props = {
  kind: Kind | null
  defaultName?: string
  isPending: boolean
  onClose: () => void
  onSubmit: (name: string) => Promise<void>
}

const COPY = {
  create: {
    title: 'Neue Prüfliste',
    submitLabel: 'Anlegen',
    successMessage: 'Prüfliste angelegt.',
  },
  rename: {
    title: 'Prüfliste umbenennen',
    submitLabel: 'Speichern',
    successMessage: 'Prüfliste umbenannt.',
  },
} as const

/** Shared create/rename modal for a review list name. */
export const ReviewListNameModal = ({
  kind,
  defaultName = '',
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
          defaultValues={{ name: defaultName }}
          schema={NameSchema}
          onSubmit={async (values) => {
            try {
              await onSubmit(values.name)
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
            <TextField
              form={form}
              name="name"
              label="Name"
              placeholder="z. B. Problematische Kreuzungen"
              disabled={isPending}
            />
          )}
        </Form>
      ) : null}
    </ModalDialog>
  )
}
