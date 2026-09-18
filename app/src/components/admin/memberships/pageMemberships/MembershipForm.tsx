import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import type { z } from 'zod'
import { AdminFormLayout } from '@/components/admin/aside/AdminFormLayout'
import { AdminFormSection } from '@/components/admin/aside/AdminFormSection'
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

  const regionOptions = regionOptsRaw.map(({ value, label, readonly, outerProps }) => ({
    value,
    label,
    disabled: readonly || regionsLocked,
    className: outerProps?.className,
  }))

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
        }}
      />
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

  return (
    <Form
      actionBarPlacement="none"
      showFormErrors={false}
      defaultValues={{
        userId: initialValues?.userId ?? '',
        regionId: initialValues?.regionId ?? '',
      }}
      schema={MembershipSchema}
      onSubmit={async (values) => {
        const result = await createMembershipFn({
          data: {
            userId: values.userId,
            regionId: values.regionId,
          },
        })
        if (result.success) {
          return { success: true, message: 'Angelegt.', redirect: '/admin/memberships' }
        }
        return result
      }}
    >
      {(form, { submitError }) => (
        <AdminFormLayout
          fieldLabels={sectionLabels}
          form={form}
          submitLabel="Erstellen"
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
  )
}
