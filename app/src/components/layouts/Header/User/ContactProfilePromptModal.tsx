import { useQueryClient } from '@tanstack/react-query'
import { useHydrated, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { TextField } from '@/components/shared/form/fields/TextField'
import { Form } from '@/components/shared/form/Form'
import { Link } from '@/components/shared/links/Link'
import { buttonStyles } from '@/components/shared/links/styles'
import { ModalDialog } from '@/components/shared/Modal/ModalDialog'
import { hasContactEmail } from '@/components/shared/utils/osmPlaceholderEmail'
import { currentUserQueryKey } from '@/server/users/currentUserQueryOptions'
import type { CurrentUser } from '@/server/users/queries/getCurrentUser.server'
import { ContactProfilePromptFormSchema } from '@/server/users/schema'
import { updateUserFn } from '@/server/users/users.functions'
import {
  useContactProfilePromptActions,
  useContactProfilePromptDismissed,
} from './useContactProfilePromptStore'

type Props = {
  user: NonNullable<CurrentUser>
}

export function ContactProfilePromptModal({ user }: Props) {
  const hydrated = useHydrated()
  const dismissed = useContactProfilePromptDismissed()
  const { dismissForSession } = useContactProfilePromptActions()
  const queryClient = useQueryClient()
  const router = useRouter()
  const needsContactEmail = !hasContactEmail(user.email)
  const [phase, setPhase] = useState<'form' | 'thanks'>('form')

  const shouldMount = needsContactEmail || phase === 'thanks'
  const open = hydrated && !dismissed && shouldMount

  const handleSetOpen = (value: boolean) => {
    if (value) return
    if (phase === 'thanks') {
      dismissForSession()
      setPhase('form')
      return
    }
    dismissForSession()
  }

  if (!shouldMount) return null

  return (
    <ModalDialog
      title="Willkommen – bitte vervollständigen Sie Ihre Kontaktdaten"
      icon="edit"
      open={open}
      setOpen={handleSetOpen}
      panelTestId="contact-profile-prompt-modal"
    >
      {phase === 'thanks' ? (
        <p className="text-sm text-gray-700">Vielen Dank! Ihre Angaben wurden gespeichert.</p>
      ) : (
        <>
          <article className="space-y-3 text-sm text-gray-700">
            <p>
              Schön, dass Sie TILDA nutzen. Bitte vervollständigen Sie Ihre Registrierung mit
              E-Mail-Adresse (Pflicht) und gerne auch einem Vor- und Nachnamen. Diese Daten werden
              bei der Anmeldung über OpenStreetMap nicht mit übermittelt, aber helfen uns, die
              Profile zu verwalten.
            </p>
            <p>
              Die Daten werden ausschließlich im Rahmen der Arbeit mit TILDA verwendet.
              Beispielsweise bei der Anzeige in Hinweisen/Antworten (Name) und bei optionalen
              E-Mail-Benachrichtigungen. Weitere Informationen finden Sie in der{' '}
              <Link to="/datenschutz" blank>
                Datenschutzerklärung
              </Link>
              .
            </p>
          </article>

          <Form
            className="mt-4"
            defaultValues={{
              email: hasContactEmail(user.email) ? user.email : '',
              firstName: user.firstName ?? '',
              lastName: user.lastName ?? '',
            }}
            schema={ContactProfilePromptFormSchema}
            showFormErrors
            onSubmit={async (values) => {
              const result = await updateUserFn({
                data: {
                  email: values.email,
                  firstName: values.firstName ?? '',
                  lastName: values.lastName ?? '',
                  osmDescription: user.osmDescription ?? undefined,
                },
              })
              if (result?.success) {
                setPhase('thanks')
                window.setTimeout(async () => {
                  await queryClient.invalidateQueries({ queryKey: currentUserQueryKey })
                  await router.invalidate()
                  setPhase('form')
                }, 1800)
              }
              return result
            }}
          >
            {(form) => (
              <>
                <TextField
                  form={form}
                  name="email"
                  label="E-Mail-Adresse"
                  type="email"
                  autoComplete="email"
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4">
                  <TextField
                    form={form}
                    name="firstName"
                    label="Vorname"
                    autoComplete="given-name"
                    optional
                  />
                  <TextField
                    form={form}
                    name="lastName"
                    label="Nachname"
                    autoComplete="family-name"
                    optional
                  />
                </div>
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs inset-ring-1 inset-ring-gray-300 hover:bg-gray-50"
                    onClick={() => dismissForSession()}
                  >
                    Für diese Sitzung ausblenden
                  </button>
                  <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
                    {([canSubmit, isSubmitting]) => (
                      <button
                        type="submit"
                        disabled={!canSubmit || isSubmitting}
                        className={buttonStyles}
                      >
                        {isSubmitting ? '…' : 'Speichern'}
                      </button>
                    )}
                  </form.Subscribe>
                </div>
              </>
            )}
          </Form>
        </>
      )}
    </ModalDialog>
  )
}
