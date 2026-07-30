import { createFileRoute } from '@tanstack/react-router'
import { PageMemberships } from '@/components/admin/memberships/PageMemberships'
import { getAdminMembershipsLoaderFn } from '@/server/admin/admin.functions'
import { createOffsetSearchSchema } from '@/shared/pagination/offsetSearchSchema'

const membershipsSearchSchema = createOffsetSearchSchema({ maxTake: 200 })

export const Route = createFileRoute('/admin/memberships/')({
  ssr: true,
  validateSearch: (search) => membershipsSearchSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => getAdminMembershipsLoaderFn({ data: deps }),
  head: () => ({
    meta: [{ title: 'Nutzer:innen & Mitgliedschaften – ADMIN TILDA' }],
  }),
  component: PageMemberships,
})
