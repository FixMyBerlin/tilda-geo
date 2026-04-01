import { createFileRoute } from '@tanstack/react-router'
import { PageUploads } from '@/components/admin/uploads/PageUploads'
import { getAdminUploadsLoaderFn } from '@/server/admin/admin.functions'

export const Route = createFileRoute('/admin/uploads/')({
  ssr: true,
  loader: async () => {
    return await getAdminUploadsLoaderFn()
  },
  head: () => ({
    meta: [{ title: 'Uploads – ADMIN TILDA' }],
  }),
  component: PageUploads,
})
