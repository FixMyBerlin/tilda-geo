import { createFileRoute } from '@tanstack/react-router'
import { PageRegionContractEdit } from '@/components/admin/region-contracts/PageRegionContractEdit'
import { getAdminRegionContractEditLoaderFn } from '@/server/admin/admin.functions'

export const Route = createFileRoute('/admin/region-contracts/$slug/edit')({
  ssr: true,
  loader: async ({ params }) => {
    return await getAdminRegionContractEditLoaderFn({ data: { slug: params.slug } })
  },
  head: () => ({
    meta: [{ title: 'Auftrag bearbeiten – ADMIN TILDA' }],
  }),
  component: PageRegionContractEdit,
})
