import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import type { z } from 'zod'
import { RadioGroup } from '@/components/shared/form/fields/RadioGroup'
import { Select } from '@/components/shared/form/fields/Select'
import { Form } from '@/components/shared/form/Form'
import type { FormApi } from '@/components/shared/form/types'
import { createMembershipFn } from '@/server/memberships/memberships.functions'
import { MembershipSchema } from '@/server/memberships/schema'
import type { RegionWithAdditionalData } from '@/server/regions/queries/getRegionsWithAdditionalData.server'
import type { User } from '@/server/users/queries/getUsers.server'
import { getUserWithMembershipsFn } from '@/server/users/users.functions'
import { getRegionSelectOptions } from './utils/getRegionSelectOptions'
import { getUserSelectOptions } from './utils/getUserSelectOptions'

type Props = {
  regions: RegionWithAdditionalData[]
  users: User[]
  initialValues?: {
    userId?: string
    regionId?: string
  }
  submitLabel?: string
}

type MembershipFormValues = z.input<typeof MembershipSchema>

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
  regions: RegionWithAdditionalData[]
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
        label="Region, auf dem User Rechte erhalten soll"
        items={regionOptions}
      />
    </>
  )
}

export function MembershipForm({
  regions,
  users,
  initialValues,
  submitLabel = 'Speichern',
}: Props) {
  const [selectedUserId, setSelectedUserId] = useState(initialValues?.userId ?? '')

  return (
    <Form
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
        if (result.success) return { success: true, redirect: '/admin/memberships' }
        return result
      }}
      submitLabel={submitLabel}
    >
      {(form) => (
        <MembershipFormFields
          form={form}
          userId={selectedUserId}
          onUserIdChange={setSelectedUserId}
          regions={regions}
          users={users}
        />
      )}
    </Form>
  )
}
