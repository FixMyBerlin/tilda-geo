'use client'
import { FORM_ERROR, Form, FormProps } from '@/src/app/_components/forms/Form'
import { LabeledTextField } from '@/src/app/_components/forms/LabeledTextField'
import { Link } from '@/src/app/_components/links/Link'
import { buttonStyles } from '@/src/app/_components/links/styles'
import { Markdown } from '@/src/app/_components/text/Markdown'
import { proseClasses } from '@/src/app/_components/text/prose'
import { getOsmUrl } from '@/src/app/_components/utils/getOsmUrl'
import { useCurrentUser } from '@/src/app/_hooks/useCurrentUser'
import { isAdmin } from '@/src/app/_hooks/usersUtils'
import updateOsmDescription from '@/src/server/users/mutations/updateOsmDescription'
import updateUser from '@/src/server/users/mutations/updateUser'
import { UpdateUserSchema } from '@/src/server/users/schema'
import { useMutation } from '@blitzjs/rpc'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { twJoin } from 'tailwind-merge'
import { z } from 'zod'
import { UserFormOsmDescriptionMissing } from './UserFormOsmDescriptionMissing'
export { FORM_ERROR } from '@/src/app/_components/forms/Form'

export function UserFormForm<S extends z.ZodType<any, any>>(props: FormProps<S>) {
  return (
    <Form<S> {...props}>
      <LabeledTextField
        name="firstName"
        label="Vorname"
        placeholder=""
        autoComplete="given-name"
        optional
      />
      <LabeledTextField
        name="lastName"
        label="Nachname"
        placeholder=""
        autoComplete="family-name"
        optional
      />
      <LabeledTextField
        type="email"
        name="email"
        label="E-Mail-Adresse"
        placeholder=""
        autoComplete="email"
        help="Verwendet zur Kontaktaufnahme durch FixMyCity und für Benachrichtigungen aus dem Atlas."
      />
    </Form>
  )
}

export const UserForm = () => {
  const router = useRouter()
  const user = useCurrentUser()!
  const [updateUserMutation] = useMutation(updateUser)
  const [updateUserOsmDescriptionMutation] = useMutation(updateOsmDescription)

  return (
    <>
      <UserFormForm
        submitText="Account aktualisieren"
        schema={UpdateUserSchema}
        initialValues={{
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email || '',
        }}
        onSubmit={async (values) => {
          try {
            await updateUserMutation(values)
            router.push('/settings/user')
          } catch (error: any) {
            console.error(error)
            return { [FORM_ERROR]: error }
          }
        }}
      />
      <aside
        className={twJoin(proseClasses, 'prose-sm prose-gray mt-10 border-t border-gray-400 pt-10')}
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
                    <Image
                      src={user.osmAvatar}
                      width={32}
                      height={32}
                      className="my-0 h-8 w-8 rounded-full"
                      alt=""
                      aria-hidden="true"
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
        {Boolean(user.osmDescription?.trim()) ? (
          <>
            <p className="leading-snug text-gray-500">
              Hinweis: Diese Angaben werden bei jedem neuen Einloggen aktualisiert. Um die Daten zu
              aktualisieren, bitte ausloggen und erneut einloggen.
            </p>
            {isAdmin(user) && (
              <div className="bg-pink-300 px-4 py-2 text-xs leading-5">
                <button
                  onClick={() => {
                    updateUserOsmDescriptionMutation({ osmDescription: '' })
                    window.location.reload()
                  }}
                  className={buttonStyles}
                >
                  Beschreibung löschen
                </button>
              </div>
            )}
          </>
        ) : (
          <UserFormOsmDescriptionMissing />
        )}
      </aside>
    </>
  )
}
