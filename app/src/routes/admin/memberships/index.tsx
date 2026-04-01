import { createFileRoute } from '@tanstack/react-router'
import { PageMemberships } from '@/components/admin/memberships/PageMemberships'
import { getAdminMembershipsLoaderFn } from '@/server/admin/admin.functions'

const MAX_TAKE = 1000

export const Route = createFileRoute('/admin/memberships/')({
  ssr: true,
  loader: async () => {
    return await getAdminMembershipsLoaderFn({ data: { take: MAX_TAKE } })
  },
  head: () => ({
    meta: [{ title: 'Nutzer:innen & Mitgliedschaften – ADMIN TILDA' }],
  }),
  component: PageMemberships,
})
