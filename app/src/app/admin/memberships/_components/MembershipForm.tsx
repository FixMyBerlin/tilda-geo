'use client'
import Form, { FormProps } from '@/src/app/_components/forms/Form'
import { LabeledRadiobuttonGroup } from '@/src/app/_components/forms/LabeledRadiobuttonGroup'
import { LabeledSelect } from '@/src/app/_components/forms/LabeledSelect'
import getRegionsWithAdditionalData from '@/src/server/regions/queries/getRegionsWithAdditionalData'
import getUsers from '@/src/server/users/queries/getUsers'
import getUserWithMemberships from '@/src/server/users/queries/getUserWithMemberships'
import { useQuery } from '@blitzjs/rpc'
import { useFormContext } from 'react-hook-form'
import { z } from 'zod'
import { getRegionSelectOptions } from './utils/getRegionSelectOptions'
import { getUserSelectOptions } from './utils/getUserSelectOptions'
export { FORM_ERROR } from '@/src/app/_components/forms/Form'

function MembershipFormContent<S extends z.ZodType<any, any>>() {
  const [users] = useQuery(getUsers, {})
  const [regions] = useQuery(getRegionsWithAdditionalData, {})
  const { watch } = useFormContext()

  // Watch the userId field to fetch user data when it changes
  const userId = watch('userId')
  const [userData] = useQuery(
    getUserWithMemberships,
    userId ? { userId: Number(userId) } : { userId: 0 },
    { enabled: !!userId },
  )

  return (
    <>
      <LabeledSelect name="userId" label="User" options={getUserSelectOptions(users)} />
      <LabeledRadiobuttonGroup
        scope="regionId"
        label="Region, auf dem User Rechte erhalten soll"
        items={getRegionSelectOptions(regions, userData)}
      />
    </>
  )
}

export function MembershipForm<S extends z.ZodType<any, any>>(props: FormProps<S>) {
  return (
    <Form<S> {...props}>
      <MembershipFormContent />
    </Form>
  )
}
