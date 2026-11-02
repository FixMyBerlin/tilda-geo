import { useId } from 'react'
import { twJoin } from 'tailwind-merge'
import { z } from 'zod'
import { TextField } from '@/components/shared/form/fields/TextField'
import { Form } from '@/components/shared/form/Form'
import { buttonStylesOnYellow } from '@/components/shared/links/styles'
import { ModalDialog } from '@/components/shared/Modal/ModalDialog'
import { getErrorMessage } from '@/components/shared/toast/toastError'
import { planningTitleSchema } from '@/server/planning/planningFormSchemas'
import type { SpaceFinderNameModalKind } from './useSpaceFinderCommands'

const NameSchema = z.object({
  name: planningTitleSchema,
})

type Kind = SpaceFinderNameModalKind

type Props = {
  kind: Kind | null
  defaultName?: string
  isPending: boolean
  onClose: () => void
  onSubmit: (name: string) => Promise<void>
}

const COPY: Record<
  Kind,
  { title: string; label: string; submitLabel: string; successMessage: string; failure: string }
> = {
  newVariant: {
    title: 'Neue Variante',
    label: 'Name',
    submitLabel: 'Anlegen',
    successMessage: 'Variante angelegt. Die Faktoren starten mit den Standardwerten.',
    failure: 'Variante konnte nicht angelegt werden.',
  },
  renameVariant: {
    title: 'Variante umbenennen',
    label: 'Name',
    submitLabel: 'Speichern',
    successMessage: 'Variante umbenannt.',
    failure: 'Umbenennen fehlgeschlagen.',
  },
  renameArea: {
    title: 'Planungsgebiet umbenennen',
    label: 'Name',
    submitLabel: 'Speichern',
    successMessage: 'Planungsgebiet umbenannt.',
    failure: 'Umbenennen fehlgeschlagen.',
  },
}

/** Create/rename modal for a Variante or the Gebiet — same shape as `ReviewListNameModal`. */
export const SpaceFinderNameModal = ({
  kind,
  defaultName = '',
  isPending,
  onClose,
  onSubmit,
}: Props) => {
  const formId = useId()
  const copy = kind ? COPY[kind] : COPY.renameVariant

  return (
    <ModalDialog
      title={copy.title}
      icon="edit"
      mode="spaceFinder"
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
              await onSubmit(values.name.trim())
              onClose()
              return { success: true, message: copy.successMessage }
            } catch (error) {
              return {
                success: false,
                message: getErrorMessage(error, copy.failure),
              }
            }
          }}
        >
          {(form) => <TextField form={form} name="name" label={copy.label} disabled={isPending} />}
        </Form>
      ) : null}
    </ModalDialog>
  )
}
