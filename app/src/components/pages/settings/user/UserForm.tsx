import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { twJoin } from 'tailwind-merge'
import { TextField } from '@/components/shared/form/fields/TextField'
import { Form } from '@/components/shared/form/Form'
import { Img } from '@/components/shared/Img'
import { Link } from '@/components/shared/links/Link'
import { buttonStyles } from '@/components/shared/links/styles'
import { Markdown } from '@/components/shared/text/Markdown'
import { proseClasses } from '@/components/shared/text/prose'
import { getOsmUrl } from '@/components/shared/utils/getOsmUrl'
import { hasContactEmail } from '@/components/shared/utils/osmPlaceholderEmail'
import { isAdmin } from '@/components/shared/utils/usersUtils'
import { currentUserQueryKey } from '@/server/users/currentUserQueryOptions'
import type { CurrentUser } from '@/server/users/queries/getCurrentUser.server'
import { UpdateUserSchema } from '@/server/users/schema'
import { updateOsmDescriptionFn, updateUserFn } from '@/server/users/users.functions'
import { UserFormOsmDescriptionMissing } from './UserFormOsmDescriptionMissing'

function ClearOsmDescriptionButton() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [pending, setPending] = useState(false)
  return (
    <div className="bg-pink-300 px-4 py-2 text-xs leading-5">
      <button
        type="button"
        disabled={pending}
        className={buttonStyles}
        onClick={async () => {
          setPending(true)
          await updateOsmDescriptionFn({ data: { osmDescription: '' } })
          await queryClient.invalidateQueries({ queryKey: currentUserQueryKey })
          await router.invalidate()
          setPending(false)
        }}
      >
        {pending ? 'Wird gelöscht...' : 'Beschreibung löschen'}
      </button>
    </div>
  )
}

type Props = {
  user: NonNullable<CurrentUser>
}

export const UserForm = ({ user }: Props) => {
  const queryClient = useQueryClient()
  const router = useRouter()
  return (
    <>
      <Form
        defaultValues={{
          email: hasContactEmail(user.email) ? user.email : '',
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
          osmDescription: user.osmDescription ?? '',
        }}
        schema={UpdateUserSchema}
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
            await queryClient.invalidateQueries({ queryKey: currentUserQueryKey })
            await router.invalidate()
          }
          return result
        }}
        submitLabel="Account aktualisieren"
      >
        {(form) => (
          <>
            <TextField
              form={form}
              name="firstName"
              label="Vorname"
              placeholder=""
              autoComplete="given-name"
              optional
              optionalSuffix="optional, empfohlen"
            />
            <TextField
              form={form}
              name="lastName"
              label="Nachname"
              placeholder=""
              autoComplete="family-name"
              optional
              optionalSuffix="optional, empfohlen"
            />
            <TextField
              form={form}
              name="email"
              label="E-Mail-Adresse"
              type="email"
              placeholder=""
              autoComplete="email"
              help="Verwendet zur Kontaktaufnahme durch FixMyCity und für Benachrichtigungen aus dem Atlas."
            />
          </>
        )}
      </Form>

      <aside
        className={twJoin(proseClasses, 'prose-sm mt-10 border-t border-gray-400 pt-10 prose-gray')}
      >
        <h2 className="text-sm">Angaben auf openstreetmap.org:</h2>
        <p className="mt-3 text-sm text-gray-500">
          <Link blank href={getOsmUrl('/account/edit')}>
            Name, Avatar bearbeiten
          </Link>
          .{' '}
          <Link blank href={getOsmUrl('/profile/edit')}>
            Profilbeschreibung bearbeiten
          </Link>
          .
        </p>
        <div className="rounded border">
          <table className="my-0 text-sm">
            <tbody>
              <tr>
                <th className="pl-1 font-normal">Anzeigename</th>
                <td className="py-1">
                  <strong>{user.osmName ? user.osmName : '–'}</strong>
                </td>
              </tr>
              <tr>
                <th className="pl-1 font-normal">Avatar</th>
                <td className="py-1">
                  {user.osmAvatar ? (
                    <Img
                      src={user.osmAvatar}
                      width={32}
                      height={32}
                      className="my-0 h-8 w-8 rounded-full"
                      alt=""
                      aria-hidden
                    />
                  ) : (
                    '–'
                  )}
                </td>
              </tr>
              <tr>
                <th className="pl-1 font-normal">Profilbeschreibung</th>
                <td className="py-1 pr-1 text-sm">
                  <Markdown
                    markdown={user.osmDescription}
                    className="prose-xs leading-snug font-normal text-gray-600"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {user.osmDescription?.trim() ? (
          <>
            <p className="leading-snug text-gray-500">
              Hinweis: Diese Angaben werden bei jedem neuen Einloggen aktualisiert. Um die Daten zu
              aktualisieren, bitte ausloggen und erneut einloggen.
            </p>
            {isAdmin(user) && <ClearOsmDescriptionButton />}
          </>
        ) : (
          <UserFormOsmDescriptionMissing />
        )}
      </aside>
    </>
  )
}
