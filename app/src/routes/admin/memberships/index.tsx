import { createFileRoute, stripSearchParams } from '@tanstack/react-router'
import { PageMemberships } from '@/components/admin/memberships/PageMemberships'
import { optionalSearchString } from '@/lib/searchParamsSchema'
import { getAdminMembershipsLoaderFn } from '@/server/admin/admin.functions'
import { createPageSearchSchema, pageSearchDefaults } from '@/shared/pagination/pageSearchSchema'

const membershipsSearchSchema = createPageSearchSchema().extend({
  q: optionalSearchString(),
  regionSlug: optionalSearchString().catch(undefined),
})

export const Route = createFileRoute('/admin/memberships/')({
  ssr: true,
  validateSearch: membershipsSearchSchema,
  search: { middlewares: [stripSearchParams(pageSearchDefaults)] },
  loaderDeps: ({ search }) => ({
    page: search.page,
    pageSize: search.pageSize,
    q: search.q,
    regionSlug: search.regionSlug,
  }),
  // Region filter options (`AdminRegionFilter`) load once in the parent `/admin` route.
  loader: ({ deps }) => getAdminMembershipsLoaderFn({ data: deps }),
  head: () => ({
    meta: [{ title: 'Nutzer & Rechte – ADMIN TILDA' }],
  }),
  component: PageMemberships,
})
