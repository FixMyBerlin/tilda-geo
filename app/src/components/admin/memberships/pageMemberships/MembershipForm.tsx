import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useStore } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import type { z } from 'zod'
import { AdminFormLayout } from '@/components/admin/aside/AdminFormLayout'
import { AdminFormSection } from '@/components/admin/aside/AdminFormSection'
import { Callout } from '@/components/shared/Callout/Callout'
import { ConfirmDialog } from '@/components/shared/dialog/ConfirmDialog'
import { RadioGroup } from '@/components/shared/form/fields/RadioGroup'
import { Select } from '@/components/shared/form/fields/Select'
import { Form } from '@/components/shared/form/Form'
import type { FormApi } from '@/components/shared/form/types'
import { createMembershipFn } from '@/server/memberships/memberships.functions'
import { MembershipSchema } from '@/server/memberships/schema'
import type { TRegion } from '@/server/regions/regionConfigMapper.server'
import type { User } from '@/server/users/queries/getUsers.server'
import { getUserWithMembershipsFn } from '@/server/users/users.functions'
import { getRegionSelectOptions } from './utils/getRegionSelectOptions'
import { getUserSelectOptions } from './utils/getUserSelectOptions'

type Props = {
  regions: TRegion[]
  users: User[]
  initialValues?: {
    userId?: string
    regionId?: string
  }
}

type MembershipFormValues = z.input<typeof MembershipSchema>

const sectionLabels = {
  membership: 'Mitgliedschaft',
} satisfies Record<string, string>

const roleOptions = [
  { value: 'USER', label: 'Normaler User – Rechte nur auf den zugewiesenen Regionen' },
  { value: 'ADMIN', label: 'Admin – Zugriff auf alle Regionen und den Admin-Bereich' },
]

const getUserRole = (users: User[], userId: string) =>
  users.find((u) => u.id === userId)?.role ?? 'USER'

const isAdminPromotion = (users: User[], values: Pick<MembershipFormValues, 'userId' | 'role'>) =>
  Boolean(values.userId) && values.role === 'ADMIN' && getUserRole(users, values.userId) !== 'ADMIN'

const adminPromotionWarning =
  'Admins haben Zugriff auf alle Regionen (auch nicht veröffentlichte) und den gesamten Admin-Bereich – inklusive Nutzerverwaltung und dem Vergeben weiterer Admin-Rechte.'

function MembershipFormFields({
  form,
  userId,
  onUserIdChange,
  regions,
  users,
}: {
  form: FormApi<MembershipFormValues>
  userId: string
  onUserIdChange: (nextUserId: string) => void
  regions: TRegion[]
  users: User[]
}) {
  const { data: userData, isPending: membershipQueryPending } = useQuery({
    queryKey: ['userWithMemberships', userId],
    queryFn: () => getUserWithMembershipsFn({ data: { userId } }),
    enabled: !!userId,
  })
  const userOptions = getUserSelectOptions(users)
  const regionOptsRaw = getRegionSelectOptions(regions, userData ?? null)
  const regionsLocked = Boolean(userId) && membershipQueryPending
  const role = useStore(form.store, (state) => state.values.role)
  const showAdminWarning = isAdminPromotion(users, { userId, role })

  const regionOptions = [
    { value: '', label: 'Keine Region hinzufügen', disabled: regionsLocked },
    ...regionOptsRaw.map(({ value, label, readonly, outerProps }) => ({
      value,
      label,
      disabled: readonly || regionsLocked,
      className: outerProps?.className,
    })),
  ]

  return (
    <>
      <Select
        form={form}
        name="userId"
        label="User"
        options={userOptions}
        onValueChange={(nextUserId) => {
          onUserIdChange(nextUserId)
          void form.setFieldValue('regionId', '')
          void form.setFieldValue('role', getUserRole(users, nextUserId))
        }}
      />
      <RadioGroup form={form} name="role" label="Rolle" items={roleOptions} />
      {showAdminWarning && (
        <Callout tone="warning" title="Achtung: Dieser User wird Admin">
          <p>{adminPromotionWarning}</p>
        </Callout>
      )}
      <RadioGroup
        form={form}
        name="regionId"
        label="Region, auf der der User Rechte erhalten soll"
        items={regionOptions}
      />
    </>
  )
}

export function MembershipForm({ regions, users, initialValues }: Props) {
  const [selectedUserId, setSelectedUserId] = useState(initialValues?.userId ?? '')
  const [confirmAdminOpen, setConfirmAdminOpen] = useState(false)
  const resolveConfirmAdmin = useRef<((confirmed: boolean) => void) | null>(null)

  const confirmAdminPromotion = () =>
    new Promise<boolean>((resolve) => {
      resolveConfirmAdmin.current = resolve
      setConfirmAdminOpen(true)
    })

  const closeConfirmAdmin = (confirmed: boolean) => {
    resolveConfirmAdmin.current?.(confirmed)
    resolveConfirmAdmin.current = null
    setConfirmAdminOpen(false)
  }

  const selectedUser = users.find((u) => u.id === selectedUserId)

  return (
    <>
      <Form
        actionBarPlacement="none"
        showFormErrors={false}
        defaultValues={{
          userId: initialValues?.userId ?? '',
          role: getUserRole(users, initialValues?.userId ?? ''),
          regionId: initialValues?.regionId ?? '',
        }}
        schema={MembershipSchema}
        onSubmit={async (values) => {
          if (isAdminPromotion(users, values) && !(await confirmAdminPromotion())) {
            return undefined
          }
          const result = await createMembershipFn({
            data: {
              userId: values.userId,
              role: values.role,
              regionId: values.regionId,
            },
          })
          if (result.success) {
            return { success: true, message: 'Gespeichert.', redirect: '/admin/memberships' }
          }
          return result
        }}
      >
        {(form, { submitError }) => (
          <AdminFormLayout
            fieldLabels={sectionLabels}
            form={form}
            submitLabel="Speichern"
            cancel={{ to: '/admin/memberships' }}
            submitError={submitError}
          >
            <AdminFormSection id="membership" title={sectionLabels.membership}>
              <MembershipFormFields
                form={form}
                userId={selectedUserId}
                onUserIdChange={setSelectedUserId}
                regions={regions}
                users={users}
              />
            </AdminFormSection>
          </AdminFormLayout>
        )}
      </Form>
      <ConfirmDialog
        open={confirmAdminOpen}
        setOpen={(open) => {
          if (!open) closeConfirmAdmin(false)
        }}
        tone="danger"
        icon={ExclamationTriangleIcon}
        title={`${selectedUser?.osmName ?? 'User'} wirklich zum Admin machen?`}
        description={adminPromotionWarning}
        confirmLabel="Ja, zum Admin machen"
        onConfirm={() => closeConfirmAdmin(true)}
      />
    </>
  )
}
