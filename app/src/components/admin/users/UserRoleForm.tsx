import { useRouter } from '@tanstack/react-router'
import type { z } from 'zod'
import { AdminFormLayout, type AdminFormPageExtras } from '@/components/admin/aside/AdminFormLayout'
import { AdminFormSection } from '@/components/admin/aside/AdminFormSection'
import { Callout } from '@/components/shared/Callout/Callout'
import { RadioGroup } from '@/components/shared/form/fields/RadioGroup'
import { Form, type SubmitResult } from '@/components/shared/form/Form'
import { UpdateUserRoleSchema } from '@/server/users/schema'
import { updateUserRoleFn } from '@/server/users/users.functions'

type UserRoleFormValues = z.input<typeof UpdateUserRoleSchema>

/** Section ids (jump list + URL hash) and titles of the field groups, in page order. */
const sectionLabels = {
  role: 'Rolle',
} satisfies Record<string, string>

type Props = {
  user: { id: string; role: UserRoleFormValues['role'] }
  pageExtras: AdminFormPageExtras
}

export function UserRoleForm({ user, pageExtras }: Props) {
  const router = useRouter()

  return (
    <Form<UserRoleFormValues>
      actionBarPlacement="none"
      defaultValues={{ userId: user.id, role: user.role }}
      schema={UpdateUserRoleSchema}
      onSubmit={async (values) => {
        const result = await updateUserRoleFn({ data: values })
        if (result.success) {
          await router.invalidate()
          return { success: true }
        }
        return result as SubmitResult<UserRoleFormValues>
      }}
    >
      {(form, { submitError }) => (
        <AdminFormLayout
          fieldLabels={sectionLabels}
          extras={pageExtras}
          form={form}
          submitLabel="Speichern"
          cancel={{ to: '/admin/users' }}
          submitError={submitError}
        >
          <AdminFormSection id="role" title={sectionLabels.role}>
            <RadioGroup
              form={form}
              name="role"
              label="Rolle"
              help="Eine geänderte Rolle gilt für den Admin-Bereich sofort, für den Zugriff auf Regionen erst nach erneutem Login."
              items={[
                {
                  value: 'USER',
                  label: 'Normaler User – Rechte nur auf Regionen mit Mitgliedschaft',
                },
                {
                  value: 'ADMIN',
                  label: 'Admin – Zugriff auf alle Regionen und den Admin-Bereich',
                },
              ]}
            />
            <form.Subscribe selector={(state) => state.values.role}>
              {(role) =>
                role === 'ADMIN' && user.role !== 'ADMIN' ? (
                  <Callout tone="warning" title="Achtung: Dieser User wird Admin">
                    <p>
                      Admins haben Zugriff auf alle Regionen (auch nicht veröffentlichte) und den
                      gesamten Admin-Bereich – inklusive Nutzerverwaltung und dem Vergeben weiterer
                      Admin-Rechte.
                    </p>
                  </Callout>
                ) : null
              }
            </form.Subscribe>
          </AdminFormSection>
        </AdminFormLayout>
      )}
    </Form>
  )
}
