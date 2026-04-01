import { createFileRoute } from '@tanstack/react-router'
import { PageUpload } from '@/components/admin/uploads/PageUpload'
import { getAdminUploadLoaderFn } from '@/server/admin/admin.functions'

export const Route = createFileRoute('/admin/uploads/$slug')({
  ssr: true,
  loader: async ({ params }) => {
    return await getAdminUploadLoaderFn({ data: { slug: params.slug } })
  },
  component: PageUpload,
})
