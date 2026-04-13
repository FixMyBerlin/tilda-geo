import { createFileRoute } from '@tanstack/react-router'
import { PageRegions } from '@/components/admin/regions/PageRegions'
import { getAdminRegionsLoaderFn } from '@/server/admin/admin.functions'

export const Route = createFileRoute('/admin/regions/')({
  ssr: true,
  loader: async () => {
    return await getAdminRegionsLoaderFn()
  },
  head: () => ({
    meta: [{ title: 'Regionen – ADMIN TILDA' }],
  }),
  component: PageRegions,
})
