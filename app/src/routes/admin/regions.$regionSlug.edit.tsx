import { createFileRoute } from '@tanstack/react-router'
import { PageRegionEdit } from '@/components/admin/regions/PageRegionEdit'
import { getAdminRegionEditLoaderFn } from '@/server/admin/admin.functions'

export const Route = createFileRoute('/admin/regions/$regionSlug/edit')({
  ssr: true,
  loader: async ({ params }) => {
    return await getAdminRegionEditLoaderFn({ data: { regionSlug: params.regionSlug } })
  },
  component: PageRegionEdit,
})
