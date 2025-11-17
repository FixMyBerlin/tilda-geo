'use client'
import createMembership from '@/src/server/memberships/mutations/createMembership'
import getRegionsWithAdditionalData from '@/src/server/regions/queries/getRegionsWithAdditionalData'
import { useMutation, useQuery } from '@blitzjs/rpc'
import { useRouter, useSearchParams } from 'next/navigation'
import { Breadcrumb } from '../../_components/Breadcrumb'
import { FORM_ERROR, MembershipForm } from '../_components/MembershipForm'

export default function AdminNewMembershipPage() {
  const router = useRouter()
  const params = useSearchParams()
  const regionSlug = params?.get('regionSlug')

  const [createMembershipMutation] = useMutation(createMembership)
  const [regions] = useQuery(getRegionsWithAdditionalData, {})

  // Find region ID from slug if provided
  const regionId = regionSlug ? regions?.find((r) => r.slug === regionSlug)?.id : undefined

  type HandleSubmit = any // TODO
  const handleSubmit = async (values: HandleSubmit) => {
    try {
      await createMembershipMutation({ ...values })
      router.refresh()
      router.push('/admin/memberships')
    } catch (error: any) {
      console.error(error)
      return { [FORM_ERROR]: error }
    }
  }

  return (
    <>
      <Breadcrumb
        pages={[
          { href: '/admin/memberships', name: 'Mitgliedschaften' },
          { href: '/admin/memberships/new', name: 'Anlegen' },
        ]}
      />
      <MembershipForm
        initialValues={{
          userId: params?.get('userId'),
          regionId: regionId ? String(regionId) : undefined,
        }}
        submitText="Erstellen"
        onSubmit={handleSubmit}
      />
    </>
  )
}

AdminNewMembershipPage.authenticate = { role: 'ADMIN' }
